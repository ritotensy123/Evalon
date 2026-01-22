/**
 * API Client Utility
 * 
 * Provides standardized error handling, retry logic, and request management
 * for all API calls in the application.
 */

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  RETRYABLE_ERROR_CODES: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'],
  // Special handling for rate limit errors (429) - use longer backoff
  RATE_LIMIT_DELAY: 3000, // 3 seconds for rate limit errors
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @returns {number} Delay in milliseconds
 */
const calculateBackoffDelay = (attempt) => {
  const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
};

/**
 * Check if error is retryable
 * @param {Error} error - Axios error object
 * @returns {boolean} True if error is retryable
 */
const isRetryableError = (error) => {
  // Network errors
  if (error.code && RETRY_CONFIG.RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  // HTTP status codes
  if (error.response?.status && RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(error.response.status)) {
    return true;
  }
  
  // No response (network failure)
  if (!error.response) {
    return true;
  }
  
  return false;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================================================
// RETRY INTERCEPTOR
// =============================================================================

/**
 * Create retry interceptor for axios instance
 * @param {Object} axiosInstance - Axios instance
 * @param {Object} config - Retry configuration (optional)
 * @returns {Function} Response interceptor function
 */
export const createRetryInterceptor = (axiosInstance, config = {}) => {
  const retryConfig = { ...RETRY_CONFIG, ...config };
  
  return async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if:
    // 1. Already retried max times
    // 2. Request doesn't have config (shouldn't happen)
    // 3. Error is not retryable
    // 4. Request method is not idempotent (POST, PATCH, PUT, DELETE)
    if (
      !originalRequest ||
      originalRequest.__retryCount >= retryConfig.MAX_RETRIES ||
      !isRetryableError(error) ||
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(originalRequest.method?.toUpperCase())
    ) {
      return Promise.reject(error);
    }
    
    // Initialize retry count
    originalRequest.__retryCount = originalRequest.__retryCount || 0;
    originalRequest.__retryCount += 1;
    
    // Calculate delay - use longer delay for rate limit errors (429)
    const isRateLimit = error.response?.status === 429;
    const delay = isRateLimit 
      ? retryConfig.RATE_LIMIT_DELAY 
      : calculateBackoffDelay(originalRequest.__retryCount - 1);
    
    // Log retry attempt (suppress 429 in dev if it's expected from StrictMode)
    if (import.meta.env.MODE === 'development') {
      if (isRateLimit) {
        console.warn(
          `⏳ Rate limit hit, retrying (${originalRequest.__retryCount}/${retryConfig.MAX_RETRIES}):`,
          originalRequest.url,
          `after ${delay}ms`
        );
      } else {
        console.log(
          `🔄 Retrying request (${originalRequest.__retryCount}/${retryConfig.MAX_RETRIES}):`,
          originalRequest.url,
          `after ${delay}ms`
        );
      }
    }
    
    // Wait before retrying
    await sleep(delay);
    
    // Retry request
    return axiosInstance(originalRequest);
  };
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Standardize error response format
 * @param {Error} error - Axios error object
 * @returns {Object} Standardized error object
 */
export const standardizeError = (error) => {
  // Network error (no response)
  if (!error.response) {
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
      code: error.code || 'NETWORK_ERROR',
      statusCode: 0,
      data: null,
    };
  }
  
  // HTTP error response
  const { status, data } = error.response;
  
  // Backend standardized error format
  if (data && typeof data === 'object' && 'success' in data) {
    return {
      success: data.success,
      message: data.message || data.error?.message || 'An error occurred',
      code: data.error?.code || `HTTP_${status}`,
      statusCode: status,
      data: data.data || null,
      error: data.error || null,
      requestId: data.requestId || null,
      timestamp: data.timestamp || null,
    };
  }
  
  // Generic HTTP error
  return {
    success: false,
    message: data?.message || data?.error || `HTTP ${status} Error`,
    code: `HTTP_${status}`,
    statusCode: status,
    data: data || null,
  };
};

/**
 * Create error handler interceptor
 * @param {Function} onTokenExpiration - Callback for token expiration
 * @returns {Function} Response interceptor function
 */
export const createErrorHandler = (onTokenExpiration) => {
  return (error) => {
    const standardizedError = standardizeError(error);
    
    // Handle token expiration
    if (standardizedError.statusCode === 401 && onTokenExpiration) {
      onTokenExpiration(standardizedError);
    }
    
    // Log error in development (suppress 429 warnings if they're expected from React StrictMode)
    if (import.meta.env.MODE === 'development') {
      // Suppress 429 errors in console to reduce noise from React StrictMode double-invocation
      if (standardizedError.statusCode === 429) {
        // Only log if it's not a retryable error (i.e., all retries failed)
        if (!error.config?.__retryCount || error.config.__retryCount >= RETRY_CONFIG.MAX_RETRIES) {
          console.warn('⚠️ Rate limit exceeded (all retries exhausted):', standardizedError.message);
        }
        // Otherwise, the retry interceptor will handle it
      } else {
        console.error('❌ API Error:', standardizedError);
      }
    }
    
    // Reject with standardized error
    return Promise.reject(standardizedError);
  };
};

// =============================================================================
// REQUEST CANCELLATION
// =============================================================================

/**
 * Create AbortController for request cancellation
 * @returns {Object} Object with controller and cancel function
 */
export const createRequestCanceller = () => {
  const controller = new AbortController();
  
  return {
    controller,
    signal: controller.signal,
    cancel: (reason = 'Request cancelled') => {
      controller.abort(reason);
    },
    isCancelled: () => controller.signal.aborted,
  };
};

/**
 * Add cancellation support to axios config
 * @param {Object} config - Axios config object
 * @param {AbortSignal} signal - AbortSignal from AbortController
 * @returns {Object} Updated config with signal
 */
export const addCancellation = (config, signal) => {
  return {
    ...config,
    signal,
  };
};

// =============================================================================
// REQUEST ID TRACKING
// =============================================================================

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Add request ID to axios config
 * @param {Object} config - Axios config object
 * @param {string} requestId - Request ID (optional, will generate if not provided)
 * @returns {Object} Updated config with request ID header
 */
export const addRequestId = (config, requestId = null) => {
  const id = requestId || generateRequestId();
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-ID': id,
    },
    __requestId: id, // Store for logging
  };
};

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

/**
 * Get auth token from storage
 * @returns {string|null} Auth token or null
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Set auth token in storage
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Create auth interceptor for axios instance
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Request interceptor function
 */
export const createAuthInterceptor = (axiosInstance) => {
  return (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };
};

// =============================================================================
// REQUEST LOGGING
// =============================================================================

/**
 * Create request logging interceptor
 * @param {string} apiName - Name of the API (for logging)
 * @param {boolean} verbose - Enable verbose logging (default: false)
 * @returns {Function} Request interceptor function
 */
export const createRequestLogger = (apiName = 'API', verbose = false) => {
  return (config) => {
    if (import.meta.env.MODE === 'development' || verbose) {
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      const url = config.url || 'UNKNOWN';
      const requestId = config.__requestId || 'N/A';
      console.log(`📤 ${apiName} Request: ${method} ${url} [${requestId}]`);
    }
    return config;
  };
};

/**
 * Create response logging interceptor
 * @param {string} apiName - Name of the API (for logging)
 * @param {boolean} verbose - Enable verbose logging (default: false)
 * @returns {Function} Response interceptor function
 */
export const createResponseLogger = (apiName = 'API', verbose = false) => {
  return (response) => {
    if (import.meta.env.MODE === 'development' || verbose) {
      const status = response.status || 'UNKNOWN';
      const url = response.config?.url || 'UNKNOWN';
      const requestId = response.config?.__requestId || 'N/A';
      console.log(`📥 ${apiName} Response: ${status} ${url} [${requestId}]`);
    }
    return response;
  };
};

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  createRetryInterceptor,
  createErrorHandler,
  createRequestCanceller,
  addCancellation,
  addRequestId,
  generateRequestId,
  standardizeError,
  getAuthToken,
  setAuthToken,
  createAuthInterceptor,
  createRequestLogger,
  createResponseLogger,
  RETRY_CONFIG,
};



