const router = require('express').Router();
const { register, login, requestOTP, verifyOTP, googleLogin, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validate');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);
router.post('/google', googleLogin);
router.get('/me', authenticate, getMe);

module.exports = router;
