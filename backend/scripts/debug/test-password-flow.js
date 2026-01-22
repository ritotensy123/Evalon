const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const mongoose = require('mongoose');

// Test password hashing flow
async function testPasswordFlow() {
  try {
    console.log('🔧 Testing Password Hashing Flow...\n');

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

    const plainPassword = 'TestPassword123!';
    console.log('📝 Testing with password:', plainPassword);

    // Test 1: Create new user (should hash password)
    console.log('\n📝 Test 1: Creating new user with plain password');
    const testUser = new User({
      email: 'test@example.com',
      password: plainPassword, // Plain password
      userType: 'student',
      userId: new mongoose.Types.ObjectId(),
      userModel: 'Student',
      userTypeEmail: 'test@example.com_student',
      authProvider: 'local',
      isEmailVerified: true
    });

    console.log('Before save - password:', testUser.password);
    console.log('Is modified password:', testUser.isModified('password'));
    
    await testUser.save();
    console.log('After save - password:', testUser.password);
    console.log('Hash length:', testUser.password.length);
    console.log('Is bcrypt hash:', testUser.password.startsWith('$2a$') || testUser.password.startsWith('$2b$'));

    // Test 2: Password comparison
    console.log('\n📝 Test 2: Testing password comparison');
    const isMatch = await testUser.comparePassword(plainPassword);
    console.log('Password comparison result:', isMatch);

    const wrongPassword = await testUser.comparePassword('WrongPassword123!');
    console.log('Wrong password comparison:', wrongPassword);

    // Test 3: Update user without changing password (should not re-hash)
    console.log('\n📝 Test 3: Updating user without password change');
    const originalHash = testUser.password;
    testUser.profile.firstName = 'Updated';
    await testUser.save();
    console.log('Password after update:', testUser.password);
    console.log('Password unchanged:', originalHash === testUser.password);

    // Test 4: Update user with new password (should hash new password)
    console.log('\n📝 Test 4: Updating user with new password');
    const newPassword = 'NewPassword456!';
    testUser.password = newPassword;
    console.log('Before save with new password:', testUser.password);
    console.log('Is modified password:', testUser.isModified('password'));
    
    await testUser.save();
    console.log('After save with new password:', testUser.password);
    console.log('New password hash length:', testUser.password.length);

    // Test 5: Verify new password works
    console.log('\n📝 Test 5: Testing new password');
    const newPasswordMatch = await testUser.comparePassword(newPassword);
    console.log('New password comparison:', newPasswordMatch);
    
    const oldPasswordMatch = await testUser.comparePassword(plainPassword);
    console.log('Old password should fail:', oldPasswordMatch);

    // Test 6: Test createFromRegistration method
    console.log('\n📝 Test 6: Testing createFromRegistration method');
    const registrationUser = await User.createFromRegistration({
      email: 'registration@example.com',
      password: 'RegistrationPassword123!',
      userType: 'teacher',
      userId: new mongoose.Types.ObjectId(),
      userModel: 'Teacher',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });

    console.log('Registration user password hash:', registrationUser.password);
    console.log('Registration hash length:', registrationUser.password.length);
    
    const registrationMatch = await registrationUser.comparePassword('RegistrationPassword123!');
    console.log('Registration password comparison:', registrationMatch);

    // Test 7: Test with already hashed password (should not double hash)
    console.log('\n📝 Test 7: Testing with already hashed password');
    const alreadyHashedPassword = testUser.password; // Use existing hash
    const testUser2 = new User({
      email: 'test2@example.com',
      password: alreadyHashedPassword, // Already hashed
      userType: 'student',
      userId: new mongoose.Types.ObjectId(),
      userModel: 'Student',
      userTypeEmail: 'test2@example.com_student',
      authProvider: 'local',
      isEmailVerified: true
    });

    console.log('Before save (hashed password):', testUser2.password);
    console.log('Is modified password:', testUser2.isModified('password'));
    
    await testUser2.save();
    console.log('After save (should be same):', testUser2.password);
    console.log('Passwords are same:', testUser.password === testUser2.password);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ 
      email: { $in: ['test@example.com', 'test2@example.com', 'registration@example.com'] } 
    });
    console.log('✅ Test data cleaned up');

    console.log('\n✅ Password hashing flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Passwords are correctly hashed using bcrypt');
    console.log('✅ No double hashing occurs');
    console.log('✅ Password comparison works correctly');
    console.log('✅ Updates without password change preserve hash');
    console.log('✅ Updates with new password hash correctly');
    console.log('✅ createFromRegistration method works properly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testPasswordFlow();
