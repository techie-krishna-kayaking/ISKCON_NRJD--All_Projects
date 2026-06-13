const router = require('express').Router();
const { getCurrentStock, submitDailyStock, getStockHistory, updateStockEntry, getStockAlerts } = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, stockRules, mongoIdParam } = require('../middleware/validate');

router.get('/', authenticate, authorize('admin', 'stock_team', 'procurement'), getCurrentStock);
router.get('/alerts', authenticate, authorize('admin', 'stock_team'), getStockAlerts);
router.post('/daily', authenticate, authorize('admin', 'stock_team'), stockRules, validate, submitDailyStock);
router.get('/history', authenticate, authorize('admin', 'stock_team'), getStockHistory);
router.put('/:id', authenticate, authorize('admin', 'stock_team'), mongoIdParam, validate, updateStockEntry);

module.exports = router;
