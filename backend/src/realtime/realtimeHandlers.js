const { logger: defaultLogger } = require('../utils/logger');
const { registerExamHandlers } = require('./realtimeExamHandlers');
const { registerRtcHandlers } = require('./realtimeRtcHandlers');
const { registerMonitoringHandlers } = require('./realtimeMonitoringHandlers');
const {
  unregisterSessionSocket,
  unregisterMonitoringSocket,
} = require('./realtimeSessionManager');
const ExamSession = require('../models/ExamSession');

/**
 * Register all realtime socket handlers.
 * This is the main orchestrator that delegates to specialized handler modules.
 * Dependencies are injected to avoid globals and keep testability.
 */
function registerSocketHandlers({
  io,
  dataStore,
  ExamService,
  questionBankService,
  checkRateLimit,
  broadcastToMonitoring,
  logActivity,
  broadcastTimelineUpdate,
  findStudentSocketBySessionId,
  logger = defaultLogger,
}) {
  io.on('connection', (socket) => {
    logger.info(`[SOCKET] User connected`, { socketId: socket.id, userType: socket.userType });

    // Track connection in data store
    dataStore.addConnection(socket.id, {
      userId: socket.userId,
      userType: socket.userType,
      organizationId: socket.organizationId,
      userInfo: socket.userInfo
    });

    // Register all handler groups
    registerExamHandlers({
      socket,
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

    registerMonitoringHandlers({
      socket,
      dataStore,
      checkRateLimit,
      validateSessionForEvent: require('./realtimeSessionManager').validateSessionForEvent,
      broadcastToMonitoring,
      logActivity,
      io,
      logger,
    });

    registerRtcHandlers({
      socket,
      io,
      dataStore,
      checkRateLimit,
      broadcastToMonitoring,
      logActivity,
      findStudentSocketBySessionId,
      logger,
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        logger.info('[SOCKET] User disconnected', { socketId: socket.id });
        dataStore.removeConnection(socket.id);
        
        if (socket.monitoringExamId) {
          unregisterMonitoringSocket(dataStore, socket.monitoringExamId, socket.id);
        }
        
        if (socket.sessionId && socket.examId) {
          const session = await ExamSession.findById(socket.sessionId);
          if (session) {
            session.status = 'disconnected';
            session.isConnected = false;
            session.isMonitoringActive = false;
            session.lastActivity = new Date();
            try {
              await session.save();
            } catch (saveError) {
              logger.error('[SOCKET] Session save error', { error: saveError.message });
            }
            
            if (session.status !== 'completed' && session.status !== 'submitted') {
              dataStore.updateSuspicionScore(socket.sessionId, 'abnormal_disconnect', 10);
              const updatedScore = dataStore.getSuspicionScore(socket.sessionId);
              broadcastToMonitoring(socket.examId, 'suspicion_update', {
                sessionId: socket.sessionId,
                score: updatedScore,
                latestEvent: { eventType: 'abnormal_disconnect', weight: 10 },
                isFinal: true
              });
              logActivity(socket.examId, socket.sessionId, 'suspicion_event', {
                eventType: 'abnormal_disconnect',
                weight: 10
              });
            }
          }
          
          dataStore.removeSession(socket.examId, socket.sessionId);
          unregisterSessionSocket(dataStore, socket.sessionId);
          broadcastToMonitoring(socket.examId, 'student_disconnected', {
            sessionId: socket.sessionId,
            examId: socket.examId,
            userId: socket.userId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('[SOCKET] Error in disconnect', { error: error.message });
      }
    });
  });
}

module.exports = { registerSocketHandlers };
