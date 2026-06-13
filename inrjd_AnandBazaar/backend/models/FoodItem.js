const mongoose = require('mongoose');
const { unitTypes } = require('../config/constants');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    unique: true,
  },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['rice', 'dal', 'bread', 'vegetable', 'sweet', 'snack', 'beverage', 'condiment', 'other'],
    required: true,
  },
  isVeg: { type: Boolean, default: true },
  image: { type: String },
  pricePerPlate: { type: Number, default: 0, min: 0 },
  pricePerUnit: { type: Number, default: 0, min: 0 },
  unit: { type: String, enum: unitTypes, default: 'count' },
  servingSize: { type: String },
  isAvailable: { type: Boolean, default: true },
  isExtra: { type: Boolean, default: false },
  extraOptions: {
    sizes: [{ label: String, value: String, priceAddon: Number }],
  },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

foodItemSchema.index({ category: 1 });
foodItemSchema.index({ isAvailable: 1 });
foodItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('FoodItem', foodItemSchema);
