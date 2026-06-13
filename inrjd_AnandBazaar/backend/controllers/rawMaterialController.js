const RawMaterial = require('../models/RawMaterial');
const { logAudit } = require('../services/auditService');

// Get all raw materials
exports.getRawMaterials = async (req, res, next) => {
  try {
    const { category, lowStock } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    let materials = await RawMaterial.find(filter).sort({ category: 1, name: 1 });

    if (lowStock === 'true') {
      materials = materials.filter((m) => m.isLowStock);
    }

    res.json({ rawMaterials: materials });
  } catch (error) {
    next(error);
  }
};

// Get single raw material
exports.getRawMaterial = async (req, res, next) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Raw material not found' });
    res.json({ rawMaterial: material });
  } catch (error) {
    next(error);
  }
};

// Create raw material (admin only)
exports.createRawMaterial = async (req, res, next) => {
  try {
    const material = await RawMaterial.create({ ...req.body, createdBy: req.user._id });
    await logAudit({
      action: 'raw_material_created',
      entity: 'RawMaterial',
      entityId: material._id,
      performedBy: req.user._id,
      changes: req.body,
      req,
    });
    res.status(201).json({ rawMaterial: material });
  } catch (error) {
    next(error);
  }
};

// Update raw material (admin only)
exports.updateRawMaterial = async (req, res, next) => {
  try {
    const previous = await RawMaterial.findById(req.params.id);
    if (!previous) return res.status(404).json({ error: 'Raw material not found' });

    const material = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });

    await logAudit({
      action: 'raw_material_updated',
      entity: 'RawMaterial',
      entityId: material._id,
      performedBy: req.user._id,
      changes: req.body,
      previousValues: previous.toObject(),
      req,
    });

    res.json({ rawMaterial: material });
  } catch (error) {
    next(error);
  }
};
