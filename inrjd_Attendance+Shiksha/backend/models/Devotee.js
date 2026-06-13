const mongoose = require("mongoose");

const DevoteeSchema = new mongoose.Schema({
  program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, trim: true, default: "" },
  email:   { type: String, trim: true, lowercase: true, default: "" },
  addedToProgram: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Devotee", DevoteeSchema);