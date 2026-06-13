const router = require('express').Router();
const { getItems, getItem, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, mongoIdParam } = require('../middleware/validate');

router.get('/', getItems);
router.get('/:id', mongoIdParam, validate, getItem);
router.post('/', authenticate, authorize('admin'), createItem);
router.put('/:id', authenticate, authorize('admin'), mongoIdParam, validate, updateItem);
router.delete('/:id', authenticate, authorize('admin'), mongoIdParam, validate, deleteItem);

module.exports = router;
