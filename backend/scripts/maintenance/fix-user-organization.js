const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
require('dotenv').config();

// Connect to MongoDB
// IMPORTANT: MONGODB_URI must be set in .env file - no fallback allowed
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
  process.exit(1);
}

// ENFORCED: Database name is ALWAYS 'evalon'
const REQUIRED_DB_NAME = 'evalon';

mongoose.connect(mongoUri, {
  dbName: REQUIRED_DB_NAME
});

async function fixUserOrganization() {
  try {
    console.log('🔧 Fixing user organization reference...\n');

    // Find the user
    const user = await User.findOne({ email: 'ritotensy@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Current User ID: ${user.userId}`);
    console.log(`   User Model: ${user.userModel}`);
    console.log('');

    // Find available organizations
    const organizations = await Organization.find({});
    console.log('🏢 Available organizations:');
    organizations.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.email}) - ID: ${org._id}`);
    });
    console.log('');

    // Use the first organization (Greenwood High School)
    const targetOrg = organizations[0];
    console.log(`🎯 Updating user to point to: ${targetOrg.name} (${targetOrg._id})`);

    // Update the user's userId
    user.userId = targetOrg._id;
    await user.save();

    console.log('✅ User updated successfully!');
    console.log(`   New User ID: ${user.userId}`);
    
    // Verify the fix
    await user.populate('userId');
    console.log(`   Populated User ID: ${user.userId}`);
    if (user.userId) {
      console.log(`   Organization Name: ${user.userId.name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixUserOrganization();
