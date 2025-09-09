const Organization = require('../models/Organization');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const { getAuth } = require('../config/firebase');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, store, retrieve, update, remove } = require('../utils/tempStorage');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate unique organization code
const generateOrgCode = (organizationName, country) => {
  // Get country code from form data (first 2 letters of country)
  const countryCode = country ? country.substring(0, 2).toUpperCase() : 'XX';
  
  // Generate 3-letter institution abbreviation from organisation name
  const orgName = organizationName || 'ORG';
  const orgAbbrev = orgName
    .replace(/[^A-Za-z]/g, '') // Remove non-letters
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); // Pad with X if less than 3 characters
  
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Generate 3-character random alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 3 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  
  return `${countryCode}-${orgAbbrev}-${currentYear}-${randomPart}`;
};

// Step 1: Organization Details
const registerStep1 = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      organisationName,
      country,
      state,
      city,
      pincode,
      organisationType,
      studentStrength,
      isGovernmentRecognized
    } = req.body;

    // Check if organization with same name already exists
    const existingOrg = await Organization.findOne({ 
      name: { $regex: new RegExp(organisationName, 'i') } 
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this name already exists'
      });
    }

    // Generate organization code
    let orgCode = generateOrgCode(organisationName, country);
    
    // Check if code already exists (very unlikely but good practice)
    let existingCode = await Organization.findOne({ orgCode });
    while (existingCode) {
      orgCode = generateOrgCode(organisationName, country);
      existingCode = await Organization.findOne({ orgCode });
    }

    // Generate a unique token for this registration session
    const registrationToken = generateToken();
    
    // Store step 1 data in temporary storage
    const step1Data = {
      organisationName,
      country,
      state,
      city,
      pincode,
      organisationType,
      studentStrength,
      isGovernmentRecognized,
      orgCode: orgCode
    };
    
    store(registrationToken, { step1Data });

    res.status(200).json({
      success: true,
      message: 'Organization details saved successfully',
      data: {
        orgCode,
        step: 1,
        nextStep: 'admin_details',
        registrationToken // Send token to client for subsequent requests
      }
    });

  } catch (error) {
    console.error('Error in registerStep1:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Step 2: Admin Details with OTP Verification
const registerStep2 = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors in registerStep2:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      adminName,
      adminEmail,
      adminPhone,
      countryCode,
      password,
      confirmPassword,
      registrationToken
    } = req.body;

    console.log('Received registerStep2 data:', {
      adminName,
      adminEmail,
      adminPhone,
      countryCode,
      password: password ? '***' : 'undefined',
      confirmPassword: confirmPassword ? '***' : 'undefined',
      registrationToken
    });

    // Check if step 1 is completed
    const registrationData = retrieve(registrationToken);
    if (!registrationData?.step1Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 1 first'
      });
    }

    // Check if admin email already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'An admin with this email already exists'
      });
    }

    // Check if organization with this email already exists
    const existingOrg = await Organization.findOne({ email: adminEmail });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this email already exists'
      });
    }

    // Hash password only if provided, otherwise generate a temporary one
    let hashedPassword = null;
    if (password && password !== 'undefined' && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 12);
    } else {
      // Generate a temporary password if none provided
      const tempPassword = `TempPass${Date.now()}`;
      hashedPassword = await bcrypt.hash(tempPassword, 12);
    }

    // Get existing step2Data if it exists
    const existingData = retrieve(registrationToken);
    const existingStep2Data = existingData?.step2Data || {};
    
    // Store step 2 data in temporary storage, merging with existing data
    const step2Data = {
      ...existingStep2Data, // Preserve existing data (including verification status)
      adminName,
      adminEmail,
      adminPhone,
      countryCode,
      password: hashedPassword,
      // Only set verification flags to false if they don't already exist
      emailVerified: existingStep2Data.emailVerified || false,
      phoneVerified: existingStep2Data.phoneVerified || false
    };
    
    update(registrationToken, { step2Data });

    res.status(200).json({
      success: true,
      message: 'Admin details saved successfully',
      data: {
        step: 2,
        nextStep: 'otp_verification',
        email: adminEmail,
        phone: `${countryCode}${adminPhone}`,
        requiresVerification: {
          email: true,
          phone: true
        },
        registrationToken
      }
    });

  } catch (error) {
    console.error('Error in registerStep2:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Verify Email OTP for Organization Registration
const verifyEmailOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, registrationToken } = req.body;

    // Check if registration token is provided
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get registration data from temporary storage
    const registrationData = retrieve(registrationToken);
    if (!registrationData || !registrationData.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 2 first'
      });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
      email,
      type: 'email',
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email or OTP already verified'
      });
    }

    try {
      await otpRecord.verifyOTP(otp);
      
      // Update registration data in temporary storage
      const updateResult = update(registrationToken, { 
        step2Data: { 
          ...registrationData.step2Data, 
          emailVerified: true 
        } 
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email,
          verified: true,
          nextStep: registrationData.step2Data.phoneVerified ? 'setup_preferences' : 'phone_verification'
        }
      });

    } catch (verifyError) {
      res.status(400).json({
        success: false,
        message: verifyError.message
      });
    }

  } catch (error) {
    console.error('Error in verifyEmailOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Verify Phone OTP for Organization Registration
const verifyPhoneOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, countryCode, otp, registrationToken } = req.body;

    // Check if registration token is provided
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get registration data from temporary storage
    const registrationData = retrieve(registrationToken);
    if (!registrationData || !registrationData.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 2 first'
      });
    }

    const fullPhoneNumber = `${countryCode}${phone}`;

    // Use Twilio Verify API for phone OTP verification
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services('VA3f3539548e41c1b6def2b7b85ca2a3e9')
        .verificationChecks
        .create({
          to: fullPhoneNumber,
          code: otp
        });

      if (verificationCheck.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP or OTP expired'
        });
      }
      
      // Update registration data in temporary storage
      const updateResult = update(registrationToken, { 
        step2Data: { 
          ...registrationData.step2Data, 
          phoneVerified: true 
        } 
      });

      res.status(200).json({
        success: true,
        message: 'Phone verified successfully',
        data: {
          phone: fullPhoneNumber,
          verified: true,
          nextStep: registrationData.step2Data.emailVerified ? 'setup_preferences' : 'email_verification'
        }
      });

    } catch (twilioError) {
      console.error('Twilio verification error:', twilioError);
      res.status(400).json({
        success: false,
        message: 'Failed to verify phone OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Error in verifyPhoneOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Step 3: Setup Preferences and Complete Registration
const registerStep3 = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      institutionStructure,
      departments,
      addSubAdmins,
      timeZone,
      twoFactorAuth,
      logo,
      registrationToken
    } = req.body;

    // Check if registration token is provided
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get data from previous steps using tempStorage
    const registrationData = retrieve(registrationToken);
    if (!registrationData || !registrationData.step1Data || !registrationData.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Previous steps not completed. Please start from step 1.'
      });
    }

    const step1Data = registrationData.step1Data;
    const step2Data = registrationData.step2Data;



    // Check if both email and phone are verified
    if (!step2Data.emailVerified || !step2Data.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify both email and phone before completing registration',
        requiresVerification: {
          email: !step2Data.emailVerified,
          phone: !step2Data.phoneVerified
        }
      });
    }

    // Start database transaction
    const session = await Organization.startSession();
    session.startTransaction();

    try {
      // Create organization
      const organization = new Organization({
        name: step1Data.organisationName,
        email: step2Data.adminEmail,
        phone: step2Data.adminPhone,
        address: {
          street: 'Not provided', // Default value since not collected in current form
          city: step1Data.city,
          state: step1Data.state,
          zipCode: step1Data.pincode,
          country: step1Data.country
        },
        website: '', // Not collected in current form
        description: `${step1Data.organisationType} institution`,
        foundedYear: new Date().getFullYear(),
        studentCount: parseInt(step1Data.studentStrength) || 0,
        teacherCount: 0,
        status: 'active',
        orgCode: step1Data.orgCode,
        institutionStructure,
        departments: departments || [],
        timeZone,
        twoFactorAuth: twoFactorAuth || false,
        isGovernmentRecognized: step1Data.isGovernmentRecognized,
        logo: logo || null
      });

      await organization.save({ session });

      // Create admin user
      const [firstName, ...lastNameParts] = step2Data.adminName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const admin = new Admin({
        firstName,
        lastName,
        email: step2Data.adminEmail,
        phone: step2Data.adminPhone,
        countryCode: step2Data.countryCode,
        password: step2Data.password,
        organizationId: organization._id,
        role: 'admin',
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: twoFactorAuth || false,
        status: 'active'
      });

      await admin.save({ session });

      // Generate JWT token for admin
      const token = jwt.sign(
        { 
          adminId: admin._id, 
          organizationId: organization._id,
          role: 'admin',
          email: admin.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Commit transaction
      await session.commitTransaction();

      // Clear temporary storage data
      remove(registrationToken);

      res.status(201).json({
        success: true,
        message: 'Organization registered successfully!',
        data: {
          organization: {
            id: organization._id,
            name: organization.name,
            orgCode: organization.orgCode,
            email: organization.email,
            status: organization.status
          },
          admin: {
            id: admin._id,
            name: admin.fullName,
            email: admin.email,
            role: admin.role,
            emailVerified: admin.emailVerified,
            phoneVerified: admin.phoneVerified
          },
          token,
          nextSteps: [
            'Complete your profile setup',
            'Add your first teachers',
            'Configure your institution settings'
          ]
        }
      });

    } catch (transactionError) {
      // Rollback transaction
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in registerStep3:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get organization by code
const getOrganizationByCode = async (req, res) => {
  try {
    const { orgCode } = req.params;

    const organization = await Organization.findOne({ orgCode })
      .select('-__v')
      .lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error('Error in getOrganizationByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Check if organization code exists
const checkOrgCode = async (req, res) => {
  try {
    const { orgCode } = req.params;

    const organization = await Organization.findOne({ orgCode });
    
    res.status(200).json({
      success: true,
      exists: !!organization,
      message: organization ? 'Organization code exists' : 'Organization code is available'
    });

  } catch (error) {
    console.error('Error in checkOrgCode:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const { registrationToken } = req.query;
    
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }
    
    const registrationData = retrieve(registrationToken);
    
    if (!registrationData) {
      return res.status(404).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        step1Completed: !!registrationData.step1Data,
        step2Completed: !!registrationData.step2Data,
        emailVerified: registrationData.step2Data?.emailVerified || false,
        phoneVerified: registrationData.step2Data?.phoneVerified || false,
        currentStep: registrationData.step1Data ? (registrationData.step2Data ? 3 : 2) : 1,
        orgCode: registrationData.step1Data?.orgCode || null
      }
    });

  } catch (error) {
    console.error('Error in getRegistrationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Clear registration session
const clearRegistrationSession = async (req, res) => {
  try {
    delete req.session.step1Data;
    delete req.session.step2Data;
    
    res.status(200).json({
      success: true,
      message: 'Registration session cleared'
    });

  } catch (error) {
    console.error('Error in clearRegistrationSession:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

module.exports = {
  registerStep1,
  registerStep2,
  registerStep3,
  verifyEmailOTP,
  verifyPhoneOTP,
  getOrganizationByCode,
  checkOrgCode,
  getRegistrationStatus,
  clearRegistrationSession
};