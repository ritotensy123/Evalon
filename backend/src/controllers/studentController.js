const Student = require('../models/Student');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const { generateToken, store, retrieve, update, remove } = require('../utils/tempStorage');
const { sendEmailOTP, sendPhoneOTP, verifyEmailOTP, verifyPhoneOTP } = require('./otpController');

// Step 1: Basic Details
const registerStep1 = async (req, res) => {
  try {
    const { 
      fullName, 
      phoneNumber, 
      countryCode, 
      emailAddress, 
      dateOfBirth, 
      gender, 
      country, 
      city, 
      pincode 
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !emailAddress || !dateOfBirth || !gender || !country || !city || !pincode) {
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

    // Validate date of birth (must be at least 5 years old)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid date format'
      });
    }
    
    if (age < 5 || age > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid date of birth (age must be between 5 and 100 years)'
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ emailAddress });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Email address already registered'
      });
    }

    // Generate a unique token for this registration session
    const registrationToken = generateToken();
    
    // Store step 1 data in temporary storage
    const step1Data = {
      fullName,
      phoneNumber,
      countryCode: countryCode || '+91',
      emailAddress,
      dateOfBirth: birthDate,
      gender,
      country,
      city,
      pincode
    };

    store(registrationToken, { step1Data });

    res.json({
      success: true,
      message: 'Basic details saved successfully',
      data: {
        ...step1Data,
        registrationToken // Send token to client for subsequent requests
      }
    });

  } catch (error) {
    console.error('Error in registerStep1:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Step 2: Organization Verification
const registerStep2 = async (req, res) => {
  try {
    const { organizationCode, registrationToken, registrationType, academicLevel } = req.body;
    
    // Debug logging
    console.log('Step 2 - Registration Type:', registrationType);
    console.log('Step 2 - Organization Code:', organizationCode);
    console.log('Step 2 - Academic Level:', academicLevel);

    // Check if registration token is provided
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get registration data from temporary storage
    const registrationData = retrieve(registrationToken);
    if (!registrationData?.step1Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete step 1 first'
      });
    }

    // Handle standalone registration
    if (registrationType === 'standalone') {
      const step2Data = {
        registrationType: 'standalone',
        isStandalone: true,
        academicLevel: academicLevel || null,
        organizationCode: null,
        organizationName: null,
        isOrganizationValid: false,
        associationStatus: 'standalone'
      };

      // Store step 2 data
      update(registrationToken, { step2Data });

      return res.status(200).json({
        success: true,
        message: 'Standalone registration setup completed',
        data: step2Data
      });
    }

    // Handle organization registration
    if (registrationType === 'organization' && !organizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Organization code is required for organization registration'
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
          organizationCode: organizationCode.toUpperCase(),
          organizationName: '',
          organizationId: null,
          isOrganizationValid: false,
          associationStatus: 'not_found'
        }
      });
    }

    const step2Data = {
      organizationCode: organizationCode.toUpperCase(),
      organizationName: organization.name,
      organizationId: organization._id,
      isOrganizationValid: true,
      associationStatus: 'verified'
    };

    // Update registration data in temporary storage
    update(registrationToken, { step2Data });

    res.json({
      success: true,
      message: 'Organization verified successfully',
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

// Step 3: Security Verification (Email & Phone OTP)
const sendEmailOTPForStudent = async (req, res) => {
  try {
    const { emailAddress, registrationToken } = req.body;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    const registrationData = retrieve(registrationToken);
    if (!registrationData?.step1Data || registrationData.step1Data.emailAddress !== emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address does not match registration data'
      });
    }

    // Check if we have real Gmail credentials configured
    const hasRealGmailCredentials = process.env.EMAIL_USER && 
                                   process.env.EMAIL_PASS &&
                                   process.env.EMAIL_USER !== 'your-gmail@gmail.com' &&
                                   process.env.EMAIL_PASS !== 'your-app-password';

    // Use real email service if credentials are configured
    if (hasRealGmailCredentials) {
      // Use centralized OTP controller for production
      const result = await sendEmailOTP(emailAddress, 'student_registration');
      
      if (result.success) {
        return res.json({
          success: true,
          message: 'Email OTP sent successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send email OTP'
        });
      }
    } else {
      const OTP = require('../models/OTP');
      
      // Delete existing OTPs for this email
      await OTP.deleteMany({ 
        email: emailAddress,
        purpose: 'student_registration' 
      });
      
      // Generate and store new OTP
      const devOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      const otpRecord = new OTP({
        email: emailAddress,
        otp: devOTP,
        type: 'email',
        purpose: 'student_registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      await otpRecord.save();
      
      console.log(`📧 Email OTP for ${emailAddress}: ${devOTP}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to email successfully (development mode)',
        data: {
          email: emailAddress,
          otp: devOTP, // Only in development
          expiresIn: '10 minutes'
        }
      });
      return;
    }
  } catch (error) {
    console.error('Error in sendEmailOTPForStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email OTP',
      error: error.message
    });
  }
};

const sendPhoneOTPForStudent = async (req, res) => {
  try {
    const { phoneNumber, countryCode, registrationToken } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and country code are required'
      });
    }

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    const registrationData = retrieve(registrationToken);
    if (!registrationData?.step1Data || 
        registrationData.step1Data.phoneNumber !== phoneNumber ||
        registrationData.step1Data.countryCode !== countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number does not match registration data'
      });
    }

    // Check if we have real Twilio credentials configured
    const hasRealTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && 
                                   process.env.TWILIO_AUTH_TOKEN && 
                                   process.env.TWILIO_PHONE_NUMBER &&
                                   process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid' &&
                                   process.env.TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token';

    // Use real SMS service if credentials are configured
    if (hasRealTwilioCredentials) {
      // Use centralized OTP controller for production
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const result = await sendPhoneOTP(fullPhoneNumber, 'student_registration');
      
      if (result.success) {
        return res.json({
          success: true,
          message: 'Phone OTP sent successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send phone OTP'
        });
      }
    } else {
      const OTP = require('../models/OTP');
      
      // Delete existing OTPs for this phone
      await OTP.deleteMany({ 
        phone: phoneNumber, 
        countryCode: countryCode,
        purpose: 'student_registration' 
      });
      
      // Generate and store new OTP
      const devOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      const otpRecord = new OTP({
        phone: phoneNumber,
        countryCode: countryCode,
        otp: devOTP,
        type: 'phone',
        purpose: 'student_registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      await otpRecord.save();
      
      console.log(`📱 Phone OTP for ${fullPhoneNumber}: ${devOTP}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to phone successfully (development mode)',
        data: {
          phone: fullPhoneNumber,
          otp: devOTP, // Only in development
          expiresIn: '10 minutes'
        }
      });
      return;
    }
  } catch (error) {
    console.error('Error in sendPhoneOTPForStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const verifyEmailOTPForStudent = async (req, res) => {
  try {
    const { emailOTP, emailAddress, registrationToken } = req.body;

    if (!emailOTP || !emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email OTP and email address are required'
      });
    }

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Check if we have real Gmail credentials configured
    const hasRealGmailCredentials = process.env.EMAIL_USER && 
                                   process.env.EMAIL_PASS &&
                                   process.env.EMAIL_USER !== 'your-gmail@gmail.com' &&
                                   process.env.EMAIL_PASS !== 'your-app-password';

    // Use real email service if credentials are configured
    if (hasRealGmailCredentials) {
      // Use centralized OTP controller for verification
      // Call centralized verification
      const verificationResult = await verifyEmailOTP(emailAddress, emailOTP, 'student_registration');
      
      // If verification was successful, update registration data
      if (verificationResult && verificationResult.success) {
        console.log('🔍 Email OTP verified successfully, updating registration data...');
        const registrationData = retrieve(registrationToken);
        
        if (registrationData && registrationData.step2Data) {
          update(registrationToken, {
            step2Data: {
              ...registrationData.step2Data,
              emailVerified: true
            }
          });
          console.log('✅ Email verification status updated in registration data');
        }
      }
      
      // Return the verification result
      if (verificationResult && verificationResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Email verified successfully',
          data: {
            email: emailAddress,
            verified: true
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: verificationResult?.message || 'Email verification failed'
        });
      }
    } else {
      // Verify OTP directly from database (development mode)
      const OTP = require('../models/OTP');
      
      // Find the OTP record
      const otpRecord = await OTP.findOne({
        email: emailAddress,
        type: 'email',
        purpose: 'student_registration',
        verified: false
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No OTP found for this email or OTP already verified'
        });
      }

      try {
        // Verify OTP
        await otpRecord.verifyOTP(emailOTP);
        
        console.log('🔍 Email OTP verified successfully, updating registration data...');
        const registrationData = retrieve(registrationToken);
        
        if (registrationData && registrationData.step2Data) {
          update(registrationToken, {
            step2Data: {
              ...registrationData.step2Data,
              emailVerified: true
            }
          });
          console.log('✅ Email verification status updated in registration data');
        }

        res.status(200).json({
          success: true,
          message: 'Email verified successfully',
          data: {
            email: emailAddress,
            verified: true
          }
        });
      } catch (otpError) {
        console.log('❌ Email OTP verification failed:', otpError.message);
        return res.status(400).json({
          success: false,
          message: otpError.message
        });
      }
    }
  } catch (error) {
    console.error('Error in verifyEmailOTPForStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: error.message
    });
  }
};

const verifyPhoneOTPForStudent = async (req, res) => {
  try {
    const { phoneOTP, phoneNumber, countryCode, registrationToken } = req.body;

    if (!phoneOTP || !phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone OTP, phone number, and country code are required'
      });
    }

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Check if we have real Twilio credentials configured
    const hasRealTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && 
                                   process.env.TWILIO_AUTH_TOKEN && 
                                   process.env.TWILIO_PHONE_NUMBER &&
                                   process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid' &&
                                   process.env.TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token';

    // Use real SMS service if credentials are configured
    if (hasRealTwilioCredentials) {
      // Construct full phone number
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Call centralized verification
      const verificationResult = await verifyPhoneOTP(fullPhoneNumber, phoneOTP, 'student_registration');
      
      // If verification was successful, update registration data
      if (verificationResult && verificationResult.success) {
        console.log('🔍 Phone OTP verified successfully, updating registration data...');
        const registrationData = retrieve(registrationToken);
        
        if (registrationData && registrationData.step2Data) {
          update(registrationToken, {
            step2Data: {
              ...registrationData.step2Data,
              phoneVerified: true
            }
          });
          console.log('✅ Phone verification status updated in registration data');
        }
      }
      
      // Return the verification result
      if (verificationResult && verificationResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Phone verified successfully',
          data: {
            phone: fullPhoneNumber,
            verified: true
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: verificationResult?.message || 'Phone verification failed'
        });
      }
    } else {
      // Verify OTP directly from database (development mode)
      const OTP = require('../models/OTP');
      
      // Find the OTP record
      const otpRecord = await OTP.findOne({
        phone: phoneNumber,
        countryCode: countryCode,
        type: 'phone',
        purpose: 'student_registration',
        verified: false
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No OTP found for this phone number or OTP already verified'
        });
      }

      try {
        // Verify OTP
        await otpRecord.verifyOTP(phoneOTP);
        
        console.log('🔍 Phone OTP verified successfully, updating registration data...');
        const registrationData = retrieve(registrationToken);
        
        if (registrationData && registrationData.step2Data) {
          update(registrationToken, {
            step2Data: {
              ...registrationData.step2Data,
              phoneVerified: true
            }
          });
          console.log('✅ Phone verification status updated in registration data');
        }

        res.status(200).json({
          success: true,
          message: 'Phone verified successfully',
          data: {
            phone: phoneNumber,
            verified: true
          }
        });
      } catch (otpError) {
        console.log('❌ Phone OTP verification failed:', otpError.message);
        return res.status(400).json({
          success: false,
          message: otpError.message
        });
      }
    }

  } catch (error) {
    console.error('Error in verifyPhoneOTPForStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: error.message
    });
  }
};

// Step 3: Security Verification (OTP Verification Status)
const registerStep3 = async (req, res) => {
  try {
    const { registrationToken } = req.body;

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get registration data from temporary storage
    const registrationData = retrieve(registrationToken);
    if (!registrationData?.step1Data || !registrationData?.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all previous steps first'
      });
    }

    // Check verification status
    const emailVerified = registrationData.step2Data?.emailVerified || false;
    const phoneVerified = registrationData.step2Data?.phoneVerified || false;

    res.json({
      success: true,
      message: 'Security verification status retrieved',
      data: {
        emailVerified,
        phoneVerified,
        readyForCompletion: emailVerified && phoneVerified
      }
    });

  } catch (error) {
    console.error('Error in registerStep3:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Step 4: Auto Mapping & Complete Registration
const registerStep4 = async (req, res) => {
  try {
    const { 
      password, 
      confirmPassword, 
      academicYear, 
      grade, 
      section, 
      subjects,
      registrationToken 
    } = req.body;

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

    // Validate academic details
    if (!academicYear || !grade || !section) {
      return res.status(400).json({
        success: false,
        message: 'Academic year, grade, and section are required'
      });
    }

    // Check if registration token is provided
    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Get registration data from temporary storage
    const registrationData = retrieve(registrationToken);
    console.log('🔍 Retrieved registration data:', JSON.stringify(registrationData, null, 2));
    
    if (!registrationData || !registrationData.step1Data || !registrationData.step2Data) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all previous steps first'
      });
    }

    // Check if email and phone are verified
    if (!registrationData.step2Data?.emailVerified || !registrationData.step2Data?.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify both email and phone before completing registration',
        requiresVerification: {
          email: !registrationData.step2Data?.emailVerified,
          phone: !registrationData.step2Data?.phoneVerified
        }
      });
    }

    // Generate roll number (unique within organization)
    const rollNumber = await generateUniqueRollNumber(registrationData.step2Data.organizationId);

    // Create student data
    const studentData = {
      ...registrationData.step1Data,
      ...registrationData.step2Data,
      password,
      emailVerified: registrationData.step2Data.emailVerified,
      phoneVerified: registrationData.step2Data.phoneVerified,
      academicYear,
      grade,
      section,
      rollNumber,
      subjects: subjects || [],
      status: 'active'
    };

    // Create student
    console.log('🔍 Creating student with data:', JSON.stringify(studentData, null, 2));
    const student = new Student(studentData);
    await student.save();
    console.log('✅ Student created successfully:', student._id);

    // Generate student code
    const studentCode = student.generateStudentCode();
    student.studentCode = studentCode;
    await student.save();

    // Auto-assign teachers based on subjects and organization
    await autoAssignTeachers(student._id, registrationData.step2Data.organizationId, subjects || []);

    // Create User record for authentication
    try {
      const { createStudentUser } = require('../utils/createUserFromRegistration');
      await createStudentUser(student._id, {
        emailAddress: student.emailAddress,
        password: password,
        fullName: student.fullName,
        phoneNumber: student.phoneNumber,
        countryCode: student.countryCode
      });
      console.log('✅ User record created for student:', student.emailAddress);
    } catch (userError) {
      console.error('⚠️ Warning: Failed to create user record:', userError.message);
      // Don't fail the registration if user creation fails
    }

    // Clear temporary storage
    remove(registrationToken);

    res.json({
      success: true,
      message: 'Student registration completed successfully',
      data: {
        studentId: student._id,
        studentCode,
        email: student.emailAddress,
        name: student.fullName,
        organizationName: student.organizationName,
        rollNumber: student.rollNumber,
        grade: student.grade,
        section: student.section
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

// Helper function to generate unique roll number
const generateUniqueRollNumber = async (organizationId) => {
  let rollNumber;
  let isUnique = false;
  
  while (!isUnique) {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    rollNumber = `${year}${randomNum}`;
    
    const existingStudent = await Student.findOne({ 
      rollNumber, 
      organizationId 
    });
    
    if (!existingStudent) {
      isUnique = true;
    }
  }
  
  return rollNumber;
};

// Helper function to auto-assign teachers
const autoAssignTeachers = async (studentId, organizationId, subjects) => {
  try {
    const assignedTeachers = [];
    
    for (const subject of subjects) {
      // Find available teachers for this subject in the organization
      const teacher = await Teacher.findOne({
        organizationId,
        subjects: { $in: [subject] },
        status: 'active'
      }).sort({ createdAt: 1 }); // Assign to the teacher who was created first (load balancing)
      
      if (teacher) {
        assignedTeachers.push({
          teacherId: teacher._id,
          subject: subject,
          assignedDate: new Date()
        });
      }
    }
    
    if (assignedTeachers.length > 0) {
      await Student.findByIdAndUpdate(studentId, {
        assignedTeachers: assignedTeachers
      });
      
      console.log(`✅ Auto-assigned ${assignedTeachers.length} teachers to student ${studentId}`);
    }
  } catch (error) {
    console.error('Error in autoAssignTeachers:', error);
    // Don't fail the registration if teacher assignment fails
  }
};

// Get student registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'default';
    const existingData = retrieve(sessionId) || {};

    res.json({
      success: true,
      data: {
        step1Completed: !!existingData.step1Data,
        step2Completed: !!existingData.step2Data,
        emailVerified: !!existingData.emailVerified,
        phoneVerified: !!existingData.phoneVerified,
        currentStep: existingData.step1Data ? 
          (existingData.step2Data ? 
            (existingData.emailVerified && existingData.phoneVerified ? 4 : 3) : 2) : 1
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
  registerStep4,
  sendEmailOTPForStudent,
  sendPhoneOTPForStudent,
  verifyEmailOTPForStudent,
  verifyPhoneOTPForStudent,
  getRegistrationStatus
};
