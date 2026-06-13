const express = require("express");
const router = express.Router();

const programController = require("../controllers/programController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/owners", adminOnly, programController.getOwnersList);
router.get("/", programController.getPrograms);
router.get("/:id", programController.getProgramById);
router.post("/", programController.createProgram);

// Toggle actFlag active ↔ inactive (and set promoted when disabling)
router.patch("/:id/toggle-status", programController.toggleProgramStatus);

module.exports = router;
