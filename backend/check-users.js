const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon', {
  dbName: 'evalon'
});

async function checkUsers() {
  try {
    console.log('🔍 Checking all users...\n');

    const users = await User.find({}, 'email userType userTypeEmail isActive isEmailVerified').lean();
    
    console.log('📋 All Users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   User Type: ${user.userType}`);
      console.log(`   User Type Email: ${user.userTypeEmail}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();
