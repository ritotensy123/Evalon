const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
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

    console.log('✅ User found:', {
      email: user.email,
      userType: user.userType,
      userTypeEmail: user.userTypeEmail,
      hasPassword: !!user.password
    });

    // Test password comparison
    const passwordMatch = await bcrypt.compare('Redriders@123', user.password);
    console.log('Password match:', passwordMatch);

    // Test the findByEmailAndType method
    try {
      const foundUser = await User.findByEmailAndType('ritotensy@gmail.com', 'organization_admin');
      console.log('findByEmailAndType result:', foundUser ? 'Found' : 'Not found');
    } catch (error) {
      console.log('findByEmailAndType error:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
