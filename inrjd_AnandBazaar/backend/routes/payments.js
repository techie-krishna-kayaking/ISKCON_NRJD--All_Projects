const router = require('express').Router();
const { createPayment, getPaymentsByOrder, getPayments } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, paymentRules, mongoIdParam } = require('../middleware/validate');

router.post('/', authenticate, authorize('admin'), paymentRules, validate, createPayment);
router.get('/', authenticate, authorize('admin'), getPayments);
router.get('/order/:orderId', authenticate, getPaymentsByOrder);

module.exports = router;
