const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon', {
  dbName: 'evalon'
});

async function fixAllOrgAdmins() {
  try {
    console.log('🔧 Fixing all organization admin users...\n');

    // Get all organization admin users
    const orgAdmins = await User.find({ userType: 'organization_admin' });
    const organizations = await Organization.find({});
    
    console.log(`Found ${orgAdmins.length} org admin users and ${organizations.length} organizations\n`);

    for (let i = 0; i < orgAdmins.length; i++) {
      const user = orgAdmins[i];
      console.log(`👤 Processing user: ${user.email}`);
      
      // Check if user's organization exists
      const currentOrg = await Organization.findById(user.userId);
      
      if (!currentOrg) {
        console.log(`   ❌ Organization not found for ID: ${user.userId}`);
        
        // Find the best matching organization based on email domain
        let targetOrg = null;
        
        // Try to match by email domain
        const userDomain = user.email.split('@')[1];
        targetOrg = organizations.find(org => 
          org.email && org.email.split('@')[1] === userDomain
        );
        
        // If no domain match, assign to the first available organization
        if (!targetOrg && organizations.length > 0) {
          // For admin@testschool.com, assign to Metro University (the second org)
          if (user.email === 'admin@testschool.com') {
            targetOrg = organizations.find(org => org.name === 'Metro University');
          } else {
            targetOrg = organizations[0];
          }
        }
        
        if (targetOrg) {
          console.log(`   🎯 Assigning to: ${targetOrg.name} (${targetOrg._id})`);
          
          // Update user's userId
          user.userId = targetOrg._id;
          await user.save();
          
          console.log(`   ✅ User updated successfully`);
          
          // Verify the fix
          await user.populate('userId');
          if (user.userId) {
            console.log(`   ✅ Verification: ${user.userId.name}`);
          }
        } else {
          console.log(`   ❌ No available organization to assign`);
        }
      } else {
        console.log(`   ✅ Organization exists: ${currentOrg.name}`);
      }
      console.log('');
    }

    // Final verification
    console.log('🔍 Final verification - All org admin users:');
    const updatedUsers = await User.find({ userType: 'organization_admin' });
    for (const user of updatedUsers) {
      await user.populate('userId');
      console.log(`   ${user.email} -> ${user.userId ? user.userId.name : 'NULL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAllOrgAdmins();
