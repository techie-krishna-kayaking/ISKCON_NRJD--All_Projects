const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Record payment
exports.createPayment = async (req, res, next) => {
  try {
    const { order: orderId, invoice: invoiceId, amount, mode, upiReference, upiId, cashRemarks, remarks } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const payment = await Payment.create({
      order: orderId,
      invoice: invoiceId,
      amount,
      mode,
      upiReference,
      upiId,
      cashRemarks,
      collectedBy: req.user._id,
      recordedBy: req.user._id,
      remarks,
    });

    // Update invoice
    invoice.paidAmount += amount;
    invoice.pendingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    invoice.paymentStatus = invoice.pendingAmount <= 0 ? 'paid' : 'partially_paid';
    await invoice.save();

    // Update order
    order.paidAmount += amount;
    order.pendingAmount = Math.max(0, order.totalAmount - order.paidAmount);
    const newStatus = order.pendingAmount <= 0 ? 'paid' : 'partially_paid';
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      remarks: `Payment of ₹${amount} received via ${mode}`,
    });
    await order.save();

    // Notify customer
    await notify({
      userId: order.customer,
      email: order.customerEmail,
      phone: order.customerPhone,
      title: 'Payment Received',
      message: `Payment of ₹${amount} received for order #${order.orderNumber} via ${mode.toUpperCase()}. Remaining balance: ₹${order.pendingAmount}.`,
      event: 'payment_recorded',
      channels: ['in_app', 'email', 'whatsapp'],
      relatedOrder: order._id,
    });

    await logAudit({
      action: 'payment_recorded',
      entity: 'Payment',
      entityId: payment._id,
      performedBy: req.user._id,
      changes: { amount, mode, orderId, invoiceId },
      req,
    });

    res.status(201).json({ payment, invoice, order });
  } catch (error) {
    next(error);
  }
};

// Get payments for an order
exports.getPaymentsByOrder = async (req, res, next) => {
  try {
    const payments = await Payment.find({ order: req.params.orderId })
      .sort({ paymentDate: -1 })
      .populate('recordedBy', 'name')
      .populate('collectedBy', 'name');

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

// Get all payments (admin)
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, mode } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;

    const payments = await Payment.find(filter)
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('order', 'orderNumber')
      .populate('recordedBy', 'name');

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
