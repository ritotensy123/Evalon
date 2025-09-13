const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');

// Login user
const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }
    
    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required.'
      });
    }
    
    // Find user by email and user type
    const user = await User.findByEmailAndType(email, userType);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.userType);
    
    // Get user details
    const userDetails = await user.getUserDetails();
    
    // Prepare response based on user type
    let dashboardData = {};
    
    switch (user.userType) {
      case 'organization_admin':
        dashboardData = {
          organizationId: user.userId._id,
          organizationName: user.userId.organizationName,
          organizationCode: user.userId.organizationCode,
          role: 'Organization Admin'
        };
        break;
        
      case 'sub_admin':
        dashboardData = {
          organizationId: user.userId.organizationId,
          organizationName: user.userId.organizationName,
          role: 'Sub Admin'
        };
        break;
        
      case 'teacher':
        dashboardData = {
          teacherId: user.userId._id,
          organizationId: user.userId.organizationId,
          organizationName: user.userId.organizationName,
          subjects: user.userId.subjects,
          role: 'Teacher'
        };
        break;
        
      case 'student':
        dashboardData = {
          studentId: user.userId._id,
          organizationId: user.userId.organizationId,
          organizationName: user.userId.organizationName,
          academicLevel: user.userId.academicLevel,
          grade: user.userId.grade,
          role: 'Student'
        };
        break;
    }
    
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        dashboard: dashboardData
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('userId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    const userDetails = await user.getUserDetails();
    
    res.status(200).json({
      success: true,
      data: userDetails
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, countryCode } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Update profile information
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phoneNumber) user.profile.phoneNumber = phoneNumber;
    if (countryCode) user.profile.countryCode = countryCode;
    
    if (firstName && lastName) {
      user.profile.fullName = `${firstName} ${lastName}`;
    }
    
    await user.save();
    
    const userDetails = await user.getUserDetails();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: userDetails
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Logout (client-side token removal, but we can track it)
const logout = async (req, res) => {
  try {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success as token removal is handled client-side
    
    res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Verify token endpoint
const verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticate middleware passed)
    const user = await User.findById(req.user.id).populate('userId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    const userDetails = await user.getUserDetails();
    
    res.status(200).json({
      success: true,
      message: 'Token is valid.',
      data: userDetails
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyToken
};
