const express = require("express");
const router = express.Router();
const {
  getOwnerAnalytics,
  getProgramDrilldown,
  ownerSearchDevotee,
  ownerSuggestDevotee,
} = require("../controllers/ownerAnalyticsController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/owner", getOwnerAnalytics);
router.get("/owner/drilldown/:programId", getProgramDrilldown);
router.get("/owner/devotee", ownerSearchDevotee);
router.get("/owner/devotee/suggest", ownerSuggestDevotee);

module.exports = router;
