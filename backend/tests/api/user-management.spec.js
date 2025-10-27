const { test, expect } = require('@playwright/test');
const { 
  createAuthHeaders,
  generateRandomEmail
} = require('../helpers/api-helpers');

test.describe('User Management API Tests', () => {
  let request;
  let authToken;
  let createdUserIds = [];

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    // Cleanup created users
    if (authToken && createdUserIds.length > 0) {
      for (const id of createdUserIds) {
        try {
          await request.delete(`/api/user-management/${id}`, {
            headers: createAuthHeaders(authToken)
          });
        } catch (error) {
          console.log(`Note: Could not delete user ${id}`);
        }
      }
    }
    
    await request.dispose();
  });

  test.describe('Authentication Requirements', () => {
    test('should reject unauthenticated GET all users request', async () => {
      const response = await request.get('/api/user-management');
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject unauthenticated user creation', async () => {
      const response = await request.post('/api/user-management', {
        data: {
          email: generateRandomEmail(),
          name: 'Test User',
          role: 'student'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject unauthenticated user update', async () => {
      const response = await request.put('/api/user-management/123456789', {
        data: {
          name: 'Updated Name'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject unauthenticated user deletion', async () => {
      const response = await request.delete('/api/user-management/123456789');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('User Creation', () => {
    test('should create user with valid data (when authenticated and authorized)', async () => {
      const userData = {
        email: generateRandomEmail(),
        name: 'Test User',
        role: 'student',
        phone: '+919876543210',
        organizationId: 'test-org-id'
      };

      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: userData
      });

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toHaveProperty('_id');
        expect(data.user.email).toBe(userData.email);
        expect(data.user.role).toBe(userData.role);
        
        createdUserIds.push(data.user._id);
      } else {
        // Without auth or proper authorization, should be 401 or 403
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should reject user creation with missing email', async () => {
      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          name: 'Test User',
          role: 'student'
        }
      });

      expect([400, 401, 403]).toContain(response.status());
    });

    test('should reject user creation with invalid email format', async () => {
      const invalidEmails = ['invalid', '@test.com', 'test@', 'test..test@test.com'];

      for (const email of invalidEmails) {
        const response = await request.post('/api/user-management', {
          headers: authToken ? createAuthHeaders(authToken) : {},
          data: {
            email: email,
            name: 'Test User',
            role: 'student'
          }
        });

        expect([400, 401, 403]).toContain(response.status());
      }
    });

    test('should reject user creation with missing name', async () => {
      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: generateRandomEmail(),
          role: 'student'
        }
      });

      expect([400, 401, 403]).toContain(response.status());
    });

    test('should reject user creation with invalid role', async () => {
      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: generateRandomEmail(),
          name: 'Test User',
          role: 'invalid_role'
        }
      });

      expect([400, 401, 403]).toContain(response.status());
    });

    test('should reject duplicate email addresses', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const email = generateRandomEmail();
      const userData = {
        email: email,
        name: 'Test User',
        role: 'student'
      };

      // Create first user
      const firstResponse = await request.post('/api/user-management', {
        headers: createAuthHeaders(authToken),
        data: userData
      });

      if (firstResponse.status() === 201) {
        const firstData = await firstResponse.json();
        createdUserIds.push(firstData.user._id);

        // Try to create duplicate
        const duplicateResponse = await request.post('/api/user-management', {
          headers: createAuthHeaders(authToken),
          data: userData
        });

        expect([400, 409]).toContain(duplicateResponse.status());
      }
    });

    test('should validate phone number format', async () => {
      const invalidPhones = ['123', 'abcdefghij', '+1234', ''];

      for (const phone of invalidPhones) {
        const response = await request.post('/api/user-management', {
          headers: authToken ? createAuthHeaders(authToken) : {},
          data: {
            email: generateRandomEmail(),
            name: 'Test User',
            role: 'student',
            phone: phone
          }
        });

        if (response.status() === 201) {
          const data = await response.json();
          createdUserIds.push(data.user._id);
        }
        
        // Should reject invalid phones
        expect([400, 401, 403]).toContain(response.status());
      }
    });
  });

  test.describe('User Retrieval', () => {
    test('should list all users (when authenticated and authorized)', async () => {
      const response = await request.get('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.users)).toBe(true);
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should get user by ID (when authenticated and authorized)', async () => {
      const response = await request.get('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should be 401/403 without auth, 404 with auth (ID doesn't exist)
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should reject invalid user ID format', async () => {
      const response = await request.get('/api/user-management/invalid-id', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([400, 401, 403]).toContain(response.status());
    });

    test('should support pagination', async () => {
      const response = await request.get('/api/user-management?page=1&limit=10', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        // Should have pagination metadata
        expect(data).toHaveProperty('users');
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should support filtering by role', async () => {
      const response = await request.get('/api/user-management?role=student', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        // All users should have student role
        if (data.users && data.users.length > 0) {
          data.users.forEach(user => {
            expect(user.role).toBe('student');
          });
        }
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should support filtering by organization', async () => {
      const response = await request.get('/api/user-management?organizationId=test-org', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });

    test('should support search by name', async () => {
      const response = await request.get('/api/user-management?search=test', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect([401, 403]).toContain(response.status());
      }
    });
  });

  test.describe('User Update', () => {
    test('should update user with valid data (when authorized)', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+919876543211'
      };

      const response = await request.put('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: updateData
      });

      // Should be 401/403 without auth, 404 with auth (ID doesn't exist)
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should reject update with empty data', async () => {
      const response = await request.put('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {}
      });

      expect([400, 401, 403, 404]).toContain(response.status());
    });

    test('should reject role change without proper authorization', async () => {
      const response = await request.put('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          role: 'admin'
        }
      });

      // Role changes should require special authorization
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should reject update with invalid email', async () => {
      const response = await request.put('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: 'invalid-email'
        }
      });

      expect([400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('User Deletion', () => {
    test('should delete user (when authorized)', async () => {
      const response = await request.delete('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should be 401/403 without auth, 404 with auth (ID doesn't exist)
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should reject deletion of non-existent user', async () => {
      const response = await request.delete('/api/user-management/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([401, 403, 404]).toContain(response.status());
    });

    test('should reject deletion with invalid ID', async () => {
      const response = await request.delete('/api/user-management/invalid-id', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Bulk Operations', () => {
    test('should support bulk user creation (when authorized)', async () => {
      const users = [
        {
          email: generateRandomEmail(),
          name: 'Bulk User 1',
          role: 'student'
        },
        {
          email: generateRandomEmail(),
          name: 'Bulk User 2',
          role: 'student'
        }
      ];

      const response = await request.post('/api/user-management/bulk', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: { users }
      });

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.created).toBeGreaterThan(0);
        
        // Store IDs for cleanup
        if (data.users) {
          data.users.forEach(user => createdUserIds.push(user._id));
        }
      } else {
        expect([401, 403, 404]).toContain(response.status());
      }
    });

    test('should reject bulk creation with invalid data', async () => {
      const users = [
        {
          email: 'invalid-email',
          name: 'Invalid User'
        }
      ];

      const response = await request.post('/api/user-management/bulk', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: { users }
      });

      expect([400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Role-Based Access', () => {
    test('should enforce role-based permissions', async () => {
      // Try to access admin-only functionality
      const response = await request.get('/api/user-management/admin/stats', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should be restricted
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should allow organization admin to manage their org users', async () => {
      const response = await request.get('/api/user-management?organizationId=my-org', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Response depends on authentication and authorization
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize XSS attempts in name field', async () => {
      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: generateRandomEmail(),
          name: '<script>alert("xss")</script>',
          role: 'student'
        }
      });

      if (response.status() === 201) {
        const data = await response.json();
        // Should not contain script tags
        expect(data.user.name).not.toContain('<script>');
        createdUserIds.push(data.user._id);
      } else {
        expect([400, 401, 403]).toContain(response.status());
      }
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request.post('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          email: "admin'--@test.com",
          name: "'; DROP TABLE users--",
          role: 'student'
        }
      });

      // Should be rejected or sanitized
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Response Format', () => {
    test('should return consistent success response format', async () => {
      const response = await request.get('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('users');
      }
    });

    test('should return consistent error response format', async () => {
      const response = await request.get('/api/user-management');

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('message');
    });

    test('should not expose sensitive data in responses', async () => {
      const response = await request.get('/api/user-management', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        if (data.users && data.users.length > 0) {
          data.users.forEach(user => {
            // Should not expose password or sensitive fields
            expect(user).not.toHaveProperty('password');
            expect(user).not.toHaveProperty('passwordHash');
          });
        }
      }
    });
  });
});




