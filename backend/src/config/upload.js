/**
 * File Upload Configuration
 * 
 * Centralized multer configuration for file uploads
 * Uses environment-based limits and secure storage paths
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const { FILE_UPLOAD } = require('../constants');

// =============================================================================
// UPLOAD DIRECTORY CONFIGURATION
// =============================================================================

/**
 * Get upload directory path
 * @param {string} subdirectory - Optional subdirectory (e.g., 'logos', 'documents')
 * @returns {string} Full path to upload directory
 */
const getUploadDir = (subdirectory = '') => {
  const baseDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const uploadDir = subdirectory ? path.join(baseDir, subdirectory) : baseDir;
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Created upload directory: ${uploadDir}`);
  }
  
  return uploadDir;
};

// =============================================================================
// FILE SIZE LIMITS
// =============================================================================

const getFileSizeLimit = () => {
  const envLimit = parseInt(process.env.MAX_FILE_SIZE_MB);
  if (envLimit) {
    return envLimit * 1024 * 1024; // Convert MB to bytes
  }
  return FILE_UPLOAD.MAX_SIZE; // Default from constants
};

// =============================================================================
// FILE TYPE VALIDATION
// =============================================================================

/**
 * Validate file type
 * @param {string} mimetype - File MIME type
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if file type is allowed
 */
const validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Create file filter for multer
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @param {string} fieldName - Field name for error messages
 * @returns {Function} Multer file filter function
 */
const createFileFilter = (allowedTypes, fieldName = 'file') => {
  return (req, file, cb) => {
    if (validateFileType(file.mimetype, allowedTypes)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      logger.warn('File upload rejected - invalid type', {
        requestId: req.id || 'unknown',
        filename: file.originalname,
        mimetype: file.mimetype,
        allowedTypes,
      });
      cb(error, false);
    }
  };
};

// =============================================================================
// STORAGE CONFIGURATIONS
// =============================================================================

/**
 * Memory storage (for temporary processing)
 * Use when files need to be processed before saving
 */
const memoryStorage = multer.memoryStorage();

/**
 * Disk storage with organized directory structure
 * @param {string} subdirectory - Subdirectory for file organization
 * @returns {multer.StorageEngine} Multer storage engine
 */
const createDiskStorage = (subdirectory = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = getUploadDir(subdirectory);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  });
};

// =============================================================================
// PRE-CONFIGURED UPLOAD MIDDLEWARES
// =============================================================================

/**
 * Image upload configuration
 * For logos, avatars, profile pictures
 */
const imageUpload = multer({
  storage: memoryStorage, // Use memory for processing
  limits: {
    fileSize: getFileSizeLimit(),
  },
  fileFilter: createFileFilter(FILE_UPLOAD.ALLOWED_IMAGE_TYPES, 'image'),
});

/**
 * Document upload configuration
 * For PDFs, CSV files, documents
 */
const documentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: getFileSizeLimit() * 2, // Documents can be larger (20MB default)
  },
  fileFilter: createFileFilter(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES, 'document'),
});

/**
 * CSV upload configuration
 * For bulk uploads (teachers, students, etc.)
 */
const csvUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: getFileSizeLimit() * 2, // CSV files can be larger
  },
  fileFilter: createFileFilter(['text/csv', 'application/vnd.ms-excel'], 'csv'),
});

/**
 * Generic file upload (disk storage)
 * For permanent file storage
 */
const createFileUpload = (options = {}) => {
  const {
    subdirectory = '',
    maxSize = getFileSizeLimit(),
    allowedTypes = [...FILE_UPLOAD.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES],
  } = options;

  return multer({
    storage: createDiskStorage(subdirectory),
    limits: {
      fileSize: maxSize,
    },
    fileFilter: createFileFilter(allowedTypes, 'file'),
  });
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Multer error handler middleware
 * Converts multer errors to standardized API errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${Math.round(getFileSizeLimit() / 1024 / 1024)}MB`,
        code: 'FILE_TOO_LARGE',
        requestId: req.id || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
        code: 'TOO_MANY_FILES',
        requestId: req.id || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE_FIELD',
        requestId: req.id || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_FILE_TYPE',
      requestId: req.id || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
  
  next(err);
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Storage
  memoryStorage,
  createDiskStorage,
  getUploadDir,
  
  // Pre-configured uploads
  imageUpload,
  documentUpload,
  csvUpload,
  createFileUpload,
  
  // Utilities
  validateFileType,
  createFileFilter,
  getFileSizeLimit,
  handleUploadError,
  
  // Constants
  FILE_UPLOAD,
};





