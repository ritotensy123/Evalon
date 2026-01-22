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

async function checkAllOrgAdmins() {
  try {
    console.log('🔍 Checking all organization admin users...\n');

    // Find all organization admin users
    const orgAdmins = await User.find({ userType: 'organization_admin' });
    
    console.log(`📋 Found ${orgAdmins.length} organization admin users:\n`);
    
    for (let i = 0; i < orgAdmins.length; i++) {
      const user = orgAdmins[i];
      console.log(`${i + 1}. User: ${user.email}`);
      console.log(`   User ID: ${user.userId}`);
      console.log(`   User Model: ${user.userModel}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      
      // Check if organization exists
      const organization = await Organization.findById(user.userId);
      if (organization) {
        console.log(`   ✅ Organization: ${organization.name} (${organization._id})`);
        console.log(`   Organization Email: ${organization.email}`);
        console.log(`   Setup Completed: ${organization.setupCompleted}`);
      } else {
        console.log(`   ❌ Organization NOT FOUND for ID: ${user.userId}`);
      }
      console.log('');
    }

    // List all available organizations
    console.log('🏢 All available organizations:');
    const allOrgs = await Organization.find({});
    allOrgs.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.email}) - ID: ${org._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAllOrgAdmins();
