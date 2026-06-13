const mongoose = require('mongoose');
const { paymentModes } = require('../config/constants');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  mode: {
    type: String,
    enum: paymentModes,
    required: [true, 'Payment mode is required'],
  },
  // UPI specific
  upiReference: { type: String, trim: true },
  upiId: { type: String, trim: true },
  // Cash specific
  cashRemarks: { type: String, trim: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // General
  paymentDate: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, trim: true },
}, {
  timestamps: true,
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ invoice: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
