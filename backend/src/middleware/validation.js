const { body, param, query } = require('express-validator');

// Organization registration validations
const validateStep1 = [
  body('organisationName')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .isLength({ min: 3, max: 10 })
    .withMessage('Pincode must be between 3 and 10 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Pincode must contain only numbers'),
  
  body('organisationType')
    .trim()
    .notEmpty()
    .withMessage('Organization type is required')
    .isIn(['school', 'college', 'university', 'corporate', 'other'])
    .withMessage('Invalid organization type'),
  
  body('studentStrength')
    .optional()
    .isInt({ min: 1, max: 999999 })
    .withMessage('Student strength must be a number between 1 and 999999'),
  
  body('isGovernmentRecognized')
    .optional()
    .isBoolean()
    .withMessage('Government recognition must be a boolean value')
];

const validateStep2 = [
  body('adminName')
    .trim()
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin name must be between 2 and 100 characters'),
  
  body('adminEmail')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('adminPhone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Phone number must contain only numbers'),
  
  body('countryCode')
    .trim()
    .notEmpty()
    .withMessage('Country code is required')
    .matches(/^\+[1-9]\d{1,3}$/)
    .withMessage('Invalid country code format'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation for Step 2 when sending OTP (password fields optional)
const validateStep2ForOTP = [
  body('adminName')
    .trim()
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin name must be between 2 and 100 characters'),
  
  body('adminEmail')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('adminPhone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Phone number must contain only numbers'),
  
  body('countryCode')
    .trim()
    .notEmpty()
    .withMessage('Country code is required')
    .matches(/^\+[1-9]\d{1,3}$/)
    .withMessage('Invalid country code format'),
  
  body('password')
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.password && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const validateStep3 = [
  body('institutionStructure')
    .trim()
    .notEmpty()
    .withMessage('Institution structure is required')
    .isIn(['single', 'multi'])
    .withMessage('Invalid institution structure'),
  
  body('departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  
  body('departments.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each department name must be between 2 and 50 characters'),
  
  body('addSubAdmins')
    .optional()
    .isBoolean()
    .withMessage('Add sub-admins must be a boolean value'),
  
  body('timeZone')
    .trim()
    .notEmpty()
    .withMessage('Time zone is required')
    .matches(/^UTC[+-]\d{2}:\d{2}$/)
    .withMessage('Invalid time zone format'),
  
  body('twoFactorAuth')
    .optional()
    .isBoolean()
    .withMessage('Two-factor authentication must be a boolean value')
];

// OTP validations
const validateEmailOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'password_reset', 'phone_verification'])
    .withMessage('Invalid OTP purpose')
];

const validatePhoneOTP = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Phone number must contain only numbers'),
  
  body('countryCode')
    .optional()
    .trim()
    .matches(/^\+[1-9]\d{1,3}$/)
    .withMessage('Invalid country code format'),
  
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'password_reset', 'phone_verification'])
    .withMessage('Invalid OTP purpose')
];

const validateOTPVerification = [
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .matches(/^[0-9]{6}$/)
    .withMessage('OTP must contain only numbers')
];

const validateEmailOTPVerification = [
  ...validateOTPVerification,
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
];

const validatePhoneOTPVerification = [
  ...validateOTPVerification,
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Phone number must contain only numbers'),
  
  body('countryCode')
    .optional()
    .trim()
    .matches(/^\+[1-9]\d{1,3}$/)
    .withMessage('Invalid country code format')
];

// Organization code validation
const validateOrgCode = [
  param('orgCode')
    .trim()
    .notEmpty()
    .withMessage('Organization code is required')
    .matches(/^[A-Z]{2}-[A-Z]{3}-\d{4}-[A-Z0-9]{3}$/)
    .withMessage('Invalid organization code format')
];

// File upload validation
const validateFileUpload = [
  body('logo')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, JPG, PNG, and GIF images are allowed');
        }
        
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (req.file.size > maxSize) {
          throw new Error('File size must be less than 2MB');
        }
      }
      return true;
    })
];

module.exports = {
  validateStep1,
  validateStep2,
  validateStep2ForOTP,
  validateStep3,
  validateEmailOTP,
  validatePhoneOTP,
  validateEmailOTPVerification,
  validatePhoneOTPVerification,
  validateOrgCode,
  validateFileUpload
};
