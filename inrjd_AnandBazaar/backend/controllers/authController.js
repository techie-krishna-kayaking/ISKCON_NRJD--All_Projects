const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new customer
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      roles: ['customer'],
      loginProvider: 'local',
      signupSource: 'self',
    });

    const token = generateToken(user);

    await logAudit({
      action: 'user_register',
      entity: 'User',
      entityId: user._id,
      performedBy: user._id,
      req,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Email + password login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Request OTP
exports.requestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    // In production, send via email/SMS
    logger.info(`OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otpCode +otpExpires');

    if (!user || user.otpCode !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Google login scaffold
exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, name } = req.body;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        loginProvider: 'google',
        signupSource: 'google',
        roles: ['customer'],
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.loginProvider = 'google';
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
