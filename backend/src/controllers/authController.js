/**
 * AuthController
 * HTTP request/response handling for authentication operations
 * All business logic is delegated to AuthService and UserService
 */

const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const UserRepository = require('../repositories/UserRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const TeacherRepository = require('../repositories/TeacherRepository');
const StudentRepository = require('../repositories/StudentRepository');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateToken } = require('../middleware/auth');
const { sendEmailVerification: sendEmailVerificationService } = require('../services/emailService');
const admin = require('firebase-admin');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

// Login user
const login = asyncWrapper(async (req, res) => {
  const { email, password, userType } = req.body;
  
  const result = await AuthService.login(email, password, userType);
  
  return sendSuccess(res, {
    token: result.token,
    user: result.user,
    dashboard: result.dashboard,
    organization: result.organization
  }, 'Login successful.', 200);
});

// Get current user profile
const getProfile = asyncWrapper(async (req, res) => {
  const user = await UserService.getUserById(req.user.id);
  
  // Get user details using model method (preserving existing behavior)
  const userDetails = await user.getUserDetails();
  
  return sendSuccess(res, userDetails, 'Profile retrieved successfully', 200);
});

// Update user profile
const updateProfile = asyncWrapper(async (req, res) => {
  const { firstName, lastName, phoneNumber, countryCode } = req.body;
  const userId = req.user.id;
  
  // Build update data
  const updateData = {
    profile: {}
  };
  
  if (firstName) updateData.profile.firstName = firstName;
  if (lastName) updateData.profile.lastName = lastName;
  if (phoneNumber) updateData.profile.phoneNumber = phoneNumber;
  if (countryCode) updateData.profile.countryCode = countryCode;
  
  if (firstName && lastName) {
    updateData.profile.fullName = `${firstName} ${lastName}`;
  }
  
  const updatedUser = await UserService.updateUser(userId, updateData);
  const userDetails = await updatedUser.getUserDetails();
  
  return sendSuccess(res, userDetails, 'Profile updated successfully.', 200);
});

// Change password
const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  if (!currentPassword || !newPassword) {
    throw AppError.badRequest('Current password and new password are required.');
  }
  
  // SECURITY: Enforce stronger password requirements (NIST guidelines)
  if (newPassword.length < 8) {
    throw AppError.badRequest('New password must be at least 8 characters long.');
  }
  
  // Get user to verify current password
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found.');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw AppError.badRequest('Current password is incorrect.');
  }
  
  // Update password
  await UserRepository.updateById(userId, { password: newPassword });
  
  return sendSuccess(res, null, 'Password changed successfully.', 200);
});

// Logout (client-side token removal, but we can track it)
const logout = asyncWrapper(async (req, res) => {
  // Update user's last activity when logging out
  if (req.user && req.user.id) {
    try {
      await UserRepository.updateById(req.user.id, { lastActivity: new Date() });
      
      // Also update UserManagement if it exists
      const UserManagement = require('../models/UserManagement');
      const userManagement = await UserManagement.findOne({ userId: req.user.id });
      if (userManagement) {
        userManagement.lastActivity = new Date();
        await userManagement.save();
      }
    } catch (updateError) {
      // Don't fail the logout if status update fails
      logger.error('Error updating user status on logout', { error: updateError.message, stack: updateError.stack, userId: req.user?.id });
    }
  }
  
  return sendSuccess(res, null, 'Logout successful.', 200);
});

// Verify token endpoint
const verifyToken = asyncWrapper(async (req, res) => {
  // If we reach here, the token is valid (authenticate middleware passed)
  const user = await UserService.getUserById(req.user.id);
  const userDetails = await user.getUserDetails();
  
  return sendSuccess(res, userDetails, 'Token is valid.', 200);
});

// Google Sign-In authentication
const googleSignIn = asyncWrapper(async (req, res) => {
  const { credential, userType } = req.body;
  
  // Validate input
  if (!credential) {
    throw AppError.badRequest('Google credential is required.');
  }
  
  if (!userType) {
    throw AppError.badRequest('User type is required.');
  }
  
  // SECURITY: Verify Google ID token with Firebase Admin SDK
  let googleEmail;
  
  try {
    // Validate credential format
    if (!credential || typeof credential !== 'string') {
      throw AppError.unauthorized('Invalid Google credential format.');
    }
    
    // SECURITY: Only accept valid Firebase ID tokens
    const decodedToken = await admin.auth().verifyIdToken(credential);
    googleEmail = decodedToken.email;
    
    if (!googleEmail) {
      throw AppError.unauthorized('Unable to extract email from Google credential.');
    }
  } catch (error) {
    // SECURITY: Don't expose detailed error messages in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Firebase token verification failed: ${error.message}`
      : 'Invalid or expired Google credential.';
    throw AppError.unauthorized(errorMessage);
  }
  
  // Find user by email and type
  const userTypeEmail = `${googleEmail.toLowerCase()}_${userType}`;
  const user = await UserRepository.findOne(
    { userTypeEmail },
    { populate: 'userId' }
  );
  
  if (!user) {
    throw AppError.unauthorized(`No ${userType} account found with email ${googleEmail}. Please register first.`);
  }
  
  // Check if userId is properly populated
  if (!user.userId) {
    throw AppError.internal('User data is incomplete. Please contact support.');
  }
  
  // Check if account is active
  if (!user.isActive) {
    throw AppError.unauthorized('Account is deactivated. Please contact support.');
  }
  
  // Check if email is verified (skip for admin-created users with temporary passwords)
  if (!user.isEmailVerified && user.authProvider !== 'temp_password' && !user.firstLogin) {
    throw AppError.unauthorized('Email not verified. Please verify your email first.');
  }
  
  // Generate JWT token
  const token = generateToken(user._id, user.userType, user.tokenVersion || 0);
  
  // Get dashboard data based on user type
  let dashboardData = null;
  let organizationData = null;
  
  try {
    if (user.userType === 'organization_admin') {
      // Get organization dashboard data
      let organizationId = user.userId;
      if (user.userId && user.userId._id) {
        organizationId = user.userId._id;
      }
      
      const organization = await OrganizationRepository.findById(organizationId);
      if (organization) {
        organizationData = {
          id: organization._id,
          name: organization.name,
          orgCode: organization.orgCode,
          email: organization.email,
          phone: organization.phone,
          website: organization.website,
          description: organization.description,
          address: organization.address,
          foundedYear: organization.foundedYear,
          logo: organization.logo,
          departments: organization.departments || [],
          adminPermissions: organization.adminPermissions || {},
          securitySettings: organization.securitySettings || {},
          notificationSettings: organization.notificationSettings || {},
          subAdmins: organization.subAdmins || [],
          setupCompleted: organization.setupCompleted || false,
          setupCompletedAt: organization.setupCompletedAt,
          setupSkipped: organization.setupSkipped || false,
          country: organization.country,
          state: organization.state,
          city: organization.city,
          pincode: organization.pincode,
          studentStrength: organization.studentStrength,
          isGovernmentRecognized: organization.isGovernmentRecognized,
          institutionStructure: organization.institutionStructure
        };
        
        dashboardData = {
          organizationId: organization._id,
          organizationName: organization.name,
          organizationCode: organization.orgCode,
          role: 'Organization Admin',
          setupCompleted: organization.setupCompleted || false
        };
      }
    } else if (user.userType === 'teacher') {
      // Get teacher dashboard data
      const teacher = await TeacherRepository.findById(user.userId);
      if (teacher) {
        dashboardData = {
          teacherId: teacher._id,
          organizationId: teacher.organization,
          organizationName: teacher.organizationName,
          subjects: teacher.subjects,
          role: 'Teacher'
        };
      }
    } else if (user.userType === 'student') {
      // Get student dashboard data
      const student = await StudentRepository.findById(user.userId);
      if (student) {
        dashboardData = {
          studentId: student._id,
          organizationId: student.organization,
          organizationName: student.organizationName,
          academicLevel: student.academicLevel,
          grade: student.grade,
          role: 'Student'
        };
      }
    }
  } catch (dashboardError) {
    // Continue with login even if dashboard data fails
    logger.error('Error fetching dashboard data', { error: dashboardError.message, stack: dashboardError.stack, userId: req.user?.id });
  }
  
  // Update last login
  await UserRepository.updateById(user._id, { lastLogin: new Date() });
  
  return sendSuccess(res, {
    token,
    user: {
      id: user._id,
      email: user.email,
      userType: user.userType,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      firstLogin: user.firstLogin,
      organizationId: user.userType === 'organization_admin' ? 
        (user.userId && user.userId._id ? user.userId._id : user.userId) : 
        (dashboardData?.organizationId || null)
    },
    dashboard: dashboardData,
    organization: organizationData
  }, 'Google Sign-In successful', 200);
});

// Complete first-time login (change password and update profile)
const completeFirstTimeLogin = asyncWrapper(async (req, res) => {
  const { newPassword, confirmPassword, profileData } = req.body;
  const userId = req.user.id;
  
  // Validate input
  if (!newPassword || !confirmPassword) {
    throw AppError.badRequest('New password and confirmation are required');
  }
  
  if (newPassword !== confirmPassword) {
    throw AppError.badRequest('Passwords do not match');
  }
  
  // SECURITY: Enforce stronger password requirements (NIST guidelines)
  if (newPassword.length < 8) {
    throw AppError.badRequest('Password must be at least 8 characters long.');
  }
  
  // Find the user
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  
  // IMPORTANT: Organization admins do NOT require first-time login setup
  // They bypass password/profile setup wizards entirely
  if (user.userType === 'organization_admin') {
    throw AppError.badRequest('Organization admins do not require first-time login setup');
  }
  
  // Check if this is actually a first-time login
  if (!user.firstLogin) {
    throw AppError.badRequest('This is not a first-time login');
  }
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Build update data
  const updateData = {
    password: hashedPassword,
    firstLogin: false,
    authProvider: 'local' // Change from temp_password to local after first login
  };
  
  // Update profile data if provided
  if (profileData) {
    updateData.profile = user.profile || {};
    if (profileData.firstName) updateData.profile.firstName = profileData.firstName;
    if (profileData.lastName) updateData.profile.lastName = profileData.lastName;
    if (profileData.phone) updateData.profile.phone = profileData.phone;
    if (profileData.department) updateData.profile.department = profileData.department;
    if (profileData.address) updateData.profile.address = profileData.address;
  }
  
  // Update user
  await UserRepository.updateById(userId, updateData);
  
  // Update the associated Teacher or Student record if needed
  if (user.userType === 'teacher' && user.userId) {
    const teacher = await TeacherRepository.findById(user.userId);
    if (teacher && profileData) {
      const teacherUpdate = {};
      if (profileData.firstName && profileData.lastName) {
        teacherUpdate.fullName = `${profileData.firstName} ${profileData.lastName}`;
      }
      if (profileData.phone) teacherUpdate.phoneNumber = profileData.phone;
      if (profileData.department) teacherUpdate.department = profileData.department;
      if (profileData.subjects) teacherUpdate.subjects = profileData.subjects;
      if (profileData.experienceLevel) teacherUpdate.experienceLevel = profileData.experienceLevel;
      if (profileData.yearsOfExperience) teacherUpdate.yearsOfExperience = profileData.yearsOfExperience;
      
      if (Object.keys(teacherUpdate).length > 0) {
        await TeacherRepository.updateById(user.userId, teacherUpdate);
      }
    }
  } else if (user.userType === 'student' && user.userId) {
    const student = await StudentRepository.findById(user.userId);
    if (student && profileData) {
      const studentUpdate = {};
      if (profileData.firstName && profileData.lastName) {
        studentUpdate.fullName = `${profileData.firstName} ${profileData.lastName}`;
      }
      if (profileData.department) {
        studentUpdate.department = profileData.department;
        // Try to find and link to Department ID if exists in same organization
        if (student.organization && profileData.department) {
          const Department = require('../models/Department');
          const department = await Department.findOne({ 
            name: profileData.department, 
            organizationId: student.organization,
            status: 'active'
          });
          if (department) {
            studentUpdate.departmentId = department._id;
          }
        }
      }
      if (profileData.academicYear) studentUpdate.academicYear = profileData.academicYear;
      if (profileData.grade) studentUpdate.grade = profileData.grade;
      if (profileData.section) studentUpdate.section = profileData.section;
      if (profileData.dateOfBirth) studentUpdate.dateOfBirth = profileData.dateOfBirth;
      if (profileData.gender) studentUpdate.gender = profileData.gender;
      if (profileData.country) studentUpdate.country = profileData.country;
      if (profileData.city) studentUpdate.city = profileData.city;
      if (profileData.pincode) studentUpdate.pincode = profileData.pincode;
      if (profileData.rollNumber) studentUpdate.rollNumber = profileData.rollNumber;
      
      if (Object.keys(studentUpdate).length > 0) {
        await StudentRepository.updateById(user.userId, studentUpdate);
      }
      
      // Update user profile in parent User model as well
      if (profileData.firstName || profileData.lastName || profileData.department || profileData.academicYear) {
        const userProfileUpdate = { profile: user.profile || {} };
        if (profileData.firstName) userProfileUpdate.profile.firstName = profileData.firstName;
        if (profileData.lastName) userProfileUpdate.profile.lastName = profileData.lastName;
        if (profileData.department) userProfileUpdate.profile.department = profileData.department;
        if (profileData.academicYear) userProfileUpdate.profile.academicYear = profileData.academicYear;
        await UserRepository.updateById(userId, userProfileUpdate);
      }
    }
  }
  
  // Get updated user
  const updatedUser = await UserRepository.findById(userId);
  
  return sendSuccess(res, {
    user: {
      id: updatedUser._id,
      email: updatedUser.email,
      userType: updatedUser.userType,
      firstLogin: updatedUser.firstLogin,
      profile: updatedUser.profile
    }
  }, 'First-time login completed successfully', 200);
});

// Send email verification with OTP
const sendEmailVerification = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  
  // Find user
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  
  // Check if email is already verified
  // For students in first-time login, always allow email verification
  if (user.isEmailVerified && !(user.userType === 'student' && user.firstLogin)) {
    return sendSuccess(res, {
      expiresIn: 0 // No expiration since already verified
    }, 'Email is already verified', 200);
  }
  
  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Update user with OTP
  await UserRepository.updateById(userId, {
    emailVerificationToken: otpCode,
    emailVerificationExpires: otpExpires
  });
  
  // Send verification email with OTP
  // Check if email service is configured
  const hasEmailConfig = process.env.EMAIL_USER && 
                        process.env.EMAIL_PASS &&
                        process.env.EMAIL_USER !== 'your-gmail@gmail.com' &&
                        process.env.EMAIL_PASS !== 'your-app-password';
  
  if (hasEmailConfig) {
    const emailResult = await sendEmailVerificationService(
      user.email,
      user.profile?.firstName || 'User',
      otpCode
    );
    
    if (!emailResult.success) {
      throw AppError.internal(emailResult.error || 'Failed to send verification email');
    }
  }
  
  return sendSuccess(res, {
    expiresIn: 10 * 60 * 1000 // 10 minutes in milliseconds
  }, 'Verification OTP sent successfully', 200);
});

// Verify email with OTP
const verifyEmailWithOTP = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { otp } = req.body;
  
  if (!otp) {
    throw AppError.badRequest('OTP is required');
  }
  
  // Find user
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  
  // Check if email is already verified
  // For students in first-time login, allow verification even if marked as verified
  if (user.isEmailVerified && !(user.userType === 'student' && user.firstLogin)) {
    throw AppError.badRequest('Email is already verified');
  }
  
  // Check if OTP exists and is not expired
  if (!user.emailVerificationToken || !user.emailVerificationExpires) {
    throw AppError.badRequest('No verification OTP found. Please request a new one.');
  }
  
  if (new Date() > user.emailVerificationExpires) {
    throw AppError.badRequest('OTP has expired. Please request a new one.');
  }
  
  // Verify OTP
  if (user.emailVerificationToken !== otp) {
    throw AppError.badRequest('Invalid OTP. Please check and try again.');
  }
  
  // Mark email as verified
  await UserRepository.updateById(userId, {
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined
  });
  
  return sendSuccess(res, null, 'Email verified successfully', 200);
});

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyToken,
  googleSignIn,
  completeFirstTimeLogin,
  sendEmailVerification,
  verifyEmailWithOTP
};
