const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  registerStep3,
  sendEmailOTPForTeacher,
  sendPhoneOTPForTeacher,
  verifyEmailOTPForTeacher,
  verifyPhoneOTPForTeacher,
  registerStep4,
  getRegistrationStatus
} = require('../controllers/teacherController');

// Teacher Registration Routes
router.post('/register/step1', registerStep1);
router.post('/register/step2', registerStep2);
router.post('/register/step3', registerStep3);
router.post('/register/step4', registerStep4);

// OTP Routes
router.post('/send-email-otp', sendEmailOTPForTeacher);
router.post('/send-phone-otp', sendPhoneOTPForTeacher);
router.post('/verify-email-otp', verifyEmailOTPForTeacher);
router.post('/verify-phone-otp', verifyPhoneOTPForTeacher);

// Status Route
router.get('/registration-status', getRegistrationStatus);

module.exports = router;

