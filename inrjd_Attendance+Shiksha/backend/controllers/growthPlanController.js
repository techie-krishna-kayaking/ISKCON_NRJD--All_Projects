const GrowthPlan = require("../models/GrowthPlan");
const Participant = require("../models/Participant");

// ── CREATE / UPDATE ─────────────────────────────────────────────────
const upsertGrowthPlan = async (req, res) => {
  try {
    const { participantId, goalTitle, description, targetLevel, targetDate, status } = req.body;

    if (!participantId) return res.status(400).json({ message: "Participant ID is required." });
    if (!goalTitle?.trim()) return res.status(400).json({ message: "Goal title is required." });

    const participant = await Participant.findById(participantId);
    if (!participant) return res.status(404).json({ message: "Participant not found." });

    if (req.user.role !== "admin" && participant.programOwner?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied." });

    // If updating an existing plan
    if (req.params.id) {
      const plan = await GrowthPlan.findById(req.params.id);
      if (!plan) return res.status(404).json({ message: "Growth plan not found." });

      plan.goalTitle = goalTitle.trim();
      plan.description = description?.trim() || "";
      plan.targetLevel = targetLevel || plan.targetLevel;
      plan.targetDate = targetDate ? new Date(targetDate) : plan.targetDate;
      plan.status = status || plan.status;
      plan.updatedBy = req.user._id;
      await plan.save();
      return res.json({ message: "Growth plan updated.", growthPlan: plan });
    }

    // Create new
    const plan = await GrowthPlan.create({
      participant: participantId,
      goalTitle: goalTitle.trim(),
      description: description?.trim() || "",
      targetLevel: targetLevel || "Shraddhavan",
      targetDate: targetDate ? new Date(targetDate) : null,
      status: "active",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ message: "Growth plan created.", growthPlan: plan });
  } catch (err) {
    console.error("Upsert growth plan error:", err);
    res.status(500).json({ message: "Failed to save growth plan." });
  }
};

// ── GET PLANS FOR A PARTICIPANT ─────────────────────────────────────
const getPlans = async (req, res) => {
  try {
    const plans = await GrowthPlan.find({ participant: req.params.participantId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ growthPlans: plans });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch growth plans." });
  }
};

module.exports = { upsertGrowthPlan, getPlans };
