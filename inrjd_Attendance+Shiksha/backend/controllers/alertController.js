const Program = require("../models/Program");
const Devotee = require("../models/Devotee");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");

// ── Frequency thresholds (days) ──────────────────────────────────────
const THRESHOLDS = {
  daily: { yellow: 5, red: 7 },
  weekly: { yellow: 7, red: 14 },
  "bi-weekly": { yellow: 14, red: 21 },
  biweekly: { yellow: 14, red: 21 },
  fortnightly: { yellow: 14, red: 21 },
  monthly: { yellow: 30, red: 45 },
  default: { yellow: 7, red: 14 },
};

function getThreshold(frequency) {
  if (!frequency) return THRESHOLDS.default;
  const key = frequency.toLowerCase().replace(/\s+/g, "");
  return THRESHOLDS[key] || THRESHOLDS.default;
}

function daysSince(date) {
  if (!date) return Infinity;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

// Returns "green" | "yellow" | "red"
function healthColor(frequency, lastDate) {
  const days = daysSince(lastDate);
  if (days === Infinity) return "red"; // never marked
  const t = getThreshold(frequency);
  if (days >= t.red) return "red";
  if (days >= t.yellow) return "yellow";
  return "green";
}

// ── GET /alerts/owner ────────────────────────────────────────────────
const getOwnerAlerts = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const programs = await Program.find({
      programOwner: ownerId,
      actFlag: "active",
    }).lean();

    const alerts = [];

    for (const prog of programs) {
      const lastAtt = await Attendance.findOne({ program: prog._id })
        .sort({ date: -1 })
        .select("date")
        .lean();
      const lastDate = lastAtt?.date || null;
      const days = daysSince(lastDate);
      const t = getThreshold(prog.frequency);
      const color = healthColor(prog.frequency, lastDate);
      const devotees = await Devotee.find({ program: prog._id })
        .select("name phone email")
        .lean();
      const summaries = await AttendanceSummary.find({
        program: prog._id,
      }).lean();

      // ── HIGH: Never had attendance ─────────────────────────────
      if (!lastDate) {
        alerts.push({
          id: `${prog._id}-no-history`,
          priority: "high",
          type: "ACTIVE_NO_HISTORY",
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          lastDate: null,
          daysOverdue: null,
          color: "red",
          message: `Program ${prog.programKey} is active but has no attendance history.`,
          action: "Mark first attendance",
        });
      }

      // ── HIGH: Overdue based on frequency ──────────────────────
      else if (color === "red") {
        alerts.push({
          id: `${prog._id}-overdue`,
          priority: "high",
          type: "OVERDUE_ATTENDANCE",
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          lastDate,
          daysOverdue: days,
          color: "red",
          message: `Attendance not marked for ${prog.programKey} for ${days} days.`,
          action: "Mark attendance now",
        });
      }

      // ── MEDIUM: Approaching overdue ───────────────────────────
      else if (color === "yellow") {
        alerts.push({
          id: `${prog._id}-warning`,
          priority: "medium",
          type: "ATTENDANCE_WARNING",
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          lastDate,
          daysOverdue: days,
          color: "yellow",
          message: `Attendance for ${prog.programKey} is ${days} days old. Mark soon.`,
          action: "Mark attendance",
        });
      }

      // ── MEDIUM: Low attendance trend ──────────────────────────
      if (summaries.length > 0) {
        const avgPct = Math.round(
          summaries.reduce((s, x) => s + x.percentage, 0) / summaries.length
        );
        if (avgPct < 40 && summaries.length > 0) {
          alerts.push({
            id: `${prog._id}-low-att`,
            priority: "medium",
            type: "LOW_ATTENDANCE",
            programId: prog._id,
            programKey: prog.programKey,
            programType: prog.programType,
            frequency: prog.frequency,
            lastDate,
            daysOverdue: null,
            color: "red",
            message: `${prog.programKey} has average attendance of ${avgPct}%.`,
            action: "Review devotee engagement",
          });
        }
      }

      // ── INFO: Devotees missing contact info ───────────────────
      const incomplete = devotees.filter((d) => !d.phone && !d.email);
      if (incomplete.length > 0) {
        alerts.push({
          id: `${prog._id}-incomplete`,
          priority: "info",
          type: "INCOMPLETE_DEVOTEE",
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          lastDate,
          daysOverdue: null,
          color: "yellow",
          message: `${incomplete.length} devotee(s) in ${prog.programKey} have no phone or email.`,
          action: "Complete devotee details",
        });
      }

      // ── INFO: No devotees at all ───────────────────────────────
      if (devotees.length === 0) {
        alerts.push({
          id: `${prog._id}-no-devotees`,
          priority: "high",
          type: "NO_DEVOTEES",
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          lastDate,
          daysOverdue: null,
          color: "red",
          message: `Program ${prog.programKey} has no devotees added.`,
          action: "Add devotees",
        });
      }
    }

    // Sort: high → medium → info, then by daysOverdue desc
    const order = { high: 0, medium: 1, info: 2 };
    alerts.sort((a, b) =>
      order[a.priority] !== order[b.priority]
        ? order[a.priority] - order[b.priority]
        : (b.daysOverdue || 0) - (a.daysOverdue || 0)
    );

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    console.error("Alert fetch error:", err);
    res.status(500).json({ message: "Failed to compute alerts." });
  }
};

// ── GET /alerts/program/:id ──────────────────────────────────────────
// Single program health status (used in mini dashboard)
const getProgramHealth = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).lean();
    if (!program)
      return res.status(404).json({ message: "Program not found." });

    const lastAtt = await Attendance.findOne({ program: program._id })
      .sort({ date: -1 })
      .select("date")
      .lean();
    const lastDate = lastAtt?.date || null;
    const days = daysSince(lastDate);
    const color = healthColor(program.frequency, lastDate);
    const t = getThreshold(program.frequency);

    const summaries = await AttendanceSummary.find({
      program: program._id,
    }).lean();
    const devotees = await Devotee.find({ program: program._id })
      .select("name phone email")
      .lean();
    const avgPct = summaries.length
      ? Math.round(
          summaries.reduce((s, x) => s + x.percentage, 0) / summaries.length
        )
      : 0;

    // Completeness score
    let score = 100;
    if (!lastDate) score -= 40;
    if (devotees.length === 0) score -= 30;
    const incomplete = devotees.filter((d) => !d.phone && !d.email).length;
    if (incomplete > 0) score -= Math.min(20, incomplete * 5);
    if (avgPct < 40 && summaries.length > 0) score -= 10;
    score = Math.max(0, score);

    res.json({
      color,
      daysSinceLastAttendance: days === Infinity ? null : days,
      lastDate,
      avgAttendance: avgPct,
      totalDevotees: devotees.length,
      incompleteDevotees: incomplete,
      completenessScore: score,
      threshold: t,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute program health." });
  }
};

// ── GET /alerts/overview ─────────────────────────────────────────────
// For AttendanceOverview page — all active programs with health status
const getAttendanceOverview = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const programs = await Program.find({
      programOwner: ownerId,
      actFlag: "active",
    })
      .populate("programOwner", "name")
      .lean();

    const overview = await Promise.all(
      programs.map(async (prog) => {
        const lastAtt = await Attendance.findOne({ program: prog._id })
          .sort({ date: -1 })
          .select("date hostName")
          .lean();
        const lastDate = lastAtt?.date || null;
        const days = daysSince(lastDate);
        const color = healthColor(prog.frequency, lastDate);
        const t = getThreshold(prog.frequency);
        const devoteeCount = await Devotee.countDocuments({
          program: prog._id,
        });
        const summaries = await AttendanceSummary.find({
          program: prog._id,
        }).lean();
        const avgPct = summaries.length
          ? Math.round(
              summaries.reduce((s, x) => s + x.percentage, 0) / summaries.length
            )
          : 0;

        return {
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          frequency: prog.frequency,
          area: prog.area,
          subArea: prog.subArea,
          isVirtual: prog.isVirtual,
          day: prog.day,
          time: prog.time,
          lastDate,
          daysSince: days === Infinity ? null : days,
          color,
          threshold: t,
          devoteeCount,
          avgPct,
          lastHost: lastAtt?.hostName || null,
        };
      })
    );

    // Sort: red first, then yellow, then green
    const colorOrder = { red: 0, yellow: 1, green: 2 };
    overview.sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);

    res.json({ programs: overview, total: overview.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to load overview." });
  }
};

module.exports = { getOwnerAlerts, getProgramHealth, getAttendanceOverview };
