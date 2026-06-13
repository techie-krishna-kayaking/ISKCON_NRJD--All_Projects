const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { calculateRequirements } = require('../services/procurementCalculator');
const Procurement = require('../models/Procurement');

// Place a new order
exports.createOrder = async (req, res, next) => {
  try {
    const {
      customerName, customerEmail, customerPhone,
      eventDate, venue, numberOfAdults, numberOfKids,
      specialInstructions, items, extras,
    } = req.body;

    // Validate food items exist
    const foodItemIds = items.map((i) => i.foodItem);
    const foodItems = await FoodItem.find({ _id: { $in: foodItemIds }, isAvailable: true });
    if (foodItems.length !== foodItemIds.length) {
      return res.status(400).json({ error: 'One or more items are unavailable' });
    }

    // Build order items with names
    const orderItems = items.map((item) => {
      const fi = foodItems.find((f) => f._id.toString() === item.foodItem);
      return {
        foodItem: item.foodItem,
        name: fi.name,
        quantity: item.quantity || 1,
        notes: item.notes,
      };
    });

    const order = await Order.create({
      customer: req.user?._id,
      customerName: customerName || req.user?.name,
      customerEmail,
      customerPhone,
      eventDate,
      venue,
      numberOfAdults,
      numberOfKids: numberOfKids || 0,
      specialInstructions,
      items: orderItems,
      extras: extras || [],
      status: 'placed',
      statusHistory: [{ status: 'placed', changedBy: req.user?._id, remarks: 'Order placed' }],
    });

    // Notify customer
    await notify({
      userId: req.user?._id,
      email: customerEmail,
      phone: customerPhone,
      title: 'Order Placed Successfully',
      message: `Your order #${order.orderNumber} for ${numberOfAdults} adults on ${new Date(eventDate).toLocaleDateString()} has been placed. We will review and confirm shortly.`,
      event: 'order_placed',
      channels: ['in_app', 'email', 'whatsapp', 'sms'],
      relatedOrder: order._id,
    });

    // Notify admins
    const admins = await User.find({ roles: 'admin', isActive: true });
    for (const admin of admins) {
      await notify({
        userId: admin._id,
        email: admin.email,
        phone: admin.phone,
        title: 'New Order Received',
        message: `Order #${order.orderNumber} placed by ${customerName || 'Customer'} for ${numberOfAdults} adults on ${new Date(eventDate).toLocaleDateString()}.`,
        event: 'order_placed',
        channels: ['in_app', 'email'],
        relatedOrder: order._id,
      });
    }

    await logAudit({
      action: 'order_placed',
      entity: 'Order',
      entityId: order._id,
      performedBy: req.user?._id || order._id,
      changes: { orderNumber: order.orderNumber },
      req,
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

// List orders
exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Customers see only their orders
    if (req.user.roles.includes('customer') && !req.user.roles.includes('admin')) {
      filter.$or = [
        { customer: req.user._id },
        { customerEmail: req.user.email },
      ];
    }

    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customer', 'name email phone');

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Get single order
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.foodItem', 'name image category')
      .populate('approvedBy', 'name');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check access
    if (req.user.roles.includes('customer') && !req.user.roles.includes('admin')) {
      if (order.customer?.toString() !== req.user._id.toString() &&
          order.customerEmail !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// Update order (admin)
exports.updateOrder = async (req, res, next) => {
  try {
    const previous = await Order.findById(req.params.id);
    if (!previous) return res.status(404).json({ error: 'Order not found' });

    const updates = req.body;
    if (updates.status) {
      updates.$push = {
        statusHistory: {
          status: updates.status,
          changedBy: req.user._id,
          remarks: updates.remarks || `Status changed to ${updates.status}`,
        },
      };
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });

    await logAudit({
      action: 'order_updated',
      entity: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      changes: updates,
      previousValues: { status: previous.status, items: previous.items },
      req,
    });

    // Notify customer of updates
    await notify({
      userId: order.customer,
      email: order.customerEmail,
      phone: order.customerPhone,
      title: 'Order Updated',
      message: `Your order #${order.orderNumber} has been updated. ${updates.adminNotes || ''}`,
      event: 'order_updated',
      channels: ['in_app', 'email'],
      relatedOrder: order._id,
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// Approve order (admin)
exports.approveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { pricePerPlate, adminNotes } = req.body;

    // Calculate totals
    const plateCount = order.numberOfAdults + (order.numberOfKids * 0.5);
    const subtotal = pricePerPlate ? pricePerPlate * plateCount : order.subtotal;
    const extrasTotal = order.extras.reduce((sum, e) => sum + (e.totalPrice || 0), 0);

    order.status = 'approved';
    order.pricePerPlate = pricePerPlate || order.pricePerPlate;
    order.subtotal = subtotal;
    order.extrasTotal = extrasTotal;
    order.totalAmount = subtotal + extrasTotal;
    order.pendingAmount = order.totalAmount - order.paidAmount;
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    order.adminNotes = adminNotes;
    order.statusHistory.push({
      status: 'approved',
      changedBy: req.user._id,
      remarks: adminNotes || 'Order approved by admin',
    });

    await order.save();

    // Generate procurement requirements
    const requirements = await calculateRequirements(
      order.items, order.numberOfAdults, order.numberOfKids
    );

    if (requirements.length > 0) {
      await Procurement.create({
        order: order._id,
        date: order.eventDate,
        items: requirements.map((r) => ({
          rawMaterial: r.rawMaterial,
          name: r.name,
          requiredQuantity: r.requiredQuantity,
          currentStock: r.currentStock,
          shortage: r.shortage,
          unit: r.unit,
          status: r.shortage > 0 ? 'required' : 'closed',
        })),
        overallStatus: requirements.some((r) => r.shortage > 0) ? 'required' : 'closed',
        createdBy: req.user._id,
      });
    }

    // Notify customer
    await notify({
      userId: order.customer,
      email: order.customerEmail,
      phone: order.customerPhone,
      title: 'Order Approved!',
      message: `Your order #${order.orderNumber} has been approved! Total: ₹${order.totalAmount}. Price per plate: ₹${order.pricePerPlate}. We will send the invoice shortly.`,
      event: 'order_approved',
      channels: ['in_app', 'email', 'whatsapp', 'sms'],
      relatedOrder: order._id,
    });

    // Notify procurement team
    const procurementUsers = await User.find({ roles: 'procurement', isActive: true });
    for (const pu of procurementUsers) {
      await notify({
        userId: pu._id,
        email: pu.email,
        title: 'New Procurement Required',
        message: `Order #${order.orderNumber} approved. Raw materials needed for ${order.numberOfAdults} adults on ${new Date(order.eventDate).toLocaleDateString()}.`,
        event: 'procurement_needed',
        channels: ['in_app', 'email'],
        relatedOrder: order._id,
      });
    }

    await logAudit({
      action: 'order_approved',
      entity: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      changes: { status: 'approved', pricePerPlate, totalAmount: order.totalAmount },
      req,
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// Change order status
exports.changeStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      remarks: remarks || `Status changed to ${status}`,
    });
    await order.save();

    await logAudit({
      action: 'order_status_changed',
      entity: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      changes: { status, remarks },
      req,
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};
