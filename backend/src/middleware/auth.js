const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { 
      userId, 
      userType,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Find user and populate user details
    const user = await User.findById(decoded.userId).populate('userId');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }
    
    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      userModel: user.userModel,
      userId: user.userId,
      userDetails: user.userId,
      authProvider: user.authProvider,
      // For organization admins, userId is the organizationId
      organizationId: user.userType === 'organization_admin' ? user.userId : null
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).populate('userId');
        
        if (user && user.isActive) {
          req.user = {
            id: user._id,
            email: user.email,
            userType: user.userType,
            userModel: user.userModel,
            userId: user.userId,
            userDetails: user.userId,
            authProvider: user.authProvider
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is organization admin
const isOrgAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'organization_admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Organization admin privileges required.'
  });
};

// Check if user is sub admin
const isSubAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'sub_admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Sub admin privileges required.'
  });
};

// Check if user is teacher
const isTeacher = (req, res, next) => {
  if (req.user && req.user.userType === 'teacher') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Teacher privileges required.'
  });
};

// Check if user is student
const isStudent = (req, res, next) => {
  if (req.user && req.user.userType === 'student') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Student privileges required.'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  isOrgAdmin,
  isSubAdmin,
  isTeacher,
  isStudent,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
