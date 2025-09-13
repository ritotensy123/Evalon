const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon', {
  dbName: 'evalon'
});

async function fixUserEmails() {
  try {
    console.log('🔧 Fixing User Email Records...\n');

    const users = await User.find({});
    
    for (const user of users) {
      const expectedUserTypeEmail = `${user.email.toLowerCase()}_${user.userType}`;
      
      console.log(`Fixing user: ${user.email} (${user.userType})`);
      console.log(`  Current userTypeEmail: ${user.userTypeEmail}`);
      console.log(`  Expected userTypeEmail: ${expectedUserTypeEmail}`);
      
      if (user.userTypeEmail !== expectedUserTypeEmail) {
        user.userTypeEmail = expectedUserTypeEmail;
        await user.save();
        console.log(`  ✅ Fixed!\n`);
      } else {
        console.log(`  ✅ Already correct\n`);
      }
    }

    // Test the fixes
    console.log('🧪 Testing fixes...\n');
    
    const testCases = [
      { email: 'ritotensy@gmail.com', userType: 'organization_admin' },
      { email: 'maryloid936@gmail.com', userType: 'teacher' },
      { email: 'lespanol79@gmail.com', userType: 'student' }
    ];
    
    for (const testCase of testCases) {
      const foundUser = await User.findByEmailAndType(testCase.email, testCase.userType);
      console.log(`${testCase.email} (${testCase.userType}): ${foundUser ? '✅ Found' : '❌ Not found'}`);
    }

  } catch (error) {
    console.error('❌ Error fixing user emails:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixUserEmails();
