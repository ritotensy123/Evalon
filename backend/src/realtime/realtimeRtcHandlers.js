const ExamSession = require('../models/ExamSession');
const { logger: defaultLogger } = require('../utils/logger');
const { WEBSOCKET } = require('../constants');

function registerRtcHandlers({
  socket,
  io,
  dataStore,
  checkRateLimit,
  broadcastToMonitoring,
  logActivity,
  findStudentSocketBySessionId,
  logger = defaultLogger,
}) {
  // Health / metrics
  socket.on('heartbeat', (data) => {
    if (!checkRateLimit(socket.id, 'heartbeat', WEBSOCKET.RATE_LIMIT.HEARTBEAT.max, WEBSOCKET.RATE_LIMIT.HEARTBEAT.window)) {
      logger.warn(`[RATE LIMIT] heartbeat blocked`, { socketId: socket.id });
      return;
    }
    dataStore.updateHeartbeat(socket.id);
    if (socket.sessionId) {
      dataStore.recordHeartbeat(socket.sessionId);
    }
    socket.emit('heartbeat_ack', { 
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      clientTime: data?.clientTime
    });
  });

  socket.on('heartbeat_rtt', (data) => {
    try {
      const { rtt } = data || {};
      if (!socket.sessionId || typeof rtt !== 'number') return;

      const health = dataStore.updateRTT(socket.sessionId, rtt);
      if (socket.examId && health) {
        broadcastToMonitoring(socket.examId, 'health_update', {
          sessionId: socket.sessionId,
          examId: socket.examId,
          health: { rtt: health.rtt, jitter: health.jitter, packetLoss: health.packetLoss },
          timestamp: new Date()
        });
        let networkWeight = 0;
        if (health.rtt > 600) {
          dataStore.updateSuspicionScore(socket.sessionId, 'high_rtt', 5);
          networkWeight += 5;
        }
        if (health.packetLoss > 20) {
          dataStore.updateSuspicionScore(socket.sessionId, 'high_packet_loss', 10);
          networkWeight += 10;
        }
        if (networkWeight > 0) {
          const score = dataStore.getSuspicionScore(socket.sessionId);
          broadcastToMonitoring(socket.examId, 'suspicion_update', {
            sessionId: socket.sessionId,
            score,
            latestEvent: { eventType: 'network_instability', weight: networkWeight }
          });
          logActivity(socket.examId, socket.sessionId, 'suspicion_event', {
            eventType: 'network_instability',
            weight: networkWeight
          });
        }
      }
    } catch (error) {
      logger.error('Error in heartbeat_rtt', { error: error.message });
    }
  });

  socket.on('client_metrics', (data) => {
    try {
      const { fps, cpuLoad, tabVisible, cameraActive, micActive } = data || {};
      if (!socket.sessionId) return;
      const health = dataStore.updateSessionHealth(socket.sessionId, {
        fps: typeof fps === 'number' ? fps : undefined,
        cpuLoad: typeof cpuLoad === 'number' ? cpuLoad : undefined,
        tabVisible: typeof tabVisible === 'boolean' ? tabVisible : undefined,
        cameraActive: typeof cameraActive === 'boolean' ? cameraActive : undefined,
        micActive: typeof micActive === 'boolean' ? micActive : undefined
      }, Date.now());
      if (socket.examId && health) {
        broadcastToMonitoring(socket.examId, 'health_update', {
          sessionId: socket.sessionId,
          examId: socket.examId,
          health,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error in client_metrics', { error: error.message });
    }
  });

  // WebRTC signalling
  socket.on('webrtc_offer', (data) => {
    try {
      const { examId, sessionId, offer } = data || {};
      if (!examId || !sessionId || !offer) {
        socket.emit('webrtc_error', { message: 'Invalid WebRTC offer payload' });
        return;
      }
      io.to(`exam_${examId}`).emit('webrtc_offer', { sessionId, offer, senderId: socket.id });
    } catch (error) {
      logger.error('Error in webrtc_offer', { error: error.message });
    }
  });

  socket.on('webrtc_answer', (data) => {
    try {
      const { examId, sessionId, answer } = data || {};
      if (!examId || !sessionId || !answer) {
        socket.emit('webrtc_error', { message: 'Invalid WebRTC answer payload' });
        return;
      }
      io.to(`exam_${examId}`).emit('webrtc_answer', { sessionId, answer, senderId: socket.id });
    } catch (error) {
      logger.error('Error in webrtc_answer', { error: error.message });
    }
  });

  socket.on('webrtc_ice_candidate', (data) => {
    try {
      const { examId, sessionId, candidate } = data || {};
      if (!examId || !sessionId || !candidate) {
        socket.emit('webrtc_error', { message: 'Invalid ICE candidate payload' });
        return;
      }
      io.to(`exam_${examId}`).emit('webrtc_ice_candidate', { sessionId, candidate, senderId: socket.id });
    } catch (error) {
      logger.error('Error in webrtc_ice_candidate', { error: error.message });
    }
  });

  socket.on('request_webrtc_offer', (data) => {
    try {
      const { sessionId } = data || {};
      if (!['teacher', 'admin', 'organization_admin'].includes(socket.userType)) {
        socket.emit('webrtc_error', { message: 'Unauthorized' });
        return;
      }
      const studentSocket = findStudentSocketBySessionId(sessionId);
      if (studentSocket) {
        studentSocket.emit('request_webrtc_offer', {
          requesterId: socket.id,
          examId: studentSocket.examId,
          timestamp: new Date()
        });
      } else {
        socket.emit('webrtc_error', { message: 'Student not connected' });
      }
    } catch (error) {
      logger.error('Error in request_webrtc_offer', { error: error.message });
    }
  });

  socket.on('request_screen_share', (data) => {
    try {
      const { sessionId } = data || {};
      io.to(`session_${sessionId}`).emit('request_screen_share', { requesterId: socket.id, timestamp: new Date() });
    } catch (error) {
      logger.error('Error in request_screen_share', { error: error.message });
    }
  });

  socket.on('screen_share_refused', (data) => {
    try {
      const { sessionId } = data || {};
      io.to(`session_${sessionId}`).emit('screen_share_refused', { sessionId, timestamp: new Date() });
    } catch (error) {
      logger.error('Error in screen_share_refused', { error: error.message });
    }
  });

  socket.on('screen_share_started', (data) => {
    try {
      const { sessionId } = data || {};
      io.to(`session_${sessionId}`).emit('screen_share_started', { sessionId, timestamp: new Date() });
    } catch (error) {
      logger.error('Error in screen_share_started', { error: error.message });
    }
  });

  socket.on('screen_share_stopped', (data) => {
    try {
      const { sessionId } = data || {};
      io.to(`session_${sessionId}`).emit('screen_share_stopped', { sessionId, timestamp: new Date() });
    } catch (error) {
      logger.error('Error in screen_share_stopped', { error: error.message });
    }
  });

  // Start/Pause/Resume Exam (logged for now)
  socket.on('start_exam', (data) => {
    logger.info('start_exam', { socketId: socket.id, data });
  });
  socket.on('pause_exam', (data) => {
    logger.info('pause_exam', { socketId: socket.id, data });
  });
  socket.on('resume_exam', (data) => {
    logger.info('resume_exam', { socketId: socket.id, data });
  });

  // Disconnect
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
          try { await session.save(); } catch (saveError) { logger.error('[SOCKET] Session save error', { error: saveError.message }); }
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
}

module.exports = { registerRtcHandlers };

