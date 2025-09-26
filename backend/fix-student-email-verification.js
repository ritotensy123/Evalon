const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evalon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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
