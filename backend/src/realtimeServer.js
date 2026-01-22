const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import configurations
const { config, corsConfig, socketCorsConfig, validateEnv } = require('./config/server');
const { ports } = require('./config/ports');
const { logger } = require('./utils/logger');
const { WEBSOCKET } = require('./constants');
const { applyAIRules } = require('./realtime/realtimeAIRules');
const RealtimeDataStore = require('./realtime/realtimeDataStore');
const { registerHealthIntervals } = require('./realtime/realtimeHealth');

// Import centralized database connection
const connectDB = require('./config/database');

// Import auth utilities for token verification
const { verifyToken, resolveUserOrganization } = require('./utils/authUtils');

// Validate environment variables early
validateEnv();

// Import models
const User = require('./models/User');
const Exam = require('./models/Exam');
const ExamSession = require('./models/ExamSession');
const ExamActivityLog = require('./models/ExamActivityLog');
const questionBankService = require('./services/questionBankService');
const ExamService = require('./services/ExamService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: socketCorsConfig,
  // Performance optimizations
  transports: ['websocket'], // Force WebSocket for better performance
  pingTimeout: WEBSOCKET.PING_TIMEOUT,
  pingInterval: WEBSOCKET.PING_INTERVAL,
  upgradeTimeout: WEBSOCKET.UPGRADE_TIMEOUT,
  maxHttpBufferSize: WEBSOCKET.MAX_HTTP_BUFFER_SIZE,
  allowEIO3: true,
  // Connection pooling
  connectionStateRecovery: {
    maxDisconnectionDuration: WEBSOCKET.MAX_DISCONNECTION_DURATION,
    skipMiddlewares: true
  }
});

// Middleware (CORS centralized in config/server.js)
app.use(cors(corsConfig));
app.use(express.json());

// HIGH-4 FIX: WebSocket rate limiting
const socketRateLimiter = new Map(); // socketId -> { event -> { count, resetTime } }

function checkRateLimit(socketId, event, maxRequests = 10, windowMs = 1000) {
  const now = Date.now();

  if (!socketRateLimiter.has(socketId)) {
    socketRateLimiter.set(socketId, new Map());
  }

  const socketLimits = socketRateLimiter.get(socketId);

  if (!socketLimits.has(event)) {
    socketLimits.set(event, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const limit = socketLimits.get(event);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

// HIGH-6 FIX: Unified monitoring broadcast helper
// Broadcasts events to all teachers monitoring a specific exam
function broadcastToMonitoring(examId, eventName, payload) {
  if (!examId) {
    logger.warn(`Broadcast skipped - no examId provided for ${eventName}`);
    return 0;
  }
  
  // Use Socket.IO room for efficient broadcasting
  const roomName = `monitoring_${examId}`;
  io.to(roomName).emit(eventName, payload);
  
  // Get count for logging (from dataStore if available, otherwise estimate)
  const socketCount = dataStore?.getMonitoringSockets(examId)?.length || 0;
  
  if (socketCount > 0) {
    logger.info(`Monitoring broadcast → ${eventName}`, { examId, listeners: socketCount });
  }
  
  return socketCount;
}

// HIGH-7 FIX: Helper to find student socket by session ID
function findStudentSocketBySessionId(sessionId) {
  if (!sessionId) return null;
  
  const sessionIdStr = sessionId.toString();
  for (const [, socket] of io.sockets.sockets) {
    if (socket.sessionId?.toString() === sessionIdStr && socket.userType === 'student') {
      return socket;
    }
  }
  return null;
}

// HIGH-8 FIX: Audit trail logging helper
// Non-blocking async write to ExamActivityLog collection
// IMPORTANT: No PII (names, emails, deviceInfo) should be passed in metadata
function logActivity(examId, sessionId, eventType, metadata = {}) {
  // Skip if no examId or sessionId
  if (!examId || !sessionId) {
    return;
  }
  
  // Sanitize metadata - remove any potential PII
  const sanitizedMetadata = { ...metadata };
  const piiFields = ['name', 'email', 'phone', 'userInfo', 'deviceInfo', 'password', 'token', 'student'];
  piiFields.forEach(field => {
    if (sanitizedMetadata[field]) {
      delete sanitizedMetadata[field];
    }
  });
  
  // Non-blocking write - don't await
  ExamActivityLog.create({
    examId,
    sessionId,
    eventType,
    timestamp: new Date(),
    metadata: sanitizedMetadata
  }).catch(err => {
    // Log error without exposing details
    logger.error(`[AUDIT] Failed to log activity: ${eventType}`, { examId, sessionId, eventType });
  });
}

// Timeline update broadcast helper
function broadcastTimelineUpdate(examId, sessionId, event) {
  if (!examId || !event) return;
  
  broadcastToMonitoring(examId, 'timeline_update', {
    sessionId,
    latestEvent: {
      timestamp: event.timestamp,
      type: event.type,
      severity: event.severity,
      message: event.message
    }
  });
}

const {
  validateSessionForEvent,
  registerMonitoringSocket,
  unregisterMonitoringSocket,
  registerSessionSocket,
  unregisterSessionSocket,
} = require('./realtime/realtimeSessionManager');

const { registerMonitoringHandlers } = require('./realtime/realtimeMonitoringHandlers');
// AI rule engine and realtime data store moved to ./realtime modules

const dataStore = new RealtimeDataStore();

// Database connection - uses centralized connection module
// Note: connectDB is imported from ./config/database.js above
// This ensures consistent database connection across all servers

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('[SOCKET] No token provided in handshake', { socketId: socket.id });
      return next(new Error('Authentication error: No token provided'));
    }

    // Use centralized token verification from authUtils
    const { decoded, error: tokenError } = verifyToken(token);
    
    if (tokenError) {
      logger.warn(`[SOCKET] Token verification failed: ${tokenError.type}`, { socketId: socket.id, errorType: tokenError.type });
      return next(new Error(`Authentication error: ${tokenError.message}`));
    }
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      logger.warn('[SOCKET] User not found for token', { socketId: socket.id, userId: decoded.userId });
      return next(new Error('Authentication error: User not found'));
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn('[SOCKET] User account is deactivated', { socketId: socket.id, userId: user._id });
      return next(new Error('Authentication error: Account deactivated'));
    }
    
    // Validate token version (revocation check)
    const userTokenVersion = user.tokenVersion || 0;
    const tokenTokenVersion = decoded.tokenVersion || 0;
    if (tokenTokenVersion < userTokenVersion) {
      logger.warn('[SOCKET] Token has been revoked', { socketId: socket.id, userId: user._id });
      return next(new Error('Authentication error: Token revoked. Please login again.'));
    }
    
    // Validate userType hasn't changed (prevent privilege persistence)
    if (decoded.userType !== user.userType) {
      logger.warn('[SOCKET] User role has changed since token was issued', { 
        socketId: socket.id, 
        userId: user._id,
        tokenUserType: decoded.userType,
        currentUserType: user.userType
      });
      return next(new Error('Authentication error: Role changed. Please login again.'));
    }
    
    // Resolve organization ID using shared function
    await user.populate({ path: 'userId', model: user.userModel });
    const organizationId = resolveUserOrganization(user);

    // Set socket properties
    socket.userId = user._id.toString();
    socket.userType = user.userType;
    socket.organizationId = organizationId;
    socket.userInfo = {
      name: user.profile?.firstName || user.profile?.fullName || 'User',
      id: user._id.toString()
    };

    logger.info(`[SOCKET] Authenticated`, { socketId: socket.id, userType: user.userType, userId: user._id });
    next();
  } catch (error) {
    logger.error('[SOCKET] Authentication error', { error: error.message, stack: error.stack, socketId: socket.id });
    next(new Error('Authentication error: ' + error.message));
  }
});

// Import socket handlers orchestrator
const { registerSocketHandlers } = require('./realtime/realtimeHandlers');

// Socket connection handling
// Socket handlers registered via extracted module
registerSocketHandlers({
  io,
  dataStore,
  ExamService,
  questionBankService,
  checkRateLimit,
  broadcastToMonitoring,
  logActivity,
  broadcastTimelineUpdate,
  findStudentSocketBySessionId,
  logger,
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected for realtime server');

    // Start server
    const PORT = config.REALTIME_PORT;
    server.listen(PORT, () => {
      logger.info(`Realtime server running on port ${PORT}`);
      logger.info(`Socket.IO server ready for connections`);
    });

    // Register health intervals (AI periodic recheck)
    registerHealthIntervals({
      dataStore,
      io,
      broadcastToMonitoring,
      logActivity,
      logger,
    });

    // Setup graceful shutdown handlers
    const { setupShutdownHandlers } = require('./utils/gracefulShutdown');
    setupShutdownHandlers({
      server,
      io,
      logger,
      serviceName: 'realtime-server',
    });
  } catch (error) {
    logger.error('Failed to start realtime server', { error: error.message, stack: error.stack });
    throw error;
  }
}

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start realtime server', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = { app, server, io, dataStore };
