const Program = require("../models/Program");
const ProgramNamesOnly = require("../models/ProgramNamesOnly");
const AttendanceSummary = require("../models/AttendanceSummary");
const Attendance = require("../models/Attendance");
const Devotee = require("../models/Devotee");

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TODAY_NAME =
  DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Mon=0

const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id;

    // ── 1. ACTIVE programs only ────────────────────────────────
    const activePrograms = await Program.find({
      programOwner: ownerId,
      actFlag: "active",
    }).lean();

    const allPrograms = await Program.find({ programOwner: ownerId }).lean();
    const activeProgramIds = activePrograms.map((p) => p._id);

    const totalPrograms = activePrograms.length;
    const disabledCount = allPrograms.length - activePrograms.length;

    // ── 2. Unique devotees from active programs only ───────────
    const nameDocs = await ProgramNamesOnly.find({
      program: { $in: activeProgramIds },
    }).lean();
    const uniqueNames = new Set();
    nameDocs.forEach((d) =>
      d.names.forEach((n) => uniqueNames.add(n.toLowerCase().trim()))
    );
    const totalDevotees = uniqueNames.size;

    // ── 3. Attendance summary for active programs only ─────────
    const summaries = await AttendanceSummary.find({
      programOwner: ownerId,
      program: { $in: activeProgramIds },
    }).lean();

    let pctTotal = 0,
      activeAtt = 0,
      moderate = 0,
      inactive = 0;
    summaries.forEach((s) => {
      pctTotal += s.percentage;
      if (s.percentage >= 80) activeAtt++;
      else if (s.percentage >= 40) moderate++;
      else inactive++;
    });

    const totalSummaryRecords = summaries.length;
    const avgAttendance =
      totalSummaryRecords > 0 ? Math.round(pctTotal / totalSummaryRecords) : 0;
    const inactivePct =
      totalSummaryRecords > 0
        ? Math.round((inactive / totalSummaryRecords) * 100)
        : 0;

    // ── 4. Top 3 programs by avg % ─────────────────────────────
    const progMap = {};
    summaries.forEach((s) => {
      const k = String(s.program);
      if (!progMap[k])
        progMap[k] = {
          programId: s.program,
          programKey: s.programKey,
          total: 0,
          count: 0,
        };
      progMap[k].total += s.percentage;
      progMap[k].count += 1;
    });

    const topPrograms = Object.values(progMap)
      .map((p) => ({
        programId: p.programId,
        programKey: p.programKey,
        avgPct: p.count > 0 ? Math.round(p.total / p.count) : 0,
      }))
      .sort((a, b) => b.avgPct - a.avgPct)
      .slice(0, 3);

    // ── 5. At-risk programs ────────────────────────────────────
    const atRisk = Object.values(progMap)
      .map((p) => ({
        programId: p.programId,
        programKey: p.programKey,
        avgPct: p.count > 0 ? Math.round(p.total / p.count) : 0,
      }))
      .filter((p) => p.avgPct < 40 && p.count > 0);

    // ── 6. Recent 5 sessions ───────────────────────────────────
    const recentRaw = await Attendance.find({
      programOwner: ownerId,
      program: { $in: activeProgramIds },
    })
      .sort({ date: -1 })
      .limit(50)
      .select("programKey date hostName")
      .lean();

    const seen = new Set();
    const recentSessions = [];
    for (const r of recentRaw) {
      const key = `${r.programKey}-${
        new Date(r.date).toISOString().split("T")[0]
      }`;
      if (!seen.has(key)) {
        seen.add(key);
        recentSessions.push({
          programKey: r.programKey,
          date: r.date,
          hostName: r.hostName,
        });
        if (recentSessions.length === 5) break;
      }
    }

    // ── 7. TODAY'S PROGRAMS (full info) ───────────────────────
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const todayRaw = activePrograms.filter((p) => {
      const freq = (p.frequency || "").toLowerCase().replace(/[\s-]/g, "");
      const dayMatch = (p.day || "").toLowerCase() === TODAY_NAME.toLowerCase();
      return dayMatch || freq === "daily";
    });

    // Check which are already marked today
    const markedToday = new Set();
    if (todayRaw.length) {
      const marked = await Attendance.distinct("program", {
        program: { $in: todayRaw.map((p) => p._id) },
        date: { $gte: today },
      });
      marked.forEach((id) => markedToday.add(id.toString()));
    }

    const todayPrograms = await Promise.all(
      todayRaw.map(async (p) => {
        const devCount = await Devotee.countDocuments({ program: p._id });
        const progSummaries = summaries.filter(
          (s) => s.program.toString() === p._id.toString()
        );
        const avgPct = progSummaries.length
          ? Math.round(
              progSummaries.reduce((sum, x) => sum + x.percentage, 0) /
                progSummaries.length
            )
          : 0;
        const lastAtt = await Attendance.findOne({ program: p._id })
          .sort({ date: -1 })
          .select("date")
          .lean();

        return {
          programId: p._id,
          programKey: p.programKey,
          programType: p.programType,
          frequency: p.frequency,
          day: p.day,
          time: p.time,
          area: p.area,
          subArea: p.subArea,
          language: p.language,
          isVirtual: p.isVirtual || false,
          devoteeCount: devCount,
          avgAttendance: avgPct,
          lastSession: lastAtt?.date || null,
          markedToday: markedToday.has(p._id.toString()),
        };
      })
    );

    // ── 8. WEEKLY SCHEDULE ─────────────────────────────────────
    const dayMap = {};
    DAYS_ORDER.forEach((d) => {
      dayMap[d] = [];
    });

    activePrograms.forEach((p) => {
      const freq = (p.frequency || "").toLowerCase().replace(/[\s-]/g, "");
      const dayKey = (p.day || "").trim();

      const entry = {
        programId: p._id,
        programKey: p.programKey,
        programType: p.programType,
        frequency: p.frequency,
        time: p.time,
        area: p.area,
        language: p.language,
        isVirtual: p.isVirtual || false,
      };

      if (freq === "daily") {
        // Add to all days
        DAYS_ORDER.forEach((d) => dayMap[d].push({ ...entry, isDaily: true }));
      } else if (dayMap[dayKey]) {
        dayMap[dayKey].push(entry);
      }
    });

    const weeklySchedule = DAYS_ORDER.map((day) => ({
      day,
      isToday: day.toLowerCase() === TODAY_NAME.toLowerCase(),
      programs: dayMap[day],
      count: dayMap[day].length,
    }));

    res.json({
      totalPrograms,
      disabledCount,
      totalDevotees,
      avgAttendance,
      active: activeAtt,
      moderate,
      inactive,
      inactivePct,
      showAlert: inactivePct > 30,
      topPrograms,
      atRisk,
      recentSessions,
      todayPrograms,
      weeklySchedule,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard." });
  }
};

module.exports = { getOwnerDashboard };
