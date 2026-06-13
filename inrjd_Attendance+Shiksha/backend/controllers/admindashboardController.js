const Program = require("../models/Program");
const User = require("../models/User");
const Devotee = require("../models/Devotee");
const Attendance = require("../models/Attendance");
const AttendanceSummary = require("../models/AttendanceSummary");
const ReminderLog = require("../models/Reminderlog");
const Config = require("../models/Config");

// ── Date helpers ─────────────────────────────────────────────────────
function startOf(unit) {
  const d = new Date();
  if (unit === "today") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (unit === "week") {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (unit === "month") {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  if (unit === "6month") {
    d.setMonth(d.getMonth() - 6);
    return d;
  }
  return d;
}
function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / 864e5);
}
const FREQ_THRESH = {
  daily: 7,
  weekly: 14,
  biweekly: 21,
  fortnightly: 21,
  monthly: 45,
};
function freqThresh(freq) {
  return (
    FREQ_THRESH[(freq || "weekly").toLowerCase().replace(/[\s-]/g, "")] || 14
  );
}

const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOf("today");
    const weekStart = startOf("week");
    const monthStart = startOf("month");
    const last6Start = startOf("6month");

    // ════════════════════════════════════════════════════════════
    // SECTION 1: CORE COUNTS
    // ════════════════════════════════════════════════════════════
    const [
      totalPrograms,
      disabledPrograms,
      totalOwners,
      totalAdmins,
      totalDevotees,
      newDevoteesWeek,
      submissionsToday,
      submissionsWeek,
    ] = await Promise.all([
      Program.countDocuments({ actFlag: "active" }),
      Program.countDocuments({ actFlag: "inactive" }),
      User.countDocuments({ role: "owner", isActive: true }),
      User.countDocuments({ role: "admin", isActive: true }),
      Devotee.countDocuments(),
      Devotee.countDocuments({ createdAt: { $gte: weekStart } }),
      Attendance.countDocuments({ createdAt: { $gte: todayStart } }),
      Attendance.countDocuments({ createdAt: { $gte: weekStart } }),
    ]);

    // Sessions this month (unique program+date combos)
    const monthSessionsAgg = await Attendance.aggregate([
      { $match: { date: { $gte: monthStart } } },
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
    const monthSessions = monthSessionsAgg[0]?.total || 0;

    // Avg attendance across all summaries
    const avgAgg = await AttendanceSummary.aggregate([
      { $group: { _id: null, avg: { $avg: "$percentage" } } },
    ]);
    const avgAttendance = Math.round(avgAgg[0]?.avg || 0);

    // ════════════════════════════════════════════════════════════
    // SECTION 2: SYSTEM HEALTH
    // ════════════════════════════════════════════════════════════
    const lastAttDoc = await Attendance.findOne()
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();
    const lastReminderDoc = await ReminderLog.findOne()
      .sort({ lastSentAt: -1 })
      .select("lastSentAt sentCount")
      .lean();
    const totalRemindersSent = await ReminderLog.aggregate([
      { $group: { _id: null, total: { $sum: "$sentCount" } } },
    ]);

    // Orphan check: devotees whose program no longer exists
    const orphanDevotees = await Devotee.aggregate([
      {
        $lookup: {
          from: "programs",
          localField: "program",
          foreignField: "_id",
          as: "prog",
        },
      },
      { $match: { prog: { $size: 0 } } },
      { $count: "total" },
    ]);
    const orphanCount = orphanDevotees[0]?.total || 0;

    // Duplicate config check: config types with duplicate values
    const configs = await Config.find({}).lean();
    const duplicateConfigs = configs
      .filter((c) => {
        const vals = c.values.map((v) => v.toLowerCase());
        return new Set(vals).size !== vals.length;
      })
      .map((c) => c.type);

    // Missing mandatory config
    const requiredTypes = [
      "area",
      "subArea",
      "frequency",
      "programType",
      "language",
      "day",
    ];
    const missingConfigs = requiredTypes.filter((t) => {
      const found = configs.find((c) => c.type === t);
      return !found || found.values.length === 0;
    });

    // Programs with incomplete setup (missing time/day/startDate)
    const incompleteSetup = await Program.countDocuments({
      actFlag: "active",
      $or: [{ day: "" }, { time: "" }, { startDate: null }],
    });

    const systemHealth = {
      lastAttendanceSubmission: lastAttDoc?.createdAt || null,
      lastReminderSent: lastReminderDoc?.lastSentAt || null,
      totalRemindersSent: totalRemindersSent[0]?.total || 0,
      orphanDevotees: orphanCount,
      duplicateConfigs,
      missingConfigs,
      incompleteSetupCount: incompleteSetup,
      dbStatus: "connected",
    };

    // ════════════════════════════════════════════════════════════
    // SECTION 3: PROGRAM OVERSIGHT
    // ════════════════════════════════════════════════════════════
    const activePrograms = await Program.find({ actFlag: "active" })
      .populate("programOwner", "name email")
      .lean();

    // Enrich with attendance data
    let overdueCount = 0,
      atRiskCount = 0,
      noHistoryCount = 0;
    const programOverview = [];

    for (const p of activePrograms) {
      const lastAtt = await Attendance.findOne({ program: p._id })
        .sort({ date: -1 })
        .select("date")
        .lean();
      const days = lastAtt ? daysSince(lastAtt.date) : null;
      const thresh = freqThresh(p.frequency);
      let status = "healthy";
      if (!lastAtt) {
        status = "no-history";
        noHistoryCount++;
      } else if (days >= thresh) {
        status = "overdue";
        overdueCount++;
      } else if (days >= thresh * 0.6) {
        status = "at-risk";
        atRiskCount++;
      }

      const summaries = await AttendanceSummary.find({ program: p._id }).lean();
      const avgPct = summaries.length
        ? Math.round(
            summaries.reduce((s, x) => s + x.percentage, 0) / summaries.length
          )
        : null;
      const devoteeCount = await Devotee.countDocuments({ program: p._id });

      programOverview.push({
        programId: p._id,
        programKey: p.programKey,
        programType: p.programType,
        frequency: p.frequency,
        area: p.area,
        ownerName: p.programOwner?.name || "—",
        days,
        thresh,
        status,
        avgPct,
        devoteeCount,
        createdAt: p.createdAt,
      });
    }

    // Programs newly created this week
    const newlyCreated = programOverview.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= weekStart
    ).length;

    // Recently disabled
    const recentlyDisabled = await Program.countDocuments({
      actFlag: "inactive",
      updatedAt: { $gte: weekStart },
    });

    // By type, frequency, area
    const byType = await Program.aggregate([
      { $match: { actFlag: "active" } },
      { $group: { _id: "$programType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);
    const byFreq = await Program.aggregate([
      { $match: { actFlag: "active" } },
      { $group: { _id: "$frequency", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byArea = await Program.aggregate([
      { $match: { actFlag: "active" } },
      { $group: { _id: "$area", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Top 8 programs by avg attendance
    const topPrograms = await AttendanceSummary.aggregate([
      {
        $group: {
          _id: "$program",
          programKey: { $first: "$programKey" },
          programType: { $first: "$programType" },
          area: { $first: "$area" },
          avgPct: { $avg: "$percentage" },
          devoteeCount: { $sum: 1 },
        },
      },
      { $sort: { avgPct: -1 } },
      { $limit: 8 },
    ]);

    const atRiskPrograms = programOverview
      .filter(
        (p) =>
          p.status === "overdue" ||
          p.status === "no-history" ||
          p.status === "at-risk"
      )
      .sort((a, b) => (b.days || 9999) - (a.days || 9999))
      .slice(0, 8);

    // ════════════════════════════════════════════════════════════
    // SECTION 4: OWNER OVERSIGHT
    // ════════════════════════════════════════════════════════════
    const owners = await User.find({ role: "owner", isActive: true }).lean();

    const ownerActivity = await Promise.all(
      owners.map(async (owner) => {
        const progs = await Program.find({ programOwner: owner._id }).lean();
        const active = progs.filter((p) => p.actFlag === "active").length;
        const sums = await AttendanceSummary.find({
          programOwner: owner._id,
        }).lean();
        const avgPct = sums.length
          ? Math.round(sums.reduce((s, x) => s + x.percentage, 0) / sums.length)
          : null;
        const lastAtt = await Attendance.findOne({ programOwner: owner._id })
          .sort({ date: -1 })
          .select("date")
          .lean();
        const reminderLog = await ReminderLog.findOne({
          program: { $in: progs.map((p) => p._id) },
        })
          .sort({ lastSentAt: -1 })
          .lean();
        const daysSinceAtt = lastAtt ? daysSince(lastAtt.date) : null;

        // Overdue programs for this owner
        let ownerOverdue = 0;
        for (const p of progs.filter((x) => x.actFlag === "active")) {
          const la = await Attendance.findOne({ program: p._id })
            .sort({ date: -1 })
            .select("date")
            .lean();
          const d = la ? daysSince(la.date) : null;
          if (d === null || d >= freqThresh(p.frequency)) ownerOverdue++;
        }

        return {
          ownerId: owner._id,
          ownerName: owner.name,
          ownerEmail: owner.email,
          programCount: progs.length,
          activeCount: active,
          avgAttendance: avgPct,
          lastSession: lastAtt?.date || null,
          daysSinceAtt,
          overdueCount: ownerOverdue,
          reminderCount: reminderLog?.sentCount || 0,
          needsAttention:
            ownerOverdue > 0 || daysSinceAtt === null || daysSinceAtt > 14,
        };
      })
    );

    const ownersNeedingAttention = ownerActivity.filter(
      (o) => o.needsAttention
    ).length;
    const ownersWithZeroActive = ownerActivity.filter(
      (o) => o.activeCount === 0
    ).length;

    // ════════════════════════════════════════════════════════════
    // SECTION 5: DEVOTEE OVERSIGHT
    // ════════════════════════════════════════════════════════════
    const devoteesNoContact = await Devotee.countDocuments({
      $or: [{ phone: "" }, { phone: { $exists: false } }],
      $and: [{ $or: [{ email: "" }, { email: { $exists: false } }] }],
    });

    // Devotees missing phone
    const missingPhone = await Devotee.countDocuments({
      phone: { $in: ["", null] },
    });
    // Devotees missing email
    const missingEmail = await Devotee.countDocuments({
      email: { $in: ["", null] },
    });

    // Orphan summaries (summary without active devotee)
    const orphanSummaries = orphanCount; // reuse from above

    // Devotees per program (top programs)
    const devoteesPerProg = await Devotee.aggregate([
      { $group: { _id: "$program", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "programs",
          localField: "_id",
          foreignField: "_id",
          as: "prog",
        },
      },
      { $unwind: { path: "$prog", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          programKey: "$prog.programKey",
          programType: "$prog.programType",
          count: 1,
        },
      },
    ]);

    // ════════════════════════════════════════════════════════════
    // SECTION 6: ATTENDANCE OPERATIONS
    // ════════════════════════════════════════════════════════════

    // Programs with NO attendance this week
    const allActiveIds = activePrograms.map((p) => p._id);
    const markedThisWeek = await Attendance.distinct("program", {
      date: { $gte: weekStart },
    });
    const markedSet = new Set(markedThisWeek.map(String));
    const notMarkedThisWeek = allActiveIds.filter(
      (id) => !markedSet.has(String(id))
    ).length;

    // Repeated absentee patterns (devotees absent in last 3+ consecutive sessions)
    const repeatedAbsentees = await Attendance.aggregate([
      { $match: { status: "absent" } },
      {
        $group: {
          _id: { prog: "$program", name: "$devoteeName" },
          absences: { $sum: 1 },
          lastDate: { $max: "$date" },
        },
      },
      { $match: { absences: { $gte: 3 } } },
      { $count: "total" },
    ]);

    // BV programs missing chapter
    const bvMissingChapter = await Attendance.countDocuments({
      programType: { $regex: /^bv$|bhaktivriksha/i },
      chapter: { $in: ["", null] },
      createdAt: { $gte: weekStart },
    });

    // Host missing
    const hostMissing = await Attendance.countDocuments({
      hostName: { $in: ["", null] },
      createdAt: { $gte: weekStart },
    });

    // Attendance by day (last 7 days for sparkline)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const count = await Attendance.countDocuments({
        date: { $gte: d, $lte: dEnd },
      });
      last7Days.push({
        label: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        count,
      });
    }

    // Monthly trend (last 6 months)
    const monthlyTrendAgg = await Attendance.aggregate([
      { $match: { date: { $gte: last6Start } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const months = [
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
    const monthlyTrend = monthlyTrendAgg.map((m) => ({
      label: `${months[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
      total: m.total,
      present: m.present,
      pct: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0,
    }));

    // Recent 10 sessions
    const recentRaw = await Attendance.find({})
      .sort({ date: -1 })
      .limit(200)
      .select("programKey date hostName programType")
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
        if (recentSessions.length === 5) break;
      }
    }

    // ════════════════════════════════════════════════════════════
    // HEALTH DISTRIBUTION
    // ════════════════════════════════════════════════════════════
    const healthAgg = await AttendanceSummary.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ["$percentage", 80] }, then: "active" },
                { case: { $gte: ["$percentage", 40] }, then: "moderate" },
              ],
              default: "inactive",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const health = { active: 0, moderate: 0, inactive: 0 };
    healthAgg.forEach((h) => {
      health[h._id] = h.count;
    });
    const totalSummaryRecords =
      health.active + health.moderate + health.inactive;

    // ════════════════════════════════════════════════════════════
    // RESPONSE
    // ════════════════════════════════════════════════════════════
    res.json({
      // Core
      totalPrograms,
      disabledPrograms,
      totalOwners,
      totalAdmins,
      totalDevotees,
      monthSessions,
      avgAttendance,
      submissionsToday,
      submissionsWeek,
      newDevoteesWeek,

      // Health
      health,
      totalSummaryRecords,

      // System health
      systemHealth,

      // Program oversight
      programCounts: {
        total: activePrograms.length,
        overdue: overdueCount,
        atRisk: atRiskCount,
        noHistory: noHistoryCount,
        newThisWeek: newlyCreated,
        recentDisabled: recentlyDisabled,
        incomplete: incompleteSetup,
      },
      byType,
      byFreq,
      byArea,
      topPrograms,
      atRiskPrograms,

      // Owner oversight
      ownerActivity: ownerActivity
        .sort((a, b) => (b.overdueCount || 0) - (a.overdueCount || 0))
        .slice(0, 12),
      ownerCounts: {
        total: owners.length,
        needsAttention: ownersNeedingAttention,
        zeroActive: ownersWithZeroActive,
      },

      // Devotee oversight
      devoteeCounts: {
        total: totalDevotees,
        newThisWeek: newDevoteesWeek,
        missingPhone,
        missingEmail,
        missingContact: devoteesNoContact,
        orphan: orphanSummaries,
      },
      devoteesPerProg,

      // Attendance ops
      attendanceOps: {
        submissionsToday,
        submissionsWeek,
        notMarkedThisWeek,
        repeatedAbsentees: repeatedAbsentees[0]?.total || 0,
        bvMissingChapter,
        hostMissing,
      },
      last7Days,
      monthlyTrend,
      recentSessions,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Failed to load admin dashboard." });
  }
};

module.exports = { getAdminDashboard };
