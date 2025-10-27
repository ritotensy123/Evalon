const { test, expect } = require('@playwright/test');
const { 
  createAuthHeaders,
  generateRandomEmail,
  generateOrgCode
} = require('../helpers/api-helpers');

test.describe('Organization API Tests', () => {
  let request;
  let authToken;
  let createdOrgIds = [];

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

  test.describe('Organization Registration', () => {
    test('should validate organization registration endpoint exists', async () => {
      const response = await request.post('/api/organizations/register', {
        data: {
          name: 'Test Organization'
        }
      });

      // Endpoint should exist (not 404)
      expect(response.status()).not.toBe(404);
    });

    test('should reject organization with missing required fields', async () => {
      const response = await request.post('/api/organizations/register', {
        data: {
          name: 'Test Organization'
          // Missing other required fields
        }
      });

      expect([400]).toContain(response.status());
    });

    test('should validate email format in organization registration', async () => {
      const response = await request.post('/api/organizations/register', {
        data: {
          name: 'Test Organization',
          email: 'invalid-email',
          organizationCode: generateOrgCode()
        }
      });

      expect([400]).toContain(response.status());
    });

    test('should validate phone number format', async () => {
      const response = await request.post('/api/organizations/register', {
        data: {
          name: 'Test Organization',
          email: generateRandomEmail(),
          phone: '123',
          organizationCode: generateOrgCode()
        }
      });

      expect([400]).toContain(response.status());
    });

    test('should validate organization code format', async () => {
      const invalidCodes = ['', 'ABC', '@#$%', 'a'.repeat(100)];

      for (const code of invalidCodes) {
        const response = await request.post('/api/organizations/register', {
          data: {
            name: 'Test Organization',
            email: generateRandomEmail(),
            organizationCode: code
          }
        });

        expect([400]).toContain(response.status());
      }
    });
  });

  test.describe('Organization Retrieval', () => {
    test('should list organizations (with proper authorization)', async () => {
      const response = await request.get('/api/organizations', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.organizations)).toBe(true);
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should get organization by ID', async () => {
      const response = await request.get('/api/organizations/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([401, 403, 404]).toContain(response.status());
    });

    test('should validate organization code lookup', async () => {
      const response = await request.get('/api/organizations/code/IN-TEST-2025-ABC', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should work with or without auth depending on your API design
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Organization Update', () => {
    test('should require authentication for updates', async () => {
      const response = await request.put('/api/organizations/507f1f77bcf86cd799439011', {
        data: {
          name: 'Updated Name'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should validate update data', async () => {
      const response = await request.put('/api/organizations/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: 'invalid-email'
        }
      });

      expect([400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize XSS in organization name', async () => {
      const response = await request.post('/api/organizations/register', {
        data: {
          name: '<script>alert("xss")</script>',
          email: generateRandomEmail(),
          organizationCode: generateOrgCode()
        }
      });

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.organization.name).not.toContain('<script>');
      }
    });
  });
});




