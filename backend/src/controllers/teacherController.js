const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');
const { store, retrieve, update, remove } = require('../utils/tempStorage');
const { sendEmailOTP } = require('../services/emailService');
const { sendPhoneOTP, verifyPhoneOTP } = require('../services/twilioService');

// Step 1: Basic Details
const registerStep1 = async (req, res) => {
  try {
    const { fullName, phoneNumber, countryCode, emailAddress, country, city, pincode } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !emailAddress || !country || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if email already exists
    const existingTeacher = await Teacher.findOne({ emailAddress });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Email address already registered'
      });
    }

    // Store step 1 data in temporary storage
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const step1Data = {
      fullName,
      phoneNumber,
      countryCode: countryCode || '+91',
      emailAddress,
      country,
      city,
      pincode
    };

    const existingData = retrieve(sessionId) || {};
    store(sessionId, { ...existingData, step1Data });

    res.json({
      success: true,
      message: 'Basic details saved successfully',
      data: step1Data
    });

  } catch (error) {
    console.error('Error in registerStep1:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Step 2: Professional Details
const registerStep2 = async (req, res) => {
  try {
    const { subjects, role, affiliationType, experienceLevel, currentInstitution, yearsOfExperience } = req.body;

    // Validate required fields
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one subject'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    if (!affiliationType) {
      return res.status(400).json({
        success: false,
        message: 'Affiliation type is required'
      });
    }

    // Validate experience level for freelance teachers
    if (affiliationType === 'freelance' && !experienceLevel) {
      return res.status(400).json({
        success: false,
        message: 'Experience level is required for independent teachers'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    const step2Data = {
      subjects,
      role,
      affiliationType,
      experienceLevel,
      currentInstitution,
      yearsOfExperience
    };

    // Merge with existing data
    store(sessionId, { ...existingData, step2Data });

    res.json({
      success: true,
      message: 'Professional details saved successfully',
      data: step2Data
    });

  } catch (error) {
    console.error('Error in registerStep2:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Step 3: Organization Link
const registerStep3 = async (req, res) => {
  try {
    const { organizationCode } = req.body;

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    if (!existingData.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete previous steps first'
      });
    }

    // Skip organization validation for freelance teachers
    if (existingData.step2Data.affiliationType === 'freelance') {
      const step3Data = {
        organizationCode: '',
        organizationName: '',
        organizationId: null,
        isOrganizationValid: true,
        associationStatus: 'freelance'
      };

      store(sessionId, { ...existingData, step3Data });

      return res.json({
        success: true,
        message: 'Independent teacher setup completed',
        data: step3Data
      });
    }

    // Validate organization code for organization teachers
    if (!organizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Organization code is required'
      });
    }

    // Find organization by code
    const organization = await Organization.findOne({ 
      orgCode: organizationCode.toUpperCase() 
    });

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found',
        data: {
          organizationCode,
          organizationName: '',
          organizationId: null,
          isOrganizationValid: false,
          associationStatus: 'not_found'
        }
      });
    }

    const step3Data = {
      organizationCode: organizationCode.toUpperCase(),
      organizationName: organization.name,
      organizationId: organization._id,
      isOrganizationValid: true,
      associationStatus: 'verified'
    };

    store(sessionId, { ...existingData, step3Data });

    res.json({
      success: true,
      message: 'Organization linked successfully',
      data: step3Data
    });

  } catch (error) {
    console.error('Error in registerStep3:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send Email OTP
const sendEmailOTPForTeacher = async (req, res) => {
  try {
    const { emailAddress } = req.body;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    if (!existingData.step1Data || existingData.step1Data.emailAddress !== emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address does not match registration data'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in temporary storage
    const otpData = {
      emailOTP: {
        code: otp,
        expiresAt
      }
    };

    store(sessionId, { ...existingData, ...otpData });

    // Send email OTP
    try {
      await sendEmailOTP(emailAddress, otp);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with registration even if email fails (for development)
    }

    res.json({
      success: true,
      message: 'OTP sent to email successfully'
    });

  } catch (error) {
    console.error('Error in sendEmailOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send Phone OTP
const sendPhoneOTPForTeacher = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and country code are required'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    if (!existingData.step1Data || 
        existingData.step1Data.phoneNumber !== phoneNumber ||
        existingData.step1Data.countryCode !== countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number does not match registration data'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in temporary storage
    const otpData = {
      phoneOTP: {
        code: otp,
        expiresAt
      }
    };

    store(sessionId, { ...existingData, ...otpData });

    // Send phone OTP
    try {
      await sendPhoneOTP(countryCode + phoneNumber, otp);
    } catch (phoneError) {
      console.error('Phone OTP sending failed:', phoneError);
      // Continue with registration even if SMS fails (for development)
    }

    res.json({
      success: true,
      message: 'OTP sent to phone successfully'
    });

  } catch (error) {
    console.error('Error in sendPhoneOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify Email OTP
const verifyEmailOTPForTeacher = async (req, res) => {
  try {
    const { emailOTP } = req.body;

    if (!emailOTP) {
      return res.status(400).json({
        success: false,
        message: 'Email OTP is required'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    if (!existingData.emailOTP) {
      return res.status(400).json({
        success: false,
        message: 'No email OTP found. Please request a new OTP'
      });
    }

    // Check if OTP is expired
    if (new Date() > existingData.emailOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Email OTP has expired. Please request a new OTP'
      });
    }

    // Verify OTP
    if (existingData.emailOTP.code !== emailOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email OTP'
      });
    }

    // Update verification status
    const updatedData = {
      ...existingData,
      emailVerified: true
    };

    tempStorage.set(sessionId, updatedData);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error in verifyEmailOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify Phone OTP
const verifyPhoneOTPForTeacher = async (req, res) => {
  try {
    const { phoneOTP } = req.body;

    if (!phoneOTP) {
      return res.status(400).json({
        success: false,
        message: 'Phone OTP is required'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    if (!existingData.phoneOTP) {
      return res.status(400).json({
        success: false,
        message: 'No phone OTP found. Please request a new OTP'
      });
    }

    // Check if OTP is expired
    if (new Date() > existingData.phoneOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Phone OTP has expired. Please request a new OTP'
      });
    }

    // Verify OTP
    if (existingData.phoneOTP.code !== phoneOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone OTP'
      });
    }

    // Update verification status
    const updatedData = {
      ...existingData,
      phoneVerified: true
    };

    tempStorage.set(sessionId, updatedData);

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });

  } catch (error) {
    console.error('Error in verifyPhoneOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Step 4: Complete Registration
const registerStep4 = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    // Validate password
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    // Check if all previous steps are completed
    if (!existingData.step1Data || !existingData.step2Data || !existingData.step3Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all previous steps first'
      });
    }

    // Check if email and phone are verified
    if (!existingData.emailVerified || !existingData.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify both email and phone before completing registration',
        requiresVerification: {
          email: !existingData.emailVerified,
          phone: !existingData.phoneVerified
        }
      });
    }

    // Create teacher data
    const teacherData = {
      ...existingData.step1Data,
      ...existingData.step2Data,
      ...existingData.step3Data,
      password,
      emailVerified: existingData.emailVerified,
      phoneVerified: existingData.phoneVerified,
      status: 'active'
    };

    // Create teacher
    const teacher = new Teacher(teacherData);
    await teacher.save();

    // Generate teacher code
    const teacherCode = teacher.generateTeacherCode();

    // Clear temporary storage
    remove(sessionId);

    res.json({
      success: true,
      message: 'Teacher registration completed successfully',
      data: {
        teacherId: teacher._id,
        teacherCode,
        email: teacher.emailAddress,
        name: teacher.fullName,
        organizationName: teacher.organizationName,
        affiliationType: teacher.affiliationType
      }
    });

  } catch (error) {
    console.error('Error in registerStep4:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email address already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get teacher registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
    const existingData = retrieve(sessionId) || {};

    res.json({
      success: true,
      data: {
        step1Completed: !!existingData.step1Data,
        step2Completed: !!existingData.step2Data,
        step3Completed: !!existingData.step3Data,
        emailVerified: !!existingData.emailVerified,
        phoneVerified: !!existingData.phoneVerified,
        currentStep: existingData.step1Data ? 
          (existingData.step2Data ? 
            (existingData.step3Data ? 
              (existingData.emailVerified && existingData.phoneVerified ? 4 : 3) : 2) : 1) : 0
      }
    });

  } catch (error) {
    console.error('Error in getRegistrationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerStep1,
  registerStep2,
  registerStep3,
  sendEmailOTPForTeacher,
  sendPhoneOTPForTeacher,
  verifyEmailOTPForTeacher,
  verifyPhoneOTPForTeacher,
  registerStep4,
  getRegistrationStatus
};
