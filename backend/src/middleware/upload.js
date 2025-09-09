const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate temporary filename first
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E6);
    
    // Create temporary filename - will be renamed later with proper org context
    const tempFilename = `temp_${timestamp}_${randomSuffix}${extension}`;
    
    cb(null, tempFilename);
  }
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  const fileType = req.body.fileType || req.query.fileType || 'logo';
  
  if (fileType === 'logo') {
    // For logos, only allow images
    if (file.mimetype.startsWith('image/')) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, JPG, PNG, GIF, and WebP images are allowed for logos'), false);
      }
    } else {
      cb(new Error('Only image files are allowed for logos'), false);
    }
  } else if (fileType === 'document') {
    // For documents, allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, Excel, text files, and images are allowed for documents'), false);
    }
  } else {
    // Default: allow images and common documents
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
};

// Configure multer with dynamic limits based on file type
const getFileSizeLimit = (fileType) => {
  switch (fileType) {
    case 'logo':
      return 2 * 1024 * 1024; // 2MB for logos
    case 'document':
      return 10 * 1024 * 1024; // 10MB for documents
    default:
      return 5 * 1024 * 1024; // 5MB default
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit (will be overridden by fileFilter)
    files: 1 // Only one file at a time
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware wrapper with error handling
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const fileType = req.body.fileType || req.query.fileType || 'logo';
      const maxSize = getFileSizeLimit(fileType);
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File size too large. Maximum size is ${maxSizeMB}MB for ${fileType} files.`
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Utility function to delete uploaded file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file URL
const getFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Utility function to parse filename and extract organization info
const parseFilename = (filename) => {
  const parts = filename.split('_');
  if (parts.length >= 4) {
    return {
      fileType: parts[0],
      orgCode: parts[1],
      orgName: parts[2],
      timestamp: parts[3],
      randomSuffix: parts[4]?.split('.')[0],
      extension: parts[4]?.split('.')[1] || ''
    };
  }
  return null;
};

// Utility function to generate filename for different contexts
const generateFilename = (fileType, orgCode, orgName, extension, documentType = null) => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E6);
  
  // Clean organization name for filename (remove special characters)
  const cleanOrgName = orgName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  const cleanOrgCode = orgCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  
  // Create descriptive filename
  let filename = `${fileType}_${cleanOrgCode}_${cleanOrgName}_${timestamp}_${randomSuffix}`;
  
  // Add document type if specified
  if (documentType && documentType !== 'general') {
    filename = `${fileType}_${cleanOrgCode}_${cleanOrgName}_${documentType}_${timestamp}_${randomSuffix}`;
  }
  
  return `${filename}${extension}`;
};

// Utility function to rename uploaded file with proper organization context
const renameFileWithContext = (tempFilePath, orgCode, orgName, fileType, documentType = null) => {
  try {
    const extension = path.extname(tempFilePath);
    const newFilename = generateFilename(fileType, orgCode, orgName, extension, documentType);
    const newFilePath = path.join(path.dirname(tempFilePath), newFilename);
    
    // Rename the file
    fs.renameSync(tempFilePath, newFilePath);
    
    return {
      success: true,
      newFilename,
      newFilePath
    };
  } catch (error) {
    console.error('Error renaming file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  handleUpload,
  deleteFile,
  getFileUrl,
  parseFilename,
  generateFilename,
  renameFileWithContext,
  getFileSizeLimit,
  upload
};
