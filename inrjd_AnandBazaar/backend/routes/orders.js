const router = require('express').Router();
const { createOrder, getOrders, getOrder, updateOrder, approveOrder, changeStatus } = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, orderRules, mongoIdParam } = require('../middleware/validate');

router.post('/', optionalAuth, orderRules, validate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, mongoIdParam, validate, getOrder);
router.put('/:id', authenticate, authorize('admin'), mongoIdParam, validate, updateOrder);
router.patch('/:id/approve', authenticate, authorize('admin'), mongoIdParam, validate, approveOrder);
router.patch('/:id/status', authenticate, authorize('admin'), mongoIdParam, validate, changeStatus);

module.exports = router;
