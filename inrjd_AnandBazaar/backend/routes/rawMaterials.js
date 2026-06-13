const router = require('express').Router();
const { getRawMaterials, getRawMaterial, createRawMaterial, updateRawMaterial } = require('../controllers/rawMaterialController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, mongoIdParam } = require('../middleware/validate');

router.get('/', authenticate, authorize('admin', 'stock_team', 'procurement'), getRawMaterials);
router.get('/:id', authenticate, mongoIdParam, validate, getRawMaterial);
router.post('/', authenticate, authorize('admin'), createRawMaterial);
router.put('/:id', authenticate, authorize('admin'), mongoIdParam, validate, updateRawMaterial);

module.exports = router;
