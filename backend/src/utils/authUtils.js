/**
 * Authentication Utilities
 * Shared functions for auth.js and userManagementAuth.js
 * 
 * This file centralizes authentication logic to prevent duplication
 * and ensure consistent behavior across all auth middlewares.
 */

const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// =============================================================================
// JWT SECRET MANAGEMENT
// =============================================================================

/**
 * Get JWT secret from environment
 * @throws {Error} If JWT_SECRET is not set
 * @returns {string} JWT secret
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required.');
  }
  return secret;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// =============================================================================
// TOKEN GENERATION & VERIFICATION
// =============================================================================

/**
 * Generate JWT token with tokenVersion for revocation support
 * @param {string} userId - User's MongoDB _id
 * @param {string} userType - User's role type
 * @param {number} tokenVersion - User's current token version (for revocation)
 * @returns {string} JWT token
 */
const generateToken = (userId, userType, tokenVersion = 0) => {
  return jwt.sign(
    { 
      userId, 
      userType,
      tokenVersion
      // Note: iat is automatically added by jwt.sign
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token with detailed error handling
 * @param {string} token - JWT token to verify
 * @returns {{ decoded: object, error: null } | { decoded: null, error: { type: string, message: string } }}
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return { decoded, error: null };
  } catch (error) {
    let errorType = 'INVALID_TOKEN';
    let message = 'Invalid token';
    
    if (error.name === 'TokenExpiredError') {
      errorType = 'TOKEN_EXPIRED';
      message = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      errorType = 'INVALID_TOKEN';
      message = 'Invalid token format.';
    } else if (error.name === 'NotBeforeError') {
      errorType = 'TOKEN_NOT_ACTIVE';
      message = 'Token not yet active.';
    }
    
    return { 
      decoded: null, 
      error: { type: errorType, message, originalError: error.message }
    };
  }
};

// =============================================================================
// TOKEN EXTRACTION
// =============================================================================

/**
 * Safely extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {{ token: string, error: null } | { token: null, error: string }}
 */
const extractToken = (authHeader) => {
  if (!authHeader) {
    return { token: null, error: 'NO_AUTH_HEADER' };
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { token: null, error: 'INVALID_AUTH_FORMAT' };
  }
  
  const token = parts[1];
  
  if (!token || token.trim() === '') {
    return { token: null, error: 'EMPTY_TOKEN' };
  }
  
  return { token, error: null };
};

// =============================================================================
// ORGANIZATION RESOLUTION
// =============================================================================

/**
 * Resolve organization ID from user record
 * This is the single source of truth for organization resolution.
 * 
 * Priority:
 * 1. user.organizationId (direct field - preferred)
 * 2. user.userId (for organization_admin, userId IS the organization)
 * 3. Populated userId.organization or userId.organizationId
 * 
 * @param {object} user - User document from database
 * @returns {string|null} Organization ID or null if not found
 */
const resolveUserOrganization = (user) => {
  // Priority 1: Direct organizationId field (new structure)
  if (user.organizationId) {
    return user.organizationId.toString();
  }
  
  // Priority 2: For organization_admin, userId IS the organization
  if (user.userType === 'organization_admin' && user.userId) {
    // userId could be populated or just an ObjectId
    const orgId = user.userId._id || user.userId;
    return orgId.toString();
  }
  
  // Priority 3: For teachers/students, check populated userId
  if ((user.userType === 'teacher' || user.userType === 'student') && user.userId) {
    // Check if userId is populated and has organization reference
    if (user.userId.organization) {
      return user.userId.organization.toString();
    }
    if (user.userId.organizationId) {
      return user.userId.organizationId.toString();
    }
  }
  
  return null;
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Log authentication event (success or failure)
 * @param {string} requestId - Request correlation ID
 * @param {string} event - Event type (AUTH_SUCCESS, AUTH_FAILED, etc.)
 * @param {object} details - Event details (sanitized, no sensitive data)
 */
const logAuthEvent = (requestId, event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: requestId || 'no-request-id',
    event,
    ...details
  };
  
  // Use different log levels based on event type
  if (event.includes('FAILED') || event.includes('DENIED') || event.includes('ERROR')) {
    logger.warn('[AUTH] Authentication event', logEntry);
  } else if (process.env.NODE_ENV === 'development') {
    // Only log successful auths in development to reduce noise
    logger.info('[AUTH] Authentication event', logEntry);
  }
};

// =============================================================================
// REQUEST USER BUILDER
// =============================================================================

/**
 * Build standardized req.user object
 * Ensures consistent shape across all auth middlewares
 * 
 * @param {object} user - User document from database
 * @param {string|null} organizationId - Resolved organization ID
 * @returns {object} Standardized req.user object
 */
const buildRequestUser = (user, organizationId) => {
  return {
    id: user._id.toString(),
    email: user.email,
    userType: user.userType,
    userModel: user.userModel,
    userId: user.userId,
    authProvider: user.authProvider,
    organizationId: organizationId,
    tokenVersion: user.tokenVersion || 0
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // JWT functions
  getJwtSecret,
  generateToken,
  verifyToken,
  JWT_EXPIRES_IN,
  
  // Token extraction
  extractToken,
  
  // Organization resolution
  resolveUserOrganization,
  
  // Logging
  logAuthEvent,
  
  // Request building
  buildRequestUser
};



