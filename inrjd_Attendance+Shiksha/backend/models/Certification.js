const mongoose = require("mongoose");

// Append-only: never update or delete certification records
const CertificationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: [true, "Participant is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    certificationLevel: {
      type: String,
      enum: [
        "Shraddhavan",
        "Krishna Sevak",
        "Krishna Sadhak",
        "Srila Prabhupada Ashraya",
        "Srila Guru Charana Ashraya",
      ],
      required: [true, "Certification level is required"],
    },
    certificationDate: {
      type: Date,
      required: [true, "Certification date is required"],
    },
    recommendedBy: {
      type: String,
      trim: true,
      default: "",
    },
    filledBy: {
      type: String,
      trim: true,
      default: "",
    },
    // Snapshot: level before and after this certification
    currentLevelBefore: {
      type: String,
      default: "None",
    },
    newLevelAfter: {
      type: String,
      required: true,
    },
    // Spiritual practice details
    chanting: {
      type: String,
      trim: true,
      default: "",
    },
    books: {
      type: String,
      trim: true,
      default: "",
    },
    commitments: {
      type: String,
      trim: true,
      default: "",
    },
    seva: {
      type: String,
      trim: true,
      default: "",
    },
    // A–F level codes from the Apps Script logic
    aCode: { type: String, trim: true, default: "" },
    bCode: { type: String, trim: true, default: "" },
    cCode: { type: String, trim: true, default: "" },
    dCode: { type: String, trim: true, default: "" },
    eCode: { type: String, trim: true, default: "" },
    fCode: { type: String, trim: true, default: "" },
    declarationAccepted: {
      type: Boolean,
      default: false,
    },
    // Flexible JSON for any extra fields
    metadataJson: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

CertificationSchema.index({ participant: 1, certificationDate: -1 });
CertificationSchema.index({ course: 1 });
CertificationSchema.index({ certificationLevel: 1 });

module.exports = mongoose.model("Certification", CertificationSchema);
