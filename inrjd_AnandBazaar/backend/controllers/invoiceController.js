const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Generate invoice from order
exports.createInvoice = async (req, res, next) => {
  try {
    const { orderId, notes } = req.body;
    const order = await Order.findById(orderId).populate('items.foodItem');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Build invoice line items
    const invoiceItems = order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit || 0,
      total: item.totalPrice || 0,
    }));

    const invoiceExtras = order.extras.map((extra) => ({
      label: extra.label,
      quantity: extra.quantity,
      pricePerUnit: extra.pricePerUnit || 0,
      total: extra.totalPrice || 0,
    }));

    const invoice = await Invoice.create({
      order: order._id,
      customer: order.customer,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: invoiceItems,
      extras: invoiceExtras,
      numberOfAdults: order.numberOfAdults,
      numberOfKids: order.numberOfKids,
      pricePerPlate: order.pricePerPlate,
      subtotal: order.subtotal,
      extrasTotal: order.extrasTotal,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      eventDate: order.eventDate,
      venue: order.venue,
      generatedBy: req.user._id,
      notes,
    });

    // Update order status
    order.status = 'invoiced';
    order.statusHistory.push({
      status: 'invoiced',
      changedBy: req.user._id,
      remarks: `Invoice ${invoice.invoiceNumber} generated`,
    });
    await order.save();

    // Notify customer
    await notify({
      userId: order.customer,
      email: order.customerEmail,
      phone: order.customerPhone,
      title: 'Invoice Generated',
      message: `Invoice ${invoice.invoiceNumber} for order #${order.orderNumber}. Total amount: ₹${invoice.totalAmount}. Payment pending: ₹${invoice.pendingAmount}.`,
      event: 'invoice_generated',
      channels: ['in_app', 'email', 'whatsapp', 'sms'],
      relatedOrder: order._id,
    });

    await logAudit({
      action: 'invoice_generated',
      entity: 'Invoice',
      entityId: invoice._id,
      performedBy: req.user._id,
      changes: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
      req,
    });

    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
};

// Get invoice
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order', 'orderNumber eventDate venue')
      .populate('generatedBy', 'name');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

// List invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const { paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Non-admin customers see only their invoices
    if (req.user.roles.includes('customer') && !req.user.roles.includes('admin')) {
      filter.$or = [
        { customer: req.user._id },
        { customerEmail: req.user.email },
      ];
    }

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('order', 'orderNumber');

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
