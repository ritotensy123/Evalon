const mongoose = require('mongoose');
const User = require('./src/models/User');
const Teacher = require('./src/models/Teacher');
const Organization = require('./src/models/Organization');
require('dotenv').config();

async function createTeacherUser() {
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

    // Delete existing teacher user if any
    const deletedUser = await User.findOneAndDelete({ 
      email: 'ritotensy@gmail.com', 
      userType: 'teacher' 
    });
    
    if (deletedUser) {
      console.log('✅ Deleted existing teacher user');
    }

    // Find the organization
    const organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
    if (!organization) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('✅ Found organization:', organization._id);

    // Create a Teacher document
    const teacher = new Teacher({
      fullName: 'Rito Tensy',
      phoneNumber: '1234567890',
      countryCode: '+91',
      emailAddress: 'ritotensy@gmail.com',
      country: 'India',
      city: 'Mumbai',
      pincode: '400001',
      subjects: ['Mathematics', 'Physics'],
      role: 'teacher',
      affiliationType: 'organization',
      currentInstitution: 'Test Organization',
      yearsOfExperience: '5',
      organizationCode: organization.orgCode,
      organizationName: organization.name,
      organizationId: organization._id,
      isOrganizationValid: true,
      associationStatus: 'verified',
      emailVerified: true,
      phoneVerified: true,
      password: 'Redriders@123',
      status: 'active'
    });

    await teacher.save();
    console.log('✅ Teacher created:', teacher._id);

    // Create User document for teacher
    const teacherUser = new User({
      email: 'ritotensy@gmail.com',
      password: 'Redriders@123', // This will be hashed by pre-save middleware
      userType: 'teacher',
      userId: teacher._id,
      userModel: 'Teacher',
      userTypeEmail: 'ritotensy@gmail.com_teacher',
      authProvider: 'local',
      profile: {
        firstName: 'Rito',
        lastName: 'Tensy'
      },
      isEmailVerified: true,
      isActive: true
    });

    await teacherUser.save();
    console.log('✅ Teacher user created successfully');

    // Test the password
    const passwordMatch = await teacherUser.comparePassword('Redriders@123');
    console.log('Password match test:', passwordMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTeacherUser();
