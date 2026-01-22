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

async function fixUserEmails() {
  try {
    console.log('🔧 Fixing User Email Records...\n');

    const users = await User.find({});
    
    for (const user of users) {
      const expectedUserTypeEmail = `${user.email.toLowerCase()}_${user.userType}`;
      
      console.log(`Fixing user: ${user.email} (${user.userType})`);
      console.log(`  Current userTypeEmail: ${user.userTypeEmail}`);
      console.log(`  Expected userTypeEmail: ${expectedUserTypeEmail}`);
      
      if (user.userTypeEmail !== expectedUserTypeEmail) {
        user.userTypeEmail = expectedUserTypeEmail;
        await user.save();
        console.log(`  ✅ Fixed!\n`);
      } else {
        console.log(`  ✅ Already correct\n`);
      }
    }

    // Test the fixes
    console.log('🧪 Testing fixes...\n');
    
    const testCases = [
      { email: 'ritotensy@gmail.com', userType: 'organization_admin' },
      { email: 'maryloid936@gmail.com', userType: 'teacher' },
      { email: 'lespanol79@gmail.com', userType: 'student' }
    ];
    
    for (const testCase of testCases) {
      const foundUser = await User.findByEmailAndType(testCase.email, testCase.userType);
      console.log(`${testCase.email} (${testCase.userType}): ${foundUser ? '✅ Found' : '❌ Not found'}`);
    }

  } catch (error) {
    console.error('❌ Error fixing user emails:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixUserEmails();
