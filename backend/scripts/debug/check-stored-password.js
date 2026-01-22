const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkStoredPassword() {
  try {
    // IMPORTANT: MONGODB_URI must be set in .env file - no fallback allowed
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
      process.exit(1);
    }
    
    // ENFORCED: Database name is ALWAYS 'evalon'
    const REQUIRED_DB_NAME = 'evalon';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      dbName: REQUIRED_DB_NAME
    });
    console.log(`✅ Connected to ${REQUIRED_DB_NAME} database`);

    // Find the user
    const user = await User.findOne({ 
      email: 'ritotensy@gmail.com', 
      userType: 'organization_admin' 
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log('Stored password hash:', user.password);
    console.log('Password hash length:', user.password.length);
    
    // Test with the exact password we want to use
    const testPassword = 'Redriders@123';
    const match = await bcrypt.compare(testPassword, user.password);
    console.log(`Password "${testPassword}" match:`, match);
    
    // Let's also test what the auth controller is actually receiving
    console.log('\n--- Testing different password formats ---');
    const testPasswords = [
      'Redriders@123',
      'redriders@123',
      'Redriders@123 ',
      ' Redriders@123'
    ];
    
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`"${pwd}" (length: ${pwd.length}) match:`, match);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStoredPassword();
