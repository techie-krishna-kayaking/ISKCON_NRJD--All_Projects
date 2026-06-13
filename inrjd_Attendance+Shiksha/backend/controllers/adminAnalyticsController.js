const Program = require("../models/Program");
const User = require("../models/User");
const Devotee = require("../models/Devotee");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");

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

// Program category classifier
function classifyProgram(type = "") {
  const t = type.toLowerCase();
  if (
    [
      "bhaktivriksha",
      "bv",
      "japa session",
      "japa",
      "sp study group",
      "study group",
      "bhagavatam class",
    ].some((k) => t.includes(k))
  )
    return "commitment";
  if (
    [
      "gita manjari",
      "tulasi manjari",
      "gita learning",
      "manjari",
      "learning program",
    ].some((k) => t.includes(k))
  )
    return "manjari";
  return "others";
}

const getAdminAnalytics = async (req, res) => {
  try {
    // ── FILTER PARAMS ─────────────────────────────────────────────
    const {
      ownerId: ownerFilter,
      programType: typeFilter,
      frequency: freqFilter,
      area: areaFilter,
      subArea: subAreaFilter,
      language: langFilter,
      day: dayFilter,
      status: statusFilter,
      startDate,
      endDate,
    } = req.query;

    // ── BUILD PROGRAM FILTER ───────────────────────────────────────
    const progFilter = {};
    if (ownerFilter) progFilter.programOwner = ownerFilter;
    if (typeFilter) progFilter.programType = typeFilter;
    if (freqFilter) progFilter.frequency = freqFilter;
    if (areaFilter) progFilter.area = areaFilter;
    if (subAreaFilter) progFilter.subArea = subAreaFilter;
    if (langFilter) progFilter.language = langFilter;
    if (dayFilter) progFilter.day = dayFilter;
    if (statusFilter && statusFilter !== "all")
      progFilter.actFlag = statusFilter;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)
      dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));

    // ── ALL PROGRAMS (for filter options) ─────────────────────────
    const allPrograms = await Program.find({}).lean();

    // ── FILTER OPTIONS ─────────────────────────────────────────────
    const uniq = (arr, k) =>
      [...new Set(arr.map((p) => p[k]).filter(Boolean))].sort();
    const filterOptions = {
      owners: (
        await User.find({ role: "owner", isActive: true })
          .select("_id name")
          .lean()
      ).map((u) => ({ id: u._id, name: u.name })),
      programTypes: uniq(allPrograms, "programType"),
      frequencies: uniq(allPrograms, "frequency"),
      areas: uniq(allPrograms, "area"),
      subAreas: uniq(allPrograms, "subArea"),
      languages: uniq(allPrograms, "language"),
      days: uniq(allPrograms, "day"),
    };

    // ── FILTERED PROGRAMS ──────────────────────────────────────────
    const programs = await Program.find(progFilter)
      .populate("programOwner", "name email")
      .lean();
    const activePrograms = programs.filter((p) => p.actFlag === "active");
    const inactivePrograms = programs.filter((p) => p.actFlag === "inactive");
    const programIds = programs.map((p) => p._id);
    const activeProgramIds = activePrograms.map((p) => p._id);

    // ── ATTENDANCE MATCH ───────────────────────────────────────────
    const attBase = { program: { $in: programIds } };
    if (Object.keys(dateFilter).length) attBase.date = dateFilter;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── SYSTEM KPI COUNTS ──────────────────────────────────────────
    const [totalDevotees, totalOwners, attWeek, attTotal] = await Promise.all([
      Devotee.countDocuments({ program: { $in: programIds } }),
      User.countDocuments({ role: "owner", isActive: true }),
      Attendance.countDocuments({ ...attBase, createdAt: { $gte: weekStart } }),
      Attendance.countDocuments(attBase),
    ]);

    // Total unique sessions (unique date per program combos)
    const sessionAgg = await Attendance.aggregate([
      { $match: attBase },
      {
        $group: {
          _id: {
            program: "$program",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
        },
      },
      { $count: "total" },
    ]);
    const totalSessions = sessionAgg[0]?.total || 0;

    // monthStart for "this month" KPIs — computed now, used later after owners is available
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newDevoteesThisMonth = await Devotee.countDocuments({
      program: { $in: programIds },
      createdAt: { $gte: monthStart },
    });

    // Programs without recent attendance
    const progAtRisk = [];
    const progNoAtt = [];
    for (const p of activePrograms) {
      const last = await Attendance.findOne({ program: p._id })
        .sort({ date: -1 })
        .select("date")
        .lean();
      const days = last ? daysSince(last.date) : null;
      const thresh = freqThresh(p.frequency);
      if (days === null || days >= thresh) {
        if (days === null) progNoAtt.push(p.programKey);
        else progAtRisk.push(p.programKey);
      }
    }

    // ── SUMMARIES ──────────────────────────────────────────────────
    const summaries = await AttendanceSummary.find({
      program: { $in: programIds },
    }).lean();
    const totalSummaryRecs = summaries.length;
    const avgAttSystem =
      totalSummaryRecs > 0
        ? Math.round(
            summaries.reduce((s, x) => s + x.percentage, 0) / totalSummaryRecs
          )
        : 0;

    const healthCounts = { active: 0, moderate: 0, inactive: 0 };
    summaries.forEach((s) => {
      if (s.percentage >= 80) healthCounts.active++;
      else if (s.percentage >= 40) healthCounts.moderate++;
      else healthCounts.inactive++;
    });

    // ── OWNER PERFORMANCE ──────────────────────────────────────────
    const owners = await User.find({ role: "owner", isActive: true }).lean();
    const newProgramsThisMonth = await Program.countDocuments({
      programOwner: { $in: owners.map((o) => o._id) },
      createdAt: { $gte: monthStart },
    });
    const ownerStats = await Promise.all(
      owners.map(async (o) => {
        const oProgs = programs.filter(
          (p) =>
            p.programOwner?._id?.toString() === o._id.toString() ||
            p.programOwner?.toString() === o._id.toString()
        );
        const oPIds = oProgs.map((p) => p._id);
        const oActive = oProgs.filter((p) => p.actFlag === "active").length;
        const oSums = summaries.filter((s) =>
          oPIds.some((id) => id.toString() === s.program?.toString())
        );
        const avgPct = oSums.length
          ? Math.round(
              oSums.reduce((s, x) => s + x.percentage, 0) / oSums.length
            )
          : 0;
        const devCount = await Devotee.countDocuments({
          program: { $in: oPIds },
        });
        const lastAtt = await Attendance.findOne({ program: { $in: oPIds } })
          .sort({ date: -1 })
          .select("date")
          .lean();
        const attThisWeek = await Attendance.countDocuments({
          program: { $in: oPIds },
          createdAt: { $gte: weekStart },
        });

        // Overdue programs
        let overdueCount = 0;
        for (const p of oProgs.filter((x) => x.actFlag === "active")) {
          const la = await Attendance.findOne({ program: p._id })
            .sort({ date: -1 })
            .select("date")
            .lean();
          if (!la || daysSince(la.date) >= freqThresh(p.frequency))
            overdueCount++;
        }

        // Category breakdown + per-type breakdown
        const commitment = oProgs.filter(
          (p) => classifyProgram(p.programType) === "commitment"
        ).length;
        const manjari = oProgs.filter(
          (p) => classifyProgram(p.programType) === "manjari"
        ).length;
        const others = oProgs.length - commitment - manjari;

        // Per program type count for leader chart
        const typeCount = {};
        oProgs.forEach((p) => {
          const t = p.programType || "Unknown";
          typeCount[t] = (typeCount[t] || 0) + 1;
        });
        const progTypes = Object.entries(typeCount)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);

        return {
          ownerId: o._id,
          ownerName: o.name,
          ownerEmail: o.email,
          programCount: oProgs.length,
          activeCount: oActive,
          overdueCount,
          devoteeCount: devCount,
          avgAttendance: avgPct,
          lastActivity: lastAtt?.date || null,
          attThisWeek,
          daysSinceActivity: lastAtt ? daysSince(lastAtt.date) : null,
          commitment,
          manjari,
          others,
          progTypes,
          consistencyScore: Math.max(
            0,
            100 - overdueCount * 20 - (daysSince(lastAtt?.date) || 30) * 0.5
          ),
        };
      })
    );

    ownerStats.sort((a, b) => b.avgAttendance - a.avgAttendance);
    const bestOwner = ownerStats[0] || null;
    const worstOwner = ownerStats[ownerStats.length - 1] || null;
    const mostActive =
      [...ownerStats].sort((a, b) => b.attThisWeek - a.attThisWeek)[0] || null;
    const leastActive =
      [...ownerStats].sort((a, b) => a.attThisWeek - b.attThisWeek)[0] || null;

    // ── PROGRAM CATEGORY BREAKDOWN ─────────────────────────────────
    const commitment = programs.filter(
      (p) => classifyProgram(p.programType) === "commitment"
    );
    const manjari = programs.filter(
      (p) => classifyProgram(p.programType) === "manjari"
    );
    const othersP = programs.filter(
      (p) => classifyProgram(p.programType) === "others"
    );

    const catAvg = async (progs) => {
      const ids = progs.map((p) => p._id);
      const sums = summaries.filter((s) =>
        ids.some((id) => id.toString() === s.program?.toString())
      );
      return sums.length
        ? Math.round(sums.reduce((a, x) => a + x.percentage, 0) / sums.length)
        : 0;
    };
    const [commitAvg, manjariAvg, othersAvg] = await Promise.all([
      catAvg(commitment),
      catAvg(manjari),
      catAvg(othersP),
    ]);

    // ── DISTRIBUTION ANALYTICS ─────────────────────────────────────
    const byArea = {};
    const byLang = {};
    const byType = {};
    const byFreq = {};
    const byDay = {};
    const byOwner = {};
    programs.forEach((p) => {
      const ow = p.programOwner?.name || "Unknown";
      [
        ["area", p.area, byArea],
        ["language", p.language, byLang],
        ["programType", p.programType, byType],
        ["frequency", p.frequency, byFreq],
        ["day", p.day, byDay],
        ["owner", ow, byOwner],
      ].forEach(([, v, map]) => {
        if (v) {
          map[v] = (map[v] || 0) + 1;
        }
      });
    });

    // Avg attendance per area/language/type
    const areaAvgAtt = {},
      langAvgAtt = {},
      typeAvgAtt = {};
    for (const area of Object.keys(byArea)) {
      const pIds = programs.filter((p) => p.area === area).map((p) => p._id);
      const sums = summaries.filter((s) =>
        pIds.some((id) => id.toString() === s.program?.toString())
      );
      areaAvgAtt[area] = sums.length
        ? Math.round(sums.reduce((a, x) => a + x.percentage, 0) / sums.length)
        : 0;
    }
    for (const lang of Object.keys(byLang)) {
      const pIds = programs
        .filter((p) => p.language === lang)
        .map((p) => p._id);
      const sums = summaries.filter((s) =>
        pIds.some((id) => id.toString() === s.program?.toString())
      );
      langAvgAtt[lang] = sums.length
        ? Math.round(sums.reduce((a, x) => a + x.percentage, 0) / sums.length)
        : 0;
    }
    for (const type of Object.keys(byType)) {
      const pIds = programs
        .filter((p) => p.programType === type)
        .map((p) => p._id);
      const sums = summaries.filter((s) =>
        pIds.some((id) => id.toString() === s.program?.toString())
      );
      typeAvgAtt[type] = sums.length
        ? Math.round(sums.reduce((a, x) => a + x.percentage, 0) / sums.length)
        : 0;
    }

    // ── MONTHLY TREND (12 months) ──────────────────────────────────
    const twelveAgo = new Date();
    twelveAgo.setFullYear(twelveAgo.getFullYear() - 1);
    const monthlyRaw = await Attendance.aggregate([
      {
        $match: {
          program: { $in: programIds },
          date: { $gte: twelveAgo },
          ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const monthlyTrend = monthlyRaw.map((m) => ({
      label: `${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
      total: m.total,
      present: m.present,
      absent: m.total - m.present,
      pct: pct(m.present, m.total),
    }));

    // ── PROGRAM MASTER TABLE DATA ──────────────────────────────────
    const programTable = await Promise.all(
      programs.map(async (p) => {
        const pSums = summaries.filter(
          (s) => s.program?.toString() === p._id.toString()
        );
        const avgPct = pSums.length
          ? Math.round(
              pSums.reduce((a, x) => a + x.percentage, 0) / pSums.length
            )
          : 0;
        const devCount = await Devotee.countDocuments({ program: p._id });
        const lastAtt = await Attendance.findOne({ program: p._id })
          .sort({ date: -1 })
          .select("date")
          .lean();
        const days = lastAtt ? daysSince(lastAtt.date) : null;
        const thresh = freqThresh(p.frequency);
        let regularity = "Healthy";
        if (!lastAtt) regularity = "No Data";
        else if (days >= thresh) regularity = "Overdue";
        else if (days >= thresh * 0.6) regularity = "Watch";
        return {
          programId: p._id,
          programKey: p.programKey,
          ownerName: p.programOwner?.name || "—",
          ownerId: p.programOwner?._id?.toString() || "",
          area: p.area,
          subArea: p.subArea,
          language: p.language,
          frequency: p.frequency,
          day: p.day || "", // ← was missing, fixes DayWiseTable
          programType: p.programType,
          devoteeCount: devCount,
          avgPct,
          lastAttDate: lastAtt?.date || null,
          actFlag: p.actFlag,
          regularity,
          category: classifyProgram(p.programType),
          daysSince: days,
        };
      })
    );

    // ── TOP/BOTTOM DEVOTEES ────────────────────────────────────────
    const allSummariesSorted = [...summaries].sort(
      (a, b) => b.percentage - a.percentage
    );
    const topDevotees = allSummariesSorted.slice(0, 10);
    const bottomDevotees = [...summaries]
      .filter((s) => s.percentage < 40)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 10);

    // ── DAY-WISE PROGRAM COUNT ─────────────────────────────────────
    const dayWise = Object.entries(byDay)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    // ── TODAY'S PROGRAMS (all owners) ─────────────────────────────
    const todayName = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][new Date().getDay()];
    const todayProgs = activePrograms.filter((p) => {
      const freq = (p.frequency || "").toLowerCase().replace(/[\s-]/g, "");
      return (
        p.day?.toLowerCase() === todayName.toLowerCase() || freq === "daily"
      );
    });
    const todayMarkedSet = new Set();
    if (todayProgs.length) {
      const marked = await Attendance.distinct("program", {
        program: { $in: todayProgs.map((p) => p._id) },
        date: { $gte: today },
      });
      marked.forEach((id) => todayMarkedSet.add(id.toString()));
    }
    const todayPrograms = todayProgs.map((p) => ({
      programId: p._id,
      programKey: p.programKey,
      programType: p.programType,
      ownerName: p.programOwner?.name || "—",
      area: p.area,
      time: p.time,
      frequency: p.frequency,
      markedToday: todayMarkedSet.has(p._id.toString()),
    }));

    // ── SMART INSIGHTS ─────────────────────────────────────────────
    const insights = [];
    if (bestOwner)
      insights.push({
        type: "good",
        text: `${bestOwner.ownerName} leads system performance with ${bestOwner.avgAttendance}% avg attendance across ${bestOwner.programCount} programs.`,
      });
    if (
      worstOwner &&
      worstOwner.ownerId.toString() !== bestOwner?.ownerId?.toString()
    )
      insights.push({
        type: "warn",
        text: `${worstOwner.ownerName} has the lowest performance at ${worstOwner.avgAttendance}%. ${worstOwner.overdueCount} programs are overdue.`,
      });
    const overdueOwners = ownerStats.filter((o) => o.overdueCount > 0);
    if (overdueOwners.length)
      insights.push({
        type: "warn",
        text: `${overdueOwners.length} owner${
          overdueOwners.length > 1 ? "s have" : " has"
        } overdue programs: ${overdueOwners
          .slice(0, 3)
          .map((o) => o.ownerName)
          .join(", ")}.`,
      });
    const bestArea = Object.entries(areaAvgAtt).sort((a, b) => b[1] - a[1])[0];
    const worstArea = Object.entries(areaAvgAtt).sort((a, b) => a[1] - b[1])[0];
    if (bestArea)
      insights.push({
        type: "good",
        text: `${bestArea[0]} is the top-performing area with ${bestArea[1]}% avg attendance.`,
      });
    if (worstArea && worstArea[0] !== bestArea?.[0])
      insights.push({
        type: "warn",
        text: `${worstArea[0]} area has the lowest participation at ${worstArea[1]}%.`,
      });
    if (commitAvg > manjariAvg)
      insights.push({
        type: "info",
        text: `Commitment programs (${commitAvg}%) outperform Manjari programs (${manjariAvg}%) system-wide.`,
      });
    else if (manjariAvg > commitAvg)
      insights.push({
        type: "info",
        text: `Manjari programs (${manjariAvg}%) perform better than Commitment programs (${commitAvg}%).`,
      });
    const bestLang = Object.entries(langAvgAtt).sort((a, b) => b[1] - a[1])[0];
    if (bestLang)
      insights.push({
        type: "info",
        text: `${bestLang[0]} language programs have the highest attendance at ${bestLang[1]}%.`,
      });
    if (progNoAtt.length)
      insights.push({
        type: "critical",
        text: `${progNoAtt.length} program${
          progNoAtt.length > 1 ? "s have" : " has"
        } never had attendance recorded.`,
      });

    // ── DAILY SUBMISSIONS — last 90 days (GitHub heatmap) ─────────
    const ninetyAgo = new Date();
    ninetyAgo.setDate(ninetyAgo.getDate() - 90);
    ninetyAgo.setHours(0, 0, 0, 0);
    const dailyRaw = await Attendance.aggregate([
      {
        $match: {
          program: { $in: programIds },
          date: { $gte: ninetyAgo },
          status: "present",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailySubmissions = dailyRaw.map((d) => ({
      date: d._id,
      count: d.count,
    }));

    // ── AREA × TYPE/LANGUAGE MATRIX (for advanced combo chart) ────
    const areaTypeMatrix = {};
    const areaLangMatrix = {};
    programs.forEach((p) => {
      const a = p.area || "Unknown";
      const t = p.programType || "Unknown";
      const l = p.language || "Unknown";
      if (!areaTypeMatrix[a]) areaTypeMatrix[a] = {};
      areaTypeMatrix[a][t] = (areaTypeMatrix[a][t] || 0) + 1;
      if (!areaLangMatrix[a]) areaLangMatrix[a] = {};
      areaLangMatrix[a][l] = (areaLangMatrix[a][l] || 0) + 1;
    });
    const areaTypeData = Object.entries(areaTypeMatrix)
      .map(([area, types]) => ({
        area,
        types: Object.entries(types).map(([type, count]) => ({ type, count })),
        totalCount: Object.values(types).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10);
    const areaLangData = Object.entries(areaLangMatrix)
      .map(([area, langs]) => ({
        area,
        langs: Object.entries(langs).map(([lang, count]) => ({ lang, count })),
        totalCount: Object.values(langs).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10);

    res.json({
      // KPIs
      kpis: {
        totalDevotees,
        totalOwners,
        totalPrograms: programs.length,
        activePrograms: activePrograms.length,
        inactivePrograms: inactivePrograms.length,
        attTotal,
        attWeek,
        progAtRisk: progAtRisk.length,
        progNoAtt: progNoAtt.length,
        avgAttSystem,
        totalSessions,
        newProgramsThisMonth,
        newDevoteesThisMonth,
        bestOwner: bestOwner
          ? { name: bestOwner.ownerName, pct: bestOwner.avgAttendance }
          : null,
        worstOwner: worstOwner
          ? { name: worstOwner.ownerName, pct: worstOwner.avgAttendance }
          : null,
        mostActive: mostActive
          ? { name: mostActive.ownerName, count: mostActive.attThisWeek }
          : null,
        leastActive: leastActive
          ? { name: leastActive.ownerName, count: leastActive.attThisWeek }
          : null,
      },
      filterOptions,
      todayPrograms,
      healthCounts,
      // Category breakdown
      categories: {
        commitment: { count: commitment.length, avgPct: commitAvg },
        manjari: { count: manjari.length, avgPct: manjariAvg },
        others: { count: othersP.length, avgPct: othersAvg },
      },
      // Distributions
      byArea: Object.entries(byArea)
        .map(([k, v]) => ({ label: k, count: v, avgPct: areaAvgAtt[k] || 0 }))
        .sort((a, b) => b.count - a.count),
      byLanguage: Object.entries(byLang)
        .map(([k, v]) => ({ label: k, count: v, avgPct: langAvgAtt[k] || 0 }))
        .sort((a, b) => b.count - a.count),
      byType: await Promise.all(
        Object.entries(byType).map(async ([k, v]) => {
          const pIds = programs
            .filter((p) => p.programType === k)
            .map((p) => p._id);
          const devs = await Devotee.countDocuments({ program: { $in: pIds } });
          return {
            label: k,
            count: v,
            avgPct: typeAvgAtt[k] || 0,
            devoteeCount: devs,
          };
        })
      ).then((r) => r.sort((a, b) => b.count - a.count)),
      byFrequency: Object.entries(byFreq)
        .map(([k, v]) => ({ label: k, count: v }))
        .sort((a, b) => b.count - a.count),
      byDay: dayWise,
      byOwner: Object.entries(byOwner)
        .map(([k, v]) => ({ label: k, count: v }))
        .sort((a, b) => b.count - a.count),
      // Analytics data
      ownerStats,
      programTable,
      topDevotees,
      bottomDevotees,
      monthlyTrend,
      insights,
      dailySubmissions,
      areaTypeData,
      areaLangData,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    res.status(500).json({ message: "Failed to load admin analytics." });
  }
};

module.exports = {
  getAdminAnalytics,
  searchDevotee,
  suggestDevotee,
  ownerSearchDevotee,
  ownerSuggestDevotee,
};

// ── OWNER DEVOTEE SEARCH (only their programs) ─────────────────────────
async function ownerSearchDevotee(req, res) {
  try {
    const ownerId = req.user._id;
    const { name } = req.query;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: "Name too short." });

    // Get only this owner's programs
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
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
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
          pct,
          streak,
          monthlyBreakdown,
          recentSessions,
          status: pct >= 80 ? "Active" : pct >= 40 ? "Moderate" : "Irregular",
        };
      })
    );

    res.json({ found: true, results: results.filter(Boolean) });
  } catch (err) {
    console.error("Owner devotee search:", err);
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

// ── DEVOTEE AUTOCOMPLETE SUGGEST ────────────────────────────────────────
async function suggestDevotee(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ suggestions: [] });

    const regex = new RegExp(q.trim(), "i");
    // Search through ProgramNamesOnly names arrays
    const docs = await ProgramNamesOnly.find({
      names: { $elemMatch: { $regex: q.trim(), $options: "i" } },
    })
      .select("names")
      .limit(20)
      .lean();

    const matched = new Set();
    docs.forEach((d) => {
      d.names.forEach((n) => {
        if (regex.test(n) && n.trim().length > 1) matched.add(n.trim());
      });
    });

    const suggestions = [...matched].slice(0, 8);
    res.json({ suggestions });
  } catch (err) {
    res.json({ suggestions: [] });
  }
}

// ── DEVOTEE SEARCH ─────────────────────────────────────────────────────
const ProgramNamesOnly = require("../models/ProgramNamesOnly");

async function searchDevotee(req, res) {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: "Name too short." });

    const q = name.trim().toLowerCase();

    // Find all ProgramNamesOnly docs where this name appears
    const nameDocs = await ProgramNamesOnly.find({
      names: { $elemMatch: { $regex: q, $options: "i" } },
    })
      .populate(
        "program",
        "programKey programType area language frequency day time programOwner actFlag"
      )
      .lean();

    if (!nameDocs.length) return res.json({ found: false, results: [] });

    // For each program this devotee is in, get attendance summary
    const results = await Promise.all(
      nameDocs.map(async (nd) => {
        const prog = nd.program;
        if (!prog) return null;

        // Get their exact names from this doc that match
        const matchedNames = nd.names.filter((n) =>
          n.toLowerCase().includes(q)
        );

        // Get Attendance records for this person in this program
        const attRecords = await Attendance.find({
          program: prog._id,
          devoteeName: { $regex: q, $options: "i" },
        })
          .sort({ date: -1 })
          .limit(50)
          .lean();

        // Look up when devotee was added to program
        const devoteeDoc = await Devotee.findOne({
          program: prog._id,
          name: { $regex: new RegExp(`^${matchedNames[0] || q}$`, "i") },
        }).select("addedToProgram createdAt").lean();
        const addedDate = devoteeDoc?.addedToProgram || devoteeDoc?.createdAt || null;

        // Total sessions (filtered by addedToProgram if available)
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
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

        // Monthly breakdown
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

        // Last 10 sessions
        const recentSessions = attRecords.slice(0, 10).map((r) => ({
          date: r.date,
          status: r.status,
          host: r.hostName,
        }));

        // Streak — current consecutive present
        let streak = 0;
        for (const r of attRecords) {
          if (r.status === "present") streak++;
          else break;
        }

        // Owner info
        const owner = await User.findById(prog.programOwner)
          .select("name")
          .lean();

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
          ownerName: owner?.name || "—",
          devoteeName: matchedNames[0] || q,
          attended,
          total,
          pct,
          streak,
          monthlyBreakdown,
          recentSessions,
          status: pct >= 80 ? "Active" : pct >= 40 ? "Moderate" : "Irregular",
        };
      })
    );

    const clean = results.filter(Boolean);
    res.json({ found: clean.length > 0, results: clean });
  } catch (err) {
    console.error("Devotee search error:", err);
    res.status(500).json({ message: "Search failed." });
  }
}
