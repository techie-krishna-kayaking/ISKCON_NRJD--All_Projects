const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/certificationController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/levels", (req, res) => {
  res.json({ levels: ctrl.LEVEL_ORDER });
});
router.get("/participant/:participantId", ctrl.getCertificationHistory);
router.get("/course/:courseId", ctrl.getCertificationsByCourse);
router.post("/", ctrl.issueCertification);

module.exports = router;
