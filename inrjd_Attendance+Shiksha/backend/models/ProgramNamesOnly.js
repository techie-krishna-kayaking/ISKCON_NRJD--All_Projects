const mongoose = require("mongoose");

const ProgramNamesSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      unique: true,
      required: true,
    },
    names: [{ type: String }], // only devotee names; quick lookup without full devotee fetch
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProgramNamesOnly", ProgramNamesSchema);
