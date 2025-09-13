const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';

async function recreateUser() {
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
    } else {
      console.log('ℹ️ No existing user to delete');
    }

    // Find the organization
    const organization = await Organization.findOne({ email: 'ritotensy@gmail.com' });
    if (!organization) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('✅ Found organization:', organization._id);

    // Hash the password correctly
    const password = 'Redriders@123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');

    // Create new user
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
    console.log('✅ User created successfully');

    // Test the password immediately
    const passwordMatch = await bcrypt.compare(password, newUser.password);
    console.log('Password match test:', passwordMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recreateUser();
