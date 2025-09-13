const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testPhoneOTPFlow() {
  try {
    console.log('🧪 Testing Phone OTP Flow...\n');

    // Step 1: Register step 1
    console.log('1️⃣ Registering Step 1...');
    const step1Response = await axios.post(`${BASE_URL}/teachers/register/step1`, {
      fullName: 'Test Teacher',
      phoneNumber: '9876543210',
      countryCode: '+91',
      emailAddress: 'test@example.com',
      country: 'India',
      city: 'Mumbai',
      pincode: '400001'
    });
    console.log('✅ Step 1 Response:', step1Response.data);
    const registrationToken = step1Response.data.data.registrationToken;

    // Step 2: Register step 2
    console.log('\n2️⃣ Registering Step 2...');
    const step2Response = await axios.post(`${BASE_URL}/teachers/register/step2`, {
      subjects: ['Mathematics'],
      role: 'teacher',
      affiliationType: 'freelance',
      experienceLevel: 'intermediate',
      registrationToken
    });
    console.log('✅ Step 2 Response:', step2Response.data);

    // Step 3: Register step 3
    console.log('\n3️⃣ Registering Step 3...');
    const step3Response = await axios.post(`${BASE_URL}/teachers/register/step3`, {
      registrationToken
    });
    console.log('✅ Step 3 Response:', step3Response.data);

    // Step 4: Send Phone OTP
    console.log('\n4️⃣ Sending Phone OTP...');
    const sendOTPResponse = await axios.post(`${BASE_URL}/teachers/send-phone-otp`, {
      phoneNumber: '9876543210',
      countryCode: '+91',
      registrationToken
    });
    console.log('✅ Send OTP Response:', sendOTPResponse.data);
    const sentOTP = sendOTPResponse.data.data.otp;

    // Step 5: Verify Phone OTP
    console.log('\n5️⃣ Verifying Phone OTP...');
    console.log('Using OTP:', sentOTP);
    const verifyOTPResponse = await axios.post(`${BASE_URL}/teachers/verify-phone-otp`, {
      phoneOTP: sentOTP,
      phoneNumber: '9876543210',
      countryCode: '+91',
      registrationToken
    });
    console.log('✅ Verify OTP Response:', verifyOTPResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPhoneOTPFlow();
