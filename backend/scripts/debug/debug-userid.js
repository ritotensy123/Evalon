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

async function debugUserId() {
  try {
    console.log('🔍 Debugging userId field...\n');

    // Check the specific user
    const user = await User.findOne({ email: 'ritotensy@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User Type: ${user.userType}`);
    console.log(`   User ID: ${user.userId}`);
    console.log(`   User Model: ${user.userModel}`);
    console.log(`   User Type Email: ${user.userTypeEmail}`);
    console.log('');

    // Try to populate userId
    await user.populate('userId');
    console.log('📊 After populate:');
    console.log(`   User ID (populated): ${user.userId}`);
    
    if (user.userId) {
      console.log(`   User ID type: ${typeof user.userId}`);
      console.log(`   User ID is object: ${user.userId.constructor.name}`);
    } else {
      console.log('   ❌ User ID is null/undefined after populate');
    }

    // Check if organization exists
    if (user.userType === 'organization_admin') {
      console.log('\n🏢 Checking organization...');
      const orgId = user.userId;
      console.log(`   Looking for organization with ID: ${orgId}`);
      
      const organization = await Organization.findById(orgId);
      if (organization) {
        console.log(`   ✅ Organization found: ${organization.name}`);
        console.log(`   Organization ID: ${organization._id}`);
      } else {
        console.log('   ❌ Organization not found');
        
        // List all organizations
        console.log('\n📋 All organizations in database:');
        const allOrgs = await Organization.find({}, 'name email _id');
        allOrgs.forEach((org, index) => {
          console.log(`   ${index + 1}. ${org.name} (${org.email}) - ID: ${org._id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugUserId();
