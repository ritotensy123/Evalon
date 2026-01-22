const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { createUserFromRegistration } = require('../utils/createUserFromRegistration');
// REMOVED: Email and Mobile OTP imports removed - OTP verification not required for teachers
// (similar to organization registration flow)
// const { sendEmailOTP, verifyEmailOTP } = require('./otpController');
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

    // Debug: Log received data
    console.log('📝 Teacher Step 1 Registration Data:', {
      fullName,
      phoneNumber,
      countryCode,
      emailAddress,
      country,
      city,
      pincode
    });

    // Check if this is an org-created user first
    const existingUser = await User.findOne({
      email: emailAddress.toLowerCase(),
      userType: 'teacher',
      authProvider: 'pending_registration',
      isRegistrationComplete: false
    });

    const isOrgCreatedUser = !!existingUser;

    // Validate required fields only for standalone registrations
    // NOTE: phoneNumber is optional (mobile OTP verification removed, similar to organization registration)
    if (!isOrgCreatedUser && (!fullName || !emailAddress || !country || !city || !pincode)) {
      console.log('❌ Missing required fields for standalone registration:', {
        fullName: !!fullName,
        phoneNumber: !!phoneNumber,
        emailAddress: !!emailAddress,
        country: !!country,
        city: !!city,
        pincode: !!pincode
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if teacher already exists
    // NOTE: Teacher model uses 'email' field (not 'emailAddress')
    const existingTeacher = await Teacher.findOne({
      email: emailAddress.toLowerCase()
    });

    if (existingTeacher && isOrgCreatedUser) {
      // This is an admin-created teacher completing their registration
      console.log('🔄 Admin-created teacher completing registration:', emailAddress);
      
      // Update the existing teacher record with new data (only if provided)
      if (fullName) existingTeacher.fullName = fullName;
      if (phoneNumber && countryCode) existingTeacher.phoneNumber = `${countryCode}${phoneNumber}`;
      if (country) existingTeacher.country = country;
      if (city) existingTeacher.city = city;
      if (pincode) existingTeacher.pincode = pincode;
      existingTeacher.status = 'active';
      
      await existingTeacher.save();
      
      // Generate registration token for the next steps
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
        timestamp: new Date(),
        isAdminCreated: true,
        existingTeacherId: existingTeacher._id,
        existingUserId: existingUser._id
      };

      // Store data with registration token as key
      console.log('🔍 Step 1 - Storing admin-created teacher data with token:', registrationToken);
      store(registrationToken, step1Data);
      console.log('🔍 Step 1 - Data stored successfully');

      return res.status(200).json({
        success: true,
        message: 'Admin-created teacher basic details updated successfully',
        data: {
          step: 1,
          nextStep: 'professional_details',
          registrationToken,
          isAdminCreated: true
        }
      });
    } else if (existingTeacher) {
      // This is a regular duplicate email
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // This is a new standalone registration
    console.log('🆕 New standalone teacher registration:', emailAddress);

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

// Register teacher step 2 (professional details + password)
// MIRRORS: Organization registerStep2 - stores password hash in temp storage
const registerStep2 = async (req, res) => {
  try {
    const {
      subjects,
      role,
      affiliationType,
      experienceLevel,
      currentInstitution,
      yearsOfExperience,
      password,
      confirmPassword,
      registrationToken
    } = req.body;

    // Validate required fields
    if (!subjects || !role || !affiliationType || !registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Password is required when saving step 2 (before final registration)
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required'
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
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

    // Hash password (required at this step) - MIRRORS Organization step 2
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    // SECURITY: Only store the hashed password, never the raw password
    // The User model will accept the pre-hashed password with proper handling
    step2Data.hashedPassword = hashedPassword;

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
        nextStep: 'complete_registration',
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

// Register teacher step 3 (complete registration)
// MIRRORS: Organization completeRegistration - final commit that saves to DB
const registerStep3 = async (req, res) => {
  try {
    const {
      registrationToken,
      emailVerified = false // Email verification removed - always false
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

    // Check if all required data is present
    if (!registrationData.fullName || !registrationData.emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete registration data'
      });
    }

    // Password is required for final registration (should be hashed in step 2)
    if (!registrationData.hashedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to complete registration'
      });
    }

    // Check if teacher with this email already exists
    const existingTeacher = await Teacher.findOne({ 
      email: registrationData.emailAddress.toLowerCase() 
    });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Prepare teacher data
    const nameParts = registrationData.fullName.split(' ');
    const firstName = nameParts[0] || registrationData.fullName;
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate employeeId for freelance teacher
    const employeeId = `TEA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Find or create a default "Freelance" organization for standalone teachers
    // This is required by the Teacher model (organization field is required)
    let freelanceOrg = null;
    try {
      freelanceOrg = await Organization.findOne({ 
        orgCode: 'FREELANCE-DEFAULT'
      });
      
      if (!freelanceOrg) {
        // Create a default organization for freelance teachers
        const freelanceEmail = `freelance-${Date.now()}@evalon.system`;
        freelanceOrg = new Organization({
          name: 'Freelance Teachers',
          orgCode: 'FREELANCE-DEFAULT',
          email: freelanceEmail,
          phone: '+0000000000',
          institutionStructure: 'single',
          foundedYear: new Date().getFullYear(),
          status: 'active',
          isGovernmentRecognized: false,
          emailVerified: false,
          phoneVerified: false,
          adminName: 'System Administrator',
          adminEmail: freelanceEmail,
          adminPhone: '+0000000000',
          timeZone: 'Asia/Kolkata'
        });
        await freelanceOrg.save();
        console.log('✅ Created default Freelance organization:', freelanceOrg._id);
      }
    } catch (orgError) {
      console.error('❌ Error creating/finding Freelance organization:', orgError);
      return res.status(500).json({
        success: false,
        message: 'Failed to setup organization for teacher',
        error: orgError.message
      });
    }

    // Find a system user for createdBy field (required by Teacher model)
    let systemUser = null;
    try {
      systemUser = await User.findOne({ 
        userType: 'organization_admin',
        isActive: true
      }).limit(1);
      
      if (!systemUser) {
        const orgAdminUser = await User.findOne({
          userType: 'organization_admin',
          userId: freelanceOrg._id,
          userModel: 'Organization'
        });
        
        if (orgAdminUser) {
          systemUser = orgAdminUser;
        }
      }

      if (!systemUser) {
        return res.status(500).json({
          success: false,
          message: 'System configuration error: No admin user found. Please contact support.',
          error: 'Missing system user for teacher creation'
        });
      }
    } catch (userFindError) {
      console.error('❌ Error finding system user:', userFindError);
      return res.status(500).json({
        success: false,
        message: 'System configuration error',
        error: userFindError.message
      });
    }

    // CREATE TEACHER RECORD FIRST (before user, since user needs teacher._id)
    const teacherData = {
      firstName: firstName,
      lastName: lastName,
      email: registrationData.emailAddress.toLowerCase(),
      phone: registrationData.phoneNumber ? `${registrationData.countryCode || ''}${registrationData.phoneNumber}` : '',
      employeeId: employeeId,
      teacherRole: registrationData.role || 'teacher',
      subjects: registrationData.subjects || [],
      experience: registrationData.experienceLevel || '0-2 years',
      status: 'active',
      organization: freelanceOrg._id,
      createdBy: systemUser._id
    };

    console.log('🔄 Creating teacher record...');
    
    let teacher;
    try {
      teacher = new Teacher(teacherData);
      const savedTeacher = await teacher.save();
      console.log('✅ Teacher saved to database successfully. Teacher ID:', savedTeacher._id);
      
      // Verify the save by querying the database
      const verifyTeacher = await Teacher.findById(savedTeacher._id);
      if (!verifyTeacher) {
        console.error("❌ CRITICAL: Teacher save appeared successful but document not found in DB!");
        return res.status(500).json({
          success: false,
          message: 'Teacher save verification failed',
          error: 'Document not found after save'
        });
      }
      console.log("✅ Verified: Teacher document exists in database:", verifyTeacher._id);
      
      teacher = savedTeacher;
    } catch (teacherSaveError) {
      console.error('❌ Error saving teacher to database:', teacherSaveError);
      return res.status(500).json({
        success: false,
        message: 'Teacher registration failed',
        error: teacherSaveError.message,
        details: teacherSaveError.errors || {}
      });
    }

    // CREATE USER RECORD FOR AUTHENTICATION
    // MIRRORS: Organization completeRegistration - uses pre-hashed password
    console.log('🔧 Creating teacher user...');
    
    let teacherUser;
    try {
      const userTypeEmail = `${registrationData.emailAddress.toLowerCase()}_teacher`;
      
      // Check if user already exists
      const existingUser = await User.findOne({ userTypeEmail });
      
      if (existingUser) {
        // Update existing user
        console.log('🔄 Updating existing teacher user:', existingUser._id);
        existingUser.userId = teacher._id;
        existingUser.userModel = 'Teacher';
        existingUser.isActive = true;
        existingUser.isRegistrationComplete = true;
        existingUser.firstLogin = false;
        existingUser.authProvider = 'local';
        existingUser.isEmailVerified = false;
        existingUser.profile = {
          firstName: firstName,
          lastName: lastName
        };
        
        // SECURITY: Pass the pre-hashed password - User model detects bcrypt hashes and skips re-hashing
        existingUser.password = registrationData.hashedPassword;
        
        teacherUser = await existingUser.save();
        console.log('✅ Existing teacher user updated:', teacherUser._id);
      } else {
        // Create new user with teacher ID
        // SECURITY: Pass the pre-hashed password - User model detects bcrypt hashes and skips re-hashing
        teacherUser = await createUserFromRegistration({
          email: registrationData.emailAddress.toLowerCase(),
          password: registrationData.hashedPassword, // Already hashed - User model will detect this
          userType: 'teacher',
          userId: teacher._id,
          userModel: 'Teacher',
          profile: {
            firstName: firstName,
            lastName: lastName
          }
        });
        console.log('✅ New teacher user created:', teacherUser._id);
      }
    } catch (userError) {
      console.error('❌ Error creating/updating teacher user:', userError);
      // Teacher is already saved, but user creation failed
      // This is a critical error - user won't be able to login
      return res.status(500).json({
        success: false,
        message: 'Failed to create teacher user account',
        error: userError.message,
        note: 'Teacher record was created but user account creation failed. Please contact support.'
      });
    }

    // Update teacher's createdBy to point to the actual user
    if (teacher.createdBy.toString() !== teacherUser._id.toString()) {
      try {
        teacher.createdBy = teacherUser._id;
        await teacher.save();
        console.log('✅ Updated teacher createdBy to user ID:', teacherUser._id);
      } catch (updateError) {
        console.error('❌ Error updating teacher createdBy field:', updateError);
        // Non-critical - teacher already exists
      }
    }

    // Generate JWT token
    const { generateToken } = require('../middleware/auth');
    const token = generateToken(teacherUser._id, 'teacher', teacherUser.tokenVersion || 0);

    // Clean up temporary data
    remove(registrationToken);

    // Final verification before response
    const finalVerify = await Teacher.findById(teacher._id);
    if (!finalVerify) {
      console.error("❌ CRITICAL: Teacher not found before sending success response!");
      return res.status(500).json({
        success: false,
        message: 'Teacher registration verification failed',
        error: 'Document not found in database'
      });
    }
    console.log("✅ Final verification passed - Teacher exists:", finalVerify._id);

    // RESPONSE SENT ONLY AFTER SUCCESSFUL SAVE AND VERIFICATION
    // MIRRORS: Organization completeRegistration response structure
    return res.status(200).json({
      success: true,
      message: 'Teacher registered successfully!',
      data: {
        teacher: {
          id: teacher._id,
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          subjects: teacher.subjects,
          role: teacher.teacherRole,
          status: teacher.status
        },
        user: {
          id: teacherUser._id,
          name: `${firstName} ${lastName}`,
          email: teacherUser.email,
          userType: 'teacher',
          emailVerified
        },
        token,
        nextSteps: [
          'Complete your profile setup',
          'Start creating assessments',
          'Connect with students'
        ]
      }
    });

  } catch (error) {
    console.error('Teacher registration step 3 error:', error);
    return res.status(500).json({
      success: false,
      message: 'Teacher registration failed',
      error: error.message
    });
  }
};

// Register teacher (legacy single-step registration - kept for backward compatibility)
const registerTeacher = async (req, res) => {
  try {
    const teacherData = req.body;

    // Check if teacher already exists
    // NOTE: Teacher model uses 'email' field (not 'emailAddress')
    const existingTeacher = await Teacher.findOne({
      email: (teacherData.emailAddress || teacherData.email || '').toLowerCase()
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
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email, // Teacher model uses 'email' field
          subjects: teacher.subjects,
          role: teacher.teacherRole,
          organizationName: teacher.organizationName || 'Freelance'
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
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email, // Teacher model uses 'email' field
          phone: teacher.phone, // Teacher model uses 'phone' field
          subjects: teacher.subjects,
          role: teacher.teacherRole, // Teacher model uses 'teacherRole' field
          organization: teacher.organization,
          experience: teacher.experience,
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
      query.organization = organizationId;
    }
    if (status) {
      query.status = status;
    }

    const teachers = await Teacher.find(query)
      .select('firstName lastName email subjects role organizationName yearsOfExperience status')
      .sort({ firstName: 1 });

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
    delete updateData.email; // Teacher model uses 'email' field
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
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email, // Teacher model uses 'email' field
          subjects: teacher.subjects,
          role: teacher.teacherRole, // Teacher model uses 'teacherRole' field
          organization: teacher.organization,
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

// REMOVED: sendEmailOTPForTeacher - Email OTP verification removed from teacher flow
// (similar to organization registration flow where email OTP was removed)
// Teachers can register and login using email + password only, without email OTP verification.

// REMOVED: sendPhoneOTPForTeacher - Mobile OTP verification removed from teacher flow
// (similar to organization registration flow where phone OTP was removed)
// Teachers can register and login using email + password only, without mobile OTP verification.

// REMOVED: verifyEmailOTPForTeacher - Email OTP verification removed from teacher flow
// (similar to organization registration flow where email OTP was removed)
// Teachers can register and login using email + password only, without email OTP verification.

// REMOVED: verifyPhoneOTPForTeacher - Mobile OTP verification removed from teacher flow
// (similar to organization registration flow where phone OTP was removed)
// Teachers can register and login using email + password only, without mobile OTP verification.

// Assign teacher to department
const assignToDepartment = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { departmentId } = req.body;

    console.log('🎯 Assigning teacher to department:', { teacherId, departmentId });

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Add department to teacher's departments array if not already present
    if (!teacher.departments.includes(departmentId)) {
      teacher.departments.push(departmentId);
      await teacher.save();
    }

    console.log('✅ Teacher assigned to department successfully');

    res.json({
      success: true,
      message: 'Teacher assigned to department successfully',
      data: {
        teacher: {
          id: teacher._id,
          departments: teacher.departments
        }
      }
    });

  } catch (error) {
    console.error('Error assigning teacher to department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign teacher to department',
      error: error.message
    });
  }
};

// Remove teacher from department
const removeFromDepartment = async (req, res) => {
  try {
    const { teacherId, departmentId } = req.params;

    console.log('🎯 Removing teacher from department:', { teacherId, departmentId });

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Remove department from teacher's departments array
    teacher.departments = teacher.departments.filter(
      dept => dept.toString() !== departmentId
    );
    await teacher.save();

    console.log('✅ Teacher removed from department successfully');

    res.json({
      success: true,
      message: 'Teacher removed from department successfully',
      data: {
        teacher: {
          id: teacher._id,
          departments: teacher.departments
        }
      }
    });

  } catch (error) {
    console.error('Error removing teacher from department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove teacher from department',
      error: error.message
    });
  }
};

module.exports = {
  // Multi-step registration functions
  registerStep1,
  registerStep2,
  registerStep3, // FINAL COMMIT - Saves teacher to database
  // Legacy single-step registration
  registerTeacher,
  // CRUD operations
  getTeacherById,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  // REMOVED: Email and Mobile OTP functions removed from teacher flow (similar to organization registration)
  // sendEmailOTPForTeacher,
  // verifyEmailOTPForTeacher,
  // sendPhoneOTPForTeacher,
  // verifyPhoneOTPForTeacher,
  // Department assignment
  assignToDepartment,
  removeFromDepartment
};