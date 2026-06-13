const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true,
  },
  rawMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true,
  },
  quantityPerAdult: { type: Number, required: true, min: 0 },
  quantityPerKid: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

recipeSchema.index({ foodItem: 1, rawMaterial: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);
