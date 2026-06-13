const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const Notification = require('../models/Notification');

// Email transporter
let emailTransporter = null;
const getEmailTransporter = () => {
  if (!emailTransporter && process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return emailTransporter;
};

// Twilio client (lazy init)
let twilioClient = null;
const getTwilioClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// Send in-app notification
const sendInApp = async ({ userId, title, message, event, data, relatedOrder }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      event,
      channel: 'in_app',
      data,
      relatedOrder,
      sentVia: ['in_app'],
    });
    return notification;
  } catch (error) {
    logger.error(`In-app notification failed: ${error.message}`);
    return null;
  }
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      logger.warn('Email not configured, skipping email notification');
      return false;
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AnandBazaar <noreply@anandbazaar.com>',
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    return false;
  }
};

// Send WhatsApp
const sendWhatsApp = async ({ to, message }) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      logger.warn('Twilio not configured, skipping WhatsApp notification');
      return false;
    }
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
    });
    logger.info(`WhatsApp sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`WhatsApp send failed: ${error.message}`);
    return false;
  }
};

// Send SMS
const sendSMS = async ({ to, message }) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      logger.warn('Twilio not configured, skipping SMS notification');
      return false;
    }
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info(`SMS sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`SMS send failed: ${error.message}`);
    return false;
  }
};

// Unified notification sender
const notify = async ({ userId, email, phone, title, message, event, channels = ['in_app'], data, relatedOrder }) => {
  const results = {};

  for (const channel of channels) {
    switch (channel) {
      case 'in_app':
        results.in_app = await sendInApp({ userId, title, message, event, data, relatedOrder });
        break;
      case 'email':
        if (email) {
          results.email = await sendEmail({
            to: email,
            subject: title,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <div style="background:#F97316;color:white;padding:15px;text-align:center;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;">🙏 AnandBazaar Prasadam</h2>
              </div>
              <div style="padding:20px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
                <h3>${title}</h3>
                <p>${message}</p>
                <hr style="border-color:#eee;"/>
                <p style="font-size:12px;color:#666;">Jai Jagannath! All items are offered to Lord Jagannath.</p>
              </div>
            </div>`,
            text: `${title}\n\n${message}\n\nJai Jagannath!`,
          });
        }
        break;
      case 'whatsapp':
        if (phone) {
          results.whatsapp = await sendWhatsApp({ to: phone, message: `🙏 AnandBazaar: ${title}\n\n${message}` });
        }
        break;
      case 'sms':
        if (phone) {
          results.sms = await sendSMS({ to: phone, message: `AnandBazaar: ${title} - ${message}` });
        }
        break;
    }
  }

  // Update notification delivery status if in-app notification was created
  if (results.in_app) {
    const deliveryStatus = {};
    if (channels.includes('email')) deliveryStatus.email = results.email ? 'sent' : 'failed';
    if (channels.includes('whatsapp')) deliveryStatus.whatsapp = results.whatsapp ? 'sent' : 'failed';
    if (channels.includes('sms')) deliveryStatus.sms = results.sms ? 'sent' : 'failed';
    await Notification.findByIdAndUpdate(results.in_app._id, {
      sentVia: channels.filter((ch) => results[ch]),
      deliveryStatus,
    });
  }

  return results;
};

module.exports = { notify, sendEmail, sendWhatsApp, sendSMS, sendInApp };
