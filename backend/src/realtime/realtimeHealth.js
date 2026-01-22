const { applyAIRules } = require('./realtimeAIRules');
const { WEBSOCKET } = require('../constants');

/**
 * Register periodic health/AI tasks on the realtime server.
 * Keeps realtimeServer lean by isolating intervals/timers here.
 */
function registerHealthIntervals({ dataStore, io, broadcastToMonitoring, logActivity, logger }) {
  // ADVANCED-2 PART 3: Periodic AI Rule Reevaluation (every 30s)
  setInterval(async () => {
    try {
      const now = Date.now();

      for (const [examId, sessionsMap] of dataStore.examSessions.entries()) {
        if (!sessionsMap || !(sessionsMap instanceof Map)) continue;
        
        for (const [sessionId] of sessionsMap.entries()) {
          const state = dataStore.getSessionState(sessionId);
          if (!state) continue;

          // Only check sessions active in last 15 seconds
          if (!state.lastUpdate || now - state.lastUpdate > WEBSOCKET.STATE_STALE_THRESHOLD) {
            continue;
          }

          await applyAIRules({
            sessionId,
            examId,
            state,
            dataStore,
            io,
            broadcastToMonitoring,
            logActivity,
          });

          const updatedState = dataStore.getSessionState(sessionId);
          if (updatedState) {
            broadcastToMonitoring(examId, 'ai_periodic_recheck', {
              sessionId: sessionId,
              examId: examId,
              aiRiskScore: updatedState.aiRiskScore || 0,
              aiRiskLevel: updatedState.aiRiskLevel || 'low',
              timestamp: now
            });
          }
        }
      }
    } catch (err) {
      logger.error('AI periodic recheck error', { error: err.message, stack: err.stack });
    }
  }, WEBSOCKET.HEALTH_CHECK_INTERVAL);
}

module.exports = {
  registerHealthIntervals,
};

