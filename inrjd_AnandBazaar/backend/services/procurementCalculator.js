const Recipe = require('../models/Recipe');
const RawMaterial = require('../models/RawMaterial');
const logger = require('../utils/logger');

/**
 * Calculate raw material requirements for an order's items.
 * @param {Array} orderItems - Array of { foodItem, quantity }
 * @param {Number} adults - number of adults
 * @param {Number} kids - number of kids
 * @returns {Array} - Array of { rawMaterial, requiredQuantity, currentStock, shortage, unit, name }
 */
const calculateRequirements = async (orderItems, adults = 0, kids = 0) => {
  const requirements = {};

  for (const item of orderItems) {
    const recipes = await Recipe.find({ foodItem: item.foodItem }).populate('rawMaterial');

    for (const recipe of recipes) {
      const rmId = recipe.rawMaterial._id.toString();
      const qty = (recipe.quantityPerAdult * adults) + (recipe.quantityPerKid * kids);

      if (!requirements[rmId]) {
        requirements[rmId] = {
          rawMaterial: recipe.rawMaterial._id,
          name: recipe.rawMaterial.name,
          unit: recipe.rawMaterial.unit,
          requiredQuantity: 0,
          currentStock: recipe.rawMaterial.currentStock,
        };
      }
      requirements[rmId].requiredQuantity += qty * (item.quantity || 1);
    }
  }

  // Calculate shortages
  return Object.values(requirements).map((r) => ({
    ...r,
    shortage: Math.max(0, r.requiredQuantity - r.currentStock),
  }));
};

module.exports = { calculateRequirements };
