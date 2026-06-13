const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Safe email helper — gracefully handles missing/broken email functions
async function trySendEmail(fn, args) {
  try {
    if (typeof fn === "function") await fn(args);
  } catch (e) {
    console.warn("[Email] Failed to send email:", e.message);
    // Don't throw — email failure should never break the auth flow
  }
}

// Lazy-load email functions so a missing/broken util doesn't crash the module
function getEmailFns() {
  try {
    return require("../utils/sendEmail");
  } catch {
    return {};
  }
}

// ── Helper: build the full user object returned to frontend ──────────
function buildUserPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin ?? false,
    programKeyPrefix: user.programKeyPrefix ?? null,
    mustChangePassword: user.mustChangePassword ?? false,
    lastLogin: user.lastLogin ?? null,
    createdAt: user.createdAt,
  };
}

// ─── LOCAL LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    if (user.provider !== "local")
      return res.status(401).json({
        message:
          "This account uses Google Sign-In. Please use 'Continue with Google'.",
      });

    if (!user.isActive)
      return res.status(401).json({
        message:
          "Your account has been deactivated. Contact your administrator.",
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    // If mustChangePassword — frontend should redirect to change-password page
    res.json({ token, user: buildUserPayload(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ─── GOOGLE OAUTH CALLBACK ───────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=Google authentication failed`
      );

    const token = generateToken(user._id, user.role);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${user.role}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=Authentication error`
    );
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash -passwordResetToken -passwordResetExpiry")
      .populate("createdBy", "name email");

    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile." });
  }
};

// ─── FORGOT PASSWORD (self-service) ─────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      message:
        "If an account with that email exists, a reset link has been sent.",
    };
    if (!email) return res.json(genericResponse);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.provider !== "local" || !user.isActive)
      return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    const { sendPasswordResetEmail } = getEmailFns();
    await trySendEmail(sendPasswordResetEmail, {
      toEmail: user.email,
      toName: user.name,
      resetLink,
    });

    res.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─── RESET PASSWORD (via token link) ────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired." });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    user.mustChangePassword = false; // ← clear forced-change flag
    await user.save();

    const { sendPasswordChangedEmail } = getEmailFns();
    await trySendEmail(sendPasswordChangedEmail, {
      toEmail: user.email,
      toName: user.name,
    });

    // Return fresh token + user so frontend can auto-login without another redirect
    const newToken = generateToken(user._id, user.role);
    res.json({
      message: "Password reset successfully. You can now log in.",
      token: newToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─── CHANGE PASSWORD (authenticated, including mustChangePassword flow) ──
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });

    const user = await User.findById(req.user._id);

    if (!user || user.provider !== "local")
      return res
        .status(400)
        .json({ message: "Password change not applicable for this account." });

    // Only require current password if NOT in forced-change mode
    if (!user.mustChangePassword) {
      if (!currentPassword)
        return res
          .status(400)
          .json({ message: "Current password is required." });
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch)
        return res
          .status(401)
          .json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false; // ← clear the forced-change flag
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    // Send notification email safely (won't crash if util missing)
    const { sendPasswordChangedEmail } = getEmailFns();
    await trySendEmail(sendPasswordChangedEmail, {
      toEmail: user.email,
      toName: user.name,
    });

    // Return fresh token + updated user so frontend updates its state immediately
    // and doesn't redirect back to the change-password page
    const newToken = generateToken(user._id, user.role);
    res.json({
      message: "Password changed successfully.",
      token: newToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─── SUPERADMIN: GET PENDING DEACTIVATION REQUESTS ──────────────────
// Returns users with pendingDeactivation flag — called on superadmin dashboard load
const getPendingActions = async (req, res) => {
  try {
    // Users deactivated by admin but not yet reviewed by superadmin
    const pending = await User.find({
      role: "owner",
      isActive: false,
      pendingApproval: true,
    })
      .select(
        "name email createdAt deactivatedAt deactivatedBy deactivationReason"
      )
      .populate("deactivatedBy", "name email")
      .lean();

    res.json({ pendingDeactivations: pending });
  } catch (error) {
    console.error("Get pending actions error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── SUPERADMIN: APPROVE / REJECT DEACTIVATION ──────────────────────
const reviewDeactivation = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: "approve" | "reject"
    if (!userId || !["approve", "reject"].includes(action))
      return res.status(400).json({ message: "Invalid request." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (action === "approve") {
      // Confirm deactivation
      user.isActive = false;
      user.pendingApproval = false;
    } else {
      // Reject — reinstate the user
      user.isActive = true;
      user.pendingApproval = false;
      user.deactivatedAt = null;
      user.deactivatedBy = null;
    }
    await user.save();

    res.json({
      message:
        action === "approve"
          ? "Deactivation approved."
          : "Deactivation rejected — owner account reinstated.",
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Review deactivation error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  login,
  googleCallback,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  getPendingActions,
  reviewDeactivation,
};
