const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  try {
    // Connect to MongoDB
    // IMPORTANT: MONGODB_URI must be set in .env file - no fallback allowed
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
      process.exit(1);
    }
    
    // ENFORCED: Database name is ALWAYS 'evalon'
    const REQUIRED_DB_NAME = 'evalon';
    
    await mongoose.connect(mongoUri, { dbName: REQUIRED_DB_NAME });
    console.log('✅ Connected to MongoDB');
    console.log(`📁 Connected to database: ${REQUIRED_DB_NAME}`);

    // Find the user
    const user = await User.findOne({ email: 'new.login@example.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      email: user.email,
      userType: user.userType,
      userTypeEmail: user.userTypeEmail,
      authProvider: user.authProvider,
      isRegistrationComplete: user.isRegistrationComplete,
      password: user.password ? 'Password exists' : 'No password',
      passwordLength: user.password ? user.password.length : 0,
      passwordStart: user.password ? user.password.substring(0, 10) : 'N/A'
    });

    // Test password comparison
    const testPassword = 'x0tn1shv7a';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Password comparison result:', isMatch);

    // Test the comparePassword method
    const methodResult = await user.comparePassword(testPassword);
    console.log('✅ Method comparison result:', methodResult);

    // Test findByEmailAndType
    const foundUser = await User.findByEmailAndType('new.login@example.com', 'teacher');
    console.log('✅ findByEmailAndType result:', foundUser ? 'Found' : 'Not found');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

debugLogin();
