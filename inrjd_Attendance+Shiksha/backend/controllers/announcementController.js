const Announcement = require("../models/Announcement");

// GET active announcements (all authenticated users)
const getAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const docs = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ priority: 1, createdAt: -1 })
      .limit(5);
    res.json({ announcements: docs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements." });
  }
};

// POST — admin creates announcement
const createAnnouncement = async (req, res) => {
  try {
    const { text, priority, expiresAt } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Text is required." });
    const doc = await Announcement.create({
      text: text.trim(),
      priority: priority || "info",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
    });
    res
      .status(201)
      .json({ message: "Announcement created.", announcement: doc });
  } catch (err) {
    res.status(500).json({ message: "Failed to create announcement." });
  }
};

// PATCH — toggle active/inactive
const toggleAnnouncement = async (req, res) => {
  try {
    const doc = await Announcement.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found." });
    doc.isActive = !doc.isActive;
    await doc.save();
    res.json({
      message: `Announcement ${doc.isActive ? "activated" : "deactivated"}.`,
      announcement: doc,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update." });
  }
};

// DELETE
const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete." });
  }
};

// GET all (admin — includes inactive)
const getAllAnnouncements = async (req, res) => {
  try {
    const docs = await Announcement.find({}).sort({ createdAt: -1 });
    res.json({ announcements: docs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch." });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
};
