const Participant = require("../models/Participant");
const GrowthPlan = require("../models/GrowthPlan");
const Certification = require("../models/Certification");

// ── CREATE ──────────────────────────────────────────────────────────
const createParticipant = async (req, res) => {
  try {
    const {
      name, shikshaCode, programKey, aadharNumber, bvLeader,
      gender, email, contactNumber, dob, address, language,
      programOwner,
    } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required." });

    if (shikshaCode) {
      const exists = await Participant.findOne({ shikshaCode: shikshaCode.toUpperCase() });
      if (exists)
        return res.status(409).json({ message: `Shiksha code "${shikshaCode}" already exists.` });
    }

    const ownerId =
      req.user.role === "admin" && programOwner ? programOwner : req.user._id;

    const participant = await Participant.create({
      name: name.trim(),
      shikshaCode: shikshaCode?.trim().toUpperCase() || undefined,
      programKey: programKey?.trim() || "",
      aadharNumber: aadharNumber?.trim() || "",
      bvLeader: bvLeader?.trim() || "",
      gender: gender || "",
      email: email?.trim().toLowerCase() || "",
      contactNumber: contactNumber?.trim() || "",
      dob: dob ? new Date(dob) : null,
      address: address?.trim() || "",
      language: language?.trim() || "",
      currentLevel: "None",
      activeFlag: true,
      addedAt: new Date(),
      programOwner: ownerId,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Participant created.", participant });
  } catch (err) {
    console.error("Create participant error:", err);
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate shiksha code." });
    res.status(500).json({ message: err.message || "Failed to create participant." });
  }
};

// ── LIST ────────────────────────────────────────────────────────────
const getParticipants = async (req, res) => {
  try {
    const { search, level, active } = req.query;
    const filter =
      req.user.role === "admin" ? {} : { programOwner: req.user._id };

    if (level) filter.currentLevel = level;
    if (active !== undefined) filter.activeFlag = active === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shikshaCode: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const participants = await Participant.find(filter)
      .populate("programOwner", "name email")
      .sort({ name: 1 })
      .lean();

    res.json({ participants, total: participants.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch participants." });
  }
};

// ── GET SINGLE (with growth plans + certification history) ──────────
const getParticipantDetail = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .populate("programOwner", "name email")
      .lean();

    if (!participant)
      return res.status(404).json({ message: "Participant not found." });

    // Owners can only view their own participants
    if (req.user.role !== "admin") {
      const ownerId = participant.programOwner?._id?.toString() || participant.programOwner?.toString();
      if (ownerId !== req.user._id.toString())
        return res.status(403).json({ message: "Access denied." });
    }

    const [growthPlans, certifications] = await Promise.all([
      GrowthPlan.find({ participant: participant._id })
        .sort({ createdAt: -1 })
        .lean(),
      Certification.find({ participant: participant._id })
        .populate("course", "name level")
        .sort({ certificationDate: -1 })
        .lean(),
    ]);

    const latestCertification = certifications.length > 0 ? certifications[0] : null;

    res.json({
      participant,
      growthPlans,
      certifications,
      latestCertification,
    });
  } catch (err) {
    console.error("Get participant detail error:", err);
    res.status(500).json({ message: "Failed to fetch participant details." });
  }
};

// ── UPDATE ──────────────────────────────────────────────────────────
const updateParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant)
      return res.status(404).json({ message: "Participant not found." });

    if (req.user.role !== "admin") {
      if (participant.programOwner?.toString() !== req.user._id.toString())
        return res.status(403).json({ message: "Access denied." });
    }

    const allowed = [
      "name", "shikshaCode", "programKey", "aadharNumber", "bvLeader",
      "gender", "email", "contactNumber", "dob", "address", "language",
      "activeFlag", "programOwner",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) participant[key] = req.body[key];
    }
    await participant.save();

    res.json({ message: "Participant updated.", participant });
  } catch (err) {
    console.error("Update participant error:", err);
    if (err.code === 11000)
      return res.status(409).json({ message: "Duplicate shiksha code." });
    res.status(500).json({ message: "Failed to update participant." });
  }
};

module.exports = {
  createParticipant,
  getParticipants,
  getParticipantDetail,
  updateParticipant,
};
