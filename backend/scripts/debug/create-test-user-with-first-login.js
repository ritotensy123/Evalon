const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUserWithFirstLogin() {
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

    // Check if test user already exists
    const existingUser = await User.findOne({ 
      email: 'testuser@example.com', 
      userType: 'organization_admin' 
    });

    if (existingUser) {
      console.log('✅ Test user already exists, updating firstLogin flag...');
      existingUser.firstLogin = true;
      existingUser.authProvider = 'temp_password';
      await existingUser.save();
      console.log('✅ Updated existing user with firstLogin: true');
    } else {
      console.log('Creating new test user with firstLogin: true...');
      
      // Check if organization already exists
      let organization = await Organization.findOne({ email: 'testuser@example.com' });
      
      if (!organization) {
        console.log('Creating new organization...');
        // Create an Organization document
        organization = new Organization({
          name: 'Test Organization for Wizard',
          email: 'testuser@example.com',
          phone: '+1234567890',
          address: '123 Test Street, Test City, Test State, Test Country, 12345',
          website: 'https://testorg.com',
          description: 'A test organization for wizard testing',
          foundedYear: 2024,
          orgCode: 'WIZARD001',
          institutionStructure: 'single',
          timeZone: 'UTC',
          status: 'active',
          adminName: 'Test Admin',
          adminEmail: 'testuser@example.com',
          adminPhone: '+1234567890'
        });

        await organization.save();
        console.log('✅ Organization created:', organization._id);
      } else {
        console.log('✅ Found existing organization:', organization._id);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
      
      // Create new user that references the organization with firstLogin: true
      const newUser = new User({
        email: 'testuser@example.com',
        password: hashedPassword,
        userType: 'organization_admin',
        userId: organization._id,
        userModel: 'Organization',
        userTypeEmail: 'testuser@example.com_organization_admin',
        authProvider: 'temp_password', // This indicates they need to set a new password
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        isEmailVerified: true,
        isActive: true,
        firstLogin: true, // This is the key flag for the wizard
        isRegistrationComplete: true
      });

      await newUser.save();
      console.log('✅ Test user created successfully with firstLogin: true');
    }

    // Verify the user was created/updated correctly
    const verifyUser = await User.findOne({ email: 'testuser@example.com' });
    console.log('✅ Verification - User data:', {
      email: verifyUser.email,
      userType: verifyUser.userType,
      firstLogin: verifyUser.firstLogin,
      authProvider: verifyUser.authProvider,
      isEmailVerified: verifyUser.isEmailVerified
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUserWithFirstLogin();
