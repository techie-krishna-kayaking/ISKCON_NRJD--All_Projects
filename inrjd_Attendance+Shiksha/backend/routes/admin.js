const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/adminController");
const { protect, adminOnly, superAdminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

// ─── User management ──────────────────────────────────────────
router.post("/create-owner", createOwner);
router.post("/create-admin", createAdmin);
router.get("/users", getUsers);

// ── SuperAdmin direct toggle (no approval needed) ─────────────
router.patch(
  "/users/:id/direct-toggle",
  superAdminOnly,
  superAdminDirectToggle
);

// ── Regular admin actions ──────────────────────────────────────
router.patch("/users/:id/reactivate", reactivateUser);
router.post("/users/:id/request-deactivation", requestDeactivation);

// ── Password management ────────────────────────────────────────
router.post("/users/:id/send-reset-link", adminSendResetLink);
router.patch("/users/:id/set-password", adminSetPassword);

// ─── Deactivation request flow (SuperAdmin only) ──────────────
router.get(
  "/deactivation-requests/pending",
  superAdminOnly,
  getPendingRequests
);
router.post(
  "/deactivation-requests/:requestId/approve",
  superAdminOnly,
  approveDeactivation
);
router.post(
  "/deactivation-requests/:requestId/reject",
  superAdminOnly,
  rejectDeactivation
);

module.exports = router;
