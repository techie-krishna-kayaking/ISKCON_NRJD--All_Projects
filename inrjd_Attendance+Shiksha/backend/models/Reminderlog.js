const mongoose = require("mongoose");

const ReminderLogSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      unique: true,
    },
    programKey: { type: String },
    lastSentAt: { type: Date, required: true },
    sentCount: { type: Number, default: 1 },
    alertType: { type: String, default: "OVERDUE_ATTENDANCE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReminderLog", ReminderLogSchema);
