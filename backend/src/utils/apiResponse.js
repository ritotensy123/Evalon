/**
 * API Response Utilities
 * Helper functions for standardized API responses
 * 
 * All responses follow the standard format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: object | null,
 *   error: object | null
 * }
 */

/**
 * Sanitize error object for production
 * Prevents stack trace leaks in production environment
 * @param {Error|Object|string} error - Error to sanitize
 * @returns {Object|null} - Sanitized error object or null
 */
function sanitizeError(error) {
  if (!error) return null;
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Error) {
    const sanitized = {
      message: error.message || 'An error occurred',
      name: error.name || 'Error'
    };
    
    // Only include stack trace in development
    if (isDevelopment && error.stack) {
      sanitized.stack = error.stack;
    }
    
    // Include custom error properties if they exist (e.g., statusCode from AppError)
    if (error.statusCode) {
      sanitized.statusCode = error.statusCode;
    }
    
    if (error.isOperational !== undefined) {
      sanitized.isOperational = error.isOperational;
    }
    
    return sanitized;
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (typeof error === 'object') {
    // Return safe error object (exclude internal properties)
    return {
      message: error.message || 'An error occurred',
      ...(isDevelopment ? error : {})
    };
  }
  
  return null;
}

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data (default: null)
 * @param {string} message - Success message (default: "OK")
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} - Express response
 */
function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  // Ensure status code is valid
  const validStatusCode = Number.isInteger(statusCode) && statusCode >= 100 && statusCode < 600 
    ? statusCode 
    : 200;
  
  // Ensure message is a string
  const safeMessage = typeof message === 'string' ? message : 'OK';
  
  // Extract request ID from request object
  const requestId = res.req?.id || res.locals?.requestId || null;
  const timestamp = new Date().toISOString();
  
  return res.status(validStatusCode).json({
    success: true,
    message: safeMessage,
    data: data !== undefined ? data : null,
    error: null,
    requestId: requestId,
    timestamp: timestamp
  });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Error|string|Object} error - Error object, error message, or error data
 * @param {string} message - Error message override (default: "ERROR")
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} - Express response
 */
function sendError(res, error = null, message = 'ERROR', statusCode = 500) {
  // Determine status code from error if it's an AppError
  let finalStatusCode = statusCode;
  if (error && error.statusCode && Number.isInteger(error.statusCode)) {
    finalStatusCode = error.statusCode;
  }
  
  // Ensure status code is valid
  const validStatusCode = Number.isInteger(finalStatusCode) && finalStatusCode >= 100 && finalStatusCode < 600 
    ? finalStatusCode 
    : 500;
  
  // Extract error message
  let errorMessage = message;
  if (error instanceof Error) {
    errorMessage = error.message || message;
  } else if (typeof error === 'string') {
    errorMessage = error || message;
  } else if (error && error.message) {
    errorMessage = error.message || message;
  }
  
  // Ensure message is a string
  const safeMessage = typeof errorMessage === 'string' ? errorMessage : 'ERROR';
  
  // Sanitize error for response
  const sanitizedError = sanitizeError(error);
  
  // Extract request ID from request object
  const requestId = res.req?.id || res.locals?.requestId || null;
  const timestamp = new Date().toISOString();
  
  // Format error object with code, message, and requestId
  const errorObject = sanitizedError ? {
    code: sanitizedError.statusCode || validStatusCode,
    message: sanitizedError.message || safeMessage,
    requestId: requestId,
    ...(sanitizedError.details && { details: sanitizedError.details })
  } : {
    code: validStatusCode,
    message: safeMessage,
    requestId: requestId
  };
  
  return res.status(validStatusCode).json({
    success: false,
    message: safeMessage,
    data: null,
    error: errorObject,
    requestId: requestId,
    timestamp: timestamp
  });
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items to return
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {string} message - Success message (default: "OK")
 * @returns {Object} - Express response
 */
function sendPaginated(res, items = [], total = 0, page = 1, limit = 10, message = 'OK') {
  // Ensure safe numeric values
  const safeTotal = Number.isInteger(total) && total >= 0 ? total : 0;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safeItems = Array.isArray(items) ? items : [];
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(safeTotal / safeLimit);
  const hasNext = safePage < totalPages;
  const hasPrev = safePage > 1;
  
  // Ensure message is a string
  const safeMessage = typeof message === 'string' ? message : 'OK';
  
  // Extract request ID from request object
  const requestId = res.req?.id || res.locals?.requestId || null;
  const timestamp = new Date().toISOString();
  
  return res.status(200).json({
    success: true,
    message: safeMessage,
    data: {
      items: safeItems,
      pagination: {
        currentPage: safePage,
        totalPages: totalPages,
        totalItems: safeTotal,
        itemsPerPage: safeLimit,
        hasNext: hasNext,
        hasPrev: hasPrev
      }
    },
    error: null,
    requestId: requestId,
    timestamp: timestamp
  });
}

/**
 * Legacy function names for backward compatibility
 * @deprecated Use sendSuccess instead
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return sendSuccess(res, data, message, statusCode);
}

/**
 * Legacy function names for backward compatibility
 * @deprecated Use sendError instead
 */
function fail(res, error = null, message = 'Error', statusCode = 500) {
  return sendError(res, error, message, statusCode);
}

module.exports = {
  // New standardized methods
  sendSuccess,
  sendError,
  sendPaginated,
  // Legacy methods (for backward compatibility)
  success,
  fail,
  // Utility function
  sanitizeError
};

