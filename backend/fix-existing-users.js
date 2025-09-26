const User = require('./src/models/User');
const mongoose = require('mongoose');

async function fixExistingUsers() {
  try {
    console.log('🔧 Fixing existing admin-created users...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evalon');
    console.log('✅ Connected to database');

    // Find users that were created by admin but don't have email verification
    const usersToFix = await User.find({
      authProvider: 'local',
      isRegistrationComplete: true,
      isEmailVerified: { $ne: true }
    });

    console.log(`📝 Found ${usersToFix.length} users that need email verification fix`);

    for (const user of usersToFix) {
      console.log(`🔧 Fixing user: ${user.email} (${user.userType})`);
      user.isEmailVerified = true;
      await user.save();
      console.log(`✅ Fixed user: ${user.email}`);
    }

    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing - all admin-created users already have email verification');
    } else {
      console.log(`\n✅ Fixed ${usersToFix.length} users`);
    }

    // Check the specific user that was having issues
    const specificUser = await User.findOne({ 
      email: 'maryloid936@gmail.com',
      userType: 'teacher'
    });

    if (specificUser) {
      console.log('\n📝 Checking specific user (maryloid936@gmail.com):');
      console.log({
        email: specificUser.email,
        userType: specificUser.userType,
        isEmailVerified: specificUser.isEmailVerified,
        isActive: specificUser.isActive,
        authProvider: specificUser.authProvider,
        isRegistrationComplete: specificUser.isRegistrationComplete
      });

      if (specificUser.isEmailVerified) {
        console.log('✅ User can now login successfully!');
      } else {
        console.log('❌ User still needs email verification fix');
        specificUser.isEmailVerified = true;
        await specificUser.save();
        console.log('✅ User email verification fixed');
      }
    } else {
      console.log('❌ Specific user not found');
    }

    console.log('\n✅ Email verification fix completed!');
    console.log('\n📋 Summary:');
    console.log('✅ All admin-created users now have isEmailVerified = true');
    console.log('✅ Users can login with temporary passwords');
    console.log('✅ No more "Please verify your email" errors');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the fix
fixExistingUsers();
