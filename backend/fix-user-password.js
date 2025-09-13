const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';

async function fixUserPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evalon'
    });
    console.log('✅ Connected to evalon database');

    // Find the user
    const user = await User.findOne({ 
      email: 'ritotensy@gmail.com', 
      userType: 'organization_admin' 
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found, updating password...');

    // Hash the password correctly
    const hashedPassword = await bcrypt.hash('Redriders@123', 12);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated successfully');

    // Test the new password
    const passwordMatch = await bcrypt.compare('Redriders@123', user.password);
    console.log('New password match:', passwordMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserPassword();
