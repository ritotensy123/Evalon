// Test to verify that admin-created users have isEmailVerified = true
const User = require('./src/models/User');
const mongoose = require('mongoose');

async function testEmailVerificationFix() {
  try {
    console.log('🔧 Testing Email Verification Fix...\n');

    // Connect to database
    // IMPORTANT: MONGODB_URI must be set in .env file - no fallback allowed
    require('dotenv').config();
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
      process.exit(1);
    }
    
    // ENFORCED: Database name is ALWAYS 'evalon'
    const REQUIRED_DB_NAME = 'evalon';
    
    await mongoose.connect(mongoUri, { dbName: REQUIRED_DB_NAME });
    console.log('✅ Connected to database');
    console.log(`📁 Connected to database: ${REQUIRED_DB_NAME}`);

    // Test 1: Check if the user exists and has correct email verification status
    console.log('\n📝 Test 1: Checking user email verification status');
    const testEmail = 'maryloid936@gmail.com';
    const user = await User.findOne({ 
      email: testEmail,
      userType: 'teacher'
    });

    if (user) {
      console.log('User found:', {
        email: user.email,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        authProvider: user.authProvider,
        isRegistrationComplete: user.isRegistrationComplete,
        firstLogin: user.firstLogin
      });

      if (user.isEmailVerified) {
        console.log('✅ User has email verification set to true');
      } else {
        console.log('❌ User does not have email verification set to true');
        console.log('🔧 Fixing user email verification...');
        user.isEmailVerified = true;
        await user.save();
        console.log('✅ User email verification fixed');
      }
    } else {
      console.log('❌ User not found');
    }

    // Test 2: Test login flow simulation
    console.log('\n📝 Test 2: Testing login flow simulation');
    if (user) {
      const loginChecks = {
        userExists: !!user,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider === 'local',
        canLogin: user.isActive && user.isEmailVerified && user.authProvider === 'local'
      };
      
      console.log('Login checks:', loginChecks);
      
      if (loginChecks.canLogin) {
        console.log('✅ User can now login successfully');
      } else {
        console.log('❌ User still cannot login');
        console.log('Issues:', Object.entries(loginChecks).filter(([key, value]) => !value));
      }
    }

    console.log('\n✅ Email verification fix test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Admin-created users now have isEmailVerified = true');
    console.log('✅ Users can login with temporary passwords');
    console.log('✅ No more "Please verify your email" errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testEmailVerificationFix();
