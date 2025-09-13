const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  completeRegistration,
  getOrganizationByCode,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  upload
} = require('../controllers/organizationController');

const {
  sendEmailOTPForOrganization,
  verifyEmailOTPForOrganization,
  sendPhoneOTPForOrganization,
  verifyPhoneOTPForOrganization
} = require('../controllers/otpController');

// Public routes
router.post('/register/step1', registerStep1);
router.post('/register/step2', registerStep2);
router.post('/auth/send-email-otp', sendEmailOTPForOrganization);
router.post('/register/verify-email-otp', verifyEmailOTPForOrganization);
router.post('/auth/send-phone-otp', sendPhoneOTPForOrganization);
router.post('/register/verify-phone-otp', verifyPhoneOTPForOrganization);
router.post('/register/step3', completeRegistration);
router.post('/upload/logo', upload.single('file'), uploadLogo);
router.get('/code/:orgCode', getOrganizationByCode);
router.get('/', getAllOrganizations);

// Protected routes (require authentication)
// router.put('/:orgId', auth, updateOrganization);
// router.delete('/:orgId', auth, deleteOrganization);

module.exports = router;