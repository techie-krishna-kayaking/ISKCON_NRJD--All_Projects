const mongoose = require("mongoose");

const AttendanceSummarySchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    programKey: { type: String, required: true },

    area: String,
    subArea: String,
    frequency: String,
    programType: String,
    language: String,
    programOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    devoteeName: { type: String, required: true },
    addedToProgram: { type: Date },
    totalSessions: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }, // 0–100
  },
  { timestamps: true }
);

// One record per devotee per program
AttendanceSummarySchema.index({ program: 1, devoteeName: 1 }, { unique: true });
AttendanceSummarySchema.index({ programOwner: 1 });
AttendanceSummarySchema.index({ percentage: 1 });

module.exports = mongoose.model("AttendanceSummary", AttendanceSummarySchema);
