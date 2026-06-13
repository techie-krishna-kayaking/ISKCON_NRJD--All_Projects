const mongoose = require("mongoose");

// SCD2 — append only, never update, never delete
const AttendanceSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    programKey: { type: String, required: true },

    // Snapshot of program fields at time of attendance
    area: String,
    subArea: String,
    frequency: String,
    programType: String,
    language: String,
    programOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    chapter: { type: String, default: "" }, // BV programs only
    hostName: { type: String, required: true },

    devoteeName: { type: String, required: true },
    date: { type: Date, required: true },

    status: { type: String, enum: ["present", "absent"], required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ program: 1, date: 1 });
AttendanceSchema.index({ program: 1, devoteeName: 1 });
AttendanceSchema.index({ programOwner: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
