const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "area",
        "subArea",
        "frequency",
        "programType",
        "language",
        "day",
        "bvChapters",
      ],
      required: true,
      unique: true,
    },
    values: [{ type: String, required: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Config", ConfigSchema);
