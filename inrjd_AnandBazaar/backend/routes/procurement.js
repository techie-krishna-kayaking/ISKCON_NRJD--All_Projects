const router = require('express').Router();
const { getProcurements, getProcurement, createProcurement, updateProcurementStatus, updateProcurementItem, completeProcurement } = require('../controllers/procurementController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, mongoIdParam } = require('../middleware/validate');

router.get('/', authenticate, authorize('admin', 'procurement'), getProcurements);
router.get('/:id', authenticate, authorize('admin', 'procurement'), mongoIdParam, validate, getProcurement);
router.post('/', authenticate, authorize('admin', 'procurement'), createProcurement);
router.patch('/:id/status', authenticate, authorize('admin', 'procurement'), mongoIdParam, validate, updateProcurementStatus);
router.put('/:id/items/:itemId', authenticate, authorize('admin', 'procurement'), updateProcurementItem);
router.put('/:id/complete', authenticate, authorize('admin', 'procurement'), completeProcurement);

module.exports = router;
