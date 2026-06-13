const mongoose = require("mongoose");

const CERTIFICATION_LEVELS = [
  "None",
  "Shraddhavan",
  "Krishna Sevak",
  "Krishna Sadhak",
  "Srila Prabhupada Ashraya",
  "Srila Guru Charana Ashraya",
];

const ParticipantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    shikshaCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    programKey: {
      type: String,
      trim: true,
      default: "",
    },
    aadharNumber: {
      type: String,
      trim: true,
      default: "",
    },
    bvLeader: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    language: {
      type: String,
      trim: true,
      default: "",
    },
    currentLevel: {
      type: String,
      enum: CERTIFICATION_LEVELS,
      default: "None",
    },
    activeFlag: {
      type: Boolean,
      default: true,
    },
    // When the participant was added to the program (for attendance calculation)
    addedAt: {
      type: Date,
      default: Date.now,
    },
    // Which program owner manages this participant
    programOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

ParticipantSchema.index({ programOwner: 1 });
ParticipantSchema.index({ programKey: 1 });
ParticipantSchema.index(
  { name: "text", shikshaCode: "text" },
  { language_override: "searchLanguage" }   // avoid clash with our `language` field
);
ParticipantSchema.index({ activeFlag: 1 });

ParticipantSchema.statics.CERTIFICATION_LEVELS = CERTIFICATION_LEVELS;

module.exports = mongoose.model("Participant", ParticipantSchema);
