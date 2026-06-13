const mongoose = require('mongoose');
const { notificationChannels, notificationEvents } = require('../config/constants');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  event: { type: String, enum: notificationEvents },
  channel: { type: String, enum: notificationChannels, default: 'in_app' },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  sentVia: [{ type: String, enum: notificationChannels }],
  deliveryStatus: {
    email: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    whatsapp: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
