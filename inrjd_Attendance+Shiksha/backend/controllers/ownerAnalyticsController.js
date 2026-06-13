const mongoose = require("mongoose");
const Program = require("../models/Program");
const Devotee = require("../models/Devotee");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");
const ProgramNamesOnly = require("../models/ProgramNamesOnly");

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function daysSince(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d)) / 864e5);
}
function pct(a, b) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}
function freqThresh(f) {
  const m = {
    daily: 7,
    weekly: 14,
    biweekly: 21,
    fortnightly: 21,
    monthly: 45,
  };
  return m[(f || "").toLowerCase().replace(/[\s-]/g, "")] || 14;
}

// Is a program scheduled this week/today?
function isScheduledToday(prog) {
  const today = DAYS[new Date().getDay()];
  return prog.day?.toLowerCase() === today.toLowerCase();
}
function isScheduledThisWeek(prog, freq) {
  const f = (freq || prog.frequency || "").toLowerCase().replace(/[\s-]/g, "");
  if (f === "daily") return true;
  if (f === "weekly") return true; // show all weekly this week
  return false;
}

const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const {
      programType,
      language,
      area,
      subArea,
      frequency,
      programId,
      startDate,
      endDate,
    } = req.query;

    // ── All programs owned ─────────────────────────────────────────
    const allOwned = await Program.find({ programOwner: ownerId }).lean();

    // ── Filter options ─────────────────────────────────────────────
    const unique = (arr, key) =>
      [...new Set(arr.map((p) => p[key]).filter(Boolean))].sort();
    const filterOptions = {
      areas: unique(allOwned, "area"),
      subAreas: unique(allOwned, "subArea"),
      frequencies: unique(allOwned, "frequency"),
      programTypes: unique(allOwned, "programType"),
      languages: unique(allOwned, "language"),
      programs: allOwned.map((p) => ({
        id: p._id,
        key: p.programKey,
        type: p.programType,
        area: p.area,
        frequency: p.frequency,
      })),
    };

    // ── Programs matching filters ──────────────────────────────────
    const progFilter = { programOwner: ownerId };
    if (programType) progFilter.programType = programType;
    if (language) progFilter.language = language;
    if (area) progFilter.area = area;
    if (subArea) progFilter.subArea = subArea;
    if (frequency) progFilter.frequency = frequency;
    if (programId) progFilter._id = new mongoose.Types.ObjectId(programId);

    const programs = await Program.find(progFilter).lean();
    const programIds = programs.map((p) => p._id);

    // ── Attendance date filter ─────────────────────────────────────
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)
      dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    const attMatch = { programOwner: ownerId, program: { $in: programIds } };
    if (Object.keys(dateFilter).length) attMatch.date = dateFilter;

    // ── TODAY'S PROGRAMS ──────────────────────────────────────────
    const todayName = DAYS[new Date().getDay()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const todayPrograms = allOwned.filter(
      (p) =>
        p.actFlag === "active" &&
        (p.day?.toLowerCase() === todayName.toLowerCase() ||
          (p.frequency || "").toLowerCase().replace(/[\s-]/g, "") === "daily")
    );

    // Was today's attendance already marked?
    const todayMarked = new Set();
    if (todayPrograms.length) {
      const marked = await Attendance.distinct("program", {
        program: { $in: todayPrograms.map((p) => p._id) },
        date: { $gte: today },
      });
      marked.forEach((id) => todayMarked.add(id.toString()));
    }

    const todayProgramsWithStatus = todayPrograms.map((p) => ({
      ...p,
      programId: p._id, // ← explicit so TodayProgramsSection gets p.programId correctly
      devoteeCount: 0, // will be enriched below if needed; dashboard does full enrichment
      avgAttendance: 0,
      lastSession: null,
      markedToday: todayMarked.has(p._id.toString()),
    }));

    // ── PER-PROGRAM STATS ─────────────────────────────────────────
    const progStats = await Attendance.aggregate([
      { $match: attMatch },
      {
        $group: {
          _id: "$program",
          programKey: { $first: "$programKey" },
          programType: { $first: "$programType" },
          area: { $first: "$area" },
          language: { $first: "$language" },
          frequency: { $first: "$frequency" },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          lastDate: { $max: "$date" },
          firstDate: { $min: "$date" },
        },
      },
    ]);

    // Enrich with devotee count, session count, health
    // Use AttendanceSummary for avg% so it matches the dashboard calculation exactly.
    // Note: allActiveIds = all active programs (for consistent avg% with dashboard)
    // programIds = filtered programs (for per-program chart data)
    const allActivePrograms = await Program.find({
      programOwner: ownerId,
      actFlag: "active",
    }).lean();
    const allActiveIds = allActivePrograms.map((p) => p._id);

    const allSummariesForPrograms = await AttendanceSummary.find({
      programOwner: ownerId,
      program: { $in: programIds }, // filtered scope for charts
    }).lean();

    // All active summaries (unfiltered) used ONLY for the headline avg% to match dashboard
    const allActiveSummaries = await AttendanceSummary.find({
      programOwner: ownerId,
      program: { $in: allActiveIds },
    }).lean();

    const enriched = await Promise.all(
      progStats.map(async (s) => {
        const devCount = await Devotee.countDocuments({ program: s._id });
        const sessions = await Attendance.distinct("date", { program: s._id });
        const matchProg = programs.find(
          (p) => p._id.toString() === s._id.toString()
        );
        const absent = s.total - s.present;

        // Per-devotee average from pre-computed summaries (same method as dashboard)
        const progSummaries = allSummariesForPrograms.filter(
          (x) => x.program.toString() === s._id.toString()
        );
        const attendance_pct = progSummaries.length
          ? Math.round(
              progSummaries.reduce((sum, x) => sum + x.percentage, 0) /
                progSummaries.length
            )
          : pct(s.present, s.total);

        return {
          ...s,
          absent,
          attendance_pct,
          devoteeCount: devCount,
          sessionCount: sessions.length,
          actFlag: matchProg?.actFlag || "active",
          day: matchProg?.day || "",
          time: matchProg?.time || "",
          daysOverdue: daysSince(s.lastDate),
          freqThresh: freqThresh(s.frequency),
        };
      })
    );

    // Programs with no attendance records yet
    const programsNoData = programs
      .filter(
        (p) => !enriched.find((e) => e._id.toString() === p._id.toString())
      )
      .map((p) => ({
        _id: p._id,
        programKey: p.programKey,
        programType: p.programType,
        area: p.area,
        language: p.language,
        frequency: p.frequency,
        total: 0,
        present: 0,
        absent: 0,
        attendance_pct: 0,
        devoteeCount: 0,
        sessionCount: 0,
        actFlag: p.actFlag,
        day: p.day,
        time: p.time,
        daysOverdue: null,
        freqThresh: freqThresh(p.frequency),
      }));
    const allProgStats = [...enriched, ...programsNoData];

    // ── BEST / WEAKEST — tie-break by sessions then devotees ─────
    const sorted = [...allProgStats].sort((a, b) =>
      b.attendance_pct !== a.attendance_pct
        ? b.attendance_pct - a.attendance_pct
        : b.sessionCount !== a.sessionCount
        ? b.sessionCount - a.sessionCount
        : b.devoteeCount - a.devoteeCount
    );
    const best = sorted[0] || null;
    const worst = sorted[sorted.length - 1] || null;
    const maxDevProg = [...allProgStats].sort(
      (a, b) => b.devoteeCount - a.devoteeCount
    )[0];

    // ── OVERALL PRESENT VS ABSENT ─────────────────────────────────
    const totalAgg = await Attendance.aggregate([
      { $match: attMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
    ]);
    const overallTotal = totalAgg[0]?.total || 0;
    const overallPresent = totalAgg[0]?.present || 0;

    // ── BY LANGUAGE (with devotee counts) ────────────────────────
    const byLanguage = await Promise.all(
      filterOptions.languages.map(async (lang) => {
        const progs = allOwned.filter((p) => p.language === lang);
        const pIds = progs.map((p) => p._id);
        const devs = await Devotee.countDocuments({ program: { $in: pIds } });
        const attData = await Attendance.aggregate([
          {
            $match: {
              programOwner: ownerId,
              program: { $in: pIds },
              ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
            },
          },
        ]);
        const t = attData[0]?.total || 0;
        const p = attData[0]?.present || 0;
        return {
          language: lang,
          total: t,
          present: p,
          absent: t - p,
          pct: pct(p, t),
          devoteeCount: devs,
          programCount: progs.length,
        };
      })
    );

    // ── BY AREA ───────────────────────────────────────────────────
    const byArea = await Promise.all(
      filterOptions.areas.map(async (ar) => {
        const pIds = allOwned.filter((p) => p.area === ar).map((p) => p._id);
        const devs = await Devotee.countDocuments({ program: { $in: pIds } });
        const att = await Attendance.aggregate([
          {
            $match: {
              programOwner: ownerId,
              program: { $in: pIds },
              ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
            },
          },
        ]);
        const t = att[0]?.total || 0,
          p = att[0]?.present || 0;
        return {
          area: ar,
          total: t,
          present: p,
          absent: t - p,
          pct: pct(p, t),
          devoteeCount: devs,
        };
      })
    );

    const twelveAgo = new Date();
    twelveAgo.setFullYear(twelveAgo.getFullYear() - 1);

    const byFrequency = await Promise.all(
      filterOptions.frequencies.map(async (freq) => {
        const pIds = allOwned
          .filter((p) => p.frequency === freq)
          .map((p) => p._id);
        const att = await Attendance.aggregate([
          {
            $match: {
              programOwner: ownerId,
              program: { $in: pIds },
              ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
            },
          },
        ]);
        const t = att[0]?.total || 0,
          p = att[0]?.present || 0;
        const avgDays = await Promise.all(
          pIds.map(async (pid) => {
            const last = await Attendance.findOne({ program: pid })
              .sort({ date: -1 })
              .select("date")
              .lean();
            return last ? daysSince(last.date) : null;
          })
        );
        const validDays = avgDays.filter((d) => d !== null);
        const avgGap = validDays.length
          ? Math.round(validDays.reduce((a, b) => a + b, 0) / validDays.length)
          : null;

        // Real monthly trend for this frequency group
        const freqMonthly = await Attendance.aggregate([
          {
            $match: {
              programOwner: ownerId,
              program: { $in: pIds },
              date: { $gte: twelveAgo },
            },
          },
          {
            $group: {
              _id: { year: { $year: "$date" }, month: { $month: "$date" } },
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const monthlyPoints = freqMonthly.map((m) => ({
          label: `${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
          year: m._id.year,
          month: m._id.month,
          pct: pct(m.present, m.total),
          present: m.present,
          total: m.total,
        }));

        return {
          frequency: freq,
          total: t,
          present: p,
          absent: t - p,
          pct: pct(p, t),
          programCount: pIds.length,
          avgGap,
          monthlyPoints,
        };
      })
    );

    // ── MONTHLY TREND (12 months) — overall ───────────────────────
    const monthlyRaw = await Attendance.aggregate([
      {
        $match: {
          programOwner: ownerId,
          program: { $in: programIds },
          date: { $gte: twelveAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          sessions: {
            $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const monthlyTrend = monthlyRaw.map((m) => ({
      label: `${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
      fullLabel: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
      total: m.total,
      present: m.present,
      absent: m.total - m.present,
      pct: pct(m.present, m.total),
      sessions: m.sessions?.length || 0,
    }));

    // ── CUMULATIVE ATTENDANCE (area chart data) ───────────────────
    let cumulative = 0;
    const cumulativeData = monthlyTrend.map((m) => {
      cumulative += m.present;
      return { label: m.label, cumPresent: cumulative, pct: m.pct };
    });

    // ── PER-PROGRAM SESSION TREND ─────────────────────────────────
    const programTrends = {};
    for (const s of allProgStats) {
      const raw = await Attendance.aggregate([
        { $match: { program: s._id } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);
      programTrends[s._id.toString()] = raw.map((r) => ({
        date: r._id,
        pct: pct(r.present, r.total),
        present: r.present,
        absent: r.total - r.present,
        total: r.total,
      }));
    }

    // ── WEEKLY ANALYSIS ───────────────────────────────────────────
    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date();
      wStart.setDate(wStart.getDate() - i * 7);
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      wEnd.setHours(23, 59, 59);
      const agg = await Attendance.aggregate([
        {
          $match: {
            programOwner: ownerId,
            program: { $in: programIds },
            date: { $gte: wStart, $lte: wEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
          },
        },
      ]);
      weeklyData.push({
        label: `W${8 - i}`,
        dateLabel: wStart.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        total: agg[0]?.total || 0,
        present: agg[0]?.present || 0,
        absent: (agg[0]?.total || 0) - (agg[0]?.present || 0),
        pct: pct(agg[0]?.present || 0, agg[0]?.total || 0),
      });
    }

    // ── DEVOTEE RANKINGS ──────────────────────────────────────────
    const summaries = await AttendanceSummary.find({
      programOwner: ownerId,
      program: { $in: programIds },
    })
      .sort({ percentage: -1 })
      .lean();

    const healthCounts = { active: 0, moderate: 0, inactive: 0 };
    summaries.forEach((s) => {
      if (s.percentage >= 80) healthCounts.active++;
      else if (s.percentage >= 40) healthCounts.moderate++;
      else healthCounts.inactive++;
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newDevotees = await Devotee.find({
      program: { $in: programIds },
      createdAt: { $gte: weekAgo },
    })
      .populate("program", "programKey")
      .lean();

    // Devotees with no recent attendance
    const devoteesMissingAtt = summaries
      .filter((s) => {
        const prog = allProgStats.find(
          (p) => p._id.toString() === s.program?.toString()
        );
        return s.percentage < 40;
      })
      .slice(0, 10);

    // ── PROGRAM HEALTH LABELS ─────────────────────────────────────
    const programHealth = allProgStats.map((p) => {
      let score = 100;
      const issues = [];
      if (!p.total) {
        issues.push("No attendance");
        score -= 40;
      }
      if (!p.lastDate) {
        issues.push("Never marked");
        score -= 40;
      } else if (p.daysOverdue >= p.freqThresh) {
        issues.push(`${p.daysOverdue}d overdue`);
        score -= 30;
      } else if (p.daysOverdue >= p.freqThresh * 0.6) {
        issues.push("Due soon");
        score -= 15;
      }
      if (p.attendance_pct < 40 && p.total > 0) {
        issues.push(`${p.attendance_pct}% avg`);
        score -= 20;
      }
      if (p.devoteeCount === 0) {
        issues.push("No devotees");
        score -= 20;
      }
      if (p.actFlag === "inactive") {
        issues.push("Disabled");
        score = 0;
      }

      score = Math.max(0, score);
      const label =
        score >= 80
          ? "Healthy"
          : score >= 55
          ? "Watch"
          : score >= 30
          ? "Risk"
          : "Critical";

      // Trend direction (improving/declining)
      const trend = programTrends[p._id.toString()] || [];
      let trendDir = "stable";
      if (trend.length >= 3) {
        const half = Math.floor(trend.length / 2);
        const first =
          trend.slice(0, half).reduce((s, x) => s + x.pct, 0) / half;
        const last =
          trend.slice(half).reduce((s, x) => s + x.pct, 0) /
          (trend.length - half);
        if (last - first > 5) trendDir = "improving";
        else if (first - last > 5) trendDir = "declining";
      }

      return { ...p, score, label, issues, trendDir };
    });

    // ── MOST IMPROVED ─────────────────────────────────────────────
    let mostImproved = null,
      bestDelta = -Infinity;
    for (const p of programHealth) {
      const t = programTrends[p._id.toString()] || [];
      if (t.length >= 3) {
        const h1 = Math.floor(t.length / 2);
        const first = t.slice(0, h1).reduce((s, x) => s + x.pct, 0) / h1;
        const last =
          t.slice(h1).reduce((s, x) => s + x.pct, 0) / (t.length - h1);
        const delta = last - first;
        if (delta > bestDelta) {
          bestDelta = delta;
          mostImproved = { ...p, improvement: Math.round(delta) };
        }
      }
    }

    // ── TYPE DISTRIBUTION WITH DEVOTEES ──────────────────────────
    const typeDistribution = await Promise.all(
      unique(allOwned, "programType").map(async (type) => {
        const pIds = allOwned
          .filter((p) => p.programType === type)
          .map((p) => p._id);
        const devs = await Devotee.countDocuments({ program: { $in: pIds } });
        return { type, programCount: pIds.length, devoteeCount: devs };
      })
    );

    // ── RECENT SESSIONS ───────────────────────────────────────────
    const recentRaw = await Attendance.find(attMatch)
      .sort({ date: -1 })
      .limit(200)
      .select("programKey date hostName status")
      .lean();
    const seen = new Set();
    const recentSessions = [];
    for (const r of recentRaw) {
      const k = `${r.programKey}-${
        new Date(r.date).toISOString().split("T")[0]
      }`;
      if (!seen.has(k)) {
        seen.add(k);
        recentSessions.push(r);
        if (recentSessions.length === 10) break;
      }
    }

    // ── ENRICH TODAY PROGRAMS from allProgStats (now available) ──
    const enrichedTodayPrograms = todayProgramsWithStatus.map((tp) => {
      const stat = allProgStats.find(
        (s) => s._id.toString() === tp._id.toString()
      );
      return {
        ...tp,
        devoteeCount: stat?.devoteeCount || 0,
        avgAttendance: stat?.attendance_pct || 0,
        lastSession: stat?.lastDate || null,
      };
    });

    // ── SUMMARY ───────────────────────────────────────────────────
    const totalDevotees = allProgStats.reduce((s, p) => s + p.devoteeCount, 0);

    // Analytics uses program-level avg (separate from dashboard which uses devotee-level)
    // Dashboard: avg of every devotee's % (pctTotal / totalSummaryRecords)
    // Analytics: avg of per-program avg% (avg of program averages) — intentionally different
    const progsWithData = allProgStats.filter((p) => p.total > 0);
    const avgAttendance = progsWithData.length
      ? Math.round(
          progsWithData.reduce((s, p) => s + p.attendance_pct, 0) /
            progsWithData.length
        )
      : 0;

    // ── VIRTUAL vs IN-PERSON counts ───────────────────────────────
    const virtualCount = programs.filter((p) => p.isVirtual === true).length;
    const inPersonCount = programs.filter((p) => !p.isVirtual).length;

    // ── WEEKLY SCHEDULE — programs grouped by day ────────────────
    const DAYS_ORDER = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const dayMap = {};
    DAYS_ORDER.forEach((d) => {
      dayMap[d] = [];
    });

    allActivePrograms.forEach((p) => {
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
        // Daily programs appear every day
        DAYS_ORDER.forEach((d) => dayMap[d].push({ ...entry, isDaily: true }));
      } else if (dayMap[dayKey]) {
        dayMap[dayKey].push(entry);
      }
    });

    const weeklySchedule = DAYS_ORDER.map((day) => ({
      day,
      isToday: day.toLowerCase() === todayName.toLowerCase(),
      programs: dayMap[day],
      count: dayMap[day].length,
    }));

    res.json({
      summary: {
        totalPrograms: programs.length,
        totalDevotees,
        avgAttendance,
        activePrograms: programs.filter((p) => p.actFlag === "active").length,
        inactivePrograms: programs.filter((p) => p.actFlag === "inactive")
          .length,
        belowThreshold: allProgStats.filter(
          (p) => p.daysOverdue !== null && p.daysOverdue >= p.freqThresh
        ).length,
        noRecentAttendance: allProgStats.filter(
          (p) => p.daysOverdue === null || p.daysOverdue >= p.freqThresh
        ).length,
        totalSessions: allProgStats.reduce((s, p) => s + p.sessionCount, 0),
        totalRecords: overallTotal,
        bestProgram: best
          ? {
              key: best.programKey,
              pct: best.attendance_pct,
              sessions: best.sessionCount,
              devotees: best.devoteeCount,
            }
          : null,
        weakestProgram:
          worst && worst._id.toString() !== best?._id.toString()
            ? { key: worst.programKey, pct: worst.attendance_pct }
            : null,
        mostImproved: mostImproved
          ? { key: mostImproved.programKey, delta: mostImproved.improvement }
          : null,
        highestDevotees: maxDevProg
          ? { key: maxDevProg.programKey, count: maxDevProg.devoteeCount }
          : null,
      },
      filterOptions,
      todayPrograms: enrichedTodayPrograms,
      presentVsAbsent: {
        present: overallPresent,
        absent: overallTotal - overallPresent,
        total: overallTotal,
      },
      healthSplit: healthCounts,
      statusSplit: {
        active: programs.filter((p) => p.actFlag === "active").length,
        inactive: programs.filter((p) => p.actFlag === "inactive").length,
      },
      typeDistribution,
      byProgram: allProgStats.sort(
        (a, b) => b.attendance_pct - a.attendance_pct
      ),
      byLanguage,
      byArea,
      byFrequency,
      monthlyTrend,
      cumulativeData,
      weeklyData,
      programTrends,
      programHealth,
      topDevotees: summaries.slice(0, 10),
      bottomDevotees: [...summaries]
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 10),
      newDevotees: newDevotees.slice(0, 10),
      devoteesMissingAtt,
      recentSessions,
      virtualCount,
      inPersonCount,
      weeklySchedule,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics." });
  }
};

const getProgramDrilldown = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const programId = req.params.programId;
    const program = await Program.findOne({
      _id: programId,
      programOwner: ownerId,
    }).lean();
    if (!program) return res.status(404).json({ message: "Not found." });

    const devotees = await Devotee.find({ program: program._id }).lean();
    const summaries = await AttendanceSummary.find({ program: program._id })
      .sort({ percentage: -1 })
      .lean();
    const sessions = await Attendance.aggregate([
      { $match: { program: program._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          host: { $first: "$hostName" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 20 },
    ]);
    res.json({ program, devotees, summaries, sessions });
  } catch (err) {
    res.status(500).json({ message: "Failed to load drilldown." });
  }
};

async function ownerSearchDevotee(req, res) {
  try {
    const ownerId = req.user._id;
    const { name } = req.query;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: "Name too short." });

    const ownerPrograms = await Program.find({ programOwner: ownerId })
      .select(
        "_id programKey programType area language frequency day time actFlag"
      )
      .lean();
    if (!ownerPrograms.length) return res.json({ found: false, results: [] });
    const progIds = ownerPrograms.map((p) => p._id);

    const nameDocs = await ProgramNamesOnly.find({
      program: { $in: progIds },
      names: { $elemMatch: { $regex: name.trim(), $options: "i" } },
    })
      .populate(
        "program",
        "programKey programType area language frequency day time actFlag"
      )
      .lean();

    if (!nameDocs.length) return res.json({ found: false, results: [] });

    const results = await Promise.all(
      nameDocs.map(async (nd) => {
        const prog = nd.program;
        if (!prog) return null;
        const matchedNames = nd.names.filter((n) =>
          n.toLowerCase().includes(name.trim().toLowerCase())
        );
        const attRecords = await Attendance.find({
          program: prog._id,
          devoteeName: { $regex: name.trim(), $options: "i" },
        })
          .sort({ date: -1 })
          .limit(50)
          .lean();

        // Look up when devotee was added to program
        const devoteeDoc = await Devotee.findOne({
          program: prog._id,
          name: { $regex: new RegExp(`^${matchedNames[0] || name.trim()}$`, "i") },
        }).select("addedToProgram createdAt").lean();
        const addedDate = devoteeDoc?.addedToProgram || devoteeDoc?.createdAt || null;

        const allSessionDates = await Attendance.distinct("date", {
          program: prog._id,
        });
        const totalSessions = addedDate
          ? allSessionDates.filter((d) => new Date(d) >= new Date(addedDate))
          : allSessionDates;
        const attended = attRecords.filter(
          (r) => r.status === "present"
        ).length;
        const total = totalSessions.length;
        const pctVal = total > 0 ? Math.round((attended / total) * 100) : 0;
        const monthMap = {};
        attRecords.forEach((r) => {
          const key = new Date(r.date).toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          });
          if (!monthMap[key]) monthMap[key] = { present: 0, absent: 0 };
          if (r.status === "present") monthMap[key].present++;
          else monthMap[key].absent++;
        });
        const monthlyBreakdown = Object.entries(monthMap)
          .map(([label, v]) => ({
            label,
            present: v.present,
            absent: v.absent,
            pct: Math.round((v.present / (v.present + v.absent)) * 100),
          }))
          .slice(0, 6)
          .reverse();
        const recentSessions = attRecords
          .slice(0, 10)
          .map((r) => ({ date: r.date, status: r.status, host: r.hostName }));
        let streak = 0;
        for (const r of attRecords) {
          if (r.status === "present") streak++;
          else break;
        }
        return {
          programId: prog._id,
          programKey: prog.programKey,
          programType: prog.programType,
          area: prog.area,
          language: prog.language,
          frequency: prog.frequency,
          day: prog.day,
          time: prog.time,
          actFlag: prog.actFlag,
          ownerName: req.user.name,
          devoteeName: matchedNames[0] || name.trim(),
          attended,
          total,
          pct: pctVal,
          streak,
          monthlyBreakdown,
          recentSessions,
          status:
            pctVal >= 80 ? "Active" : pctVal >= 40 ? "Moderate" : "Irregular",
        };
      })
    );

    res.json({ found: true, results: results.filter(Boolean) });
  } catch (err) {
    console.error("Owner devotee search error:", err);
    res.status(500).json({ message: "Search failed." });
  }
}

async function ownerSuggestDevotee(req, res) {
  try {
    const ownerId = req.user._id;
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ suggestions: [] });
    const progIds = (
      await Program.find({ programOwner: ownerId }).select("_id").lean()
    ).map((p) => p._id);
    const docs = await ProgramNamesOnly.find({
      program: { $in: progIds },
      names: { $elemMatch: { $regex: q.trim(), $options: "i" } },
    })
      .select("names")
      .limit(15)
      .lean();
    const matched = new Set();
    const regex = new RegExp(q.trim(), "i");
    docs.forEach((d) =>
      d.names.forEach((n) => {
        if (regex.test(n) && n.trim().length > 1) matched.add(n.trim());
      })
    );
    res.json({ suggestions: [...matched].slice(0, 8) });
  } catch {
    res.json({ suggestions: [] });
  }
}

module.exports = {
  getOwnerAnalytics,
  getProgramDrilldown,
  ownerSearchDevotee,
  ownerSuggestDevotee,
};
