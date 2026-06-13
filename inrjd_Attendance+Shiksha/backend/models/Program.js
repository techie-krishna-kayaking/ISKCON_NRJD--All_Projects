const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    programKey: { type: String, unique: true },
    area: { type: String, required: true },
    subArea: { type: String, required: true },
    frequency: { type: String, required: true },
    programType: { type: String, required: true },
    language: { type: String, required: true },
    programOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVirtual: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    devotees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Devotee" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── New fields ──
    actFlag: { type: String, enum: ["active", "inactive"], default: "active" },
    promoted: { type: String, default: "" },
  },
  { timestamps: true }
);

ProgramSchema.index({ programOwner: 1 });
ProgramSchema.index({ actFlag: 1 });

module.exports = mongoose.model("Program", ProgramSchema);
