const User = require("../models/User");

// ── GET own profile ──────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-passwordHash -passwordResetToken -passwordResetExpiry -googleId"
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile." });
  }
};

// ── UPDATE own profile ───────────────────────────────────────────────
// Currently allows updating: programKeyPrefix only
// (name/email changes need admin approval — keep it safe)
const updateProfile = async (req, res) => {
  try {
    const { programKeyPrefix } = req.body;

    if (programKeyPrefix !== undefined) {
      const trimmed = programKeyPrefix.trim().toUpperCase();

      if (trimmed.length < 1 || trimmed.length > 5)
        return res
          .status(400)
          .json({ message: "Program key prefix must be 1–5 characters." });

      if (!/^[A-Z0-9]+$/.test(trimmed))
        return res
          .status(400)
          .json({
            message: "Program key prefix can only contain letters and numbers.",
          });

      // Check uniqueness — no two owners should have same prefix
      const existing = await User.findOne({
        programKeyPrefix: trimmed,
        _id: { $ne: req.user._id },
      });
      if (existing)
        return res.status(409).json({
          message: `Prefix "${trimmed}" is already used by ${existing.name}. Choose a different one.`,
        });

      await User.findByIdAndUpdate(req.user._id, { programKeyPrefix: trimmed });

      return res.json({
        message: `Program key prefix set to "${trimmed}". New programs will use this prefix.`,
        programKeyPrefix: trimmed,
      });
    }

    return res.status(400).json({ message: "No updatable fields provided." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile." });
  }
};

module.exports = { getProfile, updateProfile };
