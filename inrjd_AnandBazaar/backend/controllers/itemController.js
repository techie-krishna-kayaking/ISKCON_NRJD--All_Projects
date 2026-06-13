const FoodItem = require('../models/FoodItem');
const { logAudit } = require('../services/auditService');

// Get all food items (public)
exports.getItems = async (req, res, next) => {
  try {
    const { category, available, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (search) filter.$text = { $search: search };

    const items = await FoodItem.find(filter).sort({ sortOrder: 1, category: 1, name: 1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

// Get single item
exports.getItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (error) {
    next(error);
  }
};

// Create item (admin)
exports.createItem = async (req, res, next) => {
  try {
    const item = await FoodItem.create({ ...req.body, createdBy: req.user._id });
    await logAudit({
      action: 'item_created',
      entity: 'FoodItem',
      entityId: item._id,
      performedBy: req.user._id,
      changes: req.body,
      req,
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};

// Update item (admin)
exports.updateItem = async (req, res, next) => {
  try {
    const previous = await FoodItem.findById(req.params.id);
    if (!previous) return res.status(404).json({ error: 'Item not found' });

    const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });

    await logAudit({
      action: 'item_updated',
      entity: 'FoodItem',
      entityId: item._id,
      performedBy: req.user._id,
      changes: req.body,
      previousValues: previous.toObject(),
      req,
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
};

// Delete item (admin)
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await logAudit({
      action: 'item_deleted',
      entity: 'FoodItem',
      entityId: item._id,
      performedBy: req.user._id,
      req,
    });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};
