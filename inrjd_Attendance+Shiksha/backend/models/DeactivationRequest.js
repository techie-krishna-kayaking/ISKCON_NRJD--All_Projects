const mongoose = require("mongoose");

// Tracks admin requests to deactivate any account.
// SuperAdmin must approve before the account is actually deactivated.
const deactivationRequestSchema = new mongoose.Schema(
  {
    // Which user the admin wants to deactivate
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which admin made the request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional reason the admin provides
    reason: {
      type: String,
      trim: true,
      default: "",
    },

    // pending → superadmin has not acted yet
    // approved → superadmin approved, account will be deactivated
    // rejected → superadmin rejected the request
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // When superadmin acts
    resolvedAt: {
      type: Date,
      default: null,
    },

    // Optional note from superadmin when approving/rejecting
    resolutionNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const DeactivationRequest = mongoose.model(
  "DeactivationRequest",
  deactivationRequestSchema
);

module.exports = DeactivationRequest;
