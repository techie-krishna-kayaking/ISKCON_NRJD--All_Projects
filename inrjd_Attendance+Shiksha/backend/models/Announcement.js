const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    priority: {
      type: String,
      enum: ["high", "medium", "info"],
      default: "info",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, default: null }, // null = never expires
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);
