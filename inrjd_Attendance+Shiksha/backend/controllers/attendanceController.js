const Program = require("../models/Program");
const Devotee = require("../models/Devotee");
const ProgramNamesOnly = require("../models/ProgramNamesOnly");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");
const Config = require("../models/Config");

// ── True if programType is a BV / BhaktiVriksha program ─────────────
function isBVProgram(programType) {
  if (!programType) return false;
  const t = programType.toLowerCase().replace(/\s+/g, "");
  return (
    t === "bv" || t.includes("bhaktivriksha") || t.includes("bhakti-vriksha")
  );
}

function canAccess(req, program) {
  if (req.user.role === "admin") return true;
  const ownerId = program.programOwner?._id
    ? program.programOwner._id.toString()
    : program.programOwner.toString();
  return ownerId === req.user._id.toString();
}

// ── GET program data for attendance page ─────────────────────────────
const getProgramAttendance = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate(
      "programOwner",
      "name email"
    );

    if (!program)
      return res.status(404).json({ message: "Program not found." });
    if (!canAccess(req, program))
      return res.status(403).json({ message: "Access denied." });

    const devotees = await Devotee.find({ program: program._id })
      .select("name phone email addedToProgram")
      .lean();

    const summaries = await AttendanceSummary.find({ program: program._id })
      .select("devoteeName totalSessions attended percentage addedToProgram")
      .lean();

    const summaryMap = {};
    summaries.forEach((s) => {
      summaryMap[s.devoteeName] = s;
    });

    // BV chapters — look up if this is a BV type program
    let bvChapters = [];
    if (isBVProgram(program.programType)) {
      const cfg = await Config.findOne({ type: "bvChapters" });
      bvChapters = cfg?.values || [];
    }

    const lastAtt = await Attendance.findOne({ program: program._id })
      .sort({ date: -1 })
      .select("date")
      .lean();

    const uniqueDates = await Attendance.distinct("date", {
      program: program._id,
    });

    res.json({
      program,
      devotees,
      summaryMap,
      bvChapters,
      isBV: isBVProgram(program.programType),
      lastSessionDate: lastAtt?.date || null,
      totalSessions: uniqueDates.length,
    });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ message: "Failed to fetch attendance data." });
  }
};

// ── SUBMIT attendance (SCD2 — append only) ───────────────────────────
const submitAttendance = async (req, res) => {
  try {
    const { programId, date, hostName, chapter, records } = req.body;

    if (!programId || !date || !hostName?.trim() || !records?.length)
      return res.status(400).json({
        message: "programId, date, hostName, and records are required.",
      });

    const program = await Program.findById(programId);
    if (!program)
      return res.status(404).json({ message: "Program not found." });
    if (!canAccess(req, program))
      return res.status(403).json({ message: "Access denied." });

    if (program.actFlag === "inactive")
      return res.status(400).json({
        message: "This program is inactive. Cannot record attendance.",
      });

    // Validate BV chapter if required
    if (isBVProgram(program.programType) && !chapter?.trim())
      return res
        .status(400)
        .json({ message: "BV Chapter is required for this program type." });

    const attendanceDate = new Date(date);

    const existing = await Attendance.findOne({
      program: program._id,
      date: attendanceDate,
    });
    if (existing) {
      return res.status(409).json({
        message: `Attendance for ${attendanceDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })} was already submitted for this program.`,
      });
    }

    // Insert attendance records
    const docs = records.map((r) => ({
      program: program._id,
      programKey: program.programKey,
      area: program.area,
      subArea: program.subArea,
      frequency: program.frequency,
      programType: program.programType,
      language: program.language,
      programOwner: program.programOwner,
      chapter: chapter?.trim() || "",
      hostName: hostName.trim(),
      devoteeName: r.devoteeName,
      date: attendanceDate,
      status: r.status,
    }));

    await Attendance.insertMany(docs);

    // Recompute summary
    const uniqueDates = await Attendance.distinct("date", {
      program: program._id,
    });
    const totalSessions = uniqueDates.length;

    const presentAgg = await Attendance.aggregate([
      { $match: { program: program._id, status: "present" } },
      { $group: { _id: "$devoteeName", attended: { $sum: 1 } } },
    ]);
    const presentMap = {};
    presentAgg.forEach((a) => {
      presentMap[a._id] = a.attended;
    });

    const allDevotees = await Attendance.distinct("devoteeName", {
      program: program._id,
    });

    // Build a lookup of addedToProgram dates from Devotee collection
    const devoteeRecords = await Devotee.find({ program: program._id })
      .select("name addedToProgram")
      .lean();
    const addedDateMap = {};
    devoteeRecords.forEach((d) => {
      addedDateMap[d.name] = d.addedToProgram || d.createdAt;
    });

    // Sort session dates for efficient per-devotee filtering
    const sortedDates = uniqueDates
      .map((d) => new Date(d))
      .sort((a, b) => a - b);

    const newSummaries = allDevotees.map((name) => {
      const addedDate = addedDateMap[name] || null;
      // Count only sessions on or after the devotee's addedToProgram date
      const eligibleSessions = addedDate
        ? sortedDates.filter((d) => d >= new Date(addedDate)).length
        : totalSessions;
      const att = presentMap[name] || 0;
      return {
        program: program._id,
        programKey: program.programKey,
        area: program.area,
        subArea: program.subArea,
        frequency: program.frequency,
        programType: program.programType,
        language: program.language,
        programOwner: program.programOwner,
        devoteeName: name,
        addedToProgram: addedDate,
        totalSessions: eligibleSessions,
        attended: att,
        percentage:
          eligibleSessions > 0
            ? Math.round((att / eligibleSessions) * 100)
            : 0,
      };
    });

    await AttendanceSummary.deleteMany({ program: program._id });
    if (newSummaries.length) await AttendanceSummary.insertMany(newSummaries);

    res.json({
      message: "Attendance submitted successfully.",
      totalSessions,
      recordsInserted: docs.length,
    });
  } catch (err) {
    console.error("Submit attendance error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to submit attendance." });
  }
};

// ── ADD devotee to a program ──────────────────────────────────────────
const addDevotee = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Name is required." });

    const program = await Program.findById(req.params.programId);
    if (!program)
      return res.status(404).json({ message: "Program not found." });
    if (!canAccess(req, program))
      return res.status(403).json({ message: "Access denied." });

    const existing = await Devotee.findOne({
      program: program._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing)
      return res
        .status(409)
        .json({ message: `"${name.trim()}" is already in this program.` });

    const devotee = await Devotee.create({
      program: program._id,
      name: name.trim(),
      phone: phone?.trim() || "",
      email: email?.trim().toLowerCase() || "",
    });

    program.devotees.push(devotee._id);
    await program.save();

    await ProgramNamesOnly.findOneAndUpdate(
      { program: program._id },
      { $addToSet: { names: name.trim() } },
      { upsert: true }
    );

    res
      .status(201)
      .json({ message: `${name.trim()} added to program.`, devotee });
  } catch (err) {
    res.status(500).json({ message: "Failed to add devotee." });
  }
};

// ── GET attendance history (grouped by session date) ─────────────────
const getAttendanceHistory = async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    if (!program)
      return res.status(404).json({ message: "Program not found." });
    if (!canAccess(req, program))
      return res.status(403).json({ message: "Access denied." });

    const sessions = await Attendance.aggregate([
      { $match: { program: program._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          hostName: { $first: "$hostName" },
          chapter: { $first: "$chapter" },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 20 },
    ]);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history." });
  }
};

module.exports = {
  getProgramAttendance,
  submitAttendance,
  addDevotee,
  getAttendanceHistory,
};
