const express = require("express");
const router  = express.Router();
const ac = require("../controllers/attendanceController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/program/:id",         ac.getProgramAttendance);
router.get("/history/:programId",  ac.getAttendanceHistory);
router.post("/submit",             ac.submitAttendance);
router.post("/add-devotee/:programId", ac.addDevotee);

module.exports = router;