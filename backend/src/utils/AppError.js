/**
 * AppError
 * Base custom error class for application errors
 * 
 * Provides structured error handling with status codes and safe serialization
 */

// Default status codes for common error types
const DEFAULT_STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

class AppError extends Error {
  /**
   * Create an AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {boolean} isOperational - Whether error is operational (default: true)
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, isOperational = true, details = null) {
    super(message);
    
    // Ensure status code is valid
    this.statusCode = Number.isInteger(statusCode) && statusCode >= 100 && statusCode < 600 
      ? statusCode 
      : DEFAULT_STATUS_CODES.INTERNAL_SERVER_ERROR;
    
    this.isOperational = Boolean(isOperational);
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.details = details || null;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Serialize error to a safe object for API responses
   * Excludes stack trace in production
   * @param {boolean} includeStack - Whether to include stack trace (default: based on NODE_ENV)
   * @returns {Object} - Serialized error object
   */
  toJSON(includeStack = null) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const shouldIncludeStack = includeStack !== null ? includeStack : isDevelopment;
    
    const serialized = {
      name: this.name || 'AppError',
      message: this.message || 'An error occurred',
      statusCode: this.statusCode,
      status: this.status,
      isOperational: this.isOperational,
      timestamp: this.timestamp
    };
    
    // Include details if present
    if (this.details) {
      serialized.details = this.details;
    }
    
    // Include stack trace only in development or if explicitly requested
    if (shouldIncludeStack && this.stack) {
      serialized.stack = this.stack;
    }
    
    return serialized;
  }
  
  /**
   * Get a safe error message for client responses
   * Returns user-friendly message without sensitive information
   * @returns {string} - Safe error message
   */
  getSafeMessage() {
    // In production, return generic message for non-operational errors
    if (!this.isOperational && process.env.NODE_ENV === 'production') {
      return 'An unexpected error occurred. Please try again later.';
    }
    
    return this.message || 'An error occurred';
  }
  
  /**
   * Create a Bad Request error (400)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.BAD_REQUEST, true, details);
  }
  
  /**
   * Create an Unauthorized error (401)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static unauthorized(message = 'Unauthorized', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.UNAUTHORIZED, true, details);
  }
  
  /**
   * Create a Forbidden error (403)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static forbidden(message = 'Forbidden', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.FORBIDDEN, true, details);
  }
  
  /**
   * Create a Not Found error (404)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static notFound(message = 'Resource not found', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.NOT_FOUND, true, details);
  }
  
  /**
   * Create a Conflict error (409)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static conflict(message = 'Resource conflict', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.CONFLICT, true, details);
  }
  
  /**
   * Create a Validation error (422)
   * @param {string} message - Error message
   * @param {Object} details - Validation errors
   * @returns {AppError} - AppError instance
   */
  static validationError(message = 'Validation failed', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.VALIDATION_ERROR, true, details);
  }
  
  /**
   * Create an Internal Server error (500)
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {AppError} - AppError instance
   */
  static internal(message = 'Internal server error', details = null) {
    return new AppError(message, DEFAULT_STATUS_CODES.INTERNAL_SERVER_ERROR, false, details);
  }
}

// Export default status codes for convenience
AppError.STATUS_CODES = DEFAULT_STATUS_CODES;

module.exports = AppError;

