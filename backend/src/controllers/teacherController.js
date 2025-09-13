const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { createUserFromRegistration } = require('../utils/createUserFromRegistration');
const { sendEmailOTP, sendPhoneOTP, verifyEmailOTP, verifyPhoneOTP } = require('./otpController');
const { generateToken, store, retrieve, update, remove } = require('../utils/tempStorage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register teacher step 1 (basic details)
const registerStep1 = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      countryCode,
      emailAddress,
      country,
      city,
      pincode
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !emailAddress || !country || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      emailAddress: emailAddress.toLowerCase()
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Generate registration token
    const registrationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store step 1 data in temporary storage
    const step1Data = {
      fullName,
      phoneNumber,
      countryCode,
      emailAddress: emailAddress.toLowerCase(),
      country,
      city,
      pincode,
      step: 1,
      timestamp: new Date()
    };

    // Store data with registration token as key
    store(registrationToken, step1Data);

    res.status(200).json({
      success: true,
      message: 'Teacher basic details saved successfully',
      data: {
        step: 1,
        nextStep: 'professional_details',
        registrationToken
      }
    });

  } catch (error) {
    console.error('Teacher step 1 registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register teacher step 1',
      error: error.message
    });
  }
};

// Register teacher step 2 (professional details)
const registerStep2 = async (req, res) => {
  try {
    const {
      subjects,
      role,
      affiliationType,
      experienceLevel,
      currentInstitution,
      yearsOfExperience,
      registrationToken
    } = req.body;

    // Validate required fields
    if (!subjects || !role || !affiliationType || !registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Retrieve step 1 data using registration token
    const step1Data = retrieve(registrationToken);
    if (!step1Data) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

    // Store step 2 data
    const step2Data = {
      subjects,
      role,
      affiliationType,
      experienceLevel,
      currentInstitution,
      yearsOfExperience,
      step: 2,
      timestamp: new Date()
    };

    // Update stored data with step 2 information
    const updatedData = {
      ...step1Data,
      ...step2Data
    };
    store(registrationToken, updatedData);

    res.status(200).json({
      success: true,
      message: 'Professional details saved successfully',
      data: {
        step: 2,
        nextStep: 'organization_link',
        registrationToken
      }
    });

  } catch (error) {
    console.error('Teacher step 2 registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register teacher step 2',
      error: error.message
    });
  }
};

// Register teacher step 3 (organization link)
const registerStep3 = async (req, res) => {
  try {
    const {
      organizationCode,
      registrationToken
    } = req.body;

    // Retrieve registration data
    const registrationData = retrieve(registrationToken);
    if (!registrationData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

    let organizationInfo = null;
    let isOrganizationValid = false;

    // If organization code is provided, validate it
    if (organizationCode) {
      const organization = await Organization.findOne({
        orgCode: organizationCode.toUpperCase(),
        status: 'active'
      });

      if (organization) {
        organizationInfo = {
          organizationId: organization._id,
          organizationName: organization.name,
          organizationCode: organization.orgCode
        };
        isOrganizationValid = true;
      }
    }

    // Store step 3 data
    const step3Data = {
      organizationCode: organizationCode || '',
      organizationId: organizationInfo?.organizationId || null,
      organizationName: organizationInfo?.organizationName || '',
      isOrganizationValid,
      step: 3,
      timestamp: new Date()
    };

    // Update stored data with step 3 information
    const updatedData = {
      ...registrationData,
      ...step3Data
    };
    store(registrationToken, updatedData);

    res.status(200).json({
      success: true,
      message: 'Organization link processed successfully',
      data: {
        step: 3,
        nextStep: 'security_verification',
        registrationToken,
        organizationInfo: organizationInfo || null,
        isOrganizationValid
      }
    });

  } catch (error) {
    console.error('Teacher step 3 registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process organization link',
      error: error.message
    });
  }
};

// Complete teacher registration (step 4)
const registerStep4 = async (req, res) => {
  try {
    const {
      password,
      confirmPassword,
      emailVerified = false,
      phoneVerified = false,
      registrationToken
    } = req.body;

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Retrieve all registration data
    const registrationData = retrieve(registrationToken);
    if (!registrationData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

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

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      emailAddress: registrationData.emailAddress
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Create teacher
    const teacher = new Teacher({
      fullName: registrationData.fullName,
      phoneNumber: `${registrationData.countryCode}${registrationData.phoneNumber}`,
      emailAddress: registrationData.emailAddress,
      country: registrationData.country,
      city: registrationData.city,
      pincode: registrationData.pincode,
      subjects: registrationData.subjects,
      role: registrationData.role,
      affiliationType: registrationData.affiliationType,
      experienceLevel: registrationData.experienceLevel,
      currentInstitution: registrationData.currentInstitution,
      yearsOfExperience: registrationData.yearsOfExperience,
      organizationId: registrationData.organizationId,
      organizationName: registrationData.organizationName,
      password: password, // Include password - will be hashed by middleware
      status: 'active',
      emailVerified,
      phoneVerified
    });

    await teacher.save();

    // Create teacher user
    const teacherUser = new User({
      name: registrationData.fullName,
      email: registrationData.emailAddress,
      password: hashedPassword,
      userType: 'teacher',
      userId: teacher._id,
      userModel: 'Teacher',
      userTypeEmail: `teacher_${registrationData.emailAddress}`,
      authProvider: 'local',
      emailVerified,
      phoneVerified,
      isActive: true
    });

    await teacherUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: teacherUser._id, 
        email: teacherUser.email, 
        userType: teacherUser.userType,
        teacherId: teacher._id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Clean up temporary data
    remove(registrationToken);

    res.status(200).json({
      success: true,
      message: 'Teacher registered successfully!',
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailAddress: teacher.emailAddress,
          subjects: teacher.subjects,
          role: teacher.role,
          organizationName: teacher.organizationName,
          status: teacher.status
        },
        user: {
          id: teacherUser._id,
          name: teacherUser.name,
          email: teacherUser.email,
          userType: 'teacher',
          emailVerified: teacherUser.emailVerified,
          phoneVerified: teacherUser.phoneVerified
        },
        token,
        nextSteps: [
          'Complete your profile setup',
          'Connect with your organization',
          'Start creating assessments'
        ]
      }
    });

  } catch (error) {
    console.error('Complete teacher registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete teacher registration',
      error: error.message
    });
  }
};

// Register teacher (legacy single-step registration - kept for backward compatibility)
const registerTeacher = async (req, res) => {
  try {
    const teacherData = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      emailAddress: teacherData.emailAddress.toLowerCase()
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // If organization code is provided, validate it
    if (teacherData.organizationCode) {
      const organization = await Organization.findOne({
        orgCode: teacherData.organizationCode.toUpperCase(),
        status: 'active'
      });

      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Invalid organization code'
        });
      }

      teacherData.organizationId = organization._id;
      teacherData.organizationName = organization.name;
      teacherData.isOrganizationValid = true;
    }

    // Create teacher
    const teacher = new Teacher(teacherData);
    await teacher.save();

    // Create user record
    try {
      const teacherUser = await createUserFromRegistration({
        email: teacherData.emailAddress.toLowerCase(),
        password: teacherData.password,
        userType: 'teacher',
        userId: teacher._id,
        userModel: 'Teacher',
        profile: {
          firstName: teacherData.fullName.split(' ')[0] || teacherData.fullName,
          lastName: teacherData.fullName.split(' ').slice(1).join(' ') || ''
        }
      });

      console.log('✅ Teacher user created:', teacherUser._id);
    } catch (userError) {
      console.error('❌ Error creating teacher user:', userError);
      // Don't fail the teacher creation if user creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailAddress: teacher.emailAddress,
          subjects: teacher.subjects,
          role: teacher.role,
          organizationName: teacher.organizationName
        }
      }
    });

  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register teacher',
      error: error.message
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailAddress: teacher.emailAddress,
          phoneNumber: teacher.phoneNumber,
          subjects: teacher.subjects,
          role: teacher.role,
          organizationName: teacher.organizationName,
          yearsOfExperience: teacher.yearsOfExperience,
          status: teacher.status
        }
      }
    });

  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher',
      error: error.message
    });
  }
};

// Get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const { organizationId, status } = req.query;
    
    let query = {};
    if (organizationId) {
      query.organizationId = organizationId;
    }
    if (status) {
      query.status = status;
    }

    const teachers = await Teacher.find(query)
      .select('fullName emailAddress subjects role organizationName yearsOfExperience status')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: {
        teachers
      }
    });

  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teachers',
      error: error.message
    });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.emailAddress;
    delete updateData.password;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailAddress: teacher.emailAddress,
          subjects: teacher.subjects,
          role: teacher.role,
          organizationName: teacher.organizationName,
          status: teacher.status
        }
      }
    });

  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher',
      error: error.message
    });
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { status: 'inactive' },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });

  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete teacher',
      error: error.message
    });
  }
};

// Send Email OTP for Teacher Registration
const sendEmailOTPForTeacher = async (req, res) => {
  try {
    const { emailAddress, registrationToken } = req.body;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
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

    // If registration token is provided, validate it exists
    if (registrationToken) {
      const registrationData = retrieve(registrationToken);
      if (!registrationData) {
        return res.status(400).json({
          success: false,
          message: 'Registration session not found or expired'
        });
      }
      
      // Use email from registration data
      const emailToVerify = registrationData.emailAddress || emailAddress;
      
      // Check if email already exists
      const existingTeacher = await Teacher.findOne({ 
        emailAddress: emailToVerify.toLowerCase() 
      });
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Email address already registered'
        });
      }

      // Send OTP using centralized controller
      const result = await sendEmailOTP(emailToVerify, 'teacher_registration');
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Email OTP sent successfully',
          data: {
            email: emailToVerify,
            message: 'Please check your email for the OTP code'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to send email OTP'
        });
      }
    } else {
      // Fallback for direct email verification without registration token
      const existingTeacher = await Teacher.findOne({ 
        emailAddress: emailAddress.toLowerCase() 
      });
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Email address already registered'
        });
      }

      // Send OTP using centralized controller
      const result = await sendEmailOTP(emailAddress, 'teacher_registration');
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Email OTP sent successfully',
          data: {
            email: emailAddress,
            message: 'Please check your email for the OTP code'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to send email OTP'
        });
      }
    }

  } catch (error) {
    console.error('Error in sendEmailOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email OTP',
      error: error.message
    });
  }
};

// Send Phone OTP for Teacher Registration
const sendPhoneOTPForTeacher = async (req, res) => {
  try {
    const { phoneNumber, countryCode, registrationToken } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and country code are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // If registration token is provided, validate it exists
    if (registrationToken) {
      const registrationData = retrieve(registrationToken);
      if (!registrationData) {
        return res.status(400).json({
          success: false,
          message: 'Registration session not found or expired'
        });
      }
      
      // Use phone from registration data if available
      const phoneToVerify = `${registrationData.countryCode || countryCode}${registrationData.phoneNumber || phoneNumber}`;
      
      // Check if phone already exists
      const existingTeacher = await Teacher.findOne({ 
        phoneNumber: phoneToVerify 
      });
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }

      // Send OTP using centralized controller
      const result = await sendPhoneOTP(phoneToVerify, 'teacher_registration');
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Phone OTP sent successfully',
          data: {
            phone: phoneToVerify,
            message: 'Please check your phone for the OTP code'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to send phone OTP'
        });
      }
    } else {
      // Fallback for direct phone verification without registration token
      const existingTeacher = await Teacher.findOne({ 
        phoneNumber: fullPhoneNumber 
      });
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }

      // Send OTP using centralized controller
      const result = await sendPhoneOTP(fullPhoneNumber, 'teacher_registration');
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Phone OTP sent successfully',
          data: {
            phone: fullPhoneNumber,
            message: 'Please check your phone for the OTP code'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to send phone OTP'
        });
      }
    }

  } catch (error) {
    console.error('Error in sendPhoneOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone OTP',
      error: error.message
    });
  }
};

// Verify Email OTP for Teacher Registration
const verifyEmailOTPForTeacher = async (req, res) => {
  try {
    const { emailOTP, emailAddress } = req.body;

    if (!emailOTP || !emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email OTP and email address are required'
      });
    }

    // Verify OTP using centralized controller
    const result = await verifyEmailOTP(emailAddress, emailOTP, 'teacher_registration');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email OTP verified successfully',
        data: {
          email: emailAddress,
          verified: true
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired OTP'
      });
    }

  } catch (error) {
    console.error('Error in verifyEmailOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: error.message
    });
  }
};

// Verify Phone OTP for Teacher Registration
const verifyPhoneOTPForTeacher = async (req, res) => {
  try {
    const { phoneOTP, phoneNumber, countryCode } = req.body;

    if (!phoneOTP || !phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone OTP, phone number and country code are required'
      });
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // Verify OTP using centralized controller
    const result = await verifyPhoneOTP(fullPhoneNumber, phoneOTP, 'teacher_registration');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Phone OTP verified successfully',
        data: {
          phone: fullPhoneNumber,
          verified: true
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired OTP'
      });
    }

  } catch (error) {
    console.error('Error in verifyPhoneOTPForTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: error.message
    });
  }
};

module.exports = {
  // Multi-step registration functions
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  // Legacy single-step registration
  registerTeacher,
  // CRUD operations
  getTeacherById,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  // OTP functions
  sendEmailOTPForTeacher,
  sendPhoneOTPForTeacher,
  verifyEmailOTPForTeacher,
  verifyPhoneOTPForTeacher
};