const Program = require("../models/Program");
const Devotee = require("../models/Devotee");
const ProgramNamesOnly = require("../models/ProgramNamesOnly");
const User = require("../models/User");

// ── Generate programKey ──────────────────────────────────────────────
async function generateProgramKey(ownerId) {
  const owner = await User.findById(ownerId).select("name programKeyPrefix");
  if (!owner) throw new Error("Owner not found.");

  const prefix = owner.programKeyPrefix
    ? owner.programKeyPrefix.toUpperCase()
    : owner.name.replace(/\s+/g, "").substring(0, 3).toUpperCase();

  const count = await Program.countDocuments({ programOwner: ownerId });
  const seq = String(count + 1).padStart(3, "0");
  let key = `${prefix}${seq}`;

  let attempts = 0;
  while (await Program.exists({ programKey: key })) {
    attempts++;
    key = `${prefix}${String(count + 1 + attempts).padStart(3, "0")}`;
  }
  return key;
}

// ── CREATE ───────────────────────────────────────────────────────────
const createProgram = async (req, res) => {
  try {
    const {
      area,
      subArea,
      frequency,
      programType,
      language,
      programOwner: ownerIdFromBody,
      isVirtual,
      startDate,
      day,
      time,
      devotees: devoteesInput = [],
    } = req.body;

    const required = {
      area,
      subArea,
      frequency,
      programType,
      language,
      startDate,
      day,
      time,
    };
    for (const [field, val] of Object.entries(required)) {
      if (!val || String(val).trim() === "")
        return res.status(400).json({ message: `${field} is required.` });
    }

    const ownerId =
      req.user.role === "admin" && ownerIdFromBody
        ? ownerIdFromBody
        : req.user._id;

    if (!devoteesInput.length || !devoteesInput.some((d) => d.name?.trim()))
      return res
        .status(400)
        .json({ message: "At least one devotee with a name is required." });

    const programKey = await generateProgramKey(ownerId);

    const program = await Program.create({
      programKey,
      area: area.trim(),
      subArea: subArea.trim(),
      frequency: frequency.trim(),
      programType: programType.trim(),
      language: language.trim(),
      programOwner: ownerId,
      isVirtual: isVirtual === true || isVirtual === "true",
      startDate: new Date(startDate),
      day: day.trim(),
      time: time.trim(),
      createdBy: req.user._id,
      actFlag: "active",
      promoted: "",
    });

    const filtered = devoteesInput.filter((d) => d.name?.trim());
    const devoteeDocs = await Devotee.insertMany(
      filtered.map((d) => ({
        program: program._id,
        name: d.name.trim(),
        phone: d.phone?.trim() || "",
        email: d.email?.trim().toLowerCase() || "",
      }))
    );

    program.devotees = devoteeDocs.map((d) => d._id);
    await program.save();

    await ProgramNamesOnly.create({
      program: program._id,
      names: devoteeDocs.map((d) => d.name),
    });

    const populated = await Program.findById(program._id)
      .populate("programOwner", "name email programKeyPrefix")
      .populate("devotees", "name phone email");

    res.status(201).json({
      message: `Program "${programKey}" created successfully.`,
      program: populated,
    });
  } catch (err) {
    console.error("Create program error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to create program." });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────────
// Owner sees ONLY their own programs. Admin sees all.
const getPrograms = async (req, res) => {
  try {
    const { area, programType, actFlag, search } = req.query;

    // Owner is always filtered to their own programs
    const filter =
      req.user.role === "admin" ? {} : { programOwner: req.user._id };

    if (area) filter.area = area;
    if (programType) filter.programType = programType;
    if (actFlag) filter.actFlag = actFlag;
    if (search) {
      filter.$or = [
        { programKey: { $regex: search, $options: "i" } },
        { area: { $regex: search, $options: "i" } },
        { subArea: { $regex: search, $options: "i" } },
      ];
    }

    const programs = await Program.find(filter)
      .populate("programOwner", "name email programKeyPrefix")
      .populate("devotees", "name phone email")
      .sort({ createdAt: -1 });

    res.json({ programs, total: programs.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch programs." });
  }
};

// ── GET SINGLE ───────────────────────────────────────────────────────
const getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate("programOwner", "name email programKeyPrefix")
      .populate("devotees", "name phone email");

    if (!program)
      return res.status(404).json({ message: "Program not found." });

    // Owners can only see their own
    if (req.user.role !== "admin") {
      const ownerId = program.programOwner?._id
        ? program.programOwner._id.toString()
        : program.programOwner.toString();
      if (ownerId !== req.user._id.toString())
        return res.status(403).json({ message: "Access denied." });
    }

    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch program." });
  }
};

// ── TOGGLE STATUS ────────────────────────────────────────────────────
// Toggles actFlag active ↔ inactive.
// When disabling: sets promoted = "Yes"
// When re-enabling: clears promoted
const toggleProgramStatus = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program)
      return res.status(404).json({ message: "Program not found." });

    // Owners can only modify their own
    if (req.user.role !== "admin") {
      if (program.programOwner.toString() !== req.user._id.toString())
        return res.status(403).json({ message: "Access denied." });
    }

    const wasActive = program.actFlag !== "inactive";
    program.actFlag = wasActive ? "inactive" : "active";
    program.promoted = wasActive ? "Yes" : ""; // set promoted when disabling
    await program.save();

    res.json({
      message: `Program "${program.programKey}" is now ${program.actFlag}.`,
      actFlag: program.actFlag,
      promoted: program.promoted,
    });
  } catch (err) {
    console.error("Toggle status error:", err);
    res.status(500).json({ message: "Failed to toggle program status." });
  }
};

// ── OWNERS LIST ──────────────────────────────────────────────────────
const getOwnersList = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner", isActive: true })
      .select("_id name email programKeyPrefix")
      .sort("name");
    res.json({ owners });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch owners." });
  }
};

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  toggleProgramStatus,
  getOwnersList,
};
