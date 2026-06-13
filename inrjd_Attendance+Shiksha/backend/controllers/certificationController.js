const Certification = require("../models/Certification");
const Participant = require("../models/Participant");
const Course = require("../models/Course");

const LEVEL_ORDER = [
  "None",
  "Shraddhavan",
  "Krishna Sevak",
  "Krishna Sadhak",
  "Srila Prabhupada Ashraya",
  "Srila Guru Charana Ashraya",
];

function levelIndex(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx === -1 ? 0 : idx;
}

function nextLevel(current) {
  const idx = levelIndex(current);
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : current;
}

// ── ISSUE CERTIFICATION (append-only) ───────────────────────────────
const issueCertification = async (req, res) => {
  try {
    const {
      participantId, courseId, certificationLevel, certificationDate,
      recommendedBy, filledBy, chanting, books, commitments, seva,
      aCode, bCode, cCode, dCode, eCode, fCode,
      declarationAccepted, metadataJson,
    } = req.body;

    if (!participantId) return res.status(400).json({ message: "Participant is required." });
    if (!courseId) return res.status(400).json({ message: "Course is required." });
    if (!certificationLevel) return res.status(400).json({ message: "Certification level is required." });
    if (!certificationDate) return res.status(400).json({ message: "Certification date is required." });

    const [participant, course] = await Promise.all([
      Participant.findById(participantId),
      Course.findById(courseId),
    ]);

    if (!participant) return res.status(404).json({ message: "Participant not found." });
    if (!course) return res.status(404).json({ message: "Course not found." });

    if (!course.certificationEnabled)
      return res.status(400).json({ message: "This course does not issue certifications." });

    // Owners can only certify their own participants
    if (req.user.role !== "admin") {
      if (participant.programOwner?.toString() !== req.user._id.toString())
        return res.status(403).json({ message: "Access denied." });
    }

    const currentLevelBefore = participant.currentLevel || "None";
    const newLevelAfter = certificationLevel;

    // Validate: new level must be >= current level (no downgrade)
    if (levelIndex(newLevelAfter) < levelIndex(currentLevelBefore))
      return res.status(400).json({
        message: `Cannot downgrade from "${currentLevelBefore}" to "${newLevelAfter}".`,
      });

    const certification = await Certification.create({
      participant: participantId,
      course: courseId,
      certificationLevel,
      certificationDate: new Date(certificationDate),
      recommendedBy: recommendedBy?.trim() || "",
      filledBy: filledBy?.trim() || "",
      currentLevelBefore,
      newLevelAfter,
      chanting: chanting?.trim() || "",
      books: books?.trim() || "",
      commitments: commitments?.trim() || "",
      seva: seva?.trim() || "",
      aCode: aCode?.trim() || "",
      bCode: bCode?.trim() || "",
      cCode: cCode?.trim() || "",
      dCode: dCode?.trim() || "",
      eCode: eCode?.trim() || "",
      fCode: fCode?.trim() || "",
      declarationAccepted: !!declarationAccepted,
      metadataJson: metadataJson || {},
      createdBy: req.user._id,
    });

    // Update participant's current level
    participant.currentLevel = newLevelAfter;
    await participant.save();

    const populated = await Certification.findById(certification._id)
      .populate("course", "name level")
      .populate("participant", "name shikshaCode currentLevel")
      .lean();

    res.status(201).json({ message: "Certification issued.", certification: populated });
  } catch (err) {
    console.error("Issue certification error:", err);
    res.status(500).json({ message: "Failed to issue certification." });
  }
};

// ── HISTORY FOR PARTICIPANT ─────────────────────────────────────────
const getCertificationHistory = async (req, res) => {
  try {
    const certs = await Certification.find({ participant: req.params.participantId })
      .populate("course", "name level")
      .sort({ certificationDate: -1 })
      .lean();
    res.json({ certifications: certs, total: certs.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch certification history." });
  }
};

// ── COURSE-WISE TRAIL ───────────────────────────────────────────────
const getCertificationsByCourse = async (req, res) => {
  try {
    const certs = await Certification.find({ course: req.params.courseId })
      .populate("participant", "name shikshaCode currentLevel")
      .sort({ certificationDate: -1 })
      .lean();
    res.json({ certifications: certs, total: certs.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch certifications." });
  }
};

// ── HELPER: level progression info ──────────────────────────────────
const getLevelProgression = async (req, res) => {
  res.json({ levels: LEVEL_ORDER, nextLevel: nextLevel });
};

module.exports = {
  issueCertification,
  getCertificationHistory,
  getCertificationsByCourse,
  getLevelProgression,
  LEVEL_ORDER,
  nextLevel,
};
