/**
 * Application Constants
 * 
 * Centralized constants to avoid magic numbers and strings.
 * All constants should be defined here.
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Alias for consistency with middleware
const HTTP_STATUS_CODES = HTTP_STATUS;

// User Roles
const USER_ROLES = {
  ORGANIZATION_ADMIN: 'organization-admin',
  SUB_ADMIN: 'sub-admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// User Types (legacy support)
const USER_TYPES = {
  ORGANIZATION: 'organization',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Exam Status
const EXAM_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Exam Session Status
const SESSION_STATUS = {
  PENDING: 'pending',
  STARTED: 'started',
  IN_PROGRESS: 'in-progress',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed',
  TIMED_OUT: 'timed-out',
  TERMINATED: 'terminated',
};

// Department Types
const DEPARTMENT_TYPES = {
  DEPARTMENT: 'department',
  SUB_DEPARTMENT: 'sub-department',
  CLASS: 'class',
  SECTION: 'section',
};

// Question Types
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  SINGLE_CHOICE: 'single-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
};

// Time Constants (in milliseconds)
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * TIME.MINUTE, // 15 minutes
  MAX_REQUESTS: 100,
  WEB_SOCKET_MAX_PER_SECOND: 10,
  WEB_SOCKET_WINDOW_MS: TIME.SECOND,
};

// File Upload Limits
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv'],
};

// WebSocket Events
const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Exam Session
  JOIN_EXAM_SESSION: 'join_exam_session',
  EXAM_SESSION_JOINED: 'exam_session_joined',
  START_EXAM: 'start_exam',
  EXAM_STARTED: 'exam_started',
  SUBMIT_ANSWER: 'submit_answer',
  ANSWER_SUBMITTED: 'answer_submitted',
  END_EXAM: 'end_exam',
  EXAM_ENDED: 'exam_ended',
  
  // Monitoring
  START_MONITORING: 'start_monitoring',
  MONITORING_STARTED: 'monitoring_started',
  PROGRESS_UPDATE: 'progress_update',
  SECURITY_FLAG: 'security_flag',
  AI_UPDATE: 'ai_update',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
};

// Error Codes
const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
};

// AI Proctoring Thresholds
const AI_THRESHOLDS = {
  RISK_LOW: 0.3,
  RISK_MEDIUM: 0.6,
  RISK_HIGH: 0.8,
  FACE_DETECTION_CONFIDENCE: 0.7,
};

// Session Timeouts
const SESSION_TIMEOUTS = {
  HEARTBEAT_TIMEOUT: 30 * TIME.SECOND,
  CLEANUP_INTERVAL: 5 * TIME.MINUTE,
  MAX_IDLE_TIME: 10 * TIME.MINUTE,
};

// WebSocket/Socket.IO Configuration
const WEBSOCKET = {
  // Socket.IO server configuration
  PING_TIMEOUT: 60 * TIME.SECOND, // 60 seconds
  PING_INTERVAL: 25 * TIME.SECOND, // 25 seconds
  UPGRADE_TIMEOUT: 10 * TIME.SECOND, // 10 seconds
  MAX_HTTP_BUFFER_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_DISCONNECTION_DURATION: 2 * TIME.MINUTE, // 2 minutes
  
  // Rate limiting for socket events
  RATE_LIMIT: {
    SUBMIT_ANSWER: { max: 5, window: TIME.SECOND },
    AUTO_SAVE: { max: 3, window: 2 * TIME.SECOND },
    UPDATE_PROGRESS: { max: 5, window: TIME.SECOND },
    HEARTBEAT: { max: 4, window: 2 * TIME.SECOND },
    CAMERA_STATS: { max: 10, window: 10 * TIME.SECOND },
    SCREENSHARE_STATS: { max: 8, window: 10 * TIME.SECOND },
  },
  
  // Health check intervals
  HEALTH_CHECK_INTERVAL: 30 * TIME.SECOND, // 30 seconds
  STATE_STALE_THRESHOLD: 15 * TIME.SECOND, // 15 seconds
};

module.exports = {
  HTTP_STATUS,
  HTTP_STATUS_CODES, // Alias for consistency
  USER_ROLES,
  USER_TYPES,
  EXAM_STATUS,
  SESSION_STATUS,
  DEPARTMENT_TYPES,
  QUESTION_TYPES,
  TIME,
  PAGINATION,
  RATE_LIMIT,
  FILE_UPLOAD,
  SOCKET_EVENTS,
  ERROR_CODES,
  AI_THRESHOLDS,
  SESSION_TIMEOUTS,
  WEBSOCKET,
};

