const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

const MONGODB_URI = 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';

async function createUserCorrectly() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evalon'
    });
    console.log('✅ Connected to evalon database');

    // Delete existing user
    const deletedUser = await User.findOneAndDelete({ 
      email: 'ritotensy@gmail.com', 
      userType: 'organization_admin' 
    });
    
    if (deletedUser) {
      console.log('✅ Deleted existing user');
    }

    // Find the organization
    const organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
    if (!organization) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('✅ Found organization:', organization._id);

    // Create new user WITHOUT password first (let pre-save middleware handle it)
    const newUser = new User({
      email: 'ritotensy@gmail.com',
      password: 'Redriders@123', // This will be hashed by pre-save middleware
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
    console.log('✅ User created successfully');

    // Test the password using the model's method
    const passwordMatch = await newUser.comparePassword('Redriders@123');
    console.log('Password match test:', passwordMatch);

    // Also test with bcrypt directly
    const bcrypt = require('bcryptjs');
    const directMatch = await bcrypt.compare('Redriders@123', newUser.password);
    console.log('Direct bcrypt match:', directMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUserCorrectly();
