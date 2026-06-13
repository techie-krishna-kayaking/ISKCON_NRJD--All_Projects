const mongoose = require('mongoose');
const { orderStatuses } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  pricePerUnit: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  notes: String,
});

const extraSchema = new mongoose.Schema({
  type: { type: String, enum: ['water_bottle', 'tissue', 'other'], required: true },
  label: { type: String, required: true },
  size: String,
  quantity: { type: Number, default: 0 },
  pricePerUnit: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Guest info (for non-logged-in customers)
  customerName: { type: String, trim: true },
  customerEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },

  // Event details
  eventDate: { type: Date, required: [true, 'Event date is required'] },
  venue: { type: String, required: [true, 'Venue is required'], trim: true },
  numberOfAdults: { type: Number, required: true, min: 1 },
  numberOfKids: { type: Number, default: 0, min: 0 },
  specialInstructions: { type: String, trim: true },

  // Items
  items: [orderItemSchema],
  extras: [extraSchema],

  // Pricing
  pricePerPlate: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  extrasTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: orderStatuses,
    default: 'placed',
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    timestamp: { type: Date, default: Date.now },
  }],

  // Admin fields
  adminNotes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
}, {
  timestamps: true,
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ eventDate: 1 });
orderSchema.index({ customerEmail: 1 });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date();
    const prefix = `AB${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.orderNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  // Calculate pending amount
  this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  next();
});

module.exports = mongoose.model('Order', orderSchema);
