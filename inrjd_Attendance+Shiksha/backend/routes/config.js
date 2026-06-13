const express = require("express");
const router = express.Router();

const configController = require("../controllers/configController");
const { protect, adminOnly } = require("../middleware/auth");

// ── All authenticated users can READ config ──────────────────
router.get("/", protect, configController.getAllConfigs);
router.get("/:type", protect, configController.getConfigByType);

// ── Admin only: write operations ─────────────────────────────
router.post("/:type/add", protect, adminOnly, configController.addConfigValue);
router.delete(
  "/:type/remove",
  protect,
  adminOnly,
  configController.deleteConfigValue
);
router.put("/:type", protect, adminOnly, configController.setConfigValues);

module.exports = router;
