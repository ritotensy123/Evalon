const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Organization = require('./src/models/Organization');
require('dotenv').config();

async function createStudentUser() {
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

    // Delete existing student user if any
    const deletedUser = await User.findOneAndDelete({ 
      email: 'ritotensy@gmail.com', 
      userType: 'student' 
    });
    
    if (deletedUser) {
      console.log('✅ Deleted existing student user');
    }

    // Find the organization
    const organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
    if (!organization) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('✅ Found organization:', organization._id);

    // Create a Student document
    const student = new Student({
      fullName: 'Rito Tensy',
      phoneNumber: '1234567890',
      countryCode: '+91',
      emailAddress: 'ritotensy@gmail.com',
      dateOfBirth: new Date('2000-01-01'),
      gender: 'male',
      country: 'India',
      city: 'Mumbai',
      pincode: '400001',
      organizationCode: organization.orgCode,
      organizationName: organization.name,
      organizationId: organization._id,
      isOrganizationValid: true,
      associationStatus: 'verified',
      emailVerified: true,
      phoneVerified: true,
      studentCode: 'STU001',
      academicYear: '2024-25',
      grade: '12',
      section: 'A',
      rollNumber: '12A001',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      password: 'Redriders@123',
      status: 'active'
    });

    await student.save();
    console.log('✅ Student created:', student._id);

    // Create User document for student
    const studentUser = new User({
      email: 'ritotensy@gmail.com',
      password: 'Redriders@123', // This will be hashed by pre-save middleware
      userType: 'student',
      userId: student._id,
      userModel: 'Student',
      userTypeEmail: 'ritotensy@gmail.com_student',
      authProvider: 'local',
      profile: {
        firstName: 'Rito',
        lastName: 'Tensy'
      },
      isEmailVerified: true,
      isActive: true
    });

    await studentUser.save();
    console.log('✅ Student user created successfully');

    // Test the password
    const passwordMatch = await studentUser.comparePassword('Redriders@123');
    console.log('Password match test:', passwordMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createStudentUser();
