const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Invitation = require('../models/Invitation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { store, retrieve, remove } = require('../utils/tempStorage');
const { sendRegistrationEmail, sendTemporaryCredentialsEmail } = require('../services/emailService');

// Get all users for an organization
const getAllUserManagements = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, role, status, search } = req.query;

    // Get all users for this organization
    const teachersInOrg = await Teacher.find({ organizationId }).select('_id');
    const studentsInOrg = await Student.find({ organizationId }).select('_id');
    
    console.log('🔍 User Management - Organization users query:', {
      organizationId,
      teachersCount: teachersInOrg.length,
      studentsCount: studentsInOrg.length,
      teacherIds: teachersInOrg.map(t => t._id),
      studentIds: studentsInOrg.map(s => s._id)
    });

    let organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: teachersInOrg } },
        { userType: 'student', userId: { $in: studentsInOrg } }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log('🔍 User Management - Found users:', {
      totalUsers: organizationUsers.length,
      users: organizationUsers.map(u => ({
        id: u._id,
        email: u.email,
        userType: u.userType,
        userId: u.userId,
        isActive: u.isActive,
        organizationId: u.organizationId
      }))
    });

    // Apply filters
    if (role && role !== 'all') {
      organizationUsers = organizationUsers.filter(user => user.userType === role);
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        organizationUsers = organizationUsers.filter(user => user.isActive);
      } else if (status === 'inactive') {
        organizationUsers = organizationUsers.filter(user => !user.isActive);
      }
    }
    
    if (search) {
      organizationUsers = organizationUsers.filter(user => 
        (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(search.toLowerCase())) ||
        (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(search.toLowerCase())) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const total = organizationUsers.length;
    const skip = (page - 1) * limit;
    const paginatedUsers = organizationUsers.slice(skip, skip + parseInt(limit));

    // Fetch complete user data including Teacher/Student details
    const formattedUsers = await Promise.all(paginatedUsers.map(async (user) => {
      let additionalData = {};
      
      // Fetch Teacher or Student data based on user type
      if (user.userType === 'teacher' && user.userId) {
        try {
          const teacher = await Teacher.findById(user.userId);
          if (teacher) {
            additionalData = {
              firstName: teacher.fullName?.split(' ')[0] || '',
              lastName: teacher.fullName?.split(' ').slice(1).join(' ') || '',
              phone: teacher.phoneNumber || '',
              department: teacher.department || '',
              subjects: teacher.subjects || [],
              experienceLevel: teacher.experienceLevel || '',
              yearsOfExperience: teacher.yearsOfExperience || '',
              qualification: teacher.qualification || '',
              specialization: teacher.specialization || '',
              address: teacher.address || '',
              dateOfBirth: teacher.dateOfBirth || '',
              emergencyContact: teacher.emergencyContact || '',
              notes: teacher.notes || ''
            };
          }
        } catch (error) {
          console.error('Error fetching teacher data:', error);
        }
      } else if (user.userType === 'student' && user.userId) {
        try {
          const student = await Student.findById(user.userId);
          if (student) {
            additionalData = {
              firstName: student.fullName?.split(' ')[0] || '',
              lastName: student.fullName?.split(' ').slice(1).join(' ') || '',
              phone: student.phoneNumber || '',
              department: student.department || '',
              academicYear: student.academicYear || '',
              grade: student.grade || '',
              section: student.section || '',
              rollNumber: student.rollNumber || '',
              studentCode: student.studentCode || '',
              address: student.address || '',
              dateOfBirth: student.dateOfBirth || '',
              emergencyContact: student.emergencyContact || '',
              parentName: student.parentName || '',
              parentPhone: student.parentPhone || '',
              notes: student.notes || ''
            };
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
        }
      } else if (user.userType === 'organization_admin') {
        // For organization admin, use profile data if available
        additionalData = {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          department: 'Administration',
          address: user.profile?.address || '',
          notes: user.profile?.notes || ''
        };
      }

      return {
        _id: user._id,
        firstName: additionalData.firstName || user.profile?.firstName || '',
        lastName: additionalData.lastName || user.profile?.lastName || '',
        email: user.email,
        phone: additionalData.phone || '',
        userType: user.userType,
        status: user.isActive ? 'active' : 'inactive',
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        department: additionalData.department || user.profile?.department || '',
        isEmailVerified: user.isEmailVerified || false,
        phoneVerified: user.phoneVerified || false,
        // Teacher specific fields
        subjects: additionalData.subjects || [],
        experienceLevel: additionalData.experienceLevel || '',
        yearsOfExperience: additionalData.yearsOfExperience || '',
        qualification: additionalData.qualification || '',
        specialization: additionalData.specialization || '',
        // Student specific fields
        academicYear: additionalData.academicYear || '',
        grade: additionalData.grade || '',
        section: additionalData.section || '',
        rollNumber: additionalData.rollNumber || '',
        studentCode: additionalData.studentCode || '',
        parentName: additionalData.parentName || '',
        parentPhone: additionalData.parentPhone || '',
        // Common fields
        address: additionalData.address || '',
        dateOfBirth: additionalData.dateOfBirth || '',
        emergencyContact: additionalData.emergencyContact || '',
        notes: additionalData.notes || ''
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserManagementById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password').populate('userId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

// Create new user (Teacher or Student) - Admin creates without password
const createUserManagement = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode = '+1',
      role,
      department,
      status = 'active',
      dateOfBirth,
      address,
      emergencyContact,
      emergencyPhone,
      notes,
      organizationId,
      // Teacher specific fields
      subjects = [],
      teacherRole = 'teacher',
      affiliationType = 'organization',
      experienceLevel,
      currentInstitution,
      yearsOfExperience,
      // Student specific fields
      gender,
      academicYear,
      grade,
      section,
      rollNumber,
      studentSubjects = []
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, role, organizationId'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (existingUser) {
      // If user exists and is pending registration, update their details
      if (existingUser.authProvider === 'pending_registration' && !existingUser.isRegistrationComplete) {
        console.log(`🔄 Updating existing pending user: ${email}`);
        
        // Generate temporary credentials
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
        const organization = await Organization.findById(organizationId);
        const orgCode = organization?.orgCode || 'ORG001';

        // Update the existing user with temporary credentials
        existingUser.password = hashedTempPassword;
        existingUser.isActive = true; // Active with temporary credentials
        existingUser.authProvider = 'temp_password'; // Mark as temporary password
        existingUser.isRegistrationComplete = true; // Mark as complete since they have credentials
        existingUser.isEmailVerified = true; // Email is verified for admin-created users
        existingUser.firstLogin = true; // Flag for first login flow
        existingUser.profile = {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone ? `${countryCode}${phone}` : null,
          role: role,
          department
        };

        // Update the associated Teacher or Student record
        if (role === 'teacher') {
          const teacherRecord = await Teacher.findById(existingUser.userId);
          if (teacherRecord) {
            teacherRecord.firstName = firstName;
            teacherRecord.lastName = lastName;
            teacherRecord.phoneNumber = phone || '0000000000';
            teacherRecord.countryCode = countryCode;
            teacherRecord.department = department;
            teacherRecord.subjects = subjects || [];
            teacherRecord.experienceLevel = experienceLevel || 'beginner';
            teacherRecord.currentInstitution = currentInstitution || 'Unknown';
            teacherRecord.yearsOfExperience = yearsOfExperience || 0;
            teacherRecord.organizationCode = orgCode;
            await teacherRecord.save();
          }
        } else if (role === 'student') {
          const studentRecord = await Student.findById(existingUser.userId);
          if (studentRecord) {
            studentRecord.fullName = `${firstName} ${lastName}`;
            studentRecord.phoneNumber = phone || '0000000000';
            studentRecord.countryCode = countryCode;
            studentRecord.department = department;
            studentRecord.academicYear = academicYear || '2024-25';
            studentRecord.grade = grade || '10';
            studentRecord.section = section || 'A';
            studentRecord.organizationCode = orgCode;
            await studentRecord.save();
          }
        }

        await existingUser.save();

        // Send temporary credentials email
        const emailResult = await sendTemporaryCredentialsEmail(
          email, 
          `${firstName} ${lastName}`, 
          tempPassword, 
          role
        );
        
        if (emailResult.success) {
          console.log(`📧 Temporary credentials email sent successfully to ${email}`);
        } else {
          console.error(`❌ Failed to send temporary credentials email to ${email}:`, emailResult.error);
        }

        return res.status(200).json({
          success: true,
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully. Temporary credentials sent via email.`,
          data: {
            user: {
              id: existingUser._id,
              email: existingUser.email,
              userType: existingUser.userType,
              isActive: existingUser.isActive,
              isRegistrationComplete: existingUser.isRegistrationComplete,
              firstLogin: existingUser.firstLogin
            }
          }
        });
      } else {
        // User exists and is not pending registration
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists and has completed registration'
        });
      }
    }

    // Generate temporary credentials
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
    
    // Get organization details
    const organization = await Organization.findById(organizationId);
    const orgCode = organization?.orgCode || 'ORG001';

    let createdUser = null;
    let userRecord = null;

    if (role === 'teacher') {
      // Create Teacher record
      const teacherData = {
        fullName: `${firstName} ${lastName}`,
        phoneNumber: phone || '0000000000',
        countryCode,
        emailAddress: email.toLowerCase(),
        country: 'India', // Default, can be made configurable
        city: 'Unknown', // Default, can be made configurable
        pincode: '000000', // Default, can be made configurable
        subjects: subjects || [],
        role: teacherRole,
        affiliationType,
        experienceLevel: experienceLevel || 'beginner',
        currentInstitution: currentInstitution || 'Unknown',
        yearsOfExperience: yearsOfExperience || 0,
        organizationId,
        organizationCode: orgCode,
        status: status === 'active' ? 'active' : 'inactive'
      };

      // Set organization validation
      if (affiliationType === 'organization') {
        teacherData.isOrganizationValid = true;
        teacherData.associationStatus = 'verified';
      } else {
        teacherData.associationStatus = 'freelance';
      }

      userRecord = new Teacher(teacherData);
      await userRecord.save();

      // Create User record for teacher with temporary credentials
      createdUser = new User({
        email: email.toLowerCase(),
        password: hashedTempPassword,
        userType: 'teacher',
        userId: userRecord._id,
        userModel: 'Teacher',
        userTypeEmail: `${email.toLowerCase()}_teacher`, // Explicitly set userTypeEmail
        isActive: true, // Active with temporary credentials
        authProvider: 'temp_password', // Mark as temporary password
        isRegistrationComplete: true, // Complete since they have credentials
        isEmailVerified: true, // Email is verified for admin-created teachers
        firstLogin: true, // Flag for first login flow
        organizationId: organizationId,
        profile: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone ? `${countryCode}${phone}` : null,
          role: 'teacher',
          department
        }
      });

    } else if (role === 'student') {
      // Student fields will use defaults if not provided

      // Create Student record
      const studentData = {
        fullName: `${firstName} ${lastName}`,
        phoneNumber: phone || '0000000000',
        countryCode,
        emailAddress: email.toLowerCase(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
        gender: gender || 'other',
        country: 'India', // Default, can be made configurable
        city: 'Unknown', // Default, can be made configurable
        pincode: '000000', // Default, can be made configurable
        organizationId,
        organizationCode: orgCode,
        academicYear: academicYear || '2024-25',
        grade: grade || '1',
        section: section || 'A',
        rollNumber: rollNumber || '001',
        subjects: studentSubjects || [],
        status: status === 'active' ? 'active' : 'inactive'
      };

      // Set organization validation
      studentData.isOrganizationValid = true;
      studentData.associationStatus = 'verified';

      userRecord = new Student(studentData);
      await userRecord.save();

      // Create User record for student with temporary credentials
      createdUser = new User({
        email: email.toLowerCase(),
        password: hashedTempPassword,
        userType: 'student',
        userId: userRecord._id,
        userModel: 'Student',
        userTypeEmail: `${email.toLowerCase()}_student`, // Explicitly set userTypeEmail
        isActive: true, // Active with temporary credentials
        authProvider: 'temp_password', // Mark as temporary password
        isRegistrationComplete: true, // Complete since they have credentials
        isEmailVerified: false, // Students need email verification
        firstLogin: true, // Flag for first login flow
        organizationId: organizationId,
        profile: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone ? `${countryCode}${phone}` : null,
          role: 'student',
          department
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only "teacher" and "student" are supported'
      });
    }

    await createdUser.save();

    // Send temporary credentials email
    const emailResult = await sendTemporaryCredentialsEmail(
      email, 
      `${firstName} ${lastName}`, 
      tempPassword, 
      role
    );
    
    if (emailResult.success) {
      console.log(`📧 Temporary credentials email sent successfully to ${email}`);
    } else {
      console.error(`❌ Failed to send temporary credentials email to ${email}:`, emailResult.error);
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully. Temporary credentials sent via email.`,
      data: {
        user: {
          id: createdUser._id,
          email: createdUser.email,
          userType: createdUser.userType,
          isActive: createdUser.isActive,
          isRegistrationComplete: createdUser.isRegistrationComplete,
          firstLogin: createdUser.firstLogin,
          profile: createdUser.profile
        },
        userRecord: {
          id: userRecord._id,
          fullName: userRecord.fullName,
          email: userRecord.emailAddress,
          status: userRecord.status
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
const updateUserManagement = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.organizationId;
    delete updateData.authProvider;

    // Update profile if basic info is changed
    if (updateData.firstName || updateData.lastName || updateData.email) {
      updateData.profile = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email?.toLowerCase(),
        phone: updateData.phone ? `${updateData.countryCode}${updateData.phone}` : null,
        role: updateData.role,
        department: updateData.department
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('userId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
const deleteUserManagement = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user first to get their related data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete related Teacher/Student record if exists
    if (user.userType === 'teacher' && user.userId) {
      await Teacher.findByIdAndDelete(user.userId);
      console.log('✅ Deleted related teacher record:', user.userId);
    } else if (user.userType === 'student' && user.userId) {
      await Student.findByIdAndDelete(user.userId);
      console.log('✅ Deleted related student record:', user.userId);
    }

    // Delete the user record
    await User.findByIdAndDelete(userId);
    console.log('✅ Permanently deleted user:', userId);

    res.status(200).json({
      success: true,
      message: 'User permanently deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Suspend/Activate user (toggle isActive status)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'suspend' or 'activate'

    if (!action || !['suspend', 'activate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "suspend" or "activate"'
      });
    }

    const isActive = action === 'activate';
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const statusText = isActive ? 'activated' : 'suspended';
    console.log(`✅ User ${statusText}:`, userId);

    res.status(200).json({
      success: true,
      message: `User ${statusText} successfully`,
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive,
        status: user.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Bulk create users from CSV
const bulkCreateUserManagements = async (req, res) => {
  try {
    const { users, organizationId } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users provided for bulk creation'
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: users.length
    };

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.userType) {
          results.failed.push({
            email: userData.email,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: userData.email.toLowerCase()
        });

        if (existingUser) {
          results.failed.push({
            email: userData.email,
            error: 'User already exists'
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create user based on userType
        let createdUser;
        let createdProfile;
        
        if (userData.userType === 'teacher') {
          // Create Teacher profile
          createdProfile = new Teacher({
            fullName: `${userData.firstName} ${userData.lastName}`,
            emailAddress: userData.email.toLowerCase(),
            phoneNumber: userData.phone || '',
            countryCode: '+91',
            country: 'India',
            city: 'Mumbai',
            pincode: '400001',
            department: userData.department || '',
            organizationId: organizationId,
            organizationCode: 'ORG001', // Add required organizationCode
            isActive: true,
            subjects: [],
            role: 'teacher',
            affiliationType: 'organization',
            experienceLevel: 'beginner',
            yearsOfExperience: 0,
            qualification: '',
            specialization: '',
            address: '',
            dateOfBirth: new Date('1990-01-01'),
            emergencyContact: '',
            notes: ''
          });
          
          await createdProfile.save();
          
          // Create User account
          createdUser = new User({
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            userType: 'teacher',
            userId: createdProfile._id,
            organizationId: organizationId,
            userTypeEmail: `${userData.email.toLowerCase()}_${userData.userType}`,
            userModel: 'Teacher',
            authProvider: 'temp_password',
            isRegistrationComplete: true,
            isActive: true,
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || '',
              department: userData.department || ''
            },
            emailVerified: false,
            phoneVerified: false,
            firstLogin: true
          });
          
        } else if (userData.userType === 'student') {
          // Create Student profile
          createdProfile = new Student({
            fullName: `${userData.firstName} ${userData.lastName}`,
            emailAddress: userData.email.toLowerCase(),
            phoneNumber: userData.phone || '',
            countryCode: '+91',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'other',
            country: 'India',
            city: 'Mumbai',
            pincode: '400001',
            organizationId: organizationId,
            isActive: true,
            studentId: '',
            address: '',
            emergencyContact: '',
            parentGuardianName: '',
            parentGuardianPhone: '',
            parentGuardianEmail: '',
            notes: '',
            // Academic fields
            grade: 'Grade 10',
            section: 'A',
            rollNumber: `STU${Date.now()}`,
            academicYear: '2024-2025',
            subjects: []
          });
          
          await createdProfile.save();
          
          // Create User account
          createdUser = new User({
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            userType: 'student',
            userId: createdProfile._id,
            organizationId: organizationId,
            userTypeEmail: `${userData.email.toLowerCase()}_${userData.userType}`,
            userModel: 'Student',
            authProvider: 'temp_password',
            isRegistrationComplete: true,
            isActive: true,
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || '',
              department: userData.department || ''
            },
            emailVerified: false,
            phoneVerified: false,
            firstLogin: true
          });
        } else {
          results.failed.push({
            email: userData.email,
            error: 'Invalid user type. Must be teacher or student.'
          });
          continue;
        }
        
        await createdUser.save();
        
        // Send email notification if requested
        if (userData.sendEmailNotification) {
          try {
            await sendTemporaryCredentialsEmail(
              userData.email,
              userData.firstName,
              tempPassword,
              userData.userType,
              organizationId
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the user creation if email fails
          }
        }
        
        results.successful.push({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          tempPassword: tempPassword,
          userId: createdUser._id,
          profileId: createdProfile._id
        });

      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk user creation completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: {
        results: [...results.successful, ...results.failed],
        successCount: results.successful.length,
        failureCount: results.failed.length,
        total: results.total
      }
    });

  } catch (error) {
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create users',
      error: error.message
    });
  }
};

// Send invitation email
const sendInvitation = async (req, res) => {
  try {
    const {
      email,
      role,
      department,
      customMessage,
      expiryDays = 7,
      firstName,
      lastName,
      phone
    } = req.body;

    const { organizationId } = req.params;
    const invitedBy = req.user.userId;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    // Validate role
    const validRoles = ['teacher', 'student', 'sub_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be teacher, student, or sub_admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findPendingByEmail(email.toLowerCase(), organizationId);
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'A pending invitation already exists for this email'
      });
    }

    // Create invitation
    const invitation = new Invitation({
      email: email.toLowerCase(),
      organizationId,
      invitedBy,
      role,
      metadata: {
        firstName,
        lastName,
        department,
        phone,
        customMessage
      },
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    });

    await invitation.save();

    // TODO: Send actual email using nodemailer
    console.log(`📧 Invitation created for ${email}: ${invitation.token}`);

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation',
      error: error.message
    });
  }
};

// Get invitation by token
const getInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findByToken(token);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or expired'
      });
    }

    // Get organization details
    const organization = await Organization.findById(invitation.organizationId);
    
    res.status(200).json({
      success: true,
      data: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
        organizationName: organization?.name || 'Unknown Organization',
        metadata: invitation.metadata,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    });

  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitation',
      error: error.message
    });
  }
};

// Accept invitation and create user
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName, phone, countryCode } = req.body;

    if (!password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Password, first name, and last name are required'
      });
    }

    // Get invitation
    const invitation = await Invitation.findByToken(token);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or expired'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: invitation.email
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get organization details for required fields
    const organization = await Organization.findById(invitation.organizationId);

    // Create user based on role
    let newUser;
    let userId;

    if (invitation.role === 'teacher') {
      // Create teacher
      const teacher = new Teacher({
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        emailAddress: invitation.email,
        phoneNumber: phone ? `${countryCode || '+1'}${phone}` : '+11234567890',
        countryCode: countryCode || '+1',
        country: 'USA', // Default values for required fields
        city: 'Unknown',
        pincode: '00000',
        role: 'teacher',
        affiliationType: 'organization',
        organizationId: invitation.organizationId,
        organizationCode: organization?.orgCode || 'ORG001',
        department: invitation.metadata?.department || 'General',
        password: hashedPassword,
        isActive: true
      });
      await teacher.save();
      userId = teacher._id;
    } else if (invitation.role === 'student') {
      // Create student
      const student = new Student({
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        emailAddress: invitation.email,
        phoneNumber: phone ? `${countryCode || '+1'}${phone}` : '+11234567890',
        countryCode: countryCode || '+1',
        dateOfBirth: new Date('1990-01-01'), // Default date
        gender: 'other', // Default gender
        country: 'USA', // Default values for required fields
        city: 'Unknown',
        pincode: '00000',
        organizationId: invitation.organizationId,
        department: invitation.metadata?.department || 'General',
        password: hashedPassword,
        isActive: true
      });
      await student.save();
      userId = student._id;
    } else if (invitation.role === 'sub_admin') {
      // For sub_admin, we'll create a user with organization_admin type but different permissions
      // This would need additional logic based on your sub_admin requirements
      return res.status(400).json({
        success: false,
        message: 'Sub-admin creation through invitation is not yet implemented'
      });
    }

    // Create user account
    newUser = new User({
      email: invitation.email,
      password: hashedPassword,
      userType: invitation.role,
      userId: userId,
      userModel: invitation.role === 'teacher' ? 'Teacher' : 'Student',
      userTypeEmail: invitation.email,
      authProvider: 'local',
      isActive: true,
      isEmailVerified: false,
      profile: {
        firstName,
        lastName,
        phone: phone ? `${countryCode || ''}${phone}` : null,
        department: invitation.metadata?.department || null
      }
    });

    await newUser.save();

    // Mark invitation as accepted
    await invitation.accept(newUser._id);

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: newUser._id, 
        userType: newUser.userType,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully. User created.',
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          userType: newUser.userType,
          profile: newUser.profile
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
};

// Get user statistics
const getUserManagementStats = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Get all users for this organization
    const organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: await Teacher.find({ organizationId }).select('_id') } },
        { userType: 'student', userId: { $in: await Student.find({ organizationId }).select('_id') } }
      ]
    });

    // Calculate stats
    const stats = {
      total: organizationUsers.length,
      active: organizationUsers.filter(u => u.isActive).length,
      pending: 0, // No pending status in current User model
      inactive: organizationUsers.filter(u => !u.isActive).length,
      suspended: 0, // No suspended status in current User model
      teachers: organizationUsers.filter(u => u.userType === 'teacher').length,
      students: organizationUsers.filter(u => u.userType === 'student').length,
      admins: organizationUsers.filter(u => u.userType === 'organization_admin').length,
      emailVerified: organizationUsers.filter(u => u.isEmailVerified).length,
      phoneVerified: 0 // No phone verification in current User model
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
};

// Get role distribution for organization
const getRoleDistribution = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Get all users for this organization
    const organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: await Teacher.find({ organizationId }).select('_id') } },
        { userType: 'student', userId: { $in: await Student.find({ organizationId }).select('_id') } }
      ]
    });

    // Group by userType
    const roleDistribution = organizationUsers.reduce((acc, user) => {
      const role = user.userType;
      if (!acc[role]) {
        acc[role] = { _id: role, count: 0, active: 0 };
      }
      acc[role].count++;
      if (user.isActive) {
        acc[role].active++;
      }
      return acc;
    }, {});

    const result = Object.values(roleDistribution).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get role distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get role distribution',
      error: error.message
    });
  }
};

// Get recent activity for organization
const getRecentActivity = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;

    // Get all users for this organization
    const organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: await Teacher.find({ organizationId }).select('_id') } },
        { userType: 'student', userId: { $in: await Student.find({ organizationId }).select('_id') } }
      ]
    })
      .select('email userType lastLogin profile createdAt')
      .sort({ lastLogin: -1 })
      .limit(parseInt(limit));

    // Format the response
    const recentActivity = organizationUsers.map(user => ({
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      email: user.email,
      userType: user.userType,
      lastLogin: user.lastLogin,
      lastActivity: user.lastLogin, // Use lastLogin as lastActivity
      status: user.isActive ? 'active' : 'inactive',
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: recentActivity
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
};

// Get users by role for organization
const getUsersByRole = async (req, res) => {
  try {
    const { organizationId, role } = req.params;

    // Get users by role for organization using the User model
    const organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: await Teacher.find({ organizationId }).select('_id') } },
        { userType: 'student', userId: { $in: await Student.find({ organizationId }).select('_id') } }
      ],
      userType: role,
      isActive: true
    })
      .select('-password')
      .populate('userId')
      .sort({ 'profile.firstName': 1, 'profile.lastName': 1 });

    res.status(200).json({
      success: true,
      data: organizationUsers
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users by role',
      error: error.message
    });
  }
};

// Update user role
const updateUserManagementRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, department } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        userType: role,
        'profile.department': department || null
      },
      { new: true, runValidators: true }
    ).select('-password').populate('userId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Get all invitations for an organization
const getInvitations = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { status = 'all' } = req.query;

    const invitations = await Invitation.findByOrganization(
      organizationId, 
      status === 'all' ? null : status
    );

    res.status(200).json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitations',
      error: error.message
    });
  }
};

// Cancel/Delete invitation
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    await invitation.cancel();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
};

// Resend invitation
const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only resend pending invitations'
      });
    }

    // Extend expiry date
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    // TODO: Send actual email
    console.log(`📧 Invitation resent to ${invitation.email}: ${invitation.token}`);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`
      }
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message
    });
  }
};

// Bulk send invitations
const bulkSendInvitations = async (req, res) => {
  try {
    const { invitations } = req.body;
    const { organizationId } = req.params;
    const invitedBy = req.user.userId;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invitations array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const invitationData of invitations) {
      try {
        const { email, role, firstName, lastName, department, phone } = invitationData;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          errors.push({ email, error: 'User already exists' });
          continue;
        }

        // Check for existing pending invitation
        const existingInvitation = await Invitation.findPendingByEmail(email.toLowerCase(), organizationId);
        if (existingInvitation) {
          errors.push({ email, error: 'Pending invitation already exists' });
          continue;
        }

        // Create invitation
        const invitation = new Invitation({
          email: email.toLowerCase(),
          organizationId,
          invitedBy,
          role,
          metadata: { firstName, lastName, department, phone }
        });

        await invitation.save();
        results.push({
          email: invitation.email,
          role: invitation.role,
          token: invitation.token
        });

      } catch (error) {
        errors.push({ email: invitationData.email, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${invitations.length} invitations`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Bulk send invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk invitations',
      error: error.message
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'New role is required'
      });
    }

    const validRoles = ['teacher', 'student', 'sub_admin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be teacher, student, or sub_admin'
      });
    }

    const user = await User.findById(userId).populate('userId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    user.userType = newRole;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        newRole: user.userType
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Bulk update user roles
const bulkUpdateUserRoles = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { userId, newRole } = update;

        const user = await User.findById(userId);
        if (!user) {
          errors.push({ userId, error: 'User not found' });
          continue;
        }

        user.userType = newRole;
        await user.save();

        results.push({
          userId: user._id,
          email: user.email,
          newRole: user.userType
        });

      } catch (error) {
        errors.push({ userId: update.userId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${updates.length} role updates`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Bulk update user roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user roles',
      error: error.message
    });
  }
};

// Get registration details by token
const getRegistrationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      registrationToken: token,
      isRegistrationComplete: false,
      registrationExpires: { $gt: new Date() }
    }).populate('userId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Registration token not found or expired'
      });
    }

    // Get organization details
    const organization = await Organization.findById(user.userId.organizationId);
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        organizationId: user.userId.organizationId,
        organizationName: organization?.name || 'Unknown Organization',
        organizationCode: user.organizationCode,
        profile: user.profile,
        expiresAt: user.registrationExpires,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get registration details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration details',
      error: error.message
    });
  }
};

// Complete user registration
const completeRegistration = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, organizationCode } = req.body;

    if (!password || !organizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Password and organization code are required'
      });
    }

    // Find user by token
    const user = await User.findOne({
      registrationToken: token,
      isRegistrationComplete: false,
      registrationExpires: { $gt: new Date() }
    }).populate('userId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Registration token not found or expired'
      });
    }

    // Validate organization code
    if (user.organizationCode !== organizationCode.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization code'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password and complete registration
    user.password = hashedPassword;
    user.authProvider = 'local';
    user.isRegistrationComplete = true;
    user.isActive = true;
    user.isEmailVerified = true;
    user.registrationToken = undefined;
    user.registrationExpires = undefined;
    user.organizationCode = undefined;

    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        userType: user.userType,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Registration completed successfully. User can now login.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          isActive: user.isActive,
          isRegistrationComplete: user.isRegistrationComplete,
          profile: user.profile
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: error.message
    });
  }
};

// Validate organization code
const validateOrganizationCode = async (req, res) => {
  try {
    const { token, organizationCode } = req.body;

    if (!token || !organizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Token and organization code are required'
      });
    }

    const user = await User.findOne({
      registrationToken: token,
      isRegistrationComplete: false,
      registrationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Registration token not found or expired'
      });
    }

    const isValid = user.organizationCode === organizationCode.toUpperCase();

    res.status(200).json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Organization code is valid' : 'Invalid organization code'
      }
    });

  } catch (error) {
    console.error('Validate organization code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate organization code',
      error: error.message
    });
  }
};

// Bulk delete users
const bulkDeleteUserManagements = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    console.log('🗑️ Bulk Delete Users:', { userIds });

    let deletedCount = 0;
    let failedDeletions = [];

    for (const userId of userIds) {
      try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
          failedDeletions.push({ userId, error: 'User not found' });
          continue;
        }

        // Delete associated profile
        if (user.userType === 'teacher') {
          await Teacher.findByIdAndDelete(user.userId);
        } else if (user.userType === 'student') {
          await Student.findByIdAndDelete(user.userId);
        }

        // Delete the user account
        await User.findByIdAndDelete(userId);
        deletedCount++;

        console.log(`✅ Deleted user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to delete user ${userId}:`, error);
        failedDeletions.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} users`,
      data: {
        deletedCount,
        failedDeletions,
        totalRequested: userIds.length
      }
    });
  } catch (error) {
    console.error('❌ Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete users',
      error: error.message
    });
  }
};

// Bulk toggle user status
const bulkToggleUserManagementStatus = async (req, res) => {
  try {
    const { userIds, action } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    if (!action || !['suspend', 'activate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (suspend/activate) is required'
      });
    }

    console.log('🔄 Bulk Toggle User Status:', { userIds, action });

    let updatedCount = 0;
    let failedUpdates = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          failedUpdates.push({ userId, error: 'User not found' });
          continue;
        }

        // Update user status
        user.isActive = action === 'activate';
        await user.save();

        updatedCount++;
        console.log(`✅ ${action}d user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to ${action} user ${userId}:`, error);
        failedUpdates.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully ${action}ed ${updatedCount} users`,
      data: {
        updatedCount,
        failedUpdates,
        totalRequested: userIds.length,
        action
      }
    });
  } catch (error) {
    console.error('❌ Bulk toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk toggle user status',
      error: error.message
    });
  }
};

module.exports = {
  getAllUserManagements,
  getUserManagementById,
  createUserManagement,
  updateUserManagement,
  deleteUserManagement,
  toggleUserStatus,
  bulkCreateUserManagements,
  sendInvitation,
  getInvitation,
  acceptInvitation,
  getInvitations,
  cancelInvitation,
  resendInvitation,
  bulkSendInvitations,
  getUserManagementStats,
  updateUserManagementRole,
  updateUserRole,
  bulkUpdateUserRoles,
  getRoleDistribution,
  getRecentActivity,
  getUsersByRole,
  getRegistrationDetails,
  completeRegistration,
  validateOrganizationCode,
  bulkDeleteUserManagements,
  bulkToggleUserManagementStatus
};
