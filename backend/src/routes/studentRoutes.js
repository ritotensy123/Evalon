const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  sendEmailOTPForStudent,
  sendPhoneOTPForStudent,
  verifyEmailOTPForStudent,
  verifyPhoneOTPForStudent,
  getRegistrationStatus
} = require('../controllers/studentController');

// Student Registration Routes

// Step 1: Basic Details
router.post('/register/step1', registerStep1);

// Step 2: Organization Verification
router.post('/register/step2', registerStep2);

// Step 3: Security Verification Status
router.post('/register/step3', registerStep3);

// Step 3: Security Verification - Email OTP
router.post('/send-email-otp', sendEmailOTPForStudent);
router.post('/verify-email-otp', verifyEmailOTPForStudent);

// Step 3: Security Verification - Phone OTP
router.post('/send-phone-otp', sendPhoneOTPForStudent);
router.post('/verify-phone-otp', verifyPhoneOTPForStudent);

// Step 4: Auto Mapping & Complete Registration
router.post('/register/step4', registerStep4);

// Get registration status
router.get('/registration-status', getRegistrationStatus);

module.exports = router;
