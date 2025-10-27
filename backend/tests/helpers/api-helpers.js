/**
 * API Test Helper Functions
 * Reusable utilities for API testing
 */

/**
 * Create authentication headers with JWT token
 */
function createAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Extract token from login response
 */
function extractToken(response) {
  if (response.token) return response.token;
  if (response.data && response.data.token) return response.data.token;
  return null;
}

/**
 * Generate random email for testing
 */
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test.user.${timestamp}.${random}@evalon.test`;
}

/**
 * Generate random organization code
 */
function generateOrgCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `IN-TST-2025-${random}${timestamp}`;
}

/**
 * Wait for specified milliseconds
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate API response structure
 */
function validateApiResponse(response, expectedKeys = []) {
  const data = typeof response === 'string' ? JSON.parse(response) : response;
  
  expectedKeys.forEach(key => {
    if (!(key in data)) {
      throw new Error(`Expected key '${key}' not found in response`);
    }
  });
  
  return data;
}

/**
 * Clean up test data by ID
 */
async function cleanupTestData(request, endpoint, ids = []) {
  const promises = ids.map(id => 
    request.delete(`${endpoint}/${id}`).catch(err => {
      console.log(`Note: Could not delete ${endpoint}/${id}`, err.message);
    })
  );
  
  await Promise.all(promises);
}

/**
 * Create test organization
 */
async function createTestOrganization(request, token) {
  const orgData = {
    name: `Test Organization ${Date.now()}`,
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
    headers: createAuthHeaders(token),
    data: orgData
  });

  return response;
}

/**
 * Create test user with specific role
 */
async function createTestUser(request, role = 'student', organizationId = null) {
  const userData = {
    email: generateRandomEmail(),
    password: 'Test@12345',
    name: `Test ${role} ${Date.now()}`,
    role: role,
    phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    ...(organizationId && { organizationId })
  };

  return userData;
}

/**
 * Perform login and return token
 */
async function loginAndGetToken(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });

  const data = await response.json();
  return extractToken(data);
}

module.exports = {
  createAuthHeaders,
  extractToken,
  generateRandomEmail,
  generateOrgCode,
  wait,
  validateApiResponse,
  cleanupTestData,
  createTestOrganization,
  createTestUser,
  loginAndGetToken
};




