/**
 * User Management Authentication Middleware
 * 
 * Specialized authentication for user management routes.
 * Uses shared logic from utils/authUtils.js for consistency with auth.js.
 * 
 * Key differences from standard auth.js:
 * - Includes organization membership validation
 * - Provides user action logging
 * - Has specialized rate limiting for user operations
 */

const User = require('../models/User');
const Organization = require('../models/Organization');
const {
  verifyToken,
  extractToken,
  resolveUserOrganization,
  logAuthEvent,
  buildRequestUser
} = require('../utils/authUtils');

// =============================================================================
// USER MANAGEMENT AUTHENTICATION
// =============================================================================

/**
 * Authenticate user management requests
 * Similar to standard auth but with organization resolution required
 */
const authenticateUserManagement = async (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  
  try {
    // Step 1: Extract token
    const authHeader = req.header('Authorization');
    const { token, error: extractError } = extractToken(authHeader);
    
    if (extractError) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { reason: extractError });
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        requestId
      });
    }

    // Step 2: Verify token
    const { decoded, error: verifyError } = verifyToken(token);
    
    if (verifyError) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { 
        reason: verifyError.type 
      });
      return res.status(401).json({
        success: false,
        message: verifyError.message,
        errorType: verifyError.type,
        requestId
      });
    }
    
    // Step 3: Find user (exclude password)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { reason: 'USER_NOT_FOUND' });
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        requestId
      });
    }

    // Step 4: Check if user is active
    if (!user.isActive) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { reason: 'ACCOUNT_INACTIVE' });
      return res.status(401).json({
        success: false,
        message: 'Account is not active.',
        requestId
      });
    }

    // Step 5: Validate token version
    const userTokenVersion = user.tokenVersion || 0;
    const tokenTokenVersion = decoded.tokenVersion || 0;
    
    if (tokenTokenVersion < userTokenVersion) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { reason: 'TOKEN_REVOKED' });
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        requestId
      });
    }

    // Step 6: Validate userType
    if (decoded.userType !== user.userType) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { reason: 'ROLE_CHANGED' });
      return res.status(403).json({
        success: false,
        message: 'Your role has changed. Please login again.',
        requestId
      });
    }

    // Step 7: Populate user details for organization resolution
    await user.populate({ path: 'userId', model: user.userModel });
    
    // Step 8: Resolve organization ID using shared function
    const organizationId = resolveUserOrganization(user);
    
    // User management requires organization context
    if (!organizationId) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { 
        reason: 'NO_ORGANIZATION',
        userType: user.userType
      });
      return res.status(403).json({
        success: false,
        message: 'Unable to determine organization membership.',
        requestId
      });
    }
    
    // Step 9: Verify organization access if organizationId in params
    if (req.params.organizationId && organizationId !== req.params.organizationId) {
      logAuthEvent(requestId, 'USER_MGMT_AUTH_FAILED', { 
        reason: 'ORGANIZATION_MISMATCH' 
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this organization.',
        requestId
      });
    }

    // Step 10: Build standardized req.user
    req.user = buildRequestUser(user, organizationId);
    
    // Add profile for user management context
    req.user.profile = user.profile;

    logAuthEvent(requestId, 'USER_MGMT_AUTH_SUCCESS', { 
      userType: user.userType 
    });

    next();

  } catch (error) {
    logAuthEvent(requestId, 'USER_MGMT_AUTH_ERROR', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      requestId
    });
  }
};

// =============================================================================
// ROLE CHECKS (Using shared authorize logic pattern)
// =============================================================================

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  
  if (!req.user || req.user.userType !== 'organization_admin') {
    logAuthEvent(requestId, 'AUTHZ_DENIED', { 
      reason: 'ADMIN_REQUIRED',
      userRole: req.user?.userType 
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      requestId
    });
  }
  next();
};

/**
 * Require admin or sub-admin role
 */
const requireAdminOrSubAdmin = (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  const allowedRoles = ['organization_admin', 'sub_admin'];
  
  if (!req.user || !allowedRoles.includes(req.user.userType)) {
    logAuthEvent(requestId, 'AUTHZ_DENIED', { 
      reason: 'ADMIN_OR_SUBADMIN_REQUIRED',
      userRole: req.user?.userType 
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Sub-admin privileges required.',
      requestId
    });
  }
  next();
};

/**
 * Check if user can manage other users
 */
const canManageUsers = (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  const allowedRoles = ['organization_admin', 'sub_admin', 'teacher'];
  
  if (!req.user || !allowedRoles.includes(req.user.userType)) {
    logAuthEvent(requestId, 'AUTHZ_DENIED', { 
      reason: 'USER_MANAGEMENT_DENIED',
      userRole: req.user?.userType 
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to manage users.',
      requestId
    });
  }
  next();
};

/**
 * Check if user can view user data
 */
const canViewUsers = (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  
  // Admins and sub_admins can view all users
  if (['organization_admin', 'sub_admin'].includes(req.user?.userType)) {
    return next();
  }
  
  // Teachers can view students
  if (req.user?.userType === 'teacher') {
    return next();
  }
  
  // Students can only view their own data
  if (req.user?.userType === 'student' && req.params.userId === req.user.id) {
    return next();
  }
  
  logAuthEvent(requestId, 'AUTHZ_DENIED', { 
    reason: 'VIEW_USER_DENIED',
    userRole: req.user?.userType 
  });
  return res.status(403).json({
    success: false,
    message: 'Access denied. You do not have permission to view this user data.',
    requestId
  });
};

// =============================================================================
// ORGANIZATION MEMBERSHIP VALIDATION
// =============================================================================

/**
 * Validate that user belongs to the organization in params
 */
const validateOrganizationMembership = async (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.',
        requestId
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.',
        requestId
      });
    }

    // Check if user belongs to this organization
    if (!req.user?.organizationId || req.user.organizationId.toString() !== organizationId) {
      logAuthEvent(requestId, 'ORG_MEMBERSHIP_DENIED', { 
        userOrg: req.user?.organizationId,
        requestedOrg: organizationId
      });
      return res.status(403).json({
        success: false,
        message: 'You do not belong to this organization.',
        requestId
      });
    }

    req.organization = organization;
    next();

  } catch (error) {
    logAuthEvent(requestId, 'ORG_MEMBERSHIP_ERROR', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error validating organization membership.',
      requestId
    });
  }
};

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limit user management operations
 * Simple in-memory implementation
 */
const rateLimitUserOperations = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, times] of requests.entries()) {
      const validTimes = times.filter(t => t > now - windowMs);
      if (validTimes.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimes);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const requestId = req.id || 'no-request-id';
    const key = `${req.user?.id || 'anon'}_${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create request history
    let userRequests = requests.get(key) || [];
    userRequests = userRequests.filter(time => time > windowStart);
    
    if (userRequests.length >= max) {
      logAuthEvent(requestId, 'RATE_LIMITED', { 
        userId: req.user?.id,
        ip: req.ip 
      });
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        requestId
      });
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    next();
  };
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Log user management actions (after response)
 */
const logUserAction = (action) => {
  return (req, res, next) => {
    const requestId = req.id || 'no-request-id';
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action (sanitized - no sensitive data)
      const logEntry = {
        requestId,
        action,
        userId: req.user?.id,
        userType: req.user?.userType,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        success: res.statusCode < 400
      };
      
      const { logger } = require('../utils/logger');
      if (process.env.NODE_ENV === 'development' || !logEntry.success) {
        if (logEntry.success) {
          logger.info(`[USER_ACTION][${requestId}]`, logEntry);
        } else {
          logger.warn(`[USER_ACTION][${requestId}]`, logEntry);
        }
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

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
