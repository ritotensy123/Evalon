const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  completeRegistration,
  getOrganizationByCode,
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  upload,
  completeSetup,
  getSetupStatus,
  skipSetup,
  getRegistrationSessionStatus
} = require('../controllers/organizationController');

const {
  sendEmailOTPForOrganization,
  verifyEmailOTPForOrganization,
  sendPhoneOTPForOrganization,
  verifyPhoneOTPForOrganization
} = require('../controllers/otpController');

const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/register/session-status', getRegistrationSessionStatus);
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

// Setup wizard routes
router.post('/complete-setup', completeSetup);
router.get('/:organizationId/setup-status', getSetupStatus);
router.post('/skip-setup', skipSetup);

// Protected routes (require authentication)
router.get('/:orgId', authenticate, getOrganizationById);
router.put('/:orgId', authenticate, updateOrganization);
// router.delete('/:orgId', authenticate, deleteOrganization);

module.exports = router;