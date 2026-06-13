const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const DeactivationRequest = require("../models/DeactivationRequest");
const { pushEvent } = require("../utils/sseClients");
const {
  sendAccountCreatedEmail,
  sendPasswordResetEmail,
  sendAdminSetPasswordEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendDeactivationRequestEmail,
  sendDeactivationResultEmail,
} = require("../utils/sendEmail");

// ─────────────────────────────────────────────────────────────────────
// DEACTIVATION RULES:
//
//  SuperAdmin row     → fully untouchable by everyone (no button shown)
//  SuperAdmin acting  → can DIRECTLY deactivate/reactivate any account
//                       via PATCH /admin/users/:id/direct-toggle
//  Regular admin      → must REQUEST deactivation → SuperAdmin approves
//  Reactivation       → regular admin can do directly (no approval)
// ─────────────────────────────────────────────────────────────────────

// ─── CREATE OWNER ──────────────────────────────────────────────
const createOwner = async (req, res) => {
  try {
    const { name, email, provider, password } = req.body;

    if (!name || !email || !provider)
      return res
        .status(400)
        .json({ message: "Name, email, and provider are required." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });

    if (provider === "local") {
      if (!password || password.length < 8)
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters." });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        role: "owner",
        provider: "local",
        passwordHash,
        createdBy: req.user._id,
      });

      sendAccountCreatedEmail({
        toEmail: user.email,
        toName: user.name,
        role: "owner",
        provider: "local",
        tempPassword: password,
      });

      return res.status(201).json({
        message: "Owner account created. Welcome email sent.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
        },
      });
    }

    if (provider === "google") {
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        role: "owner",
        provider: "google",
        createdBy: req.user._id,
      });

      sendAccountCreatedEmail({
        toEmail: user.email,
        toName: user.name,
        role: "owner",
        provider: "google",
      });

      return res.status(201).json({
        message: "Owner (Google) account created. Welcome email sent.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
        },
      });
    }

    return res
      .status(400)
      .json({ message: "Provider must be 'local' or 'google'." });
  } catch (error) {
    console.error("Create owner error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── CREATE ADMIN ──────────────────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: "admin",
      provider: "local",
      passwordHash,
      createdBy: req.user._id,
    });

    sendAccountCreatedEmail({
      toEmail: user.email,
      toName: user.name,
      role: "admin",
      provider: "local",
      tempPassword: password,
    });

    res.status(201).json({
      message: "Admin account created. Welcome email sent.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET ALL USERS ─────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select(
        "-passwordHash -passwordResetToken -passwordResetExpiry -googleId"
      )
      .populate("createdBy", "name email")
      .sort({ isSuperAdmin: -1, createdAt: -1 });

    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users." });
  }
};

// ─── SUPERADMIN DIRECT TOGGLE ──────────────────────────────────
// SuperAdmin can directly activate/deactivate any non-superadmin
// account without the request flow. No approval needed.
const superAdminDirectToggle = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    // Cannot touch another superadmin (there should only be one anyway)
    if (target.isSuperAdmin)
      return res
        .status(403)
        .json({ message: "Cannot modify another SuperAdmin account." });

    if (target._id.toString() === req.user._id.toString())
      return res
        .status(400)
        .json({ message: "You cannot modify your own account." });

    const wasActive = target.isActive;
    target.isActive = !target.isActive;
    await target.save();

    if (wasActive) {
      sendAccountDeactivatedEmail({
        toEmail: target.email,
        toName: target.name,
        adminName: req.user.name,
      });
    } else {
      sendAccountReactivatedEmail({
        toEmail: target.email,
        toName: target.name,
      });
    }

    res.json({
      message: `${target.name}'s account has been ${
        target.isActive ? "reactivated" : "deactivated"
      }.`,
      isActive: target.isActive,
    });
  } catch (error) {
    console.error("SuperAdmin direct toggle error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── REACTIVATE USER (regular admin, direct) ───────────────────
const reactivateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    if (target.isSuperAdmin)
      return res
        .status(403)
        .json({ message: "SuperAdmin account cannot be modified." });

    if (target._id.toString() === req.user._id.toString())
      return res
        .status(400)
        .json({ message: "You cannot modify your own account." });

    if (target.isActive)
      return res.status(400).json({ message: "Account is already active." });

    target.isActive = true;
    await target.save();

    sendAccountReactivatedEmail({ toEmail: target.email, toName: target.name });

    res.json({
      message: `${target.name}'s account has been reactivated.`,
      isActive: true,
    });
  } catch (error) {
    console.error("Reactivate error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── REQUEST DEACTIVATION (regular admin → needs SuperAdmin approval)
const requestDeactivation = async (req, res) => {
  try {
    const { reason } = req.body;
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found." });

    if (target.isSuperAdmin)
      return res
        .status(403)
        .json({ message: "SuperAdmin account cannot be deactivated." });

    if (!target.isActive)
      return res
        .status(400)
        .json({ message: "This account is already deactivated." });

    if (target._id.toString() === req.user._id.toString())
      return res
        .status(400)
        .json({
          message: "You cannot request deactivation of your own account.",
        });

    const existing = await DeactivationRequest.findOne({
      targetUser: target._id,
      status: "pending",
    });
    if (existing)
      return res
        .status(409)
        .json({
          message:
            "A deactivation request for this account is already pending.",
        });

    const superAdmin = await User.findOne({ isSuperAdmin: true });
    if (!superAdmin)
      return res
        .status(500)
        .json({ message: "No SuperAdmin configured. Cannot route request." });

    const request = await DeactivationRequest.create({
      targetUser: target._id,
      requestedBy: req.user._id,
      reason: reason || "",
    });

    // Real-time push to connected superadmin
    pushEvent("new-deactivation-request", {
      requestId: request._id,
      targetName: target.name,
      targetEmail: target.email,
      targetRole: target.role,
      requestedByName: req.user.name,
      reason: reason || "",
      createdAt: request.createdAt,
    });

    sendDeactivationRequestEmail({
      toEmail: superAdmin.email,
      toName: superAdmin.name,
      requestedByName: req.user.name,
      targetName: target.name,
      targetEmail: target.email,
      targetRole: target.role,
      reason,
      approveLink: `${process.env.FRONTEND_URL}/admin/users`,
      rejectLink: `${process.env.FRONTEND_URL}/admin/users`,
    });

    res.status(201).json({
      message: `Deactivation request for ${target.name} sent to SuperAdmin.`,
      requestId: request._id,
    });
  } catch (error) {
    console.error("Request deactivation error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET PENDING REQUESTS (SuperAdmin only) ────────────────────
const getPendingRequests = async (req, res) => {
  try {
    const requests = await DeactivationRequest.find({ status: "pending" })
      .populate("targetUser", "name email role isActive isSuperAdmin")
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests, total: requests.length });
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests." });
  }
};

// ─── APPROVE DEACTIVATION (SuperAdmin only) ────────────────────
const approveDeactivation = async (req, res) => {
  try {
    const { note } = req.body;

    const request = await DeactivationRequest.findById(req.params.requestId)
      .populate("targetUser", "name email role")
      .populate("requestedBy", "name email");

    if (!request)
      return res.status(404).json({ message: "Request not found." });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Already resolved." });

    await User.findByIdAndUpdate(request.targetUser._id, { isActive: false });

    request.status = "approved";
    request.resolvedAt = new Date();
    request.resolutionNote = note || "";
    await request.save();

    pushEvent("request-resolved", {
      requestId: request._id,
      status: "approved",
    });

    sendDeactivationResultEmail({
      toEmail: request.requestedBy.email,
      toName: request.requestedBy.name,
      targetName: request.targetUser.name,
      status: "approved",
      note,
    });
    sendAccountDeactivatedEmail({
      toEmail: request.targetUser.email,
      toName: request.targetUser.name,
      adminName: req.user.name,
    });

    res.json({
      message: `${request.targetUser.name}'s account has been deactivated.`,
    });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── REJECT DEACTIVATION (SuperAdmin only) ─────────────────────
const rejectDeactivation = async (req, res) => {
  try {
    const { note } = req.body;

    const request = await DeactivationRequest.findById(req.params.requestId)
      .populate("targetUser", "name email")
      .populate("requestedBy", "name email");

    if (!request)
      return res.status(404).json({ message: "Request not found." });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Already resolved." });

    request.status = "rejected";
    request.resolvedAt = new Date();
    request.resolutionNote = note || "";
    await request.save();

    pushEvent("request-resolved", {
      requestId: request._id,
      status: "rejected",
    });
    sendDeactivationResultEmail({
      toEmail: request.requestedBy.email,
      toName: request.requestedBy.name,
      targetName: request.targetUser.name,
      status: "rejected",
      note,
    });

    res.json({ message: "Request rejected. Admin notified." });
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── ADMIN SEND RESET LINK ─────────────────────────────────────
const adminSendResetLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.provider !== "local")
      return res
        .status(400)
        .json({ message: "Google account — password reset not applicable." });
    if (!user.isActive)
      return res
        .status(400)
        .json({ message: "Cannot reset password for a deactivated account." });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail({
      toEmail: user.email,
      toName: user.name,
      resetLink,
      triggeredByAdmin: true,
    });

    res.json({ message: `Password reset link sent to ${user.email}.` });
  } catch (error) {
    console.error("Admin send reset link error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── ADMIN SET PASSWORD ────────────────────────────────────────
const adminSetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.provider !== "local")
      return res
        .status(400)
        .json({ message: "Google account — password reset not applicable." });
    if (!newPassword || newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = true;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    sendAdminSetPasswordEmail({
      toEmail: user.email,
      toName: user.name,
      tempPassword: newPassword,
    });

    res.json({ message: `Password updated and emailed to ${user.name}.` });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createOwner,
  createAdmin,
  getUsers,
  superAdminDirectToggle,
  reactivateUser,
  requestDeactivation,
  getPendingRequests,
  approveDeactivation,
  rejectDeactivation,
  adminSendResetLink,
  adminSetPassword,
};
