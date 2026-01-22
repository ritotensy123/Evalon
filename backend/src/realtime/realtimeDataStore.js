/**
 * RealtimeDataStore
 * In-memory store for sessions, connections, health, suspicion scoring, and AI events.
 */
class RealtimeDataStore {
  constructor() {
    this.examSessions = new Map(); // examId -> Map of sessionId -> sessionData
    this.monitoringRooms = new Map(); // examId -> Set of socketIds
    this.activeConnections = new Map(); // socketId -> connectionInfo
    this.heartbeats = new Map(); // socketId -> lastHeartbeat
    
    // Authoritative session state
    this.sessionState = new Map(); // sessionId -> { currentQuestion, answeredCount, timeRemaining, ... }
    this.sessionSockets = new Map(); // sessionId -> socketId (for multi-tab detection)
    
    // Session health monitoring
    this.sessionHealth = new Map(); // sessionId -> healthObject
    this.rttSamples = new Map(); // sessionId -> array of last 10 RTT samples for jitter calculation
  }

  // Session Health Management
  initSessionHealth(sessionId) {
    const health = {
      rtt: 0,
      jitter: 0,
      packetLoss: 0,
      heartbeatCount: 0,
      missedHeartbeats: 0,
      fps: null,
      cpuLoad: null,
      tabVisible: true,
      cameraActive: false,
      micActive: false,
      aiFlags: {
        faceMissing: false,
        multipleFaces: false,
        lookingAway: false,
        phoneDetected: false
      },
      lastUpdate: Date.now()
    };
    this.sessionHealth.set(sessionId.toString(), health);
    this.rttSamples.set(sessionId.toString(), []);
    return health;
  }

  updateSessionHealth(sessionId, partialHealth, timestamp = Date.now()) {
    const sid = sessionId.toString();
    let health = this.sessionHealth.get(sid);
    
    if (!health) {
      health = this.initSessionHealth(sid);
    }
    
    // Out-of-order protection
    if (timestamp < health.lastUpdate) {
      return health;
    }
    
    const newHealth = {
      ...health,
      ...partialHealth,
      lastUpdate: timestamp
    };
    this.sessionHealth.set(sid, newHealth);
    return newHealth;
  }

  updateRTT(sessionId, rttValue) {
    const sid = sessionId.toString();
    let health = this.sessionHealth.get(sid);
    
    if (!health) {
      health = this.initSessionHealth(sid);
    }
    
    // Store RTT sample for jitter calculation
    let samples = this.rttSamples.get(sid) || [];
    samples.push(rttValue);
    if (samples.length > 10) {
      samples = samples.slice(-10); // Keep last 10 samples
    }
    this.rttSamples.set(sid, samples);
    
    // Calculate jitter (standard deviation of RTT samples)
    let jitter = 0;
    if (samples.length > 1) {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
      jitter = Math.sqrt(variance);
    }
    
    const newHealth = {
      ...health,
      rtt: rttValue,
      jitter: Math.round(jitter * 100) / 100,
      lastUpdate: Date.now()
    };
    this.sessionHealth.set(sid, newHealth);
    return newHealth;
  }

  recordHeartbeat(sessionId) {
    const sid = sessionId.toString();
    let health = this.sessionHealth.get(sid);
    
    if (!health) {
      health = this.initSessionHealth(sid);
    }
    
    health.heartbeatCount++;
    health.lastUpdate = Date.now();
    
    // Calculate packet loss
    const expectedHeartbeats = health.heartbeatCount + health.missedHeartbeats;
    health.packetLoss = expectedHeartbeats > 0 
      ? Math.round((health.missedHeartbeats / expectedHeartbeats) * 100 * 100) / 100 
      : 0;
    
    this.sessionHealth.set(sid, health);
    return health;
  }

  recordMissedHeartbeat(sessionId) {
    const sid = sessionId.toString();
    let health = this.sessionHealth.get(sid);
    
    if (!health) return;
    
    health.missedHeartbeats++;
    health.lastUpdate = Date.now();
    
    // Recalculate packet loss
    const expectedHeartbeats = health.heartbeatCount + health.missedHeartbeats;
    health.packetLoss = expectedHeartbeats > 0 
      ? Math.round((health.missedHeartbeats / expectedHeartbeats) * 100 * 100) / 100 
      : 0;
    
    this.sessionHealth.set(sid, health);
    return health;
  }

  getSessionHealth(sessionId) {
    return this.sessionHealth.get(sessionId.toString()) || null;
  }

  removeSessionHealth(sessionId) {
    const sid = sessionId.toString();
    this.sessionHealth.delete(sid);
    this.rttSamples.delete(sid);
  }

  getExamSessionsHealth(examId) {
    const sessions = this.examSessions.get(examId?.toString());
    if (!sessions) return [];
    
    const healthList = [];
    for (const [sessionId] of sessions) {
      const health = this.sessionHealth.get(sessionId);
      if (health) {
        healthList.push({ sessionId, health });
      }
    }
    return healthList.sort((a, b) => b.health.lastUpdate - a.health.lastUpdate);
  }

  // Suspicious Behaviour Scoring Engine
  initSuspicionTracking(sessionId) {
    const sid = sessionId.toString();
    const state = this.sessionState.get(sid);
    if (state) {
      state.suspicionScore = 0;
      state.suspicionHistory = [];
      this.sessionState.set(sid, state);
    }
    return { suspicionScore: 0, suspicionHistory: [] };
  }

  updateSuspicionScore(sessionId, eventType, weight) {
    const sid = sessionId.toString();
    let state = this.sessionState.get(sid);
    
    if (!state) {
      return null;
    }
    
    if (typeof state.suspicionScore !== 'number') {
      state.suspicionScore = 0;
      state.suspicionHistory = [];
    }
    
    state.suspicionScore = Math.min(100, state.suspicionScore + weight);
    
    const historyEntry = {
      eventType,
      weight,
      timestamp: Date.now()
    };
    
    state.suspicionHistory = state.suspicionHistory || [];
    state.suspicionHistory.push(historyEntry);
    
    if (state.suspicionHistory.length > 50) {
      state.suspicionHistory = state.suspicionHistory.slice(-50);
    }
    
    this.sessionState.set(sid, state);
    
    return {
      sessionId: sid,
      score: state.suspicionScore,
      latestEvent: historyEntry
    };
  }

  getSuspicionScore(sessionId) {
    const state = this.sessionState.get(sessionId.toString());
    return state?.suspicionScore ?? 0;
  }

  getSuspicionHistory(sessionId) {
    const state = this.sessionState.get(sessionId.toString());
    return state?.suspicionHistory || [];
  }

  getAggregateSuspicion(examId) {
    const sessions = this.examSessions.get(examId?.toString());
    if (!sessions) return { averageScore: 0, maxScore: 0, sessionCount: 0 };
    
    let totalScore = 0;
    let maxScore = 0;
    let count = 0;
    
    for (const [sessionId] of sessions) {
      const state = this.sessionState.get(sessionId);
      if (state && typeof state.suspicionScore === 'number') {
        totalScore += state.suspicionScore;
        maxScore = Math.max(maxScore, state.suspicionScore);
        count++;
      }
    }
    
    return {
      averageScore: count > 0 ? Math.round((totalScore / count) * 100) / 100 : 0,
      maxScore,
      sessionCount: count
    };
  }

  // Connection management
  addConnection(socketId, info) {
    this.activeConnections.set(socketId, {
      ...info,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now()
    });
  }

  removeConnection(socketId) {
    this.activeConnections.delete(socketId);
  }

  addSession(examId, sessionId, sessionData) {
    if (!this.examSessions.has(examId)) {
      this.examSessions.set(examId, new Map());
    }
    this.examSessions.get(examId).set(sessionId.toString(), {
      ...sessionData,
      lastUpdate: Date.now()
    });
  }

  updateSessionState(sessionId, updates) {
    const sid = sessionId.toString();
    const current = this.sessionState.get(sid) || {};
    const merged = { ...current, ...updates, lastUpdate: Date.now() };
    this.sessionState.set(sid, merged);
    return merged;
  }

  getSessionState(sessionId) {
    return this.sessionState.get(sessionId?.toString()) || null;
  }

  removeSession(examId, sessionId) {
    const sid = sessionId?.toString();
    const examKey = examId?.toString();
    if (this.examSessions.has(examKey)) {
      this.examSessions.get(examKey).delete(sid);
      if (this.examSessions.get(examKey).size === 0) {
        this.examSessions.delete(examKey);
      }
    }
    this.sessionState.delete(sid);
    this.sessionSockets.delete(sid);
    this.removeSessionHealth(sid);
  }

  addMonitoringSocket(examId, socketId) {
    if (!this.monitoringRooms.has(examId)) {
      this.monitoringRooms.set(examId, new Set());
    }
    this.monitoringRooms.get(examId).add(socketId);
  }

  removeMonitoringSocket(examId, socketId) {
    const room = this.monitoringRooms.get(examId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.monitoringRooms.delete(examId);
      }
    }
  }

  getMonitoringSockets(examId) {
    const room = this.monitoringRooms.get(examId);
    return room ? Array.from(room) : [];
  }

  registerSessionSocket(sessionId, socketId) {
    const sid = sessionId.toString();
    const existing = this.sessionSockets.get(sid);
    this.sessionSockets.set(sid, socketId);
    return existing; // return old socketId if existed (for multi-tab detection)
  }

  removeSessionSocket(sessionId) {
    const sid = sessionId?.toString();
    this.sessionSockets.delete(sid);
  }

  computeRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  pushAIEvent(sessionId, event, examId) {
    const sid = sessionId.toString();
    const state = this.sessionState.get(sid);
    if (!state) return;

    state.aiEvents = state.aiEvents || [];
    state.aiEvents.push({ ...event, examId });
    if (state.aiEvents.length > 100) {
      state.aiEvents = state.aiEvents.slice(-100);
    }
    this.sessionState.set(sid, state);
  }

  getAIEvents(sessionId) {
    const state = this.sessionState.get(sessionId.toString());
    return state?.aiEvents || [];
  }

  getStats() {
    return {
      totalSessions: Array.from(this.examSessions.values())
        .reduce((total, sessions) => total + sessions.size, 0),
      activeSessions: Array.from(this.examSessions.values())
        .reduce((total, sessions) => total + Array.from(sessions.values())
          .filter(s => s.isActive).length, 0),
      monitoringRooms: this.monitoringRooms.size,
      activeConnections: this.activeConnections.size
    };
  }
}

module.exports = RealtimeDataStore;





