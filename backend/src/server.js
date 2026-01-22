const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
// Rate limiting is now handled by middleware/rateLimiter.js
const session = require('express-session');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { config, corsConfig, validateEnv } = require('./config/server');
const { runStartupValidation } = require('./startup/startupRunner');
const { logger, requestLogger } = require('./utils/logger');

// Read version from package.json
const { version } = require('../package.json');

// Validate environment variables early (moved to startServer for non-blocking)
// validateEnv();

// =============================================================================
// SERVER STATE
// =============================================================================
let server = null;
let isShuttingDown = false;

// =============================================================================
// API VERSIONING
// =============================================================================
const API_PREFIX = '/api/v1';

// Import routes
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const locationRoutes = require('./routes/locationRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const userActivityRoutes = require('./routes/userActivityRoutes');
const userPermissionRoutes = require('./routes/userPermissionRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const questionBankRoutes = require('./routes/questionBankRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const teacherClassRoutes = require('./routes/teacherClassRoutes');
const healthRoutes = require('./routes/healthRoutes');
const timeRoutes = require('./routes/timeRoutes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// =============================================================================
// SECURITY MIDDLEWARE (First)
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration (centralized in config/server.js)
app.use(cors(corsConfig));

// =============================================================================
// REQUEST ID MIDDLEWARE (Early - needed for logging)
// =============================================================================
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// =============================================================================
// STATIC FILES (Before session/body parsing for efficiency)
// =============================================================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================================================
// COMPRESSION & LOGGING
// =============================================================================
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Use winston request logger
app.use(requestLogger);

// Keep morgan for development (additional detail)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =============================================================================
// RATE LIMITING
// =============================================================================
const { standardRateLimiter } = require('./middleware/rateLimiter');
app.use('/api/', standardRateLimiter);

// =============================================================================
// BODY PARSING
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// SESSION MIDDLEWARE
// =============================================================================
if (!process.env.SESSION_SECRET) {
  logger.error('FATAL: SESSION_SECRET environment variable is required.');
  logger.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 60 * 1000,
  },
  name: 'evalon.session'
}));

// =============================================================================
// REQUEST TIMEOUT MIDDLEWARE
// =============================================================================
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

app.use('/api/', (req, res, next) => {
  // Skip timeout for file uploads
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Request timeout - server took too long to respond',
        requestId: req.id
      });
    }
  });
  next();
});

// =============================================================================
// SHUTDOWN CHECK MIDDLEWARE
// =============================================================================
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({
      success: false,
      message: 'Server is shutting down'
    });
  }
  next();
});

// =============================================================================
// API ROUTES (Versioned: /api/v1/*)
// =============================================================================
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/organizations`, organizationRoutes);
app.use(`${API_PREFIX}/locations`, locationRoutes);
app.use(`${API_PREFIX}/teachers`, teacherRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/user-management`, userManagementRoutes);
app.use(`${API_PREFIX}/user-activity`, userActivityRoutes);
app.use(`${API_PREFIX}/user-permissions`, userPermissionRoutes);
app.use(`${API_PREFIX}/exams`, examRoutes);
app.use(`${API_PREFIX}/questions`, questionRoutes);
app.use(`${API_PREFIX}/question-banks`, questionBankRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/subjects`, subjectRoutes);
app.use(`${API_PREFIX}/bulk-upload`, bulkUploadRoutes);
app.use(`${API_PREFIX}/teacher-classes`, teacherClassRoutes);
app.use(`${API_PREFIX}/health`, healthRoutes);
app.use(`${API_PREFIX}/time`, timeRoutes);

// =============================================================================
// HEALTH CHECK (without API prefix for frontend compatibility)
// =============================================================================
// Mount health routes at root /health for frontend compatibility
app.use('/health', healthRoutes);

// =============================================================================
// BACKWARD COMPATIBILITY: Redirect /api/* to /api/v1/*
// =============================================================================
app.use('/api/:path(*)', (req, res, next) => {
  // Skip if already v1
  if (req.params.path.startsWith('v1/')) {
    return next();
  }
  // Redirect to versioned API
  const newUrl = `/api/v1/${req.params.path}`;
  res.redirect(307, newUrl); // 307 preserves HTTP method
});

// =============================================================================
// ROOT ENDPOINT
// =============================================================================
app.get('/', (req, res) => {
  if (isProduction) {
    // Minimal info in production
    return res.status(200).json({
      success: true,
      status: 'running',
      version
    });
  }
  
  // Full endpoint map in development
  res.status(200).json({
    success: true,
    message: 'Welcome to Evalon Backend API',
    version,
    apiVersion: 'v1',
    endpoints: {
      health: `${API_PREFIX}/health`,
      organizations: `${API_PREFIX}/organizations`,
      locations: `${API_PREFIX}/locations`,
      teachers: `${API_PREFIX}/teachers`,
      students: `${API_PREFIX}/students`,
      userManagement: `${API_PREFIX}/user-management`,
      userActivity: `${API_PREFIX}/user-activity`,
      userPermissions: `${API_PREFIX}/user-permissions`,
      departments: `${API_PREFIX}/departments`,
      subjects: `${API_PREFIX}/subjects`,
      time: `${API_PREFIX}/time`
    }
  });
});

// =============================================================================
// 404 HANDLER (Standard Express pattern)
// =============================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    requestId: req.id
  });
});

// =============================================================================
// GLOBAL ERROR HANDLER (Must be after all routes)
// =============================================================================
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
const { setupShutdownHandlers } = require('./utils/gracefulShutdown');

// Setup shutdown handlers (will be configured after server starts)
let shutdownHandlersSetup = false;

// =============================================================================
// SERVER STARTUP
// =============================================================================
const startServer = async () => {
  try {
    // Quick MongoDB connection (skip validation for faster startup)
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evalon';
    await mongoose.connect(mongoUri, { dbName: 'evalon' });
    logger.info('✅ MongoDB connected (quick mode)');
    
    // Initialize Firebase (non-blocking)
    try {
      initializeFirebase();
    } catch (fbError) {
      logger.warn('Firebase initialization skipped:', fbError.message);
    }
    
    // Create HTTP server and store reference for graceful shutdown
    server = http.createServer(app);
    
    server.listen(config.PORT, () => {
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`🚀 Evalon Main Server v${version}`);
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 API Base URL: ${config.API_BASE_URL}${API_PREFIX}`);
      logger.info(`❤️  Health Check: ${config.API_BASE_URL}${API_PREFIX}/health`);
      logger.info(`⚡ Real-time Server: ${config.REALTIME_URL}`);
      logger.info(`🌐 CORS Origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
      logger.info('═══════════════════════════════════════════════════════════');
      
      // Setup graceful shutdown handlers after server starts
      if (!shutdownHandlersSetup) {
        setupShutdownHandlers({
          httpServer: server,
          mongoose: mongoose,
          // Note: io (Socket.IO) is handled in realtimeServer.js
        });
        shutdownHandlersSetup = true;
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;

