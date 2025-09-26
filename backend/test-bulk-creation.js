const axios = require('axios');

async function testBulkCreation() {
  try {
    console.log('🧪 Testing bulk user creation...');
    
    const testData = {
      users: [
        {
          firstName: 'Test',
          lastName: 'Teacher',
          email: 'test.teacher@example.com',
          phone: '+1234567890',
          userType: 'teacher',
          department: 'computer-science',
          sendEmailNotification: true
        }
      ],
      organizationId: '507f1f77bcf86cd799439011' // Replace with actual org ID
    };
    
    const response = await axios.post('http://localhost:5001/api/user-management/users/bulk', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here' // Add actual token if needed
      }
    });
    
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBulkCreation();
