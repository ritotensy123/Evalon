const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/google', authController.googleSignIn);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.put('/complete-first-login', authenticate, authController.completeFirstTimeLogin);
router.get('/verify-token', authenticate, authController.verifyToken);
router.post('/send-verification-email', authenticate, authController.sendEmailVerification);
router.post('/verify-email-otp', authenticate, authController.verifyEmailWithOTP);

module.exports = router;
