const express = require("express");
const router  = express.Router();
const { getOwnerDashboard } = require("../controllers/ownerDashboardController");
const { getAdminDashboard } = require("../controllers/admindashboardController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/owner", protect, getOwnerDashboard);
router.get("/admin", protect, adminOnly, getAdminDashboard);

module.exports = router;