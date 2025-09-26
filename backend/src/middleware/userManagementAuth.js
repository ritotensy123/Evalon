const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Middleware to authenticate user management requests
const authenticateUserManagement = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    // Find user in User collection
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    // Get organization ID based on user type
    let organizationId = null;
    if (user.userType === 'organization_admin') {
      organizationId = user.userId.toString();
    } else if (user.userType === 'teacher' || user.userType === 'student') {
      // For teachers and students, we need to get the organization from their profile
      await user.populate('userId');
      if (user.userId && user.userId.organizationId) {
        organizationId = user.userId.organizationId.toString();
      }
    }
    
    // If we still don't have an organizationId, try to get it from the user's profile or other sources
    if (!organizationId) {
      console.error('Could not determine organizationId for user:', user._id, 'userType:', user.userType);
      return res.status(403).json({
        success: false,
        message: 'Unable to determine organization membership.'
      });
    }

    // Verify organization access
    if (req.params.organizationId && organizationId && organizationId !== req.params.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this organization.'
      });
    }

    // Add user info to request
    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      userType: user.userType,
      organizationId: organizationId,
      profile: user.profile
    };

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    next();

  } catch (error) {
    console.error('User management authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'organization_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Middleware to check if user is admin or sub_admin
const requireAdminOrSubAdmin = (req, res, next) => {
  if (!['organization_admin', 'sub_admin'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Sub-admin privileges required.'
    });
  }
  next();
};

// Middleware to check if user can manage other users
const canManageUsers = (req, res, next) => {
  // Allow organization admins, sub-admins, and teachers to manage users
  if (!['organization_admin', 'sub_admin', 'teacher'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to manage users.'
    });
  }
  next();
};

// Middleware to check if user can view user data
const canViewUsers = (req, res, next) => {
  // Admins and sub_admins can view all users
  if (['organization_admin', 'sub_admin'].includes(req.user.userType)) {
    return next();
  }
  
  // Teachers can view students
  if (req.user.userType === 'teacher') {
    return next();
  }
  
  // Students can only view their own data
  if (req.user.userType === 'student' && req.params.userId === req.user.id) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to view this user data.'
  });
};

// Middleware to validate organization membership
const validateOrganizationMembership = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.'
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    // Check if user belongs to this organization
    if (req.user.organizationId.toString() !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'You do not belong to this organization.'
      });
    }

    req.organization = organization;
    next();

  } catch (error) {
    console.error('Organization membership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating organization membership.',
      error: error.message
    });
  }
};

// Middleware to rate limit user management operations
const rateLimitUserOperations = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = `${req.user.id}_${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
    
    userRequests.push(now);
    next();
  };
};

// Middleware to log user management actions
const logUserAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action
      console.log(`User Management Action: ${action}`, {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        action,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateUserManagement,
  requireAdmin,
  requireAdminOrSubAdmin,
  canManageUsers,
  canViewUsers,
  validateOrganizationMembership,
  rateLimitUserOperations,
  logUserAction
};
