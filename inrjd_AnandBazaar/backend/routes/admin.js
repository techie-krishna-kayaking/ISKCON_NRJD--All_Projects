const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const {
  getDashboard, getUsers, createUser, updateUser,
  getAuditLogs, getRecipes, createRecipe, updateRecipe, deleteRecipe,
} = require('../controllers/adminController');
const { importExcel } = require('../utils/excelImporter');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, mongoIdParam } = require('../middleware/validate');

const upload = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel/CSV files are allowed'));
  },
});

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', mongoIdParam, validate, updateUser);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Recipes / mappings
router.get('/recipes', getRecipes);
router.post('/recipes', createRecipe);
router.put('/recipes/:id', mongoIdParam, validate, updateRecipe);
router.delete('/recipes/:id', mongoIdParam, validate, deleteRecipe);

// Excel import
router.post('/import-excel', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await importExcel(req.file.path, req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
