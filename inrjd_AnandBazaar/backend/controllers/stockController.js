const StockEntry = require('../models/StockEntry');
const RawMaterial = require('../models/RawMaterial');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const User = require('../models/User');

// Get current stock (all raw materials with current quantities)
exports.getCurrentStock = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const materials = await RawMaterial.find(filter).sort({ category: 1, name: 1 });
    res.json({ stock: materials });
  } catch (error) {
    next(error);
  }
};

// Submit daily stock entry
exports.submitDailyStock = async (req, res, next) => {
  try {
    const { items, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already submitted today by this user
    const existing = await StockEntry.findOne({
      submittedBy: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    });

    if (existing) {
      // Update existing entry
      existing.items = items;
      existing.notes = notes;
      existing.isComplete = true;
      await existing.save();

      // Update raw material stock levels
      for (const item of items) {
        const rm = await RawMaterial.findById(item.rawMaterial);
        if (rm) {
          item.previousQuantity = rm.currentStock;
          item.name = rm.name;
          item.unit = rm.unit;
          rm.currentStock = item.quantity;
          await rm.save();
        }
      }
      existing.items = items;
      await existing.save();

      return res.json({ stockEntry: existing, message: 'Stock entry updated' });
    }

    // Create new entry and update raw material stocks
    const stockItems = [];
    const lowStockAlerts = [];

    for (const item of items) {
      const rm = await RawMaterial.findById(item.rawMaterial);
      if (rm) {
        stockItems.push({
          rawMaterial: item.rawMaterial,
          name: rm.name,
          quantity: item.quantity,
          unit: rm.unit,
          previousQuantity: rm.currentStock,
          remarks: item.remarks,
        });

        rm.currentStock = item.quantity;
        await rm.save();

        if (rm.isLowStock) {
          lowStockAlerts.push(rm);
        }
      }
    }

    const stockEntry = await StockEntry.create({
      date: today,
      items: stockItems,
      submittedBy: req.user._id,
      isComplete: true,
      notes,
    });

    // Alert admins about low stock
    if (lowStockAlerts.length > 0) {
      const admins = await User.find({ roles: { $in: ['admin', 'procurement'] }, isActive: true });
      const lowItems = lowStockAlerts.map((m) => `${m.name}: ${m.currentStock} ${m.unit}`).join(', ');

      for (const admin of admins) {
        await notify({
          userId: admin._id,
          email: admin.email,
          title: 'Low Stock Alert',
          message: `The following items are running low: ${lowItems}`,
          event: 'low_stock_alert',
          channels: ['in_app', 'email'],
        });
      }
    }

    await logAudit({
      action: 'daily_stock_submitted',
      entity: 'StockEntry',
      entityId: stockEntry._id,
      performedBy: req.user._id,
      changes: { itemCount: stockItems.length },
      req,
    });

    res.status(201).json({ stockEntry });
  } catch (error) {
    next(error);
  }
};

// Get stock history
exports.getStockHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await StockEntry.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('submittedBy', 'name email');

    const total = await StockEntry.countDocuments(filter);

    res.json({
      entries,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Update a specific stock entry item
exports.updateStockEntry = async (req, res, next) => {
  try {
    const entry = await StockEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Stock entry not found' });

    const { items, notes } = req.body;
    if (items) entry.items = items;
    if (notes) entry.notes = notes;
    await entry.save();

    res.json({ stockEntry: entry });
  } catch (error) {
    next(error);
  }
};

// Get low-stock alerts
exports.getStockAlerts = async (req, res, next) => {
  try {
    const materials = await RawMaterial.find({ isActive: true });
    const alerts = materials.filter((m) => m.currentStock <= m.minimumStock);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};
