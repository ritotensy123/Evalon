const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Backend API Testing
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration - Multiple reporters for comprehensive reporting
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for API requests
    baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },

  // Configure projects for different test types
  projects: [
    {
      name: 'api-tests',
      testMatch: /tests\/api\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'frontend-tests',
      testMatch: /tests\/frontend\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Frontend URL for browser-based tests
        baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',
      },
    },
  ],

  // Global setup/teardown
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
});




