const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const FoodItem = require('../models/FoodItem');
const RawMaterial = require('../models/RawMaterial');
const Recipe = require('../models/Recipe');
const logger = require('./logger');

const CATEGORY_MAP = {
  rice: 'rice', dal: 'dal', bread: 'bread', roti: 'bread', puri: 'bread',
  vegetable: 'vegetable', sabji: 'vegetable', sweet: 'sweet', dessert: 'sweet',
  snack: 'snack', beverage: 'beverage', drink: 'beverage',
  condiment: 'condiment', chutney: 'condiment', pickle: 'condiment',
};

const RM_CATEGORY_MAP = {
  vegetable: 'vegetable', grain: 'grain', rice: 'grain', wheat: 'grain',
  spice: 'spice', masala: 'spice', oil: 'oil_ghee', ghee: 'oil_ghee',
  dairy: 'dairy', milk: 'dairy', 'dry fruit': 'dry_fruit', packaging: 'packaging',
  tissue: 'packaging', bottle: 'beverage', water: 'beverage',
};

const UNIT_MAP = {
  kg: 'kg', kilogram: 'kg', g: 'g', gram: 'g', grams: 'g',
  l: 'liter', liter: 'liter', litre: 'liter', ml: 'ml',
  count: 'count', pcs: 'count', piece: 'count', pieces: 'count',
  pack: 'pack', dozen: 'dozen', bunch: 'bunch',
};

const normalizeUnit = (unit) => {
  if (!unit) return 'count';
  return UNIT_MAP[unit.toString().toLowerCase().trim()] || 'count';
};

const normalizeCategory = (cat, map) => {
  if (!cat) return 'other';
  return map[cat.toString().toLowerCase().trim()] || 'other';
};

/**
 * Import data from an Excel file into MongoDB.
 * Supports sheets named: FoodItems, RawMaterials, Recipes
 * Falls back to parsing the first sheet if named sheets are not found.
 */
const importExcel = async (filePath, userId) => {
  const summary = {
    foodItems: { imported: 0, skipped: 0, errors: [] },
    rawMaterials: { imported: 0, skipped: 0, errors: [] },
    recipes: { imported: 0, skipped: 0, errors: [] },
  };

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    // Try to find sheets by name or use first sheet
    const foodSheet = sheetNames.find((s) => /food|item|menu/i.test(s));
    const rmSheet = sheetNames.find((s) => /raw|material|ingredient/i.test(s));
    const recipeSheet = sheetNames.find((s) => /recipe|mapping|calc/i.test(s));

    // Import food items
    if (foodSheet) {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[foodSheet]);
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const name = (row.name || row.Name || row.item || row.Item || '').toString().trim();
          if (!name) {
            summary.foodItems.errors.push(`Row ${i + 2}: Missing name`);
            summary.foodItems.skipped++;
            continue;
          }

          const existing = await FoodItem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
          if (existing) {
            summary.foodItems.skipped++;
            continue;
          }

          await FoodItem.create({
            name,
            category: normalizeCategory(row.category || row.Category, CATEGORY_MAP),
            description: row.description || row.Description || '',
            pricePerPlate: parseFloat(row.price || row.Price || row.pricePerPlate || 0) || 0,
            unit: normalizeUnit(row.unit || row.Unit),
            isAvailable: true,
            createdBy: userId,
          });
          summary.foodItems.imported++;
        } catch (error) {
          summary.foodItems.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    }

    // Import raw materials
    if (rmSheet) {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[rmSheet]);
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const name = (row.name || row.Name || row.material || row.Material || '').toString().trim();
          if (!name) {
            summary.rawMaterials.errors.push(`Row ${i + 2}: Missing name`);
            summary.rawMaterials.skipped++;
            continue;
          }

          const existing = await RawMaterial.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
          if (existing) {
            summary.rawMaterials.skipped++;
            continue;
          }

          await RawMaterial.create({
            name,
            category: normalizeCategory(row.category || row.Category, RM_CATEGORY_MAP),
            unit: normalizeUnit(row.unit || row.Unit),
            currentStock: parseFloat(row.stock || row.Stock || row.quantity || 0) || 0,
            minimumStock: parseFloat(row.minStock || row.MinStock || row.minimum || 0) || 0,
            costPerUnit: parseFloat(row.cost || row.Cost || row.price || 0) || 0,
            createdBy: userId,
          });
          summary.rawMaterials.imported++;
        } catch (error) {
          summary.rawMaterials.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    }

    // Import recipes/mappings
    if (recipeSheet) {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[recipeSheet]);
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const foodItemName = (row.foodItem || row.FoodItem || row.item || '').toString().trim();
          const rawMaterialName = (row.rawMaterial || row.RawMaterial || row.material || '').toString().trim();

          if (!foodItemName || !rawMaterialName) {
            summary.recipes.errors.push(`Row ${i + 2}: Missing food item or raw material name`);
            summary.recipes.skipped++;
            continue;
          }

          const foodItem = await FoodItem.findOne({ name: { $regex: new RegExp(`^${foodItemName}$`, 'i') } });
          const rawMaterial = await RawMaterial.findOne({ name: { $regex: new RegExp(`^${rawMaterialName}$`, 'i') } });

          if (!foodItem || !rawMaterial) {
            summary.recipes.errors.push(`Row ${i + 2}: Food item or raw material not found`);
            summary.recipes.skipped++;
            continue;
          }

          const existing = await Recipe.findOne({ foodItem: foodItem._id, rawMaterial: rawMaterial._id });
          if (existing) {
            summary.recipes.skipped++;
            continue;
          }

          await Recipe.create({
            foodItem: foodItem._id,
            rawMaterial: rawMaterial._id,
            quantityPerAdult: parseFloat(row.quantityPerAdult || row.qtyPerAdult || row.qty || 0) || 0,
            quantityPerKid: parseFloat(row.quantityPerKid || row.qtyPerKid || 0) || 0,
            unit: normalizeUnit(row.unit || row.Unit || rawMaterial.unit),
            createdBy: userId,
          });
          summary.recipes.imported++;
        } catch (error) {
          summary.recipes.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    }

    // If no named sheets found, try to parse first sheet as food items
    if (!foodSheet && !rmSheet && !recipeSheet && sheetNames.length > 0) {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
      logger.info(`No named sheets found, parsing first sheet "${sheetNames[0]}" with ${data.length} rows`);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const name = (Object.values(row)[0] || '').toString().trim();
          if (!name) continue;

          const existing = await FoodItem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
          if (existing) { summary.foodItems.skipped++; continue; }

          await FoodItem.create({
            name,
            category: 'other',
            isAvailable: true,
            createdBy: userId,
          });
          summary.foodItems.imported++;
        } catch (error) {
          summary.foodItems.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    }

    // Clean up temp file
    fs.unlink(filePath, () => {});

    logger.info('Excel import summary:', summary);
    return { success: true, summary };
  } catch (error) {
    logger.error(`Excel import failed: ${error.message}`);
    throw error;
  }
};

module.exports = { importExcel };
