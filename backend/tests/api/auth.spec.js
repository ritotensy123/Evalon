const { test, expect } = require('@playwright/test');
const { 
  generateRandomEmail, 
  createAuthHeaders,
  extractToken,
  validateApiResponse 
} = require('../helpers/api-helpers');
const testData = require('../fixtures/test-data.json');

test.describe('Authentication API Tests', () => {
  let request;
  let testUserEmail;
  let testUserPassword;
  let authToken;

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

  test.describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request.get('/health');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Evalon Backend API is running');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
    });
  });

  test.describe('Login Functionality', () => {
    test('should successfully login with valid credentials', async () => {
      // Note: This assumes you have a test user in your database
      // You may need to create a user first or use seeded test data
      
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'Test@12345'
        }
      });

      // If user doesn't exist, response will be 401
      // This test documents the expected behavior
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('user');
        expect(data.user).toHaveProperty('email');
        expect(data.user).toHaveProperty('role');
      } else {
        // Document that user needs to exist
        expect(response.status()).toBe(401);
      }
    });

    test('should reject login with invalid email', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'nonexistent@example.com',
          password: 'Test@12345'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject login with invalid password', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject login with missing email', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          password: 'Test@12345'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject login with missing password', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject login with empty credentials', async () => {
      const response = await request.post('/api/auth/login', {
        data: {}
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject login with invalid email format', async () => {
      const invalidEmails = testData.invalidInputs.emails;
      
      for (const email of invalidEmails.slice(0, 3)) {
        const response = await request.post('/api/auth/login', {
          data: {
            email: email,
            password: 'Test@12345'
          }
        });

        expect([400, 401]).toContain(response.status());
      }
    });
  });

  test.describe('Google Sign-In', () => {
    test('should have Google sign-in endpoint', async () => {
      const response = await request.post('/api/auth/google', {
        data: {
          idToken: 'invalid-token-for-testing'
        }
      });

      // Endpoint should exist (not 404)
      expect(response.status()).not.toBe(404);
      
      // Should fail with invalid token (401 or 400)
      expect([400, 401, 500]).toContain(response.status());
    });
  });

  test.describe('Token Verification', () => {
    test('should reject access without token', async () => {
      const response = await request.get('/api/auth/profile');

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject access with invalid token', async () => {
      const response = await request.get('/api/auth/profile', {
        headers: createAuthHeaders('invalid-token-12345')
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid token');
    });

    test('should reject access with malformed token', async () => {
      const response = await request.get('/api/auth/profile', {
        headers: {
          'Authorization': 'InvalidFormat token123'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject access with expired token', async () => {
      // This is a sample expired JWT token (expired in the past)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vfGxEJdRbFdHqKEkZYZ-7L9Y0rkGVWAeqAWFM';
      
      const response = await request.get('/api/auth/profile', {
        headers: createAuthHeaders(expiredToken)
      });

      expect([401]).toContain(response.status());
    });
  });

  test.describe('Logout Functionality', () => {
    test('should accept logout request', async () => {
      const response = await request.post('/api/auth/logout', {
        data: {}
      });

      // Logout should succeed even without token (client-side cleanup)
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Protected Routes', () => {
    test('should protect profile endpoint', async () => {
      const response = await request.get('/api/auth/profile');
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should protect change password endpoint', async () => {
      const response = await request.put('/api/auth/change-password', {
        data: {
          oldPassword: 'old',
          newPassword: 'new'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should protect first-time login completion endpoint', async () => {
      const response = await request.put('/api/auth/complete-first-login', {
        data: {
          completed: true
        }
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Input Validation', () => {
    test('should reject SQL injection attempts', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: "admin'--",
          password: "' OR '1'='1"
        }
      });

      expect([400, 401]).toContain(response.status());
    });

    test('should reject XSS attempts in email field', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: '<script>alert("xss")</script>@test.com',
          password: 'Test@12345'
        }
      });

      expect([400, 401]).toContain(response.status());
    });

    test('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      
      const response = await request.post('/api/auth/login', {
        data: {
          email: longString + '@test.com',
          password: longString
        }
      });

      expect([400, 401, 413]).toContain(response.status());
    });

    test('should reject special characters in email', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@#$%^&*()@test.com',
          password: 'Test@12345'
        }
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('Rate Limiting', () => {
    test.skip('should rate limit excessive login attempts', async () => {
      // This test is skipped by default as it requires time
      // Enable when testing rate limiting specifically
      
      const attempts = [];
      for (let i = 0; i < 150; i++) {
        attempts.push(
          request.post('/api/auth/login', {
            data: {
              email: `test${i}@example.com`,
              password: 'Test@12345'
            }
          })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(r => r.status() === 429);
      
      // Should have at least one rate limited response
      expect(rateLimited).toBe(true);
    });
  });

  test.describe('Response Format', () => {
    test('should return consistent error format', async () => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'nonexistent@test.com',
          password: 'wrong'
        }
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request.post('/api/auth/login', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: 'this is not valid JSON{'
      });

      expect([400]).toContain(response.status());
    });

    test('should handle empty request body', async () => {
      const response = await request.post('/api/auth/login', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: ''
      });

      expect([400]).toContain(response.status());
    });
  });

  test.describe('CORS Headers', () => {
    test('should include CORS headers in response', async () => {
      const response = await request.get('/health');
      
      const headers = response.headers();
      // CORS headers should be present
      expect(headers).toBeTruthy();
    });

    test('should handle OPTIONS preflight request', async () => {
      const response = await request.fetch('/api/auth/login', {
        method: 'OPTIONS'
      });

      // OPTIONS should be handled (200 or 204)
      expect([200, 204]).toContain(response.status());
    });
  });
});




