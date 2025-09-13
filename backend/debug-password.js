const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    const password = 'Redriders@123';
    console.log('Original password:', password);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Hashed password:', hashedPassword);
    
    // Test comparison
    const match = await bcrypt.compare(password, hashedPassword);
    console.log('Password match:', match);
    
    // Test with different variations
    const variations = [
      'Redriders@123',
      'redriders@123',
      'Redriders@123 ',
      ' Redriders@123',
      'Redriders@123\n',
      'Redriders@123\r'
    ];
    
    for (const variation of variations) {
      const match = await bcrypt.compare(variation, hashedPassword);
      console.log(`"${variation}" match:`, match);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPassword();
