/**
 * Realtime Session Manager
 * Helpers for validating session context and managing monitoring/session sockets.
 * Keep logic small and composable to avoid bloating realtimeServer.
 */

function validateSessionForEvent(socket, sessionId) {
  if (!socket.sessionId || !socket.examId) {
    return { valid: false, error: 'No active exam session' };
  }

  if (socket.sessionId.toString() !== sessionId.toString()) {
    return { valid: false, error: 'Session ID mismatch' };
  }

  if (socket.userType !== 'student') {
    return { valid: false, error: 'Only students can send camera/screen stats' };
  }

  return { valid: true };
}

function registerMonitoringSocket(dataStore, examId, socketId) {
  dataStore.addMonitoringSocket(examId, socketId);
}

function unregisterMonitoringSocket(dataStore, examId, socketId) {
  dataStore.removeMonitoringSocket(examId, socketId);
}

function registerSessionSocket(dataStore, sessionId, socketId) {
  return dataStore.registerSessionSocket(sessionId, socketId);
}

function unregisterSessionSocket(dataStore, sessionId) {
  dataStore.removeSessionSocket(sessionId);
}

module.exports = {
  validateSessionForEvent,
  registerMonitoringSocket,
  unregisterMonitoringSocket,
  registerSessionSocket,
  unregisterSessionSocket,
};





