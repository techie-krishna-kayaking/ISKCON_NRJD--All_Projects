const mongoose = require("mongoose");

const GrowthPlanSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: [true, "Participant is required"],
    },
    goalTitle: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [200, "Goal title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    targetLevel: {
      type: String,
      enum: [
        "None",
        "Shraddhavan",
        "Krishna Sevak",
        "Krishna Sadhak",
        "Srila Prabhupada Ashraya",
        "Srila Guru Charana Ashraya",
      ],
      default: "Shraddhavan",
    },
    targetDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed", "on-hold", "cancelled"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

GrowthPlanSchema.index({ participant: 1, status: 1 });

module.exports = mongoose.model("GrowthPlan", GrowthPlanSchema);
