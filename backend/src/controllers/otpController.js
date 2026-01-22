const OtpService = require('../services/OtpService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// Generate OTP (helper function - kept for backward compatibility)
const generateOTP = () => {
  return OtpService.generateOTP();
};

// Send Email OTP (helper function - kept for backward compatibility)
const sendEmailOTP = async (email, purpose = 'verification') => {
  try {
    return await OtpService.sendEmailOTP(email, purpose);
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Send Phone OTP (helper function - kept for backward compatibility)
const sendPhoneOTP = async (phoneNumber, purpose = 'verification') => {
  try {
    return await OtpService.sendPhoneOTP(phoneNumber, purpose);
  } catch (error) {
    if (error instanceof AppError) {
      // Handle specific Twilio errors
      if (error.message.includes('Twilio')) {
        return {
          success: false,
          message: error.message,
          error: 'UNVERIFIED_NUMBER'
        };
      }
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to send OTP', error: error.message };
  }
};

// Verify Email OTP (helper function - kept for backward compatibility)
const verifyEmailOTP = async (email, otpCode, purpose = 'verification') => {
  try {
    return await OtpService.verifyEmailOTPLegacy(email, otpCode, purpose);
  } catch (error) {
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Verify Phone OTP (helper function - kept for backward compatibility)
const verifyPhoneOTP = async (phoneNumber, otpCode, purpose = 'verification') => {
  try {
    return await OtpService.verifyPhoneOTPLegacy(phoneNumber, otpCode, purpose);
  } catch (error) {
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Clean up expired OTPs (helper function - kept for backward compatibility)
const cleanupExpiredOTPs = async () => {
  return await OtpService.cleanupExpiredOTPs();
};

// Run cleanup every hour
setInterval(cleanupExpiredOTPs, 3600000);

// Organization-specific OTP functions (API routes)
const sendEmailOTPForOrganization = asyncWrapper(async (req, res) => {
  const { email, registrationToken, purpose = 'registration' } = req.body;

  if (!email) {
    throw AppError.badRequest('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw AppError.badRequest('Invalid email format');
  }

  // If registrationToken is provided (for registration flow), validate it exists
  if (registrationToken && purpose === 'registration') {
    const { retrieve } = require('../utils/tempStorage');
    const registrationData = retrieve(registrationToken);
    if (!registrationData) {
      throw AppError.badRequest('Registration session not found or expired. Please start registration again.');
    }
  }

  // Check if email is already registered (only for registration purpose)
  if (purpose === 'registration') {
    const UserRepository = require('../repositories/UserRepository');
    const existingUser = await UserRepository.findOne({
      email: email.toLowerCase(),
      userType: 'organization_admin'
    });

    if (existingUser) {
      throw AppError.badRequest('An account with this email already exists. Please use a different email address.');
    }
  }

  // Use dedicated organization OTP email method - NO FALLBACK
  console.log('========================================');
  console.log('📧 [ORGANIZATION OTP CONTROLLER] Route: /auth/send-email-otp');
  console.log('📧 [ORGANIZATION OTP CONTROLLER] Calling sendOrganizationOtpEmail');
  console.log('📧 [ORGANIZATION OTP CONTROLLER] Email:', email);
  console.log('📧 [ORGANIZATION OTP CONTROLLER] Has registrationToken:', !!registrationToken);
  console.log('📧 [ORGANIZATION OTP CONTROLLER] Purpose:', purpose);
  console.log('========================================');
  
  const result = await OtpService.sendOrganizationOtpEmail(email, registrationToken, purpose);
  
  console.log('✅ [ORGANIZATION OTP CONTROLLER] Result:', result);

  return sendSuccess(res, result, result.message || 'OTP sent successfully', 200);
});

const verifyEmailOTPForOrganization = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw AppError.badRequest('Email and OTP are required');
  }

  // Convert email to lowercase for consistency
  const normalizedEmail = email.toLowerCase();
  const result = await OtpService.verifyEmailOTPLegacy(normalizedEmail, otp, 'registration');

  if (result.success) {
    return sendSuccess(res, result, result.message || 'OTP verified successfully', 200);
  } else {
    throw AppError.badRequest(result.message || 'Invalid or expired OTP');
  }
});

const sendPhoneOTPForOrganization = asyncWrapper(async (req, res) => {
  const { phone, countryCode = '+91', purpose = 'registration' } = req.body;

  if (!phone) {
    throw AppError.badRequest('Phone number is required');
  }

  const fullPhoneNumber = countryCode + phone;
  const result = await OtpService.sendPhoneOTP(fullPhoneNumber, purpose);

  return sendSuccess(res, result, result.message || 'OTP sent successfully', 200);
});

const verifyPhoneOTPForOrganization = asyncWrapper(async (req, res) => {
  const { phone, countryCode = '+91', otp } = req.body;

  if (!phone || !otp) {
    throw AppError.badRequest('Phone number and OTP are required');
  }

  const fullPhoneNumber = countryCode + phone;
  const result = await OtpService.verifyPhoneOTPLegacy(fullPhoneNumber, otp, 'registration');

  if (result.success) {
    return sendSuccess(res, result, result.message || 'OTP verified successfully', 200);
  } else {
    throw AppError.badRequest(result.message || 'Invalid or expired OTP');
  }
});

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendPhoneOTP,
  verifyEmailOTP,
  verifyPhoneOTP,
  cleanupExpiredOTPs,
  // Organization-specific functions
  sendEmailOTPForOrganization,
  verifyEmailOTPForOrganization,
  sendPhoneOTPForOrganization,
  verifyPhoneOTPForOrganization
};
