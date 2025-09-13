const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';

async function checkAndCreateUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evalon'
    });
    console.log('✅ Connected to evalon database');

    // Check if user exists
    const existingUser = await User.findOne({ 
      email: 'ritotensy@gmail.com', 
      userType: 'organization_admin' 
    });

    if (existingUser) {
      console.log('✅ User already exists:', {
        email: existingUser.email,
        userType: existingUser.userType,
        userTypeEmail: existingUser.userTypeEmail,
        isActive: existingUser.isActive
      });
    } else {
      console.log('❌ User not found, checking for existing organization...');
      
      // Check if organization already exists
      let organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
      
      if (!organization) {
        console.log('Creating new organization...');
        // Create an Organization document
        organization = new Organization({
          name: 'Test Organization',
          email: 'ritotensy@gmail.com',
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            zipCode: '12345'
          },
          website: 'https://testorg.com',
          description: 'A test organization for development',
          foundedYear: 2024,
          orgCode: 'TEST001',
          institutionStructure: 'single',
          timeZone: 'UTC',
          status: 'active'
        });

        await organization.save();
        console.log('✅ Organization created:', organization._id);
      } else {
        console.log('✅ Found existing organization:', organization._id);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('Redriders@123', 12);
      
      // Create new user that references the organization
      const newUser = new User({
        email: 'ritotensy@gmail.com',
        password: hashedPassword,
        userType: 'organization_admin',
        userId: organization._id,
        userModel: 'Organization',
        userTypeEmail: 'ritotensy@gmail.com_organization_admin',
        authProvider: 'local',
        profile: {
          firstName: 'Rito',
          lastName: 'Tensy'
        },
        isEmailVerified: true,
        isActive: true
      });

      await newUser.save();
      console.log('✅ User created successfully:', {
        email: newUser.email,
        userType: newUser.userType,
        userTypeEmail: newUser.userTypeEmail,
        userId: newUser.userId
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndCreateUser();
