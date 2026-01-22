const { logger: defaultLogger } = require('../utils/logger');

/**
 * Apply AI proctoring rules and update session state.
 * Dependencies are injected to avoid circular imports with the realtime server.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} params.examId
 * @param {object} params.state
 * @param {object} params.dataStore
 * @param {object} params.io
 * @param {function} params.broadcastToMonitoring
 * @param {function} params.logActivity
 * @param {object} [params.logger]
 */
async function applyAIRules({
  sessionId,
  examId,
  state,
  dataStore,
  io,
  broadcastToMonitoring,
  logActivity,
  logger = defaultLogger,
}) {
  try {
    if (!state) return null;

    const now = Date.now();
    let triggeredEvents = [];
    let scoreDelta = 0;

    const {
      cameraFlags,
      behaviorFlags,
      screenFlags,
      aiRiskScore
    } = state;

    // RULE 1: Face Missing
    if (cameraFlags?.faceDetected === false) {
      triggeredEvents.push({ type: "face_missing", severity: "high" });
      scoreDelta += 20;
    }

    // RULE 2: Multiple Faces
    if (cameraFlags?.multipleFaces === true) {
      triggeredEvents.push({ type: "multiple_faces_detected", severity: "high" });
      scoreDelta += 40;
    }

    // RULE 3: Eyes Not Visible
    if (cameraFlags?.eyesVisible === false) {
      triggeredEvents.push({ type: "eyes_not_visible", severity: "medium" });
      scoreDelta += 10;
    }

    // RULE 4: Looking Away
    if (behaviorFlags?.lookingAway === true) {
      triggeredEvents.push({ type: "looking_away_sustained", severity: "medium" });
      scoreDelta += 15;
    }

    // RULE 5: Talking
    if (behaviorFlags?.talking === true) {
      triggeredEvents.push({ type: "talking_detected", severity: "medium" });
      scoreDelta += 15;
    }

    // RULE 6: Suspicious Movement
    if (behaviorFlags?.suspiciousMovement === true) {
      triggeredEvents.push({ type: "suspicious_movement", severity: "medium" });
      scoreDelta += 15;
    }

    // RULE 7: Window Switch
    if (screenFlags?.windowSwitch === true) {
      triggeredEvents.push({ type: "window_switch_violation", severity: "medium" });
      scoreDelta += 20;
    }

    // RULE 8: Virtual Desktop
    if (screenFlags?.virtualDesktop === true) {
      triggeredEvents.push({ type: "virtual_desktop_violation", severity: "high" });
      scoreDelta += 40;
    }

    // RULE 9: Rapid Score Increase
    if (state.aiLastScoreDelta && state.aiLastScoreDelta > 20) {
      triggeredEvents.push({ type: "rapid_score_increase", severity: "high" });
    }

    // APPLY SCORE
    let newScore = Math.max(0, Math.min(100, (aiRiskScore || 0) + scoreDelta));
    let newLevel = dataStore.computeRiskLevel(newScore);

    dataStore.updateSessionState(sessionId, {
      aiRiskScore: newScore,
      aiRiskLevel: newLevel,
      aiLastUpdated: now,
      aiLastScoreDelta: scoreDelta
    });

    // AI EVENT GENERATION
    for (const ev of triggeredEvents) {
      await dataStore.pushAIEvent(sessionId, {
        type: ev.type,
        severity: ev.severity,
        timestamp: now
      }, examId);

      // Broadcast alert to proctors
      broadcastToMonitoring(examId, "proctor_alert", {
        sessionId,
        examId,
        eventType: ev.type,
        severity: ev.severity,
        aiRiskLevel: newLevel,
        timestamp: now
      });

      logActivity(examId, sessionId, "ai_proctor_alert_sent", {
        eventType: ev.type,
        severity: ev.severity,
        aiRiskLevel: newLevel,
        timestamp: now
      });
    }

    return { scoreDelta, events: triggeredEvents };

  } catch (err) {
    logger.error("AI RULE ENGINE ERROR", { error: err.message, stack: err.stack });
    return null;
  }
}

module.exports = {
  applyAIRules,
};





