const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { roles } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 15,
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  loginProvider: {
    type: String,
    enum: ['local', 'google', 'otp'],
    default: 'local',
  },
  googleId: { type: String, sparse: true },
  roles: {
    type: [{ type: String, enum: roles }],
    default: ['customer'],
    validate: {
      validator: (v) => v.length > 0,
      message: 'User must have at least one role',
    },
  },
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  signupSource: {
    type: String,
    enum: ['self', 'admin', 'google', 'otp'],
    default: 'self',
  },
  otpCode: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  lastLogin: Date,
}, {
  timestamps: true,
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ roles: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasRole = function (role) {
  return this.roles.includes(role);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpCode;
  delete obj.otpExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
