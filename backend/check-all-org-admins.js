const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon', {
  dbName: 'evalon'
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
