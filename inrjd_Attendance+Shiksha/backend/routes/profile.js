const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", profileController.getProfile);
router.patch("/", profileController.updateProfile);

module.exports = router;
