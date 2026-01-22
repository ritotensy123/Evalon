/**
 * Axios Configuration Utility
 * 
 * Provides standardized axios instance configuration with interceptors
 * for authentication, logging, retry logic, and error handling.
 */

import axios from 'axios';
import {
  createAuthInterceptor,
  createRequestLogger,
  createResponseLogger,
  createErrorHandler,
  createRetryInterceptor,
  addRequestId,
} from './apiClient';

// =============================================================================
// TOKEN EXPIRATION HANDLER
// =============================================================================

let isRedirecting = false;

/**
 * Handle token expiration - redirect to login
 * @param {Object} error - Standardized error object
 */
export const handleTokenExpiration = (error) => {
  if (isRedirecting) {
    return;
  }
  
  isRedirecting = true;
  
  // Clear auth data
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('dashboardData');
    localStorage.removeItem('organizationData');
  } catch (e) {
    console.error('Error clearing auth data:', e);
  }
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

// =============================================================================
// CREATE CONFIGURED AXIOS INSTANCE
// =============================================================================

/**
 * Create a configured axios instance with all interceptors
 * @param {Object} config - Axios configuration
 * @param {Object} options - Additional options
 * @param {string} options.apiName - Name for logging (default: 'API')
 * @param {boolean} options.enableRetry - Enable retry logic (default: true)
 * @param {boolean} options.enableLogging - Enable request/response logging (default: true)
 * @returns {Object} Configured axios instance
 */
export const createAxiosInstance = (config = {}, options = {}) => {
  const {
    apiName = 'API',
    enableRetry = true,
    enableLogging = true,
  } = options;
  
  // Create axios instance
  const instance = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    ...config,
  });
  
  // Request interceptors
  instance.interceptors.request.use(
    (requestConfig) => {
      // Add request ID
      const configWithId = addRequestId(requestConfig);
      
      // Add auth token
      const authInterceptor = createAuthInterceptor(instance);
      const configWithAuth = authInterceptor(configWithId);
      
      // Log request (if enabled)
      if (enableLogging) {
        const logger = createRequestLogger(apiName);
        return logger(configWithAuth);
      }
      
      return configWithAuth;
    },
    (error) => {
      console.error(`❌ ${apiName} Request Error:`, error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptors
  instance.interceptors.response.use(
    (response) => {
      // Log response (if enabled)
      if (enableLogging) {
        const logger = createResponseLogger(apiName);
        return logger(response);
      }
      return response;
    },
    async (error) => {
      // Retry logic (if enabled)
      if (enableRetry) {
        const retryInterceptor = createRetryInterceptor(instance);
        try {
          return await retryInterceptor(error);
        } catch (retryError) {
          // If retry failed, continue to error handler
          error = retryError;
        }
      }
      
      // Error handler (includes token expiration handling)
      const errorHandler = createErrorHandler(handleTokenExpiration);
      return errorHandler(error);
    }
  );
  
  return instance;
};

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  createAxiosInstance,
  handleTokenExpiration,
};





