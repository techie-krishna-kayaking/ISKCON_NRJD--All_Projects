const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.getCourses);
router.get("/:id", ctrl.getCourseById);
router.post("/", adminOnly, ctrl.createCourse);
router.patch("/:id", adminOnly, ctrl.updateCourse);

module.exports = router;
