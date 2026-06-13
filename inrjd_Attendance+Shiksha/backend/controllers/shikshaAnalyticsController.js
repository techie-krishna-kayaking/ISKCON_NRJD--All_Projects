const Participant = require("../models/Participant");
const Certification = require("../models/Certification");
const Course = require("../models/Course");
const GrowthPlan = require("../models/GrowthPlan");
const Program = require("../models/Program");
const User = require("../models/User");
const { LEVEL_ORDER } = require("../config/levelData");

// ── OVERVIEW: system-wide shiksha/certification analytics ───────
const getShikshaOverview = async (req, res) => {
  try {
    const [
      participants,
      certifications,
      courses,
      growthPlans,
      programs,
      owners,
    ] = await Promise.all([
      Participant.find({}).lean(),
      Certification.find({}).populate("course", "name level").populate("participant", "name currentLevel programOwner").lean(),
      Course.find({}).lean(),
      GrowthPlan.find({}).lean(),
      Program.find({}).lean(),
      User.find({ role: "owner", isActive: true }).select("name email").lean(),
    ]);

    const totalParticipants = participants.length;
    const activeParticipants = participants.filter((p) => p.activeFlag).length;
    const totalCertifications = certifications.length;
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.active).length;

    // Level distribution
    const levelDistribution = {};
    LEVEL_ORDER.forEach((l) => { levelDistribution[l] = 0; });
    participants.forEach((p) => {
      const lvl = p.currentLevel || "None";
      levelDistribution[lvl] = (levelDistribution[lvl] || 0) + 1;
    });

    // Certifications per month (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const certsByMonth = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      certsByMonth[key] = 0;
    }
    certifications.forEach((c) => {
      const d = new Date(c.certificationDate);
      if (d >= twelveMonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (certsByMonth[key] !== undefined) certsByMonth[key]++;
      }
    });

    // Certifications by level
    const certsByLevel = {};
    LEVEL_ORDER.filter((l) => l !== "None").forEach((l) => { certsByLevel[l] = 0; });
    certifications.forEach((c) => {
      certsByLevel[c.certificationLevel] = (certsByLevel[c.certificationLevel] || 0) + 1;
    });

    // Certifications by course
    const certsByCourse = {};
    certifications.forEach((c) => {
      const name = c.course?.name || "Unknown";
      certsByCourse[name] = (certsByCourse[name] || 0) + 1;
    });

    // Growth plan stats
    const gpStats = { active: 0, completed: 0, "on-hold": 0, cancelled: 0 };
    growthPlans.forEach((g) => { gpStats[g.status] = (gpStats[g.status] || 0) + 1; });

    // Program owner insights: participants per owner, certifications per owner
    const ownerMap = {};
    owners.forEach((o) => {
      ownerMap[o._id.toString()] = { name: o.name, email: o.email, participants: 0, certifications: 0, programs: 0 };
    });
    programs.forEach((p) => {
      const oid = p.programOwner?.toString();
      if (ownerMap[oid]) ownerMap[oid].programs++;
    });
    participants.forEach((p) => {
      const oid = p.programOwner?.toString();
      if (ownerMap[oid]) ownerMap[oid].participants++;
    });
    certifications.forEach((c) => {
      const oid = c.participant?.programOwner?.toString();
      if (oid && ownerMap[oid]) ownerMap[oid].certifications++;
    });
    const ownerInsights = Object.values(ownerMap).sort((a, b) => b.certifications - a.certifications);

    // Recent certifications (last 20)
    const recentCerts = certifications
      .sort((a, b) => new Date(b.certificationDate) - new Date(a.certificationDate))
      .slice(0, 20)
      .map((c) => ({
        participantName: c.participant?.name || "—",
        level: c.certificationLevel,
        course: c.course?.name || "—",
        date: c.certificationDate,
        fromLevel: c.currentLevelBefore,
        toLevel: c.newLevelAfter,
      }));

    // Top participants (most certifications)
    const participantCertCount = {};
    certifications.forEach((c) => {
      const pid = c.participant?._id?.toString();
      if (!pid) return;
      if (!participantCertCount[pid]) {
        participantCertCount[pid] = { name: c.participant.name, currentLevel: c.participant.currentLevel, count: 0 };
      }
      participantCertCount[pid].count++;
    });
    const topParticipants = Object.values(participantCertCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Level progression funnel: how many reached each level
    const levelFunnel = LEVEL_ORDER.map((level, idx) => ({
      level,
      stageNumber: idx,
      count: participants.filter((p) => LEVEL_ORDER.indexOf(p.currentLevel || "None") >= idx).length,
    }));

    // Participants added per month (last 12)
    const addedByMonth = { ...certsByMonth };
    Object.keys(addedByMonth).forEach((k) => { addedByMonth[k] = 0; });
    participants.forEach((p) => {
      const d = new Date(p.addedAt || p.createdAt);
      if (d >= twelveMonthsAgo) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (addedByMonth[key] !== undefined) addedByMonth[key]++;
      }
    });

    res.json({
      summary: {
        totalParticipants,
        activeParticipants,
        totalCertifications,
        totalCourses,
        activeCourses,
        totalGrowthPlans: growthPlans.length,
        totalPrograms: programs.length,
        totalOwners: owners.length,
      },
      levelDistribution,
      certsByMonth,
      certsByLevel,
      certsByCourse,
      gpStats,
      ownerInsights,
      recentCerts,
      topParticipants,
      levelFunnel,
      addedByMonth,
    });
  } catch (err) {
    console.error("Shiksha overview error:", err);
    res.status(500).json({ message: "Failed to fetch shiksha analytics." });
  }
};

// ── INDIVIDUAL DETAIL: single participant analytics ─────────────
const getParticipantAnalytics = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id).lean();
    if (!participant) return res.status(404).json({ message: "Participant not found." });

    const [certifications, growthPlans] = await Promise.all([
      Certification.find({ participant: participant._id }).populate("course", "name level").sort({ certificationDate: 1 }).lean(),
      GrowthPlan.find({ participant: participant._id }).sort({ createdAt: -1 }).lean(),
    ]);

    // Level journey timeline
    const levelJourney = certifications.map((c) => ({
      date: c.certificationDate,
      fromLevel: c.currentLevelBefore,
      toLevel: c.newLevelAfter,
      course: c.course?.name || "—",
      level: c.certificationLevel,
    }));

    // Time at each level (days)
    const timeAtLevels = [];
    for (let i = 0; i < certifications.length; i++) {
      const curr = certifications[i];
      const next = certifications[i + 1];
      const startDate = new Date(curr.certificationDate);
      const endDate = next ? new Date(next.certificationDate) : new Date();
      const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      timeAtLevels.push({ level: curr.newLevelAfter, days, current: !next });
    }

    // Days since addition
    const addedAt = participant.addedAt || participant.createdAt;
    const daysSinceAdded = Math.round((new Date() - new Date(addedAt)) / (1000 * 60 * 60 * 24));

    // Current stage index
    const currentStage = LEVEL_ORDER.indexOf(participant.currentLevel || "None");

    res.json({
      participant,
      certifications,
      growthPlans,
      levelJourney,
      timeAtLevels,
      daysSinceAdded,
      currentStage,
      totalStages: LEVEL_ORDER.length,
    });
  } catch (err) {
    console.error("Participant analytics error:", err);
    res.status(500).json({ message: "Failed to fetch participant analytics." });
  }
};

module.exports = { getShikshaOverview, getParticipantAnalytics };
