const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/shikshaAnalyticsController");
const { protect, adminOnly } = require("../middleware/auth");
const { LEVEL_ORDER, LEVEL_DATA, NEXT_LEVEL_MAP } = require("../config/levelData");

router.use(protect);

// Level data endpoint (used by frontend for certification form)
router.get("/level-data", (req, res) => {
  res.json({ levels: LEVEL_ORDER, levelData: LEVEL_DATA, nextLevelMap: NEXT_LEVEL_MAP });
});

// Admin-only overview analytics
router.get("/overview", adminOnly, ctrl.getShikshaOverview);

// Individual participant analytics (both admin and owner)
router.get("/participant/:id", ctrl.getParticipantAnalytics);

module.exports = router;
