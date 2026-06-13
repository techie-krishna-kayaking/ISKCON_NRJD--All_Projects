const express = require("express");
const router = express.Router();
const ac = require("../controllers/announcementController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, ac.getAnnouncements);
router.get("/all", protect, adminOnly, ac.getAllAnnouncements);
router.post("/", protect, adminOnly, ac.createAnnouncement);
router.patch("/:id/toggle", protect, adminOnly, ac.toggleAnnouncement);
router.delete("/:id", protect, adminOnly, ac.deleteAnnouncement);

module.exports = router;
