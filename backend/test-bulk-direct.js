const mongoose = require('mongoose');
const User = require('./src/models/User');
const Teacher = require('./src/models/Teacher');
const Student = require('./src/models/Student');
const bcrypt = require('bcryptjs');

async function testBulkCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:ritotensy@cluster0.u8jqfbo.mongodb.net/evalon-app?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    const testData = {
      firstName: 'Test',
      lastName: 'Teacher',
      email: 'test.teacher@example.com',
      phone: '+1234567890',
      userType: 'teacher',
      department: 'computer-science',
      sendEmailNotification: true
    };

    const organizationId = '507f1f77bcf86cd799439011';

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    console.log('🧪 Testing teacher creation...');

    // Create Teacher profile
    const teacher = new Teacher({
      fullName: `${testData.firstName} ${testData.lastName}`,
      emailAddress: testData.email.toLowerCase(),
      phoneNumber: testData.phone || '',
      countryCode: '+91',
      country: 'India',
      city: 'Mumbai',
      pincode: '400001',
      department: testData.department || '',
      organizationId: organizationId,
      isActive: true,
      subjects: [],
      role: 'teacher',
      affiliationType: 'organization',
      experienceLevel: 'beginner',
      yearsOfExperience: 0,
      qualification: '',
      specialization: '',
      address: '',
      dateOfBirth: new Date('1990-01-01'),
      emergencyContact: '',
      notes: ''
    });

    await teacher.save();
    console.log('✅ Teacher profile created:', teacher._id);

    // Create User account
    const user = new User({
      email: testData.email.toLowerCase(),
      password: hashedPassword,
      userType: 'teacher',
      userId: teacher._id,
      organizationId: organizationId,
      isActive: true,
      profile: {
        firstName: testData.firstName,
        lastName: testData.lastName,
        phone: testData.phone || '',
        department: testData.department || ''
      },
      emailVerified: false,
      phoneVerified: false,
      firstLogin: true
    });

    await user.save();
    console.log('✅ User account created:', user._id);
    console.log('✅ Temporary password:', tempPassword);

    // Verify the user was created
    const createdUser = await User.findById(user._id);
    const createdTeacher = await Teacher.findById(teacher._id);
    
    console.log('✅ Verification - User exists:', !!createdUser);
    console.log('✅ Verification - Teacher exists:', !!createdTeacher);
    console.log('✅ Verification - User linked to organization:', createdUser.organizationId.toString() === organizationId);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testBulkCreation();
