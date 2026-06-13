const mongoose = require('mongoose');
const { procurementStatuses } = require('../config/constants');

const procurementItemSchema = new mongoose.Schema({
  rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  name: String,
  requiredQuantity: { type: Number, required: true, min: 0 },
  currentStock: { type: Number, default: 0 },
  shortage: { type: Number, default: 0 },
  unit: String,
  purchasedQuantity: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: procurementStatuses,
    default: 'pending',
  },
});

const procurementSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  date: { type: Date, required: true },
  items: [procurementItemSchema],
  overallStatus: {
    type: String,
    enum: procurementStatuses,
    default: 'pending',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  totalEstimatedCost: { type: Number, default: 0 },
  totalActualCost: { type: Number, default: 0 },
}, {
  timestamps: true,
});

procurementSchema.index({ order: 1 });
procurementSchema.index({ date: 1 });
procurementSchema.index({ overallStatus: 1 });

module.exports = mongoose.model('Procurement', procurementSchema);
