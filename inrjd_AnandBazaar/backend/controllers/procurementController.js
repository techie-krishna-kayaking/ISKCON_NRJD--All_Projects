const Procurement = require('../models/Procurement');
const { logAudit } = require('../services/auditService');
const { notify } = require('../services/notificationService');
const User = require('../models/User');

// List procurement entries
exports.getProcurements = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.overallStatus = status;

    const procurements = await Procurement.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('order', 'orderNumber eventDate venue numberOfAdults')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    const total = await Procurement.countDocuments(filter);

    res.json({
      procurements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Get single procurement
exports.getProcurement = async (req, res, next) => {
  try {
    const procurement = await Procurement.findById(req.params.id)
      .populate('order', 'orderNumber eventDate venue numberOfAdults numberOfKids items')
      .populate('items.rawMaterial', 'name unit currentStock')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    if (!procurement) return res.status(404).json({ error: 'Procurement not found' });
    res.json({ procurement });
  } catch (error) {
    next(error);
  }
};

// Create procurement entry manually
exports.createProcurement = async (req, res, next) => {
  try {
    const procurement = await Procurement.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await logAudit({
      action: 'procurement_created',
      entity: 'Procurement',
      entityId: procurement._id,
      performedBy: req.user._id,
      req,
    });

    res.status(201).json({ procurement });
  } catch (error) {
    next(error);
  }
};

// Update procurement item status
exports.updateProcurementStatus = async (req, res, next) => {
  try {
    const { overallStatus, items, notes, totalActualCost } = req.body;
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ error: 'Procurement not found' });

    if (overallStatus) procurement.overallStatus = overallStatus;
    if (notes) procurement.notes = notes;
    if (totalActualCost !== undefined) procurement.totalActualCost = totalActualCost;

    // Update individual items if provided
    if (items && Array.isArray(items)) {
      for (const update of items) {
        const item = procurement.items.id(update._id);
        if (item) {
          if (update.status) item.status = update.status;
          if (update.purchasedQuantity !== undefined) item.purchasedQuantity = update.purchasedQuantity;
          if (update.costPerUnit !== undefined) item.costPerUnit = update.costPerUnit;
          if (update.totalCost !== undefined) item.totalCost = update.totalCost;
        }
      }
    }

    await procurement.save();

    // Notify if completed
    if (overallStatus === 'delivered' || overallStatus === 'closed') {
      const admins = await User.find({ roles: 'admin', isActive: true });
      for (const admin of admins) {
        await notify({
          userId: admin._id,
          email: admin.email,
          title: 'Procurement Completed',
          message: `Procurement for order has been ${overallStatus}.`,
          event: 'procurement_completed',
          channels: ['in_app', 'email'],
        });
      }
    }

    await logAudit({
      action: 'procurement_updated',
      entity: 'Procurement',
      entityId: procurement._id,
      performedBy: req.user._id,
      changes: req.body,
      req,
    });

    res.json({ procurement });
  } catch (error) {
    next(error);
  }
};

// Update a single procurement item (mark as purchased)
exports.updateProcurementItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { purchasedQuantity, status, costPerUnit } = req.body;

    const procurement = await Procurement.findById(id);
    if (!procurement) return res.status(404).json({ error: 'Procurement not found' });

    const item = procurement.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Procurement item not found' });

    if (purchasedQuantity !== undefined) item.purchasedQuantity = purchasedQuantity;
    if (status) item.status = status;
    if (costPerUnit !== undefined) item.costPerUnit = costPerUnit;
    item.totalCost = (item.purchasedQuantity || 0) * (item.costPerUnit || 0);

    await procurement.save();

    await logAudit({
      action: 'procurement_item_updated',
      entity: 'Procurement',
      entityId: procurement._id,
      performedBy: req.user._id,
      changes: { itemId, purchasedQuantity, status },
      req,
    });

    res.json({ procurement });
  } catch (error) {
    next(error);
  }
};

// Mark entire procurement as complete
exports.completeProcurement = async (req, res, next) => {
  try {
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) return res.status(404).json({ error: 'Procurement not found' });

    procurement.overallStatus = 'delivered';
    for (const item of procurement.items) {
      if (item.status === 'pending') item.status = 'purchased';
    }
    procurement.totalActualCost = procurement.items.reduce((sum, i) => sum + (i.totalCost || 0), 0);

    await procurement.save();

    const admins = await User.find({ roles: 'admin', isActive: true });
    for (const admin of admins) {
      await notify({
        userId: admin._id,
        email: admin.email,
        title: 'Procurement Completed',
        message: `Procurement has been marked as complete.`,
        event: 'procurement_completed',
        channels: ['in_app'],
      });
    }

    res.json({ procurement });
  } catch (error) {
    next(error);
  }
};
