/**
 * Authentication Middleware
 * 
 * Provides JWT-based authentication and role-based authorization.
 * All sensitive logic is centralized in utils/authUtils.js for consistency.
 * 
 * Features:
 * - JWT token verification with detailed error handling
 * - Token version checking for revocation support
 * - Role validation against database (prevents privilege persistence)
 * - Consistent req.user shape across all middlewares
 * - Request ID correlation for all logs
 */

const User = require('../models/User');
const {
  getJwtSecret,
  generateToken,
  verifyToken,
  extractToken,
  resolveUserOrganization,
  logAuthEvent,
  buildRequestUser,
  JWT_EXPIRES_IN
} = require('../utils/authUtils');

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * Main authentication middleware
 * Validates JWT token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  
  try {
    // Step 1: Extract token from header
    const authHeader = req.headers.authorization;
    const { token, error: extractError } = extractToken(authHeader);
    
    if (extractError) {
      logAuthEvent(requestId, 'AUTH_FAILED', { reason: extractError });
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        requestId
      });
    }
    
    // Step 2: Verify token
    const { decoded, error: verifyError } = verifyToken(token);
    
    if (verifyError) {
      logAuthEvent(requestId, 'AUTH_FAILED', { 
        reason: verifyError.type,
        detail: verifyError.message 
      });
      
      // Return appropriate status code based on error type
      const statusCode = verifyError.type === 'TOKEN_EXPIRED' ? 401 : 401;
      return res.status(statusCode).json({
        success: false,
        message: verifyError.message,
        errorType: verifyError.type,
        requestId
      });
    }
    
    // Step 3: Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      logAuthEvent(requestId, 'AUTH_FAILED', { reason: 'USER_NOT_FOUND' });
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        requestId
      });
    }
    
    // Step 4: Check if account is active
    if (!user.isActive) {
      logAuthEvent(requestId, 'AUTH_FAILED', { reason: 'ACCOUNT_DEACTIVATED' });
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
        requestId
      });
    }
    
    // Step 5: Validate token version (revocation check)
    const userTokenVersion = user.tokenVersion || 0;
    const tokenTokenVersion = decoded.tokenVersion || 0;
    
    if (tokenTokenVersion < userTokenVersion) {
      logAuthEvent(requestId, 'AUTH_FAILED', { reason: 'TOKEN_REVOKED' });
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        requestId
      });
    }
    
    // Step 6: Validate userType hasn't changed (prevent privilege persistence)
    if (decoded.userType !== user.userType) {
      logAuthEvent(requestId, 'AUTH_FAILED', { 
        reason: 'ROLE_CHANGED',
        tokenRole: decoded.userType,
        currentRole: user.userType
      });
      return res.status(403).json({
        success: false,
        message: 'Your role has changed. Please login again.',
        requestId
      });
    }
    
    // Step 7: Populate user details if needed for organization resolution
    await user.populate({ path: 'userId', model: user.userModel });
    
    // Step 8: Resolve organization ID
    const organizationId = resolveUserOrganization(user);
    
    // Step 9: Build standardized req.user object
    req.user = buildRequestUser(user, organizationId);
    
    // Step 10: Log successful authentication (dev only to reduce noise)
    logAuthEvent(requestId, 'AUTH_SUCCESS', { 
      userType: user.userType,
      hasOrganization: !!organizationId
    });
    
    next();
  } catch (error) {
    logAuthEvent(requestId, 'AUTH_ERROR', { 
      error: error.message 
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      requestId
    });
  }
};

// =============================================================================
// OPTIONAL AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * Optional authentication - allows unauthenticated access but validates token if provided
 * 
 * Behavior:
 * - No Authorization header → Continue without req.user
 * - Valid token → Set req.user and continue
 * - Invalid/expired token → Return 401 (doesn't silently swallow)
 */
const optionalAuth = async (req, res, next) => {
  const requestId = req.id || 'no-request-id';
  const authHeader = req.headers.authorization;
  
  // No auth header = continue without authentication
  if (!authHeader) {
    return next();
  }
  
  // Auth header exists = must be valid
  const { token, error: extractError } = extractToken(authHeader);
  
  if (extractError) {
    // If header exists but is malformed, reject
    if (extractError === 'INVALID_AUTH_FORMAT') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format.',
        requestId
      });
    }
    // Empty token after "Bearer " = continue without auth
    return next();
  }
  
  try {
    // Verify the token
    const { decoded, error: verifyError } = verifyToken(token);
    
    if (verifyError) {
      // Invalid token = reject (don't silently swallow)
      return res.status(401).json({
        success: false,
        message: verifyError.message,
        errorType: verifyError.type,
        requestId
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      // Check token version
      const userTokenVersion = user.tokenVersion || 0;
      const tokenTokenVersion = decoded.tokenVersion || 0;
      
      if (tokenTokenVersion < userTokenVersion) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please login again.',
          requestId
        });
      }
      
      // Check role hasn't changed
      if (decoded.userType !== user.userType) {
        return res.status(403).json({
          success: false,
          message: 'Your role has changed. Please login again.',
          requestId
        });
      }
      
      // Populate and build req.user
      await user.populate({ path: 'userId', model: user.userModel });
      const organizationId = resolveUserOrganization(user);
      req.user = buildRequestUser(user, organizationId);
    }
    
    next();
  } catch (error) {
    // Database or other errors during optional auth
    logAuthEvent(requestId, 'OPTIONAL_AUTH_ERROR', { error: error.message });
    // For optional auth, continue without user on DB errors
    next();
  }
};

// =============================================================================
// ROLE-BASED AUTHORIZATION
// =============================================================================

/**
 * Role-based authorization middleware factory
 * Use: authorize('organization_admin', 'teacher')
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const requestId = req.id || 'no-request-id';
    
    if (!req.user) {
      logAuthEvent(requestId, 'AUTHZ_DENIED', { reason: 'NO_USER' });
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        requestId
      });
    }
    
    if (!allowedRoles.includes(req.user.userType)) {
      logAuthEvent(requestId, 'AUTHZ_DENIED', { 
        reason: 'INSUFFICIENT_ROLE',
        userRole: req.user.userType,
        requiredRoles: allowedRoles
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requestId
      });
    }
    
    next();
  };
};

// =============================================================================
// ROLE-SPECIFIC MIDDLEWARE (Using authorize internally)
// =============================================================================

/**
 * Check if user is organization admin
 * Equivalent to: authorize('organization_admin')
 */
const isOrgAdmin = authorize('organization_admin');

/**
 * Check if user is sub admin
 * Equivalent to: authorize('sub_admin')
 */
const isSubAdmin = authorize('sub_admin');

/**
 * Check if user is teacher
 * Equivalent to: authorize('teacher')
 */
const isTeacher = authorize('teacher');

/**
 * Check if user is student
 * Equivalent to: authorize('student')
 */
const isStudent = authorize('student');

/**
 * Check if user is admin or sub-admin
 * Equivalent to: authorize('organization_admin', 'sub_admin')
 */
const isAdminOrSubAdmin = authorize('organization_admin', 'sub_admin');

/**
 * Check if user can manage users (admin, sub-admin, or teacher)
 * Equivalent to: authorize('organization_admin', 'sub_admin', 'teacher')
 */
const canManageUsers = authorize('organization_admin', 'sub_admin', 'teacher');

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Token functions (re-export from authUtils for backward compatibility)
  generateToken,
  verifyToken: (token) => {
    // Maintain backward compatibility - return decoded or throw
    const { decoded, error } = verifyToken(token);
    if (error) {
      throw new Error(error.message);
    }
    return decoded;
  },
  getJwtSecret,
  JWT_EXPIRES_IN,
  
  // Middlewares
  authenticate,
  authorize,
  optionalAuth,
  
  // Role-specific middlewares (all using authorize internally)
  isOrgAdmin,
  isSubAdmin,
  isTeacher,
  isStudent,
  isAdminOrSubAdmin,
  canManageUsers
};
