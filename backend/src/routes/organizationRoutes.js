const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const otpController = require('../controllers/otpController');
const { handleUpload, renameFileWithContext } = require('../middleware/upload');
const {
  validateStep1,
  validateStep2,
  validateStep2ForOTP,
  validateStep3,
  validateEmailOTP,
  validatePhoneOTP,
  validateEmailOTPVerification,
  validatePhoneOTPVerification,
  validateOrgCode
} = require('../middleware/validation');

// Organization Registration Routes
router.post('/register/step1', validateStep1, organizationController.registerStep1);
router.post('/register/step2', validateStep2ForOTP, organizationController.registerStep2);
router.post('/register/step3', validateStep3, organizationController.registerStep3);

// Organization Registration OTP Verification Routes
router.post('/register/verify-email-otp', validateEmailOTPVerification, organizationController.verifyEmailOTP);
router.post('/register/verify-phone-otp', validatePhoneOTPVerification, organizationController.verifyPhoneOTP);

// Organization Registration Status Routes
router.get('/register/status', organizationController.getRegistrationStatus);
router.delete('/register/session', organizationController.clearRegistrationSession);

// Organization Information Routes
router.get('/code/:orgCode', validateOrgCode, organizationController.getOrganizationByCode);
router.get('/check-code/:orgCode', validateOrgCode, organizationController.checkOrgCode);

// General OTP Routes (for other purposes)
router.post('/auth/send-email-otp', validateEmailOTP, otpController.sendEmailOTP);
router.post('/auth/verify-email-otp', validateEmailOTPVerification, otpController.verifyEmailOTP);
router.post('/auth/send-phone-otp', validatePhoneOTP, otpController.sendPhoneOTP);
router.post('/auth/verify-phone-otp', validatePhoneOTPVerification, otpController.verifyPhoneOTP);
router.post('/auth/resend-otp', otpController.resendOTP);

// File Upload Routes
router.post('/upload/logo', handleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get organization context
    const orgCode = req.body.orgCode || 'unknown';
    const orgName = req.body.orgName || 'org';
    const fileType = req.body.fileType || 'logo';

    // Rename file with proper organization context
    const renameResult = renameFileWithContext(req.file.path, orgCode, orgName, fileType);
    
    if (!renameResult.success) {
      console.error('Failed to rename file:', renameResult.error);
      // Continue with original filename if rename fails
    }

    const finalFilename = renameResult.success ? renameResult.newFilename : req.file.filename;
    const finalUrl = `/uploads/${finalFilename}`;

    // Log the upload details for debugging
    console.log('Logo uploaded:', {
      originalFilename: req.file.filename,
      finalFilename: finalFilename,
      originalName: req.file.originalname,
      orgCode: orgCode,
      orgName: orgName,
      fileType: fileType,
      renamed: renameResult.success
    });

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        filename: finalFilename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: finalUrl,
        organizationContext: {
          orgCode: orgCode,
          orgName: orgName,
          fileType: fileType
        }
      }
    });
  } catch (error) {
    console.error('Error in logo upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Generic document upload route
router.post('/upload/document', handleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get organization context
    const orgCode = req.body.orgCode || 'unknown';
    const orgName = req.body.orgName || 'org';
    const fileType = req.body.fileType || 'document';
    const documentType = req.body.documentType || 'general';

    // Rename file with proper organization context
    const renameResult = renameFileWithContext(req.file.path, orgCode, orgName, fileType, documentType);
    
    if (!renameResult.success) {
      console.error('Failed to rename file:', renameResult.error);
      // Continue with original filename if rename fails
    }

    const finalFilename = renameResult.success ? renameResult.newFilename : req.file.filename;
    const finalUrl = `/uploads/${finalFilename}`;

    // Log the upload details for debugging
    console.log('Document uploaded:', {
      originalFilename: req.file.filename,
      finalFilename: finalFilename,
      originalName: req.file.originalname,
      orgCode: orgCode,
      orgName: orgName,
      fileType: fileType,
      documentType: documentType,
      renamed: renameResult.success
    });

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        filename: finalFilename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: finalUrl,
        organizationContext: {
          orgCode: orgCode,
          orgName: orgName,
          fileType: fileType,
          documentType: documentType
        }
      }
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;
