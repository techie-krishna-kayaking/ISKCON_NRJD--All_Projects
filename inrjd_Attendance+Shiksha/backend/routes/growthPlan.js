const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/growthPlanController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/participant/:participantId", ctrl.getPlans);
router.post("/", ctrl.upsertGrowthPlan);
router.put("/:id", ctrl.upsertGrowthPlan);

module.exports = router;
