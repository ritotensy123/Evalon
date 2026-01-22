/**
 * Centralized Port Configuration
 * 
 * All ports must be configured via environment variables.
 * No hardcoded ports allowed.
 * 
 * Environment Variables:
 * - PORT: Main API server port (default: 5001)
 * - REALTIME_PORT: WebSocket server port (default: 5004)
 * - AI_SERVICE_PORT: Python AI service port (default: 5002)
 * - FRONTEND_PORT: Frontend dev server port (default: 3001)
 * - TEST_PORT: Test server port (default: 5001)
 */

const ports = {
  // Main API Server
  API: parseInt(process.env.PORT, 10) || 5001,
  
  // Real-time WebSocket Server
  REALTIME: parseInt(process.env.REALTIME_PORT, 10) || 5004,
  
  // Python AI Service
  AI_SERVICE: parseInt(process.env.AI_SERVICE_PORT, 10) || 5002,
  
  // Frontend Development Server
  FRONTEND: parseInt(process.env.FRONTEND_PORT, 10) || 3001,
  
  // Test Server
  TEST: parseInt(process.env.TEST_PORT, 10) || 5001,
};

/**
 * Validate that all ports are valid (between 1024 and 65535)
 * and that no two services use the same port
 */
const validatePorts = () => {
  // Only validate TEST port when in test environment
  const isTestEnv = process.env.NODE_ENV === 'test';
  const portEntries = Object.entries(ports).filter(([service]) => {
    // Skip TEST port validation unless in test environment
    return service !== 'TEST' || isTestEnv;
  });
  
  const usedPorts = new Set();
  
  for (const [service, port] of portEntries) {
    // Validate port range
    if (port < 1024 || port > 65535) {
      throw new Error(
        `Invalid port for ${service}: ${port}. Ports must be between 1024 and 65535.`
      );
    }
    
    // Check for conflicts
    if (usedPorts.has(port)) {
      throw new Error(
        `Port conflict: ${service} is trying to use port ${port}, which is already in use.`
      );
    }
    
    usedPorts.add(port);
  }
  
  return true;
};

/**
 * Get port configuration as URLs
 */
const getUrls = () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.HOST || 'localhost';
  
  return {
    API: `${protocol}://${host}:${ports.API}`,
    REALTIME: `${protocol}://${host}:${ports.REALTIME}`,
    AI_SERVICE: `${protocol}://${host}:${ports.AI_SERVICE}`,
    FRONTEND: `${protocol}://${host}:${ports.FRONTEND}`,
  };
};

module.exports = {
  ports,
  validatePorts,
  getUrls,
};

