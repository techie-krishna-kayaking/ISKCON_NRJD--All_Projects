const mongoose = require('mongoose');

const stockEntryItemSchema = new mongoose.Schema({
  rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  name: String,
  quantity: { type: Number, required: true, min: 0 },
  unit: String,
  previousQuantity: { type: Number, default: 0 },
  remarks: String,
});

const stockEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  items: [stockEntryItemSchema],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isComplete: { type: Boolean, default: false },
  notes: String,
}, {
  timestamps: true,
});

stockEntrySchema.index({ date: 1 });
stockEntrySchema.index({ submittedBy: 1 });
stockEntrySchema.index({ date: 1, submittedBy: 1 });

module.exports = mongoose.model('StockEntry', stockEntrySchema);
