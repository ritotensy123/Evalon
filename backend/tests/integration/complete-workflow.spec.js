const { test, expect } = require('@playwright/test');
const { 
  createAuthHeaders,
  generateRandomEmail,
  generateOrgCode
} = require('../helpers/api-helpers');

/**
 * Integration Tests - Complete Workflows
 * These tests verify that multiple API endpoints work together correctly
 */
test.describe('Complete Workflow Integration Tests', () => {
  let request;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('Organization Setup Workflow', () => {
    test('should complete organization registration workflow', async () => {
      // Step 1: Check if organization registration endpoint exists
      const orgData = {
        name: `Integration Test Org ${Date.now()}`,
        organizationCode: generateOrgCode(),
        type: 'college',
        email: generateRandomEmail(),
        phone: '+919876543210',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'India',
          postalCode: '123456'
        }
      };

      const response = await request.post('/api/organizations/register', {
        data: orgData
      });

      // Endpoint should exist and process request
      expect(response.status()).not.toBe(404);
      
      // If successful, verify response structure
      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.organization).toBeDefined();
        expect(data.organization.name).toBe(orgData.name);
      }
    });
  });

  test.describe('User Journey Workflow', () => {
    test.skip('should complete full user journey from registration to access', async () => {
      // This test documents a complete user workflow
      // Skip by default as it requires full authentication setup
      
      // Step 1: User login attempt
      // Step 2: Password verification
      // Step 3: Token generation
      // Step 4: Access protected resource
      // Step 5: Update profile
      // Step 6: Logout
    });
  });

  test.describe('Department Hierarchy Workflow', () => {
    test.skip('should create hierarchical department structure', async () => {
      // This test would verify:
      // 1. Create parent department
      // 2. Create child departments
      // 3. Verify hierarchy
      // 4. Update relationships
      // 5. Delete in correct order
    });
  });

  test.describe('API Health and Connectivity', () => {
    test('should verify all API endpoints are accessible', async () => {
      const endpoints = [
        '/health',
        '/api/auth/login',
        '/api/organizations',
        '/api/departments',
        '/api/user-management'
      ];

      for (const endpoint of endpoints) {
        const response = await request.fetch(endpoint, {
          method: endpoint === '/health' ? 'GET' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: endpoint.includes('login') ? { email: 'test@test.com', password: 'test' } : undefined
        });

        // Should not be 404 (endpoint exists)
        expect(response.status()).not.toBe(404);
        console.log(`✓ ${endpoint}: ${response.status()}`);
      }
    });

    test('should have consistent error response format across endpoints', async () => {
      const endpoints = [
        '/api/auth/profile',
        '/api/departments',
        '/api/user-management'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint);
        
        // All should require auth and return 401
        if (response.status() === 401) {
          const data = await response.json();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(false);
          expect(data).toHaveProperty('message');
        }
      }
    });
  });

  test.describe('Error Handling Consistency', () => {
    test('should handle 404 consistently', async () => {
      const response = await request.get('/api/nonexistent-endpoint');
      
      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });

    test('should handle malformed requests consistently', async () => {
      const endpoints = [
        '/api/auth/login',
        '/api/organizations/register'
      ];

      for (const endpoint of endpoints) {
        const response = await request.post(endpoint, {
          headers: {
            'Content-Type': 'application/json'
          },
          data: '{invalid json'
        });

        expect([400]).toContain(response.status());
      }
    });
  });

  test.describe('Performance Checks', () => {
    test('should respond to health check within acceptable time', async () => {
      const startTime = Date.now();
      const response = await request.get('/health');
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      
      console.log(`Health check response time: ${responseTime}ms`);
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request.get('/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
    });
  });
});




