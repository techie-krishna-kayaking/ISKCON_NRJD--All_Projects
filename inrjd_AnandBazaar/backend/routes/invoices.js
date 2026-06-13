const router = require('express').Router();
const { createInvoice, getInvoice, getInvoices } = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, mongoIdParam } = require('../middleware/validate');

router.post('/', authenticate, authorize('admin'), createInvoice);
router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, mongoIdParam, validate, getInvoice);

module.exports = router;
