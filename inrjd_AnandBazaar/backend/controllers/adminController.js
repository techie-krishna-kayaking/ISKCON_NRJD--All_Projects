const User = require('../models/User');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const RawMaterial = require('../models/RawMaterial');
const FoodItem = require('../models/FoodItem');
const StockEntry = require('../models/StockEntry');
const Procurement = require('../models/Procurement');
const AuditLog = require('../models/AuditLog');
const Recipe = require('../models/Recipe');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

// Dashboard stats
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalOrders, pendingOrders, approvedOrders,
      totalRevenue, pendingPayments,
      totalUsers, lowStockCount,
      pendingProcurements,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['placed', 'under_review'] } }),
      Order.countDocuments({ status: 'approved' }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Invoice.aggregate([{ $match: { paymentStatus: { $ne: 'paid' } } }, { $group: { _id: null, total: { $sum: '$pendingAmount' } } }]),
      User.countDocuments({ isActive: true }),
      RawMaterial.countDocuments({ $expr: { $lte: ['$currentStock', '$minimumStock'] } }),
      Procurement.countDocuments({ overallStatus: { $in: ['pending', 'required', 'in_progress'] } }),
    ]);

    res.json({
      dashboard: {
        totalOrders,
        pendingOrders,
        approvedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments: pendingPayments[0]?.total || 0,
        totalUsers,
        lowStockCount,
        pendingProcurements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Manage users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, active, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.roles = role;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Create user (admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, roles } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const user = await User.create({
      name,
      email,
      phone,
      password,
      roles: roles || ['customer'],
      createdBy: req.user._id,
      signupSource: 'admin',
    });

    await logAudit({
      action: 'user_created_by_admin',
      entity: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      changes: { name, email, roles },
      req,
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user (admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, roles, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (roles !== undefined) updates.roles = roles;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await logAudit({
      action: 'user_updated_by_admin',
      entity: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      changes: updates,
      req,
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('performedBy', 'name email');

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

// Manage recipes (item-to-raw-material mappings)
exports.getRecipes = async (req, res, next) => {
  try {
    const { foodItem } = req.query;
    const filter = {};
    if (foodItem) filter.foodItem = foodItem;

    const recipes = await Recipe.find(filter)
      .populate('foodItem', 'name category')
      .populate('rawMaterial', 'name unit');

    res.json({ recipes });
  } catch (error) {
    next(error);
  }
};

exports.createRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ recipe });
  } catch (error) {
    next(error);
  }
};

exports.updateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ recipe });
  } catch (error) {
    next(error);
  }
};

exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    next(error);
  }
};
