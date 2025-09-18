const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Invitation = require('../models/Invitation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { store, retrieve, remove } = require('../utils/tempStorage');

// Get all users for an organization
const getAllUserManagements = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, role, status, search } = req.query;

    // Get all users for this organization
    let organizationUsers = await User.find({
      $or: [
        { userType: 'organization_admin', userId: organizationId },
        { userType: 'teacher', userId: { $in: await Teacher.find({ organizationId }).select('_id') } },
        { userType: 'student', userId: { $in: await Student.find({ organizationId }).select('_id') } }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 });

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

    // Format users for response
    const formattedUsers = paginatedUsers.map(user => ({
      _id: user._id,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      email: user.email,
      userType: user.userType,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      department: user.profile?.department || null
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

// Create new user
const createUserManagement = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      role,
      department,
      status = 'active',
      password,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyPhone,
      notes,
      organizationId
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Create user - this function needs to be redesigned for the User model
    // For now, return an error as this requires creating Teacher/Student records first
    return res.status(400).json({
      success: false,
      message: 'User creation through this endpoint is not supported. Please use the appropriate registration endpoints.'
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

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password').populate('userId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: user
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
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
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

        // Bulk user creation is not supported with the current User model structure
        // Users must be created through the proper registration flow
        results.failed.push({
          email: userData.email,
          error: 'Bulk user creation not supported. Use registration endpoints.'
        });
        continue;

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
      data: results
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

module.exports = {
  getAllUserManagements,
  getUserManagementById,
  createUserManagement,
  updateUserManagement,
  deleteUserManagement,
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
  getUsersByRole
};
