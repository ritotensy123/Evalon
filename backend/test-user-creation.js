const axios = require('axios');

// Test user creation with proper authentication
async function testUserCreation() {
  const baseURL = 'http://localhost:5001/api';
  
  try {
    console.log('🧪 Testing User Creation with Authentication...\n');

    // Step 1: Login to get a valid token
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'ritotensy@gmail.com',
      password: 'your-password-here' // Replace with actual password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed. Please check credentials.');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    console.log('');

    // Step 2: Create a user
    console.log('2️⃣ Creating user without password...');
    const createUserResponse = await axios.post(`${baseURL}/user-management/users`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@example.com',
      phone: '1234567890',
      role: 'teacher',
      department: 'Computer Science',
      organizationId: '68cc27babb2edd5c5b3d04dc'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ User creation response:');
    console.log('Success:', createUserResponse.data.success);
    console.log('Message:', createUserResponse.data.message);
    
    if (createUserResponse.data.data) {
      console.log('Registration Link:', createUserResponse.data.data.registrationLink);
      console.log('Organization Code:', createUserResponse.data.data.organizationCode);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testUserCreation();
