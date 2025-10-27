const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
// Socket functionality moved to dedicated servers

// Import models
const Exam = require('./models/Exam');

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

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
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

// CORS configuration
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for registration flow
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: true, // Changed to true to save new sessions
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  name: 'evalon.session'
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug JWT secret endpoint
app.get('/api/debug-jwt-secret', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  res.json({
    jwtSecret: jwtSecret,
    hasEnvVar: !!process.env.JWT_SECRET,
    envVarValue: process.env.JWT_SECRET || 'not set'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Evalon Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/user-activity', userActivityRoutes);
app.use('/api/user-permissions', userPermissionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/teacher-classes', teacherClassRoutes);
app.use('/api/health', healthRoutes);

// Time synchronization endpoint
app.get('/api/time', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    unix: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

// Exam countdown endpoint for real-time synchronization
app.get('/api/exams/:examId/countdown', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const now = new Date();
    let scheduledDateTime;
    
    // Parse exam start time
    if (exam.scheduledDate instanceof Date) {
      scheduledDateTime = new Date(exam.scheduledDate);
      const [hours, minutes] = exam.startTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else if (typeof exam.scheduledDate === 'string') {
      let datePart;
      if (exam.scheduledDate.includes('T')) {
        datePart = exam.scheduledDate.split('T')[0];
      } else {
        datePart = exam.scheduledDate;
      }
      scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
    }

    const examEndTime = new Date(scheduledDateTime.getTime() + exam.duration * 60 * 1000);
    
    let timeRemaining = 0;
    let examStatus = 'waiting';
    
    if (now >= scheduledDateTime && now < examEndTime) {
      // Exam is active
      timeRemaining = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));
      examStatus = 'active';
    } else if (now < scheduledDateTime) {
      // Exam hasn't started yet
      const timeUntilStart = Math.floor((scheduledDateTime.getTime() - now.getTime()) / 1000);
      timeRemaining = timeUntilStart;
      examStatus = 'scheduled';
    } else {
      // Exam has ended
      timeRemaining = 0;
      examStatus = 'ended';
    }

    res.json({
      success: true,
      data: {
        examId,
        timeRemaining,
        examStatus,
        examStartTime: scheduledDateTime.toISOString(),
        examEndTime: examEndTime.toISOString(),
        serverTime: now.toISOString(),
        duration: exam.duration
      }
    });
  } catch (error) {
    console.error('Error getting exam countdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exam countdown'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Evalon Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      organizations: '/api/organizations',
      locations: '/api/locations',
      teachers: '/api/teachers',
      students: '/api/students',
      userManagement: '/api/user-management',
      userActivity: '/api/user-activity',
      userPermissions: '/api/user-permissions',
      departments: '/api/departments',
      subjects: '/api/subjects',
      documentation: '/api-docs'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Firebase
    initializeFirebase();
    
    const PORT = process.env.PORT || 5001;
    
    // Create HTTP server
    const server = http.createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 Evalon Main Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ Real-time Server: http://localhost:5004`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
