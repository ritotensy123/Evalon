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

async function investigateRegistrations() {
  try {
    console.log('🔍 Investigating all registrations and organizations...\n');

    // Get all organizations with full details
    console.log('🏢 All Organizations:');
    const organizations = await Organization.find({});
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org._id}`);
      console.log(`   Email: ${org.email}`);
      console.log(`   Admin Name: ${org.adminName || 'N/A'}`);
      console.log(`   Admin Email: ${org.adminEmail || 'N/A'}`);
      console.log(`   Created: ${org.createdAt}`);
      console.log('');
    });

    // Get all users with their details
    console.log('👥 All Users:');
    const users = await User.find({});
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   User Type: ${user.userType}`);
      console.log(`   User ID: ${user.userId}`);
      console.log(`   User Model: ${user.userModel}`);
      console.log(`   Profile: ${JSON.stringify(user.profile)}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for any organization with "Mary Rani" or similar
    console.log('🔍 Searching for Mary Rani related data...');
    const maryRaniOrgs = await Organization.find({
      $or: [
        { name: { $regex: /mary/i } },
        { adminName: { $regex: /mary/i } },
        { adminEmail: { $regex: /mary/i } },
        { email: { $regex: /mary/i } }
      ]
    });
    
    if (maryRaniOrgs.length > 0) {
      console.log('Found Mary Rani related organizations:');
      maryRaniOrgs.forEach(org => {
        console.log(`   ${org.name} - ${org.adminName} - ${org.adminEmail}`);
      });
    } else {
      console.log('No Mary Rani related organizations found');
    }

    // Check for any organization with "ritotensy" or similar
    console.log('\n🔍 Searching for ritotensy related data...');
    const ritoOrgs = await Organization.find({
      $or: [
        { name: { $regex: /rito/i } },
        { adminName: { $regex: /rito/i } },
        { adminEmail: { $regex: /rito/i } },
        { email: { $regex: /rito/i } }
      ]
    });
    
    if (ritoOrgs.length > 0) {
      console.log('Found ritotensy related organizations:');
      ritoOrgs.forEach(org => {
        console.log(`   ${org.name} - ${org.adminName} - ${org.adminEmail}`);
      });
    } else {
      console.log('No ritotensy related organizations found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

investigateRegistrations();
