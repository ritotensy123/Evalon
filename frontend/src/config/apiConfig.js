/**
 * Centralized API Configuration
 * 
 * All API URLs should be imported from this file.
 * Environment variables should be set in .env files:
 * - Development: .env.development
 * - Production: .env.production
 * 
 * Required environment variables:
 * - VITE_API_BASE_URL: Main backend server URL (e.g., http://localhost:5001)
 * - VITE_SOCKET_URL: Real-time WebSocket server URL (e.g., http://localhost:5004)
 * - VITE_AI_URL: Python AI service URL (e.g., http://localhost:5002)
 */

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================

/**
 * Validate environment variable
 * Logs warning if not set (only in development)
 * @param {string} name - Environment variable name
 * @param {string} value - Environment variable value
 * @returns {string} - The value or undefined
 */
const validateEnvVar = (name, value) => {
  if (!value && import.meta.env.MODE === 'development') {
    console.warn(`⚠️ Environment variable ${name} is not set. Using fallback for development.`);
  }
  return value;
};

// =============================================================================
// API BASE URLs
// =============================================================================

/**
 * Main API Base URL (includes /api/v1 path)
 * Used for: auth, organizations, exams, questions, users, etc.
 */
const API_SERVER_URL = validateEnvVar('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL) 
  || 'http://localhost:5001';
export const API_BASE_URL = `${API_SERVER_URL}/api/v1`;

/**
 * Main API Server URL (without /api path)
 * Used for: health checks, time sync, etc.
 */
export const API_SERVER = API_SERVER_URL;

/**
 * WebSocket/Real-time Server URL
 * Used for: exam monitoring, real-time updates
 */
export const SOCKET_URL = validateEnvVar('VITE_SOCKET_URL', import.meta.env.VITE_SOCKET_URL) 
  || 'http://localhost:5004';

/**
 * AI Proctoring Service URL
 * Used for: face detection, behavior analysis
 */
export const AI_SERVICE_URL = validateEnvVar('VITE_AI_URL', import.meta.env.VITE_AI_URL) 
  || 'http://localhost:5002';

// =============================================================================
// API ENDPOINT PATHS (for consistency)
// =============================================================================

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: `${API_BASE_URL}/auth`,
  
  // Organization endpoints
  ORGANIZATIONS: `${API_BASE_URL}/organizations`,
  
  // Exam endpoints
  EXAMS: `${API_BASE_URL}/exams`,
  
  // Question endpoints
  QUESTIONS: `${API_BASE_URL}/questions`,
  QUESTION_BANKS: `${API_BASE_URL}/question-banks`,
  
  // User endpoints
  TEACHERS: `${API_BASE_URL}/teachers`,
  STUDENTS: `${API_BASE_URL}/students`,
  USER_MANAGEMENT: `${API_BASE_URL}/user-management`,
  
  // Class & Department endpoints
  TEACHER_CLASSES: `${API_BASE_URL}/teacher-classes`,
  DEPARTMENTS: `${API_BASE_URL}/departments`,
  SUBJECTS: `${API_BASE_URL}/subjects`,
  
  // Utility endpoints
  HEALTH: `${API_SERVER}/health`,
  TIME: `${API_BASE_URL}/time`,
  
  // Location endpoints (countries, states, cities)
  LOCATION: API_BASE_URL,
};

// =============================================================================
// AI SERVICE ENDPOINTS
// =============================================================================

export const AI_ENDPOINTS = {
  HEALTH: `${AI_SERVICE_URL}/health`,
  DETECT_FACES: `${AI_SERVICE_URL}/api/detect-faces`,
  VALIDATE_SETUP: `${AI_SERVICE_URL}/api/validate-setup`,
  COMPREHENSIVE_PROCTORING: `${AI_SERVICE_URL}/api/comprehensive-proctoring`,
  CLASSIFY_BEHAVIOR: `${AI_SERVICE_URL}/api/classify-behavior`,
};

// =============================================================================
// SOCKET ENDPOINTS
// =============================================================================

export const SOCKET_ENDPOINTS = {
  BASE: SOCKET_URL,
  // Note: Socket.IO uses event-based communication, not REST endpoints
};

// =============================================================================
// EXPORT DEFAULT CONFIG OBJECT
// =============================================================================

export default {
  API_BASE_URL,
  API_SERVER,
  SOCKET_URL,
  AI_SERVICE_URL,
  API_ENDPOINTS,
  AI_ENDPOINTS,
  SOCKET_ENDPOINTS,
};


