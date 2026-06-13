const Course = require("../models/Course");

// ── CREATE (admin only) ─────────────────────────────────────────────
const createCourse = async (req, res) => {
  try {
    const { name, description, level, certificationEnabled } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Course name is required." });
    if (!level) return res.status(400).json({ message: "Course level is required." });

    const exists = await Course.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ message: `Course "${name}" already exists.` });

    const course = await Course.create({
      name: name.trim(),
      description: description?.trim() || "",
      level,
      certificationEnabled: certificationEnabled !== false,
      active: true,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Course created.", course });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ message: "Failed to create course." });
  }
};

// ── UPDATE (admin only) ─────────────────────────────────────────────
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });

    const { name, description, level, certificationEnabled, active } = req.body;
    if (name !== undefined) course.name = name.trim();
    if (description !== undefined) course.description = description.trim();
    if (level !== undefined) course.level = level;
    if (certificationEnabled !== undefined) course.certificationEnabled = certificationEnabled;
    if (active !== undefined) course.active = active;
    await course.save();

    res.json({ message: "Course updated.", course });
  } catch (err) {
    console.error("Update course error:", err);
    if (err.code === 11000) return res.status(409).json({ message: "Duplicate course name." });
    res.status(500).json({ message: "Failed to update course." });
  }
};

// ── LIST ────────────────────────────────────────────────────────────
const getCourses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === "true";
    const courses = await Course.find(filter).sort({ level: 1, name: 1 }).lean();
    res.json({ courses, total: courses.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses." });
  }
};

// ── GET SINGLE ──────────────────────────────────────────────────────
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).json({ message: "Course not found." });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course." });
  }
};

module.exports = { createCourse, updateCourse, getCourses, getCourseById };
