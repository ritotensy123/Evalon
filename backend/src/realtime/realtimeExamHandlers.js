const { applyAIRules } = require('./realtimeAIRules');
const {
  validateSessionForEvent,
  registerSessionSocket,
  unregisterSessionSocket,
  registerMonitoringSocket,
  unregisterMonitoringSocket,
} = require('./realtimeSessionManager');
const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const { logger: defaultLogger } = require('../utils/logger');
const { WEBSOCKET } = require('../constants');

function registerExamHandlers({
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
  logger = defaultLogger,
}) {
  // Exam: join
  socket.on('join_exam_session', async (data, callback) => {
    try {
      const { examId, sessionId, deviceInfo, networkInfo } = data || {};
      if (socket.userType !== 'student') {
        socket.emit('exam_error', { message: 'Only students can join exam sessions' });
        if (typeof callback === 'function') callback({ success: false, error: 'Only students can join exam sessions' });
        return;
      }

      logger.info('Student joining exam', { socketId: socket.id, examId, userId: socket.userId });
      const result = await ExamService.joinExam(examId, socket.userId, deviceInfo, networkInfo);
      const session = result.session;

      dataStore.addSession(examId, session._id.toString(), {
        sessionId: session._id,
        student: socket.userInfo,
        examId,
        status: 'active',
        isConnected: true,
        timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / 1000)),
        progress: session.progress,
        securityFlags: [],
        timestamp: new Date(),
        lastActivity: new Date()
      });

      socket.join(`exam_${examId}`);
      socket.examId = examId;
      socket.sessionId = result.sessionId;

      const existingSocketId = registerSessionSocket(dataStore, result.sessionId, socket.id);
      if (existingSocketId && existingSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.emit('multi_tab_warning', { 
            message: 'Another tab/window opened. This session will be disconnected.',
            timestamp: new Date()
          });
          oldSocket.disconnect(true);
          logger.warn('Multi-tab detected, disconnected old socket', { oldSocketId: existingSocketId, newSocketId: socket.id });
          logActivity(examId, result.sessionId, 'duplicate_connection', { oldSocketId: existingSocketId, newSocketId: socket.id });
        }
      }

      const initialState = dataStore.initSessionState(result.sessionId, {
        currentQuestion: session.progress?.currentQuestion || 0,
        answeredCount: session.progress?.answeredQuestions || 0,
        totalQuestions: result.exam.questions?.length || 0,
        timeRemaining: result.timeRemaining,
        isScreenSharing: false,
        lastVideoFrameTime: null,
        lastScreenFrameTime: null,
        lastVideoResolution: { width: 0, height: 0 },
        lastScreenResolution: { width: 0, height: 0 },
        videoFps: 0,
        screenFps: 0,
        videoBitrate: 0,
        screenBitrate: 0,
        cameraMuted: false,
        videoHealthScore: 100,
        aiRiskScore: 0,
        aiLastUpdated: null,
        aiEvents: [],
        aiRiskLevel: 'low',
        cameraFlags: { faceDetected: true, multipleFaces: false, eyesVisible: true },
        behaviorFlags: { lookingAway: false, talking: false, suspiciousMovement: false },
        screenFlags: { windowSwitch: false, virtualDesktop: false }
      });

      dataStore.initSessionHealth(result.sessionId);

      const restoredState = dataStore.getSessionState(result.sessionId);
      if (restoredState) {
        await applyAIRules({
          sessionId: result.sessionId,
          examId,
          state: restoredState,
          dataStore,
          io,
          broadcastToMonitoring,
          logActivity,
        });
        const finalState = dataStore.getSessionState(result.sessionId);
        broadcastToMonitoring(examId, 'ai_recalculated_on_reconnect', {
          sessionId: result.sessionId,
          examId,
          aiRiskScore: finalState?.aiRiskScore || 0,
          aiRiskLevel: finalState?.aiRiskLevel || 'low',
          timestamp: Date.now()
        });
      }

      const sessionData = dataStore.examSessions.get(examId)?.get(result.sessionId.toString());
      if (sessionData) {
        broadcastToMonitoring(examId, 'student_joined', sessionData);
      }

      socket.emit(result.socketEvent, result.socketData);
      logger.info('Student successfully joined exam session', { socketId: socket.id, examId, sessionId: result.sessionId });
      logActivity(examId, result.sessionId, 'student_joined', { socketId: socket.id });
      broadcastTimelineUpdate(examId, result.sessionId.toString(), {
        timestamp: new Date(),
        type: 'session',
        severity: 'low',
        message: 'Student joined exam session'
      });

      if (typeof callback === 'function') {
        callback({ success: true, sessionId: result.sessionId, state: initialState });
      }
    } catch (error) {
      logger.error('Error in join_exam_session', { error: error.message, stack: error.stack, socketId: socket.id });
      socket.emit('exam_error', { message: error.message || 'Failed to join exam session' });
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message || 'Failed to join exam session' });
      }
    }
  });

  // Exam: submit answer
  socket.on('submit_answer', async (data, callback) => {
    if (!checkRateLimit(socket.id, 'submit_answer', WEBSOCKET.RATE_LIMIT.SUBMIT_ANSWER.max, WEBSOCKET.RATE_LIMIT.SUBMIT_ANSWER.window)) {
      logger.warn(`[RATE LIMIT] submit_answer blocked`, { socketId: socket.id });
      return;
    }
    try {
      const { questionId, answer, timeSpent } = data || {};
      if (!socket.sessionId || !socket.examId) {
        socket.emit('exam_error', { message: 'No active exam session' });
        if (typeof callback === 'function') callback({ success: false, error: 'No active exam session' });
        return;
      }
      if (!questionId) {
        socket.emit('exam_error', { message: 'Question ID is required' });
        if (typeof callback === 'function') callback({ success: false, error: 'Question ID is required' });
        return;
      }
      const result = await ExamService.submitAnswer(socket.sessionId, questionId, answer, timeSpent);
      dataStore.updateSession(socket.examId, socket.sessionId.toString(), {
        progress: result.progress,
        lastActivity: new Date()
      });
      broadcastToMonitoring(socket.examId, 'progress_update', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        progress: result.progress,
        timestamp: new Date()
      });
      const newState = dataStore.updateSessionState(socket.sessionId, {
        answeredCount: result.progress.answeredQuestions,
        currentQuestion: result.progress.currentQuestion
      });
      broadcastToMonitoring(socket.examId, 'session_state_changed', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        state: newState
      });
      logActivity(socket.examId, socket.sessionId, 'answer_submitted', { questionId, timeSpent: timeSpent || 0 });
      socket.emit(result.socketEvent, result.socketData);
      if (typeof callback === 'function') {
        callback({ success: true, questionId, progress: result.progress });
      }
    } catch (error) {
      logger.error('Error in submit_answer', { error: error.message, stack: error.stack, socketId: socket.id });
      socket.emit('exam_error', { message: error.message || 'Failed to submit answer' });
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message || 'Failed to submit answer' });
      }
    }
  });

  // Exam: auto-save answers
  socket.on('auto_save_answers', async (data) => {
    if (!checkRateLimit(socket.id, 'auto_save_answers', WEBSOCKET.RATE_LIMIT.AUTO_SAVE.max, WEBSOCKET.RATE_LIMIT.AUTO_SAVE.window)) {
      logger.warn(`[RATE LIMIT] auto_save_answers blocked`, { socketId: socket.id });
      return;
    }
    try {
      const { examId, answers, timeRemaining } = data || {};
      if (!socket.sessionId || !socket.examId) return;

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) return;

      session.autoSave = { answers, timeRemaining, timestamp: new Date() };
      session.lastActivity = new Date();
      await session.save();

      const answerCount = answers ? Object.keys(answers).length : 0;
      dataStore.mergeState(socket.sessionId, { answeredCount: answerCount, timeRemaining });
      logActivity(examId, socket.sessionId, 'auto_save', { answerCount });
      broadcastToMonitoring(examId, 'auto_save_update', {
        sessionId: socket.sessionId,
        examId,
        studentId: socket.userId,
        timeRemaining,
        answeredCount: answerCount,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error in auto_save_answers', { error: error.message });
    }
  });

  // Exam: update progress
  socket.on('update_progress', async (data) => {
    if (!checkRateLimit(socket.id, 'update_progress', WEBSOCKET.RATE_LIMIT.UPDATE_PROGRESS.max, WEBSOCKET.RATE_LIMIT.UPDATE_PROGRESS.window)) {
      logger.warn(`[RATE LIMIT] update_progress blocked`, { socketId: socket.id });
      return;
    }
    try {
      const { currentQuestion, totalQuestions, answeredCount, timestamp } = data || {};
      if (!socket.sessionId || !socket.examId) return;

      const currentState = dataStore.getSessionState(socket.sessionId);
      const incomingTimestamp = timestamp || Date.now();
      if (currentState && incomingTimestamp < currentState.lastUpdate) {
        socket.emit('state_refresh', { state: currentState });
        if (socket.examId) {
          dataStore.updateSuspicionScore(socket.sessionId, 'out_of_order_update', 5);
          const score = dataStore.getSuspicionScore(socket.sessionId);
          broadcastToMonitoring(socket.examId, 'suspicion_update', {
            sessionId: socket.sessionId,
            score,
            latestEvent: { eventType: 'out_of_order_update', weight: 5 }
          });
          logActivity(socket.examId, socket.sessionId, 'suspicion_event', {
            eventType: 'out_of_order_update',
            weight: 5
          });
        }
        return;
      }

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) return;

      session.progress = {
        currentQuestion,
        totalQuestions,
        answeredQuestions: answeredCount,
        lastUpdated: new Date()
      };
      session.lastActivity = new Date();
      await session.save();

      const newState = dataStore.updateSessionState(socket.sessionId, {
        currentQuestion,
        totalQuestions,
        answeredCount
      }, incomingTimestamp);

      logActivity(socket.examId, socket.sessionId, 'progress_update', { currentQuestion, totalQuestions, answeredCount });
      broadcastToMonitoring(socket.examId, 'progress_update', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        progress: session.progress,
        timestamp: new Date()
      });
      broadcastToMonitoring(socket.examId, 'session_state_changed', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        state: newState
      });
    } catch (error) {
      logger.error('Error in update_progress', { error: error.message });
    }
  });

  // Exam: end
  socket.on('end_exam', async (data, callback) => {
    try {
      const { submissionType = 'normal', finalScore = null, examStats = null } = data || {};
      if (!socket.sessionId) {
        socket.emit('exam_error', { message: 'No active exam session' });
        if (typeof callback === 'function') callback({ success: false, error: 'No active exam session' });
        return;
      }
      const result = await ExamService.endExam(socket.sessionId, submissionType, finalScore, examStats);
      dataStore.mergeState(socket.sessionId, {
        status: 'submitted',
        isConnected: false,
        endReason: submissionType,
        endTime: new Date()
      });
      broadcastToMonitoring(socket.examId, 'exam_ended', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        submissionType,
        finalScore,
        endTime: new Date()
      });
      logActivity(socket.examId, result.sessionId, 'exam_ended', { reason: submissionType, finalScore: finalScore ?? undefined });
      broadcastTimelineUpdate(socket.examId, result.sessionId.toString(), {
        timestamp: new Date(),
        type: 'session',
        severity: 'low',
        message: `Exam ended (${submissionType})`
      });
      socket.emit(result.socketEvent, { ...result.socketData, finalScore, submissionType });
      if (typeof callback === 'function') {
        callback({ success: true, sessionId: result.sessionId });
      }
    } catch (error) {
      logger.error('Error in end_exam', { error: error.message, stack: error.stack, socketId: socket.id });
      socket.emit('exam_error', { message: error.message || 'Failed to end exam' });
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message || 'Failed to end exam' });
      }
    }
  });

  // Monitoring join/leave/active sessions
  socket.on('join_monitoring', async (data) => {
    try {
      const { examId } = data || {};
      if (!['teacher', 'admin', 'organization_admin'].includes(socket.userType)) {
        socket.emit('monitoring_error', { message: 'Only teachers and admins can monitor exams' });
        return;
      }
      const exam = await Exam.findById(examId);
      if (!exam) {
        socket.emit('monitoring_error', { message: 'Exam not found' });
        return;
      }
      if (socket.organizationId && exam.organizationId) {
        if (socket.organizationId.toString() !== exam.organizationId.toString()) {
          socket.emit('monitoring_error', { message: 'Unauthorized: exam belongs to a different organization' });
          return;
        }
      }
      registerMonitoringSocket(dataStore, examId, socket.id);
      dataStore.cleanupInactiveSessions?.();
      const activeSessions = dataStore.getSessionsForExam(examId);
      socket.emit('monitoring_joined', { examId, activeSessions });
      logger.info('[SOCKET] Monitoring joined', { socketId: socket.id, examId });
      logActivity(examId, null, 'monitoring_joined', { socketId: socket.id });
    } catch (error) {
      logger.error('Error in join_monitoring', { error: error.message });
      socket.emit('monitoring_error', { message: 'Failed to join monitoring' });
    }
  });

  socket.on('leave_monitoring', () => {
    try {
      if (socket.monitoringExamId) {
        unregisterMonitoringSocket(dataStore, socket.monitoringExamId, socket.id);
        logger.info('[SOCKET] Monitoring left', { socketId: socket.id, examId: socket.monitoringExamId });
      }
    } catch (error) {
      logger.error('Error in leave_monitoring', { error: error.message });
    }
  });

  socket.on('request_active_sessions', async (data) => {
    try {
      const { examId } = data || {};
      if (!examId) return;
      const sessions = dataStore.getSessionsForExam(examId) || [];
      socket.emit('active_sessions', { examId, sessions });
    } catch (error) {
      logger.error('Error in request_active_sessions', { error: error.message });
    }
  });

  // Sync questions
  socket.on('sync_questions', async (data) => {
    try {
      const { examId } = data || {};
      if (!examId) {
        socket.emit('sync_error', { message: 'Exam ID is required' });
        return;
      }
      const result = await questionBankService.syncExamQuestions(examId);
      socket.emit('sync_success', result);
    } catch (error) {
      logger.error('Error handling sync_questions', { error: error.message });
      socket.emit('sync_error', { message: 'Failed to sync questions' });
    }
  });

  // State sync
  socket.on('request_state_sync', async (data, callback) => {
    try {
      const { sessionId } = data || {};
      const sid = sessionId || socket.sessionId;
      if (!sid) {
        if (typeof callback === 'function') callback({ success: false, error: 'No session ID provided' });
        return;
      }
      const state = dataStore.getSessionState(sid);
      if (state && socket.examId) {
        const restoredState = dataStore.getSessionState(sid);
        if (restoredState) {
          await applyAIRules({
            sessionId: sid,
            examId: socket.examId,
            state: restoredState,
            dataStore,
            io,
            broadcastToMonitoring,
            logActivity,
          });
          const finalState = dataStore.getSessionState(sid);
          broadcastToMonitoring(socket.examId, 'ai_recalculated_on_reconnect', {
            sessionId: sid,
            examId: socket.examId,
            aiRiskScore: finalState?.aiRiskScore || 0,
            aiRiskLevel: finalState?.aiRiskLevel || 'low',
            timestamp: Date.now()
          });
        }
        const updatedState = dataStore.getSessionState(sid);
        socket.emit('state_sync', { state: updatedState });
        if (typeof callback === 'function') callback({ success: true, state: updatedState });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Session state not found' });
      }
    } catch (error) {
      logger.error('Error in request_state_sync', { error: error.message });
      if (typeof callback === 'function') callback({ success: false, error: 'Failed to sync state' });
    }
  });

  // Request questions
  socket.on('request_questions', async (data) => {
    try {
      const { examId, questionIds } = data || {};
      if (!examId) {
        socket.emit('exam_error', { message: 'Exam ID is required' });
        return;
      }
      const questions = await questionBankService.getQuestionsForExam(examId, questionIds);
      socket.emit('questions_data', { examId, questions });
    } catch (error) {
      logger.error('Error in request_questions', { error: error.message });
      socket.emit('exam_error', { message: 'Failed to fetch questions' });
    }
  });

  // AI proctor signals
  socket.on('ai_proctor_signal', (data) => {
    try {
      broadcastToMonitoring(socket.examId, 'ai_proctor_signal', {
        sessionId: socket.sessionId,
        examId: socket.examId,
        signal: data,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error in ai_proctor_signal', { error: error.message });
    }
  });

  // Security flag
  socket.on('report_security_flag', async (data) => {
    try {
      const { sessionId, examId, flag, severity = 'medium' } = data || {};
      if (!sessionId || !examId || !flag) {
        socket.emit('security_flag_error', { message: 'Invalid security flag payload' });
        return;
      }
      logActivity(examId, sessionId, 'security_flag', { flag, severity });
      broadcastToMonitoring(examId, 'security_alert', {
        sessionId,
        examId,
        flag: { type: flag, severity, timestamp: new Date() }
      });
    } catch (error) {
      logger.error('Error in report_security_flag', { error: error.message });
    }
  });
}

module.exports = { registerExamHandlers };

