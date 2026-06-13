const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      unique: true,
      maxlength: [150, "Course name cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    level: {
      type: String,
      enum: [
        "Shraddhavan",
        "Krishna Sevak",
        "Krishna Sadhak",
        "Srila Prabhupada Ashraya",
        "Srila Guru Charana Ashraya",
      ],
      required: [true, "Course level is required"],
    },
    certificationEnabled: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
