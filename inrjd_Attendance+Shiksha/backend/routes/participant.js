const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/participantController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.getParticipants);
router.get("/:id", ctrl.getParticipantDetail);
router.post("/", ctrl.createParticipant);
router.patch("/:id", ctrl.updateParticipant);

module.exports = router;
