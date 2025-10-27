require('dotenv').config();

/**
 * Global setup that runs before all tests
 * Use this to start the test server, seed database, etc.
 */
module.exports = async (config) => {
  console.log('🔧 Global Setup: Starting test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.TEST_PORT || '5001';
  
  // You can add additional setup here:
  // - Start test database
  // - Seed initial data
  // - Start backend server if needed
  
  console.log(`✅ Test environment ready on port ${process.env.PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${process.env.PORT}`);
};

