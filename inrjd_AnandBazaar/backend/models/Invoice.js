const mongoose = require('mongoose');
const { paymentModes, paymentStatuses } = require('../config/constants');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: String,
  customerEmail: String,
  customerPhone: String,

  // Line items
  items: [{
    name: String,
    quantity: Number,
    unit: String,
    pricePerUnit: Number,
    total: Number,
  }],
  extras: [{
    label: String,
    quantity: Number,
    pricePerUnit: Number,
    total: Number,
  }],

  // Summary
  numberOfAdults: Number,
  numberOfKids: Number,
  pricePerPlate: Number,
  subtotal: { type: Number, default: 0 },
  extrasTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // Payment
  paymentStatus: {
    type: String,
    enum: paymentStatuses,
    default: 'unpaid',
  },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },

  // Metadata
  eventDate: Date,
  venue: String,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  sentAt: Date,
}, {
  timestamps: true,
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ order: 1 });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const prefix = `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
