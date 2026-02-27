const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, googleAuth, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/profile', protect, getUserProfile);

module.exports = router;
