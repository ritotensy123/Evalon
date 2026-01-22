const { logger: defaultLogger } = require('../utils/logger');
const { applyAIRules } = require('./realtimeAIRules');
const { WEBSOCKET } = require('../constants');

// Local helper: compute video health score
function computeVideoHealthScore(stats, lastFrameTime, currentTime) {
  if (!stats) return 0;
  
  let score = 100;
  
  // FPS penalty (target: ~24-30fps)
  if (stats.fps < 5) {
    score -= 40; // Critical: almost no frames
  } else if (stats.fps < 10) {
    score -= 30; // Poor: very low fps
  } else if (stats.fps < 15) {
    score -= 15; // Below optimal
  } else if (stats.fps > 30) {
    score -= 5; // Slightly above optimal (may indicate issues)
  }
  
  // Resolution penalty (target: at least 320x240)
  if (stats.width === 0 || stats.height === 0) {
    score -= 40; // Critical: camera disabled
  } else if (stats.width < 320 || stats.height < 240) {
    score -= 20; // Low resolution
  }
  
  // Bitrate penalty (target: at least 100 kbps)
  if (stats.bitrate && stats.bitrate < 50) {
    score -= 20; // Very low bitrate
  } else if (stats.bitrate && stats.bitrate < 100) {
    score -= 10; // Low bitrate
  }
  
  // Muted penalty
  if (stats.muted === true) {
    score -= 25; // Camera muted
  }
  
  // Frame gap penalty (check if frames are coming regularly)
  if (lastFrameTime && currentTime) {
    const gapSeconds = (currentTime - lastFrameTime) / 1000;
    if (gapSeconds > 5) {
      score -= 30; // Critical: no frames for >5s
    } else if (gapSeconds > 2) {
      score -= 15; // Poor: gap >2s
    }
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function handleCameraStats({
  socket,
  data,
  dataStore,
  checkRateLimit,
  validateSessionForEvent,
  broadcastToMonitoring,
  logActivity,
  logger = defaultLogger,
}) {
  try {
    // Rate limit: 10 requests per 10 seconds
    if (!checkRateLimit(socket.id, 'camera_stats', WEBSOCKET.RATE_LIMIT.CAMERA_STATS.max, WEBSOCKET.RATE_LIMIT.CAMERA_STATS.window)) {
      logger.warn(`[RATE LIMIT] camera_stats blocked for ${socket.id}`);
      return;
    }

    const { sessionId, fps, width, height, bitrate, muted, frameTimestamp } = data;
    if (!sessionId) return;

    const validation = validateSessionForEvent(socket, sessionId);
    if (!validation.valid) {
      logger.warn(`[SOCKET] Invalid camera_stats request: ${validation.error}`);
      return;
    }

    const currentTime = Date.now();
    const frameTime = frameTimestamp ? new Date(frameTimestamp).getTime() : currentTime;

    const currentState = dataStore.getSessionState(sessionId);
    if (!currentState) return;

    const lastFrameTime = currentState.lastVideoFrameTime;
    const frameGap = lastFrameTime ? (frameTime - lastFrameTime) / 1000 : 0;

    const updatedState = dataStore.updateSessionState(sessionId, {
      lastVideoFrameTime: frameTime,
      lastVideoResolution: { width: width || 0, height: height || 0 },
      videoFps: fps || 0,
      videoBitrate: bitrate || 0
    }, currentTime);

    const healthScore = computeVideoHealthScore(
      {
        fps: fps || 0,
        width: width || 0,
        height: height || 0,
        bitrate: bitrate || 0,
        muted: muted === true
      },
      lastFrameTime,
      frameTime
    );

    dataStore.updateSessionHealth(sessionId, {
      lastVideoUpdate: frameTime,
      lastVideoResolution: { width: width || 0, height: height || 0 },
      videoFps: fps || 0,
      videoBitrate: bitrate || 0,
      videoHealthScore: healthScore,
      videoFrameGap: frameGap
    }, frameTime);

    broadcastToMonitoring(socket.examId, 'health_update', {
      sessionId,
      examId: socket.examId,
      videoHealthScore: healthScore,
      cameraMuted: muted === true,
      videoFps: fps,
      lastVideoFrameTime: frameTime,
      lastVideoResolution: { width, height }
    });

    logActivity(socket.examId, sessionId, 'camera_stats_update', {
      fps,
      width,
      height,
      bitrate,
      healthScore
    });

  } catch (error) {
    logger.error('[SOCKET] Error in camera_stats', { error: error.message });
  }
}

function handleScreenshareStats({
  socket,
  data,
  dataStore,
  checkRateLimit,
  validateSessionForEvent,
  broadcastToMonitoring,
  logActivity,
  logger = defaultLogger,
}) {
  try {
    // Rate limit: 8 requests per 10 seconds
    if (!checkRateLimit(socket.id, 'screenshare_stats', WEBSOCKET.RATE_LIMIT.SCREENSHARE_STATS.max, WEBSOCKET.RATE_LIMIT.SCREENSHARE_STATS.window)) {
      logger.warn(`[RATE LIMIT] screenshare_stats blocked for ${socket.id}`);
      return;
    }

    const { sessionId } = data;
    if (!sessionId) return;

    const validation = validateSessionForEvent(socket, sessionId);
    if (!validation.valid) {
      logger.warn(`[SOCKET] Invalid screenshare_stats request: ${validation.error}`);
      return;
    }

    const { fps, width, height, bitrate, blackScreen, windowChanged, frameTimestamp } = data;
    const currentTime = Date.now();
    const frameTime = frameTimestamp ? new Date(frameTimestamp).getTime() : currentTime;

    const currentState = dataStore.getSessionState(sessionId);
    if (!currentState) return;

    const lastFrameTime = currentState.lastScreenFrameTime;
    const frameGap = lastFrameTime ? (frameTime - lastFrameTime) / 1000 : 0;

    dataStore.updateSessionState(sessionId, {
      lastScreenFrameTime: frameTime,
      lastScreenResolution: { width: width || 0, height: height || 0 },
      screenFps: fps || 0,
      screenBitrate: bitrate || 0
    }, currentTime);

    const anomalies = [];
    if (blackScreen === true) anomalies.push('screen_share_black_screen');
    if (windowChanged === true) anomalies.push('screen_share_window_changed');
    if (frameGap > 5) anomalies.push('screen_share_frozen');

    if (anomalies.length > 0) {
      anomalies.forEach(anomaly => {
        logActivity(socket.examId, sessionId, anomaly, {
          fps,
          width,
          height,
          blackScreen,
          windowChanged,
          frameGap: frameGap.toFixed(2)
        });

        broadcastToMonitoring(socket.examId, 'security_alert', {
          sessionId,
          examId: socket.examId,
          flag: {
            type: anomaly,
            timestamp: new Date(),
            details: `Screen-share integrity violation: ${anomaly}`,
            severity: anomaly === 'screen_share_black_screen' ? 'high' : 'medium'
          }
        });
      });
    }

    broadcastToMonitoring(socket.examId, 'health_update', {
      sessionId,
      examId: socket.examId,
      screenFps: fps,
      lastScreenFrameTime: frameTime,
      lastScreenResolution: { width, height }
    });

    logActivity(socket.examId, sessionId, 'screenshare_stats_update', {
      fps,
      width,
      height,
      bitrate
    });

  } catch (error) {
    logger.error('[SOCKET] Error in screenshare_stats', { error: error.message });
  }
}

async function handleAIUpdate({
  socket,
  payload,
  dataStore,
  checkRateLimit,
  validateSessionForEvent,
  broadcastToMonitoring,
  logActivity,
  io,
  logger = defaultLogger,
}) {
  try {
    // Rate limit: 5 requests per 10 seconds
    if (!checkRateLimit(socket.id, 'ai_update', WEBSOCKET.RATE_LIMIT.CAMERA_STATS.max, WEBSOCKET.RATE_LIMIT.CAMERA_STATS.window)) {
      logger.warn(`[RATE LIMIT] ai_update blocked for ${socket.id}`);
      socket.emit('student_rate_limited', {
        event: 'ai_update',
        message: 'Rate limit exceeded. Maximum 5 requests per 10 seconds.',
        timestamp: Date.now()
      });
      logActivity(socket.examId, socket.sessionId, 'ai_update_rate_limited', {
        socketId: socket.id
      });
      return;
    }

    if (!socket.sessionId || !socket.examId) {
      socket.emit('student_error', {
        event: 'ai_update',
        reason: 'No active exam session'
      });
      return;
    }

    const validation = validateSessionForEvent(socket, socket.sessionId);
    if (!validation.valid) {
      socket.emit('student_error', {
        event: 'ai_update',
        reason: validation.error
      });
      return;
    }

    const currentState = dataStore.getSessionState(socket.sessionId);
    if (!currentState) {
      socket.emit('student_error', {
        event: 'ai_update',
        reason: 'Session state not found'
      });
      return;
    }

    const {
      faceDetected,
      multipleFaces,
      eyesVisible,
      lookingAway,
      talking,
      suspiciousMovement,
      windowSwitch,
      virtualDesktop,
      aiScoreDelta,
      aiEventType,
      aiSeverity
    } = payload || {};

    const stateUpdates = {};
    const flagsUpdated = { camera: false, behavior: false, screen: false };

    if (typeof faceDetected === 'boolean' || typeof multipleFaces === 'boolean' || typeof eyesVisible === 'boolean') {
      stateUpdates.cameraFlags = {
        ...currentState.cameraFlags,
        ...(typeof faceDetected === 'boolean' && { faceDetected }),
        ...(typeof multipleFaces === 'boolean' && { multipleFaces }),
        ...(typeof eyesVisible === 'boolean' && { eyesVisible })
      };
      flagsUpdated.camera = true;
    }

    if (typeof lookingAway === 'boolean' || typeof talking === 'boolean' || typeof suspiciousMovement === 'boolean') {
      stateUpdates.behaviorFlags = {
        ...currentState.behaviorFlags,
        ...(typeof lookingAway === 'boolean' && { lookingAway }),
        ...(typeof talking === 'boolean' && { talking }),
        ...(typeof suspiciousMovement === 'boolean' && { suspiciousMovement })
      };
      flagsUpdated.behavior = true;
    }

    if (typeof windowSwitch === 'boolean' || typeof virtualDesktop === 'boolean') {
      stateUpdates.screenFlags = {
        ...currentState.screenFlags,
        ...(typeof windowSwitch === 'boolean' && { windowSwitch }),
        ...(typeof virtualDesktop === 'boolean' && { virtualDesktop })
      };
      flagsUpdated.screen = true;
    }

    if (typeof aiScoreDelta === 'number') {
      stateUpdates.aiLastScoreDelta = aiScoreDelta;
    }

    if (Object.keys(stateUpdates).length > 0) {
      dataStore.updateSessionState(socket.sessionId, stateUpdates);
    }

    if (aiEventType && typeof aiEventType === 'string') {
      const eventSeverity = aiSeverity || 'low';
      dataStore.pushAIEvent(socket.sessionId, {
        type: aiEventType,
        severity: eventSeverity,
        timestamp: Date.now()
      }, socket.examId);
    }

    const state = dataStore.getSessionState(socket.sessionId);
    if (state) {
      const ruleResult = await applyAIRules({
        sessionId: socket.sessionId,
        examId: socket.examId,
        state,
        dataStore,
        io,
        broadcastToMonitoring,
        logActivity,
        logger,
      });

      if (ruleResult) {
        const updatedState = dataStore.getSessionState(socket.sessionId);
        broadcastToMonitoring(socket.examId, 'ai_rule_evaluation', {
          sessionId: socket.sessionId,
          examId: socket.examId,
          aiRiskScore: updatedState?.aiRiskScore || 0,
          aiRiskLevel: updatedState?.aiRiskLevel || 'low',
          flagsUpdated,
          timestamp: Date.now()
        });
      }
    }

  } catch (error) {
    logger.error('[SOCKET] Error in ai_update', { error: error.message });
  }
}

function registerMonitoringHandlers({
  socket,
  dataStore,
  checkRateLimit,
  validateSessionForEvent,
  broadcastToMonitoring,
  logActivity,
  io,
  logger = defaultLogger,
}) {
  socket.on('camera_stats', (data) =>
    handleCameraStats({
      socket,
      data,
      dataStore,
      checkRateLimit,
      validateSessionForEvent,
      broadcastToMonitoring,
      logActivity,
      logger,
    })
  );

  socket.on('screenshare_stats', (data) =>
    handleScreenshareStats({
      socket,
      data,
      dataStore,
      checkRateLimit,
      validateSessionForEvent,
      broadcastToMonitoring,
      logActivity,
      logger,
    })
  );

  socket.on('ai_update', (payload) =>
    handleAIUpdate({
      socket,
      payload,
      dataStore,
      checkRateLimit,
      validateSessionForEvent,
      broadcastToMonitoring,
      logActivity,
      io,
      logger,
    })
  );
}

module.exports = {
  registerMonitoringHandlers,
};

