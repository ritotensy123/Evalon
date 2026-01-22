const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

// Connect to MongoDB
// IMPORTANT: MONGODB_URI must be set in .env file - no fallback allowed
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
  process.exit(1);
}

// ENFORCED: Database name is ALWAYS 'evalon'
const REQUIRED_DB_NAME = 'evalon';

mongoose.connect(mongoUri, {
  dbName: REQUIRED_DB_NAME
});

async function checkUsers() {
  try {
    console.log('🔍 Checking all users...\n');

    const users = await User.find({}, 'email userType userTypeEmail isActive isEmailVerified').lean();
    
    console.log('📋 All Users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   User Type: ${user.userType}`);
      console.log(`   User Type Email: ${user.userTypeEmail}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();
