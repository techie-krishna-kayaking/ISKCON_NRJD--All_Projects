const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    role: {
      type: String,
      enum: ["admin", "owner"],
      required: [true, "Role is required"],
    },

    // Marks the one superadmin — set only by seedAdmin, never by any API
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      required: [true, "Provider is required"],
    },

    passwordHash: {
      type: String,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpiry: {
      type: Date,
      default: null,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    programKeyPrefix: {
      type: String,
      uppercase: true,
      trim: true,
      minlength: 1,
      maxlength: 5,
      default: null,
    },

    // ── Deactivation review (SuperAdmin approval flow) ──────────────────
    // When admin deactivates an owner, set pendingApproval: true so the
    // SuperAdmin sees it in the review queue on next login.
    // SuperAdmin can approve (confirm deactivation) or reject (reinstate).

    pendingApproval: {
      type: Boolean,
      default: false,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deactivationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check reset token validity
userSchema.methods.isResetTokenValid = function (rawToken) {
  const crypto = require("crypto");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetExpiry &&
    this.passwordResetExpiry > Date.now()
  );
};

const User = mongoose.model("User", userSchema);
module.exports = User;
