const { validationResult, body, param, query } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const orderRules = [
  body('customerEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('customerPhone').trim().notEmpty().withMessage('Phone number is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('numberOfAdults').isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('numberOfKids').optional().isInt({ min: 0 }),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.foodItem').isMongoId().withMessage('Valid food item ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const stockRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one stock item is required'),
  body('items.*.rawMaterial').isMongoId().withMessage('Valid raw material ID required'),
  body('items.*.quantity').isFloat({ min: 0 }).withMessage('Quantity must be 0 or more'),
];

const paymentRules = [
  body('order').isMongoId().withMessage('Valid order ID required'),
  body('invoice').isMongoId().withMessage('Valid invoice ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('mode').isIn(['upi', 'cash']).withMessage('Payment mode must be upi or cash'),
];

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid ID'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  orderRules,
  stockRules,
  paymentRules,
  mongoIdParam,
};
