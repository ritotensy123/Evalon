const mongoose = require('mongoose');

/**
 * ExamActivityLog Model
 * HIGH-8 FIX: Audit trail for all real-time exam activities
 * 
 * IMPORTANT: No PII (Personally Identifiable Information) should be stored.
 * Only store IDs and technical metadata.
 */
const examActivityLogSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      // Session lifecycle
      'student_joined',
      'student_disconnected',
      'exam_ended',
      
      // Exam progress
      'answer_submitted',
      'auto_save',
      'progress_update',
      
      // Security events
      'security_flag',
      
      // Screen sharing
      'screen_share_started',
      'screen_share_stopped',
      'screen_share_requested',
      
      // WebRTC signalling
      'webrtc_offer',
      'webrtc_answer',
      'webrtc_ice_candidate',
      'webrtc_offer_requested',
      
      // Monitoring
      'monitoring_joined',
      'monitoring_left',
      
      // HIGH-9: Multi-tab detection
      'duplicate_connection',
      'state_sync_requested',
      
      // HIGH-11: Suspicion scoring
      'suspicion_event'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'exam_activity_logs'
});

// Compound indexes for efficient querying
examActivityLogSchema.index({ examId: 1, timestamp: -1 });
examActivityLogSchema.index({ sessionId: 1, timestamp: -1 });
examActivityLogSchema.index({ examId: 1, eventType: 1, timestamp: -1 });

// Static method to get activity timeline for an exam
examActivityLogSchema.statics.getExamTimeline = async function(examId, options = {}) {
  const { limit = 100, skip = 0, eventTypes = null } = options;
  
  const query = { examId };
  if (eventTypes && Array.isArray(eventTypes)) {
    query.eventType = { $in: eventTypes };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get activity for a specific session
examActivityLogSchema.statics.getSessionTimeline = async function(sessionId, options = {}) {
  const { limit = 50 } = options;
  
  return this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// HIGH-12 FIX START: Timeline Event Normalizer
/**
 * Normalize an activity log entry into a standard timeline event format
 * @param {Object} log - Raw activity log entry
 * @returns {Object} Normalized timeline event
 */
examActivityLogSchema.statics.normalizeEvent = function(log) {
  if (!log) return null;
  
  const { eventType, timestamp, metadata = {} } = log;
  
  // Event type to normalized type mapping
  const typeMap = {
    'student_joined': 'session',
    'student_disconnected': 'disconnect',
    'exam_ended': 'session',
    'answer_submitted': 'answer',
    'auto_save': 'answer',
    'progress_update': 'progress',
    'security_flag': 'security',
    'screen_share_started': 'screen_share',
    'screen_share_stopped': 'screen_share_end',
    'screen_share_requested': 'screen_share',
    'webrtc_offer': 'webrtc',
    'webrtc_answer': 'webrtc',
    'webrtc_ice_candidate': 'webrtc',
    'webrtc_offer_requested': 'webrtc',
    'monitoring_joined': 'monitoring',
    'monitoring_left': 'monitoring',
    'duplicate_connection': 'security',
    'state_sync_requested': 'state',
    'suspicion_event': 'suspicion'
  };
  
  // Human-readable message mapping
  const messageMap = {
    'student_joined': 'Student joined exam session',
    'student_disconnected': 'Student disconnected',
    'exam_ended': 'Exam session ended',
    'answer_submitted': `Answer submitted${metadata.questionId ? ` (Q${metadata.questionId})` : ''}`,
    'auto_save': 'Answers auto-saved',
    'progress_update': `Progress: Q${metadata.currentQuestion || '?'}/${metadata.totalQuestions || '?'}`,
    'security_flag': `Security flag: ${metadata.flagType || 'unknown'}`,
    'screen_share_started': 'Screen sharing started',
    'screen_share_stopped': `Screen sharing stopped${metadata.reason ? ` (${metadata.reason})` : ''}`,
    'screen_share_requested': 'Screen share requested by teacher',
    'webrtc_offer': 'WebRTC connection initiated',
    'webrtc_answer': 'WebRTC connection established',
    'webrtc_ice_candidate': 'WebRTC ICE candidate exchange',
    'webrtc_offer_requested': 'WebRTC offer requested',
    'monitoring_joined': 'Teacher joined monitoring',
    'monitoring_left': 'Teacher left monitoring',
    'duplicate_connection': 'Multi-tab/duplicate connection detected',
    'state_sync_requested': 'State synchronization requested',
    'suspicion_event': `Suspicion event: ${metadata.eventType || 'unknown'} (+${metadata.weight || 0})`
  };
  
  // Determine severity based on event type and metadata
  let severity = 'low';
  
  if (eventType === 'security_flag') {
    const flagSeverityMap = {
      'ai_detection': metadata.severity || 'medium',
      'tab_hidden': 'medium',
      'face_missing': 'medium',
      'multiple_faces': 'high',
      'looking_away': 'low',
      'phone_detected': 'high'
    };
    severity = flagSeverityMap[metadata.flagType] || metadata.severity || 'medium';
  } else if (eventType === 'suspicion_event') {
    const weight = metadata.weight || 0;
    if (weight >= 25) severity = 'high';
    else if (weight >= 10) severity = 'medium';
    else severity = 'low';
  } else if (eventType === 'student_disconnected') {
    severity = metadata.reason === 'exam_ended' ? 'low' : 'medium';
  } else if (eventType === 'duplicate_connection') {
    severity = 'high';
  } else if (eventType === 'screen_share_stopped') {
    severity = metadata.reason === 'teacher_ended' || metadata.reason === 'exam_ended' ? 'low' : 'medium';
  }
  
  // Build sanitized metadata (remove any potential PII that slipped through)
  const sanitizedMetadata = { ...metadata };
  const piiFields = ['name', 'email', 'phone', 'userInfo', 'deviceInfo', 'password', 'token', 'ip'];
  piiFields.forEach(field => delete sanitizedMetadata[field]);
  
  return {
    timestamp: timestamp || new Date(),
    type: typeMap[eventType] || 'unknown',
    eventType, // Keep original for reference
    severity,
    message: messageMap[eventType] || `Event: ${eventType}`,
    metadata: sanitizedMetadata
  };
};

/**
 * Get normalized session timeline
 * @param {string} sessionId - Session ID
 * @param {Object} options - Query options
 * @returns {Array} Normalized timeline events
 */
examActivityLogSchema.statics.getNormalizedSessionTimeline = async function(sessionId, options = {}) {
  const { limit = 200 } = options;
  
  const logs = await this.find({ sessionId })
    .sort({ timestamp: 1 }) // Ascending for timeline
    .limit(limit)
    .lean();
  
  return logs.map(log => this.normalizeEvent(log)).filter(Boolean);
};
// HIGH-12 FIX END

// Instance method to sanitize before save (extra protection)
examActivityLogSchema.pre('save', function(next) {
  // Remove any potential PII from metadata
  if (this.metadata) {
    const piiFields = ['name', 'email', 'phone', 'userInfo', 'deviceInfo', 'password', 'token'];
    piiFields.forEach(field => {
      if (this.metadata[field]) {
        delete this.metadata[field];
      }
    });
  }
  next();
});

const ExamActivityLog = mongoose.model('ExamActivityLog', examActivityLogSchema);

module.exports = ExamActivityLog;


