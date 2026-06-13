const Config = require("../models/Config");

const VALID_TYPES = [
  "area",
  "subArea",
  "frequency",
  "programType",
  "language",
  "day",
  "bvChapters",
];

// ── GET all config (public) ─────────────────────────────────────────
// Returns { area: [...], subArea: [...], frequency: [...], ... }
const getAllConfigs = async (req, res) => {
  try {
    const docs = await Config.find({});
    const result = {};
    VALID_TYPES.forEach((t) => {
      result[t] = [];
    });
    docs.forEach((d) => {
      result[d.type] = d.values;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch config." });
  }
};

// ── GET single type (public) ────────────────────────────────────────
const getConfigByType = async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ message: "Invalid config type." });

  try {
    const doc = await Config.findOne({ type });
    res.json({ type, values: doc ? doc.values : [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch config." });
  }
};

// ── ADD a value to a type (admin only) ─────────────────────────────
const addConfigValue = async (req, res) => {
  const { type } = req.params;
  const { value } = req.body;

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ message: "Invalid config type." });
  if (!value || !value.trim())
    return res.status(400).json({ message: "Value is required." });

  try {
    const trimmed = value.trim();
    let doc = await Config.findOne({ type });
    if (!doc) {
      doc = await Config.create({ type, values: [trimmed] });
    } else {
      if (doc.values.includes(trimmed))
        return res
          .status(409)
          .json({ message: `"${trimmed}" already exists in ${type}.` });
      doc.values.push(trimmed);
      await doc.save();
    }
    res.json({ message: `"${trimmed}" added to ${type}.`, values: doc.values });
  } catch (err) {
    res.status(500).json({ message: "Failed to add value." });
  }
};

// ── DELETE a value from a type (admin only) ─────────────────────────
const deleteConfigValue = async (req, res) => {
  const { type } = req.params;
  const { value } = req.body;

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ message: "Invalid config type." });
  if (!value) return res.status(400).json({ message: "Value is required." });

  try {
    const doc = await Config.findOne({ type });
    if (!doc || !doc.values.includes(value))
      return res
        .status(404)
        .json({ message: `"${value}" not found in ${type}.` });

    doc.values = doc.values.filter((v) => v !== value);
    await doc.save();
    res.json({
      message: `"${value}" removed from ${type}.`,
      values: doc.values,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete value." });
  }
};

// ── REPLACE entire values array for a type (admin only) ─────────────
const setConfigValues = async (req, res) => {
  const { type } = req.params;
  const { values } = req.body;

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ message: "Invalid config type." });
  if (!Array.isArray(values))
    return res.status(400).json({ message: "values must be an array." });

  try {
    const cleaned = values.map((v) => v.trim()).filter(Boolean);
    const doc = await Config.findOneAndUpdate(
      { type },
      { values: cleaned },
      { upsert: true, new: true }
    );
    res.json({ message: `${type} config updated.`, values: doc.values });
  } catch (err) {
    res.status(500).json({ message: "Failed to update config." });
  }
};

module.exports = {
  getAllConfigs,
  getConfigByType,
  addConfigValue,
  deleteConfigValue,
  setConfigValues,
};
