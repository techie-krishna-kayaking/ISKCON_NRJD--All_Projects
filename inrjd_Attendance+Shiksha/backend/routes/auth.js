const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const rateLimit = require("express-rate-limit");
const {
  login,
  googleCallback,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Local auth
router.post("/login", loginLimiter, login);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
    session: false,
  }),
  googleCallback
);

// Protected
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

// Password reset (public — token-gated)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
