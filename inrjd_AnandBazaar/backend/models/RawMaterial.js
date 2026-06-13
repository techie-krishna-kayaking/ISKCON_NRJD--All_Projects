const mongoose = require('mongoose');
const { unitTypes } = require('../config/constants');

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Raw material name is required'],
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ['vegetable', 'grain', 'spice', 'oil_ghee', 'dairy', 'dry_fruit', 'packaging', 'beverage', 'other'],
    required: true,
  },
  unit: {
    type: String,
    enum: unitTypes,
    required: [true, 'Unit is required'],
  },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 0, min: 0 },
  costPerUnit: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

rawMaterialSchema.index({ category: 1 });
rawMaterialSchema.index({ name: 'text' });

rawMaterialSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

rawMaterialSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
