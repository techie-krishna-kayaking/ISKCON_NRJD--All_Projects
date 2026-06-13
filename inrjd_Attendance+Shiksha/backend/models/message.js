const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Sender (owner)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },

    // Message content
    category: {
      type: String,
      enum: ["Question", "Feedback", "Bug Report", "Other"],
      default: "Question",
    },
    subject: { type: String, trim: true, maxlength: 120, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 2000 },

    // Admin reply
    reply: { type: String, trim: true, maxlength: 1000, default: null },
    repliedAt: { type: Date, default: null },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Owner read the reply?
    ownerReadReply: { type: Boolean, default: false },

    // Status
    status: {
      type: String,
      enum: ["unread", "read", "replied", "closed"],
      default: "unread",
    },

    // Read timestamp
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for fast admin queries
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
