const express = require("express");
const router = express.Router();
const {
  getOwnerAlerts,
  getProgramHealth,
  getAttendanceOverview,
} = require("../controllers/alertController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/owner", getOwnerAlerts);
router.get("/overview", getAttendanceOverview);
router.get("/program/:id", getProgramHealth);

module.exports = router;
