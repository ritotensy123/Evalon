const mongoose = require('mongoose');
const User = require('./src/models/User');
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

async function fixStudentEmailVerification() {
  try {
    console.log('🔍 Checking students created via user management...');
    
    // Find all students with isEmailVerified: true and authProvider: 'temp_password'
    const studentsWithVerifiedEmail = await User.find({
      userType: 'student',
      isEmailVerified: true,
      authProvider: 'temp_password'
    });
    
    console.log(`📊 Found ${studentsWithVerifiedEmail.length} students with verified emails who should go through verification`);
    
    if (studentsWithVerifiedEmail.length > 0) {
      console.log('📝 Sample students:');
      studentsWithVerifiedEmail.slice(0, 3).forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.email} (${student.profile?.firstName} ${student.profile?.lastName})`);
      });
      
      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\n❓ Do you want to update these students to require email verification? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log('🔄 Updating students...');
          
          const result = await User.updateMany(
            {
              userType: 'student',
              isEmailVerified: true,
              authProvider: 'temp_password'
            },
            {
              $set: {
                isEmailVerified: false
              }
            }
          );
          
          console.log(`✅ Updated ${result.modifiedCount} students to require email verification`);
        } else {
          console.log('❌ No changes made');
        }
        
        rl.close();
        mongoose.connection.close();
      });
    } else {
      console.log('✅ No students found that need updating');
      mongoose.connection.close();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

// Run the script
fixStudentEmailVerification();
