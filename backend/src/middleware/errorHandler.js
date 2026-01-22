/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling for all Express routes
 * Uses AppError and apiResponse utilities for consistent error responses
 * 
 * Must be added AFTER all routes in server.js
 */

const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');
const { logger } = require('../utils/logger');

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Global error handler middleware
 * Handles all errors thrown in Express routes
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with request ID for tracing
  const requestId = req.id || 'unknown';
  
  // Log detailed error information
  const errorDetails = {
    message: err.message || 'Unknown error',
    name: err.name || 'Error',
    path: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode || 500,
    requestId
  };
  
  // Log stack trace in development
  if (isDevelopment && err.stack) {
    errorDetails.stack = err.stack;
  }
  
  // Use appropriate log level based on error type
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', errorDetails);
  } else {
    logger.error('Unexpected error', errorDetails);
  }
  
  // Handle AppError instances (operational errors)
  if (err instanceof AppError) {
    return sendError(res, err, err.getSafeMessage(), err.statusCode);
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    const validationError = AppError.validationError(
      'Validation failed',
      { errors: validationErrors }
    );
    
    return sendError(res, validationError, validationError.message, validationError.statusCode);
  }
  
  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicateError = AppError.conflict(
      `${field} already exists`,
      { field, value: err.keyValue?.[field] }
    );
    
    return sendError(res, duplicateError, duplicateError.message, duplicateError.statusCode);
  }
  
  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const castError = AppError.badRequest(
      `Invalid ${err.path || 'parameter'}`,
      { path: err.path, value: err.value }
    );
    
    return sendError(res, castError, castError.message, castError.statusCode);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const jwtError = AppError.unauthorized('Invalid token');
    return sendError(res, jwtError, jwtError.message, jwtError.statusCode);
  }
  
  if (err.name === 'TokenExpiredError') {
    const expiredError = AppError.unauthorized('Token expired');
    return sendError(res, expiredError, expiredError.message, expiredError.statusCode);
  }
  
  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    let multerMessage = 'File upload error';
    let statusCode = 400;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      multerMessage = 'File too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      multerMessage = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      multerMessage = 'Unexpected file field';
    }
    
    const multerError = AppError.badRequest(multerMessage, { code: err.code });
    return sendError(res, multerError, multerError.message, multerError.statusCode);
  }
  
  // Handle unknown/programming errors (non-operational)
  // These are unexpected errors that should be logged but not exposed to clients
  const internalError = AppError.internal(
    isDevelopment ? err.message : 'An unexpected error occurred'
  );
  
  // Log full error details for debugging (only in development)
  if (isDevelopment) {
    logger.debug('Full error details', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      requestId
    });
  }
  
  return sendError(res, internalError, internalError.getSafeMessage(), internalError.statusCode);
};

module.exports = errorHandler;


