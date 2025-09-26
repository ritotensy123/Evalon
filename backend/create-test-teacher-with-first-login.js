const mongoose = require('mongoose');
const User = require('./src/models/User');
const Teacher = require('./src/models/Teacher');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';

async function createTestTeacherWithFirstLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evalon'
    });
    console.log('✅ Connected to evalon database');

    // First, find or create an organization
    let organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
    if (!organization) {
      console.log('Creating organization for teacher...');
      organization = new Organization({
        name: 'Test Organization for Teacher',
        email: 'ritotensy@gmail.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City, Test State, Test Country, 12345',
        website: 'https://testorg.com',
        description: 'A test organization for teacher wizard testing',
        foundedYear: 2024,
        orgCode: 'TEACHER001',
        institutionStructure: 'single',
        timeZone: 'UTC',
        status: 'active',
        adminName: 'Test Admin',
        adminEmail: 'ritotensy@gmail.com',
        adminPhone: '+1234567890'
      });
      await organization.save();
      console.log('✅ Organization created:', organization._id);
    } else {
      console.log('✅ Found existing organization:', organization._id);
    }

    // Check if test teacher user already exists
    const existingUser = await User.findOne({ 
      email: 'teacher@example.com', 
      userType: 'teacher' 
    });

    if (existingUser) {
      console.log('✅ Test teacher user already exists, updating firstLogin flag...');
      existingUser.firstLogin = true;
      existingUser.authProvider = 'temp_password';
      await existingUser.save();
      console.log('✅ Updated existing teacher user with firstLogin: true');
    } else {
      console.log('Creating new test teacher user with firstLogin: true...');
      
      // Create Teacher record first
      const teacher = new Teacher({
        fullName: 'Test Teacher',
        emailAddress: 'teacher@example.com',
        phoneNumber: '+1234567890',
        countryCode: '+1',
        country: 'United States',
        city: 'Test City',
        pincode: '12345',
        subjects: ['Mathematics', 'Computer Science'],
        role: 'teacher',
        affiliationType: 'organization',
        experienceLevel: 'intermediate',
        yearsOfExperience: '5',
        organizationId: organization._id,
        organizationCode: organization.orgCode,
        organizationName: organization.name,
        isOrganizationValid: true,
        associationStatus: 'verified',
        isActive: true
      });

      await teacher.save();
      console.log('✅ Teacher record created:', teacher._id);

      // Hash password
      const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
      
      // Create new user that references the teacher with firstLogin: true
      const newUser = new User({
        email: 'teacher@example.com',
        password: hashedPassword,
        userType: 'teacher',
        userId: teacher._id,
        userModel: 'Teacher',
        userTypeEmail: 'teacher@example.com_teacher',
        authProvider: 'temp_password', // This indicates they need to set a new password
        profile: {
          firstName: 'Test',
          lastName: 'Teacher'
        },
        isEmailVerified: true,
        isActive: true,
        firstLogin: true, // This is the key flag for the wizard
        isRegistrationComplete: true,
        organizationId: organization._id
      });

      await newUser.save();
      console.log('✅ Test teacher user created successfully with firstLogin: true');
    }

    // Verify the user was created/updated correctly
    const verifyUser = await User.findOne({ email: 'teacher@example.com' }).populate('userId');
    console.log('✅ Verification - Teacher user data:', {
      email: verifyUser.email,
      userType: verifyUser.userType,
      firstLogin: verifyUser.firstLogin,
      authProvider: verifyUser.authProvider,
      isEmailVerified: verifyUser.isEmailVerified,
      teacherId: verifyUser.userId?._id,
      organizationId: verifyUser.organizationId
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

createTestTeacherWithFirstLogin();
