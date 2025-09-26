const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');
const admin = require('firebase-admin');

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
    
    // Ensure userId is populated for dashboard data
    await user.populate('userId');
    
    // Check if userId is properly populated
    if (!user.userId) {
      console.error('User userId is null or not populated:', user._id);
      return res.status(500).json({
        success: false,
        message: 'User data is incomplete. Please contact support.'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Check if email is verified (skip for admin-created users with temporary passwords)
    if (!user.isEmailVerified && user.authProvider !== 'temp_password' && !user.firstLogin) {
      console.log('Email verification check:', {
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        firstLogin: user.firstLogin,
        email: user.email
      });
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
    
    // Update last login (don't change firstLogin here - it should only be changed when setup is completed)
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.userType);
    
    // Get user details
    const userDetails = await user.getUserDetails();
    
    // Prepare response based on user type
    let dashboardData = {};
    let organizationData = {};
    let organization = null; // Declare organization variable outside switch
    
    switch (user.userType) {
      case 'organization_admin':
        // Get full organization data for setup wizard
        organization = await Organization.findById(user.userId);
        
        if (!organization) {
          console.error('Organization not found for user:', user.userId);
          return res.status(500).json({
            success: false,
            message: 'Organization data not found. Please contact support.'
          });
        }
        
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
          lastLogin: user.lastLogin,
          firstLogin: user.firstLogin,
          organizationId: user.userType === 'organization_admin' ? organization._id : user.userId.organizationId
        },
        dashboard: dashboardData,
        organization: organizationData
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

// Google Sign-In authentication
const googleSignIn = async (req, res) => {
  try {
    const { credential, userType } = req.body;
    
    // Validate input
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.'
      });
    }
    
    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required.'
      });
    }
    
    // Verify Google ID token (with fallback for mock tokens)
    let googleEmail;
    
    try {
      // Check if it's a test token or Firebase ID token
      if (credential === 'test-firebase-token') {
        // It's a test token, use a test email
        googleEmail = 'test@example.com';
        console.log('Using test Firebase token:', googleEmail);
      } else if (credential.split('.').length !== 3) {
        // It's a mock credential (base64 encoded JSON), decode it directly
        const mockPayload = JSON.parse(atob(credential));
        googleEmail = mockPayload.email;
        console.log('Using mock Google credential for testing:', googleEmail);
      } else {
        // It's a Firebase ID token, verify it
        const decodedToken = await admin.auth().verifyIdToken(credential);
        googleEmail = decodedToken.email;
        console.log('Using Firebase ID token:', googleEmail);
      }
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase token.'
      });
    }
    
    console.log('Google Sign-In attempt:', { email: googleEmail, userType });
    
    // Find user by email and user type
    console.log('🔍 Searching for user with email:', googleEmail, 'and type:', userType);
    const user = await User.findByEmailAndType(googleEmail, userType);
    console.log('🔍 Found user:', user ? { 
      id: user._id, 
      email: user.email, 
      userType: user.userType, 
      userId: user.userId,
      userModel: user.userModel,
      userTypeEmail: user.userTypeEmail,
      rawUserId: user.userId ? user.userId.toString() : 'null'
    } : 'No user found');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `No ${userType} account found with email ${googleEmail}. Please register first.`
      });
    }
    
    // userId should already be populated by findByEmailAndType method
    
    // Check if userId is properly populated
    if (!user.userId) {
      console.error('User userId is null or not populated:', user._id);
      return res.status(500).json({
        success: false,
        message: 'User data is incomplete. Please contact support.'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Check if email is verified (skip for admin-created users with temporary passwords)
    if (!user.isEmailVerified && user.authProvider !== 'temp_password' && !user.firstLogin) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please verify your email first.'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.userType);
    
    // Get dashboard data based on user type
    let dashboardData = null;
    let organizationData = null;
    
    try {
      if (user.userType === 'organization_admin') {
        // Get organization dashboard data
        console.log('🔍 Looking for organization with userId:', user.userId);
        console.log('🔍 UserId type:', typeof user.userId, 'UserId value:', user.userId);
        console.log('🔍 UserModel:', user.userModel);
        console.log('🔍 Full user object:', JSON.stringify(user, null, 2));
        
        // Check if userId is populated or just an ObjectId
        let organizationId = user.userId;
        if (user.userId && user.userId._id) {
          organizationId = user.userId._id;
          console.log('🔍 UserId is populated, using _id:', organizationId);
        } else {
          console.log('🔍 UserId is not populated, using raw value:', organizationId);
        }
        
        console.log('🔍 Final organizationId to search:', organizationId);
        const organization = await Organization.findById(organizationId);
        console.log('🔍 Found organization:', organization ? { id: organization._id, name: organization.name } : 'No organization found');
        
        // Also try to find all organizations to debug
        const allOrgs = await Organization.find({});
        console.log('🔍 All organizations in database:', allOrgs.map(org => ({ id: org._id, name: org.name })));
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
          
          // Get organization statistics
          const totalTeachers = await Teacher.countDocuments({ organizationId: organization._id });
          const totalStudents = await Student.countDocuments({ organizationId: organization._id });
          const totalUsers = await User.countDocuments({ userId: organization._id, userType: 'organization_admin' });
          
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
        const teacher = await Teacher.findById(user.userId);
        if (teacher) {
          const totalStudents = await Student.countDocuments({ 
            organizationId: teacher.organizationId,
            assignedTeachers: user._id 
          });
          
          dashboardData = {
            teacherId: teacher._id,
            organizationId: teacher.organizationId,
            organizationName: teacher.organizationName,
            subjects: teacher.subjects,
            role: 'Teacher'
          };
        }
      } else if (user.userType === 'student') {
        // Get student dashboard data
        const student = await Student.findById(user.userId);
        if (student) {
          dashboardData = {
            studentId: student._id,
            organizationId: student.organizationId,
            organizationName: student.organizationName,
            academicLevel: student.academicLevel,
            grade: student.grade,
            role: 'Student'
          };
        }
      }
    } catch (dashboardError) {
      console.error('Error fetching dashboard data:', dashboardError);
      // Continue with login even if dashboard data fails
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    console.log('Google Sign-In successful:', { email: googleEmail, userType });
    
    const responseData = {
      success: true,
      message: 'Google Sign-In successful',
      data: {
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
      }
    };
    
    console.log('🔍 Google Sign-In response data:', {
      user: responseData.data.user,
      hasDashboard: !!responseData.data.dashboard,
      hasOrganization: !!responseData.data.organization
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Sign-In failed. Please try again.'
    });
  }
};

// Complete first-time login (change password and update profile)
const completeFirstTimeLogin = async (req, res) => {
  try {
    const { newPassword, confirmPassword, profileData } = req.body;
    const userId = req.user.id;

    console.log('🔍 CompleteFirstTimeLogin - User ID:', userId);
    console.log('🔍 CompleteFirstTimeLogin - Request user:', req.user);

    // Validate input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if this is actually a first-time login
    if (!user.firstLogin) {
      return res.status(400).json({
        success: false,
        message: 'This is not a first-time login'
      });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user with new password and mark first login as complete
    user.password = hashedPassword;
    user.firstLogin = false;
    user.authProvider = 'local'; // Change from temp_password to local after first login
    
    // Update profile data if provided
    if (profileData) {
      if (profileData.firstName) user.profile.firstName = profileData.firstName;
      if (profileData.lastName) user.profile.lastName = profileData.lastName;
      if (profileData.phone) user.profile.phone = profileData.phone;
      if (profileData.department) user.profile.department = profileData.department;
      if (profileData.address) user.profile.address = profileData.address;
    }

    await user.save();

    // Update the associated Teacher or Student record if needed
    if (user.userType === 'teacher' && user.userId) {
      const teacher = await Teacher.findById(user.userId);
      if (teacher && profileData) {
        if (profileData.firstName && profileData.lastName) {
          teacher.fullName = `${profileData.firstName} ${profileData.lastName}`;
        }
        if (profileData.phone) teacher.phoneNumber = profileData.phone;
        if (profileData.department) teacher.department = profileData.department;
        if (profileData.subjects) teacher.subjects = profileData.subjects;
        if (profileData.experienceLevel) teacher.experienceLevel = profileData.experienceLevel;
        if (profileData.yearsOfExperience) teacher.yearsOfExperience = profileData.yearsOfExperience;
        await teacher.save();
      }
    } else if (user.userType === 'student' && user.userId) {
      const student = await Student.findById(user.userId);
      if (student && profileData) {
        if (profileData.firstName && profileData.lastName) {
          student.fullName = `${profileData.firstName} ${profileData.lastName}`;
        }
        if (profileData.phone) student.phoneNumber = profileData.phone;
        if (profileData.department) student.department = profileData.department;
        if (profileData.academicYear) student.academicYear = profileData.academicYear;
        if (profileData.grade) student.grade = profileData.grade;
        if (profileData.section) student.section = profileData.section;
        await student.save();
      }
    }

    console.log(`✅ First-time login completed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'First-time login completed successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          firstLogin: user.firstLogin,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Complete first-time login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete first-time login',
      error: error.message
    });
  }
};

// Send email verification with OTP
const sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id instead of req.user.userId
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    // For students in first-time login, always allow email verification
    if (user.isEmailVerified && !(user.userType === 'student' && user.firstLogin)) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          expiresIn: 0 // No expiration since already verified
        }
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.emailVerificationToken = otpCode;
    user.emailVerificationExpires = otpExpires;
    await user.save();

    // Send verification email with OTP
    const { sendEmailVerification } = require('../services/emailService');
    
    // Check if email service is configured
    const hasEmailConfig = process.env.EMAIL_USER && 
                          process.env.EMAIL_PASS &&
                          process.env.EMAIL_USER !== 'your-gmail@gmail.com' &&
                          process.env.EMAIL_PASS !== 'your-app-password';
    
    if (!hasEmailConfig) {
      console.log('⚠️ Email service not configured, skipping email send');
      // For development/testing, we'll just log the OTP
      console.log(`🔐 Email verification OTP for ${user.email}: ${otpCode}`);
    } else {
      const emailResult = await sendEmailVerification(
        user.email,
        user.profile?.firstName || 'User',
        otpCode
      );

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send verification email');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent successfully',
      data: {
        expiresIn: 10 * 60 * 1000 // 10 minutes in milliseconds
      }
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

// Verify email with OTP
const verifyEmailWithOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    // For students in first-time login, allow verification even if marked as verified
    if (user.isEmailVerified && !(user.userType === 'student' && user.firstLogin)) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'No verification OTP found. Please request a new one.'
      });
    }

    if (new Date() > user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.emailVerificationToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

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
