const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:ritotensy@cluster0.u8jqfbo.mongodb.net/evalon-app?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'new.login@example.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      email: user.email,
      userType: user.userType,
      userTypeEmail: user.userTypeEmail,
      authProvider: user.authProvider,
      isRegistrationComplete: user.isRegistrationComplete,
      password: user.password ? 'Password exists' : 'No password',
      passwordLength: user.password ? user.password.length : 0,
      passwordStart: user.password ? user.password.substring(0, 10) : 'N/A'
    });

    // Test password comparison
    const testPassword = 'x0tn1shv7a';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Password comparison result:', isMatch);

    // Test the comparePassword method
    const methodResult = await user.comparePassword(testPassword);
    console.log('✅ Method comparison result:', methodResult);

    // Test findByEmailAndType
    const foundUser = await User.findByEmailAndType('new.login@example.com', 'teacher');
    console.log('✅ findByEmailAndType result:', foundUser ? 'Found' : 'Not found');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

debugLogin();
