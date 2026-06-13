const express = require("express");
const router = express.Router();
const {
  getAdminAnalytics,
  searchDevotee,
  suggestDevotee,
  ownerSearchDevotee,
  ownerSuggestDevotee,
} = require("../controllers/adminAnalyticsController");
const { protect, adminOnly, ownerOnly } = require("../middleware/auth");

router.get("/admin", protect, adminOnly, getAdminAnalytics);
router.get("/admin/devotee", protect, adminOnly, searchDevotee);
router.get("/admin/devotee/suggest", protect, adminOnly, suggestDevotee);
router.get("/owner/devotee", protect, ownerOnly, ownerSearchDevotee);
router.get("/owner/devotee/suggest", protect, ownerOnly, ownerSuggestDevotee);

module.exports = router;
