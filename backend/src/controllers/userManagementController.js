const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Invitation = require('../models/Invitation');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { store, retrieve, remove } = require('../utils/tempStorage');
const { sendRegistrationEmail, sendTemporaryCredentialsEmail } = require('../services/emailService');
const { config } = require('../config/server');
const { generateToken } = require('../middleware/auth');
const UserService = require('../services/UserService');
const OrganizationService = require('../services/OrganizationService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');

// Get all users for an organization
const getAllUserManagements = asyncWrapper(async (req, res) => {
  const { organizationId } = req.params;
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    role: req.query.role,
    status: req.query.status,
    search: req.query.search,
    departmentId: req.query.departmentId,
    userType: req.query.userType
  };

  const result = await UserService.getAllUserManagements(filters, organizationId);

  return sendSuccess(res, result, 'OK', 200);
});

// Get user by ID
const getUserManagementById = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const organizationId = req.params.organizationId || req.user?.organizationId;

  const user = await UserService.getUserById(userId, organizationId);

  return sendSuccess(res, user, 'OK', 200);
});

// Create new user (Teacher or Student) - Admin creates without password
const createUserManagement = asyncWrapper(async (req, res) => {
  const organizationId = req.body.organizationId || req.user?.organizationId;
  const createdBy = req.user?.id || req.user?.userId;

  const result = await UserService.createUserManagement(req.body, organizationId, createdBy);

  const role = req.body.role || 'user';
  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
  
  return sendSuccess(res, {
    user: result.user,
    userRecord: result.userRecord
  }, `${roleCapitalized} created successfully. Temporary credentials sent via email.`, 201);
});

// Update user
const updateUserManagement = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const organizationId = req.params.organizationId || req.user?.organizationId;
  let updateData = req.body;

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

  const user = await UserService.updateUser(userId, updateData, organizationId);

  return sendSuccess(res, user, 'User updated successfully', 200);
});

// Delete user
const deleteUserManagement = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const organizationId = req.params.organizationId || req.user?.organizationId;

  await UserService.deleteUserManagement(userId, organizationId);

  return sendSuccess(res, null, 'User permanently deleted successfully', 200);
});

// Suspend/Activate user (toggle isActive status)
const toggleUserStatus = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body;
  const organizationId = req.params.organizationId || req.user?.organizationId;

  const updated = await UserService.toggleUserStatus(userId, organizationId, action);

  const statusText = action === 'activate' ? 'activated' : 'suspended';
  
  return sendSuccess(res, updated, `User ${statusText} successfully`, 200);
});

// Bulk create users from CSV
const bulkCreateUserManagements = asyncWrapper(async (req, res) => {
  const { users } = req.body;
  const organizationId = req.body.organizationId || req.user?.organizationId;
  const createdBy = req.user?.id || req.user?.userId;

  const result = await UserService.bulkCreateUsers(users, organizationId, createdBy);

  return sendSuccess(res, result, `Bulk user creation completed. ${result.successCount} successful, ${result.failureCount} failed.`, 200);
});

// Send invitation email
const sendInvitation = asyncWrapper(async (req, res) => {
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
    throw AppError.badRequest('Email and role are required');
  }

  // Validate role
  const validRoles = ['teacher', 'student', 'sub_admin'];
  if (!validRoles.includes(role)) {
    throw AppError.badRequest('Invalid role. Must be teacher, student, or sub_admin');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    email: email.toLowerCase()
  });

  if (existingUser) {
    throw AppError.badRequest('User with this email already exists');
  }

  // Check if there's already a pending invitation
  const existingInvitation = await Invitation.findPendingByEmail(email.toLowerCase(), organizationId);
  if (existingInvitation) {
    throw AppError.badRequest('A pending invitation already exists for this email');
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
  // SECURITY: Invitation tokens must never be logged

  return sendSuccess(res, {
    id: invitation._id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    invitationLink: `${config.FRONTEND_URL}/invite/${invitation.token}`
  }, 'Invitation sent successfully', HTTP_STATUS.OK);
});

// Get invitation by token
const getInvitation = asyncWrapper(async (req, res) => {
  const { token } = req.params;

  const invitation = await Invitation.findByToken(token);
  
  if (!invitation) {
    throw AppError.notFound('Invitation not found or expired');
  }

  // Get organization details
  const organization = await Organization.findById(invitation.organizationId);
  
  return sendSuccess(res, {
    id: invitation._id,
    email: invitation.email,
    role: invitation.role,
    organizationId: invitation.organizationId,
    organizationName: organization?.name || 'Unknown Organization',
    metadata: invitation.metadata,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt
  }, 'Invitation retrieved successfully', HTTP_STATUS.OK);
});

// Accept invitation and create user
const acceptInvitation = asyncWrapper(async (req, res) => {
  const { token } = req.params;
  const { password, firstName, lastName, phone, countryCode } = req.body;

  if (!password || !firstName || !lastName) {
    throw AppError.badRequest('Password, first name, and last name are required');
  }

  // Get invitation
  const invitation = await Invitation.findByToken(token);
  
  if (!invitation) {
    throw AppError.notFound('Invitation not found or expired');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    email: invitation.email
  });

  if (existingUser) {
    throw AppError.badRequest('User with this email already exists');
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
      throw AppError.badRequest('Sub-admin creation through invitation is not yet implemented');
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

    // Generate JWT token (with tokenVersion for revocation support)
    const jwtToken = generateToken(newUser._id, newUser.userType, newUser.tokenVersion || 0);

    return sendSuccess(res, {
      user: {
        id: newUser._id,
        email: newUser.email,
        userType: newUser.userType,
        profile: newUser.profile
      },
      token: jwtToken
    }, 'Invitation accepted successfully. User created.', HTTP_STATUS.OK);
});

// Get user statistics
const getUserManagementStats = asyncWrapper(async (req, res) => {
  const { organizationId } = req.params;

  const stats = await UserService.getUserStatistics(organizationId);

  return sendSuccess(res, stats, 'OK', 200);
});

// Get role distribution for organization
const getRoleDistribution = asyncWrapper(async (req, res) => {
  const { organizationId } = req.params;

    // Get all users for this organization - use the same logic as getAllUserManagements
    let organizationUsers = await User.find({
      $or: [
        { organizationId: organizationId }, // Regular users (teachers, students)
        { userType: 'organization_admin', userId: organizationId } // Organization admin users
      ]
    });

    // Also fetch teachers and students from their respective models (same logic as getAllUserManagements)
    const allTeachers = await Teacher.find({
      organization: organizationId
    }).select('firstName lastName email phoneNumber subjects role organizationName yearsOfExperience status departments organization createdAt');

    const allStudents = await Student.find({
      organization: organizationId
    }).select('firstName lastName email phoneNumber academicYear grade section rollNumber studentCode status department organization createdAt');

    // Convert teachers to User-like format
    const teacherUsers = allTeachers.map(teacher => ({
      _id: teacher._id,
      email: teacher.email,
      userType: 'teacher',
      userId: teacher._id,
      isActive: teacher.status === 'active',
      organizationId: teacher.organization,
      profile: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phoneNumber,
        department: teacher.departments
      },
      createdAt: teacher.createdAt,
      teacherData: {
        subjects: teacher.subjects,
        yearsOfExperience: teacher.yearsOfExperience,
        role: teacher.role,
        organizationName: teacher.organizationName
      }
    }));

    // Convert students to User-like format
    const studentUsers = allStudents.map(student => ({
      _id: student._id,
      email: student.email,
      userType: 'student',
      userId: student._id,
      isActive: student.status === 'active',
      organizationId: student.organization,
      profile: {
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phoneNumber,
        department: student.department
      },
      createdAt: student.createdAt,
      studentData: {
        academicYear: student.academicYear,
        grade: student.grade,
        section: student.section,
        rollNumber: student.rollNumber,
        studentCode: student.studentCode
      }
    }));

    // Combine all users
    organizationUsers = [...organizationUsers, ...teacherUsers, ...studentUsers];

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

    return sendSuccess(res, result, 'Role distribution retrieved successfully', HTTP_STATUS.OK);
});

// Get recent activity for organization
const getRecentActivity = asyncWrapper(async (req, res) => {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;

    // Get all users for this organization - use the same logic as getAllUserManagements
    const organizationUsers = await User.find({
      $or: [
        { organizationId: organizationId }, // Regular users (teachers, students)
        { userType: 'organization_admin', userId: organizationId } // Organization admin users
      ]
    })
      .select('email userType lastLogin profile createdAt isActive')
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

    return sendSuccess(res, recentActivity, 'Recent activity retrieved successfully', HTTP_STATUS.OK);
});

// Get users by role for organization
const getUsersByRole = asyncWrapper(async (req, res) => {
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

  return sendSuccess(res, organizationUsers, 'Users retrieved successfully', HTTP_STATUS.OK);
});

// Update user role
const updateUserManagementRole = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const { role, department } = req.body;

  if (!role) {
    throw AppError.badRequest('Role is required');
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
    throw AppError.notFound('User not found');
  }

  return sendSuccess(res, user, 'User role updated successfully', HTTP_STATUS.OK);
});

// Get all invitations for an organization
const getInvitations = asyncWrapper(async (req, res) => {
  const { organizationId } = req.params;
  const organizationIdParam = organizationId || req.user?.organizationId;
  const status = req.query.status || 'all';

  const result = await UserService.getInvitedUsers(organizationIdParam, status);

  return sendSuccess(res, result.invitations, 'OK', 200);
});

// Cancel/Delete invitation
const cancelInvitation = asyncWrapper(async (req, res) => {
  const { invitationId } = req.params;

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw AppError.notFound('Invitation not found');
  }

  await invitation.cancel();

  return sendSuccess(res, null, 'Invitation cancelled successfully', HTTP_STATUS.OK);
});

// Resend invitation
const resendInvitation = asyncWrapper(async (req, res) => {
  const { invitationId, userId } = req.params;
  const id = invitationId || userId; // Support both
  const organizationId = req.params.organizationId || req.user?.organizationId;
  const requestedBy = req.user?.id || req.user?.userId;

  // If invitationId is provided, use it; otherwise use userId
  const useInvitationId = !!invitationId;

  const result = await UserService.resendInvitation(id, organizationId, requestedBy, useInvitationId);

  return sendSuccess(res, {
    invitationLink: result.invitationLink
  }, 'Invitation resent successfully', 200);
});

// Bulk send invitations
const bulkSendInvitations = asyncWrapper(async (req, res) => {
  const { invitations } = req.body;
  const organizationId = req.params.organizationId || req.user?.organizationId;
  const invitedBy = req.user?.userId || req.user?.id;

  const result = await UserService.inviteUsers(invitations, organizationId, invitedBy);

  return sendSuccess(res, result, `Processed ${result.total || invitations.length} invitations`, 200);
});

// Update user role
const updateUserRole = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  if (!newRole) {
    throw AppError.badRequest('New role is required');
  }

  const validRoles = ['teacher', 'student', 'sub_admin'];
  if (!validRoles.includes(newRole)) {
    throw AppError.badRequest('Invalid role. Must be teacher, student, or sub_admin');
  }

  const user = await User.findById(userId).populate('userId');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Update user role
  user.userType = newRole;
  await user.save();

  return sendSuccess(res, {
    userId: user._id,
    email: user.email,
    newRole: user.userType
  }, 'User role updated successfully', HTTP_STATUS.OK);
});

// Bulk update users
const bulkUpdateUsers = asyncWrapper(async (req, res) => {
  const payload = req.body;
  const organizationId = req.user?.organizationId || req.body.organizationId;
  const updatedBy = req.user?.id || req.user?.userId;

  const result = await UserService.bulkUpdateUsers(payload, organizationId, updatedBy);

  return sendSuccess(res, result, 'Bulk user update completed', 200);
});

// Bulk update user roles
const bulkUpdateUserRoles = asyncWrapper(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw AppError.badRequest('Updates array is required');
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
      logger.error('Error updating user role in bulk', { userId: update.userId, error: error.message });
      errors.push({ userId: update.userId, error: error.message });
    }
  }

  return sendSuccess(res, {
    successful: results,
    errors: errors
  }, `Processed ${updates.length} role updates`, HTTP_STATUS.OK);
});

// Get registration details by token
const getRegistrationDetails = asyncWrapper(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    registrationToken: token,
    isRegistrationComplete: false,
    registrationExpires: { $gt: new Date() }
  }).populate('userId');

  if (!user) {
    throw AppError.notFound('Registration token not found or expired');
  }

  // Get organization details
  const organization = await Organization.findById(user.userId.organizationId);
  
  return sendSuccess(res, {
    id: user._id,
    email: user.email,
    userType: user.userType,
    organizationId: user.userId.organizationId,
    organizationName: organization?.name || 'Unknown Organization',
    organizationCode: user.organizationCode,
    profile: user.profile,
    expiresAt: user.registrationExpires,
    createdAt: user.createdAt
  }, 'Registration details retrieved successfully', HTTP_STATUS.OK);
});

// Complete user registration
const completeRegistration = asyncWrapper(async (req, res) => {
  const { token } = req.params;
  const { password, organizationCode } = req.body;

  if (!password || !organizationCode) {
    throw AppError.badRequest('Password and organization code are required');
  }

  // Find user by token
  const user = await User.findOne({
    registrationToken: token,
    isRegistrationComplete: false,
    registrationExpires: { $gt: new Date() }
  }).populate('userId');

  if (!user) {
    throw AppError.notFound('Registration token not found or expired');
  }

  // Validate organization code
  if (user.organizationCode !== organizationCode.toUpperCase()) {
    throw AppError.badRequest('Invalid organization code');
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

  // Generate JWT token (with tokenVersion for revocation support)
  const jwtToken = generateToken(user._id, user.userType, user.tokenVersion || 0);

  return sendSuccess(res, {
    user: {
      id: user._id,
      email: user.email,
      userType: user.userType,
      isActive: user.isActive,
      isRegistrationComplete: user.isRegistrationComplete,
      profile: user.profile
    },
    token: jwtToken
  }, 'Registration completed successfully. User can now login.', HTTP_STATUS.OK);
});

// Validate organization code
const validateOrganizationCode = asyncWrapper(async (req, res) => {
  const { token, organizationCode } = req.body;

  if (!token || !organizationCode) {
    throw AppError.badRequest('Token and organization code are required');
  }

  const user = await User.findOne({
    registrationToken: token,
    isRegistrationComplete: false,
    registrationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw AppError.notFound('Registration token not found or expired');
  }

  const isValid = user.organizationCode === organizationCode.toUpperCase();

  return sendSuccess(res, {
    isValid,
    message: isValid ? 'Organization code is valid' : 'Invalid organization code'
  }, 'Organization code validation completed', HTTP_STATUS.OK);
});

// Bulk delete users
const bulkDeleteUserManagements = asyncWrapper(async (req, res) => {
  const { userIds } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw AppError.badRequest('User IDs are required');
  }

  logger.info('Bulk delete users', { count: userIds.length });

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

      logger.debug('Deleted user', { userId });
    } catch (error) {
      logger.error('Failed to delete user', { userId, error: error.message });
      failedDeletions.push({ userId, error: error.message });
    }
  }

  return sendSuccess(res, {
    deletedCount,
    failedDeletions,
    totalRequested: userIds.length
  }, `Successfully deleted ${deletedCount} users`, HTTP_STATUS.OK);
});

// Bulk toggle user status
const bulkToggleUserManagementStatus = asyncWrapper(async (req, res) => {
  const { userIds, action } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw AppError.badRequest('User IDs are required');
  }

  if (!action || !['suspend', 'activate'].includes(action)) {
    throw AppError.badRequest('Valid action (suspend/activate) is required');
  }

  logger.info('Bulk toggle user status', { count: userIds.length, action });

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
      logger.debug('User status updated', { userId, action });
    } catch (error) {
      logger.error('Failed to update user status', { userId, action, error: error.message });
      failedUpdates.push({ userId, error: error.message });
    }
  }

  return sendSuccess(res, {
    updatedCount,
    failedUpdates,
    totalRequested: userIds.length,
    action
  }, `Successfully ${action}ed ${updatedCount} users`, HTTP_STATUS.OK);
});

// Remove user from department
const removeUserFromDepartment = asyncWrapper(async (req, res) => {
  const { departmentId, userId } = req.params;
  const organizationId = req.user.organizationId;

  // Verify department exists and belongs to organization
  const department = await Department.findOne({
    _id: departmentId,
    organizationId
  });

  if (!department) {
    throw AppError.notFound('Department not found');
  }

  // Get user and verify they belong to organization
  const user = await User.findOne({
    _id: userId,
    organizationId
  });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Remove user from department based on user type
  if (user.userType === 'teacher') {
    await Teacher.findByIdAndUpdate(user.userId, {
      $unset: { departmentId: 1 }
    });
  } else if (user.userType === 'student') {
    await Student.findByIdAndUpdate(user.userId, {
      $unset: { departmentId: 1 }
    });
  }

  return sendSuccess(res, null, 'User removed from department successfully', HTTP_STATUS.OK);
});

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
  bulkUpdateUsers,
  bulkUpdateUserRoles,
  getRoleDistribution,
  getRecentActivity,
  getUsersByRole,
  getRegistrationDetails,
  completeRegistration,
  validateOrganizationCode,
  bulkDeleteUserManagements,
  bulkToggleUserManagementStatus,
  removeUserFromDepartment
};
