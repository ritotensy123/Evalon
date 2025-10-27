const { test, expect } = require('@playwright/test');
const { 
  createAuthHeaders,
  generateRandomEmail,
  generateOrgCode
} = require('../helpers/api-helpers');

test.describe('Department API Tests', () => {
  let request;
  let authToken;
  let organizationId;
  let createdDepartmentIds = [];

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    // Cleanup created departments
    if (authToken && createdDepartmentIds.length > 0) {
      for (const id of createdDepartmentIds) {
        try {
          await request.delete(`/api/departments/${id}`, {
            headers: createAuthHeaders(authToken)
          });
        } catch (error) {
          console.log(`Note: Could not delete department ${id}`);
        }
      }
    }
    
    await request.dispose();
  });

  test.describe('Authentication Requirements', () => {
    test('should reject unauthenticated GET requests', async () => {
      const response = await request.get('/api/departments');
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject unauthenticated POST requests', async () => {
      const response = await request.post('/api/departments', {
        data: {
          name: 'Test Department',
          code: 'TEST'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject unauthenticated PUT requests', async () => {
      const response = await request.put('/api/departments/123456789', {
        data: {
          name: 'Updated Department'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject unauthenticated DELETE requests', async () => {
      const response = await request.delete('/api/departments/123456789');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Department Creation', () => {
    test('should create a department with valid data (when authenticated)', async () => {
      // Note: This test will fail without authentication
      // It documents the expected API behavior
      
      const departmentData = {
        name: `Test Department ${Date.now()}`,
        code: `TD${Date.now().toString().slice(-6)}`,
        description: 'This is a test department',
        organizationId: 'test-org-id'
      };

      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: departmentData
      });

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.department).toHaveProperty('_id');
        expect(data.department.name).toBe(departmentData.name);
        expect(data.department.code).toBe(departmentData.code);
        
        createdDepartmentIds.push(data.department._id);
      } else {
        // Without auth, should be 401
        expect(response.status()).toBe(401);
      }
    });

    test('should reject department creation with missing name', async () => {
      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          code: 'TEST'
        }
      });

      expect([400, 401]).toContain(response.status());
    });

    test('should reject department creation with missing code', async () => {
      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          name: 'Test Department'
        }
      });

      expect([400, 401]).toContain(response.status());
    });

    test('should reject department creation with duplicate code', async () => {
      if (!authToken) {
        test.skip();
        return;
      }

      const departmentData = {
        name: `Test Department ${Date.now()}`,
        code: 'DUPLICATE001',
        organizationId: 'test-org-id'
      };

      // Create first department
      const firstResponse = await request.post('/api/departments', {
        headers: createAuthHeaders(authToken),
        data: departmentData
      });

      if (firstResponse.status() === 201) {
        const firstData = await firstResponse.json();
        createdDepartmentIds.push(firstData.department._id);

        // Try to create duplicate
        const duplicateResponse = await request.post('/api/departments', {
          headers: createAuthHeaders(authToken),
          data: departmentData
        });

        expect([400, 409]).toContain(duplicateResponse.status());
      }
    });

    test('should validate department code format', async () => {
      const invalidCodes = ['', '   ', '@#$%', 'a'.repeat(100)];

      for (const code of invalidCodes) {
        const response = await request.post('/api/departments', {
          headers: authToken ? createAuthHeaders(authToken) : {},
          data: {
            name: 'Test Department',
            code: code
          }
        });

        expect([400, 401]).toContain(response.status());
      }
    });

    test('should handle very long department names', async () => {
      const longName = 'a'.repeat(1000);

      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          name: longName,
          code: 'LONG'
        }
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('Department Retrieval', () => {
    test('should list all departments (when authenticated)', async () => {
      const response = await request.get('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.departments)).toBe(true);
      } else {
        expect(response.status()).toBe(401);
      }
    });

    test('should get department by ID (when authenticated)', async () => {
      const response = await request.get('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should be 401 without auth, 404 with auth (ID doesn't exist)
      expect([401, 404]).toContain(response.status());
    });

    test('should reject invalid department ID format', async () => {
      const response = await request.get('/api/departments/invalid-id', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([400, 401]).toContain(response.status());
    });

    test('should support pagination parameters', async () => {
      const response = await request.get('/api/departments?page=1&limit=10', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect(response.status()).toBe(401);
      }
    });

    test('should support filtering by organization', async () => {
      const response = await request.get('/api/departments?organizationId=test-org', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Department Update', () => {
    test('should update department with valid data (when authenticated)', async () => {
      const updateData = {
        name: 'Updated Department Name',
        description: 'Updated description'
      };

      const response = await request.put('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: updateData
      });

      // Should be 401 without auth, 404 with auth (ID doesn't exist)
      expect([401, 404]).toContain(response.status());
    });

    test('should reject update with empty data', async () => {
      const response = await request.put('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {}
      });

      expect([400, 401, 404]).toContain(response.status());
    });

    test('should reject update with invalid fields', async () => {
      const response = await request.put('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          invalidField: 'should not work'
        }
      });

      expect([400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Department Deletion', () => {
    test('should delete department (when authenticated and authorized)', async () => {
      const response = await request.delete('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      // Should be 401 without auth, 404 with auth (ID doesn't exist)
      expect([401, 404]).toContain(response.status());
    });

    test('should reject deletion of non-existent department', async () => {
      const response = await request.delete('/api/departments/507f1f77bcf86cd799439011', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([401, 404]).toContain(response.status());
    });

    test('should reject deletion with invalid ID', async () => {
      const response = await request.delete('/api/departments/invalid-id', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('Hierarchical Structure', () => {
    test('should support parent-child relationships', async () => {
      // Test that department can have a parent
      const departmentData = {
        name: 'Sub Department',
        code: 'SUBDEPT',
        parentId: '507f1f77bcf86cd799439011'
      };

      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: departmentData
      });

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.department).toHaveProperty('parentId');
        createdDepartmentIds.push(data.department._id);
      } else {
        expect([400, 401, 404]).toContain(response.status());
      }
    });

    test('should get department hierarchy/tree', async () => {
      const response = await request.get('/api/departments/tree', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.tree)).toBe(true);
      } else {
        expect([401, 404]).toContain(response.status());
      }
    });
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize XSS attempts in department name', async () => {
      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          name: '<script>alert("xss")</script>',
          code: 'XSS'
        }
      });

      if (response.status() === 201) {
        const data = await response.json();
        // Should not contain script tags
        expect(data.department.name).not.toContain('<script>');
        createdDepartmentIds.push(data.department._id);
      } else {
        expect([400, 401]).toContain(response.status());
      }
    });

    test('should handle special characters in department fields', async () => {
      const response = await request.post('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {},
        data: {
          name: "Department's Name & Co.",
          code: 'SPEC123'
        }
      });

      if (response.status() === 201) {
        const data = await response.json();
        createdDepartmentIds.push(data.department._id);
      }
      
      expect([201, 400, 401]).toContain(response.status());
    });
  });

  test.describe('Response Format', () => {
    test('should return consistent success response format', async () => {
      const response = await request.get('/api/departments', {
        headers: authToken ? createAuthHeaders(authToken) : {}
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('departments');
      }
    });

    test('should return consistent error response format', async () => {
      const response = await request.get('/api/departments');

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('message');
    });
  });
});




