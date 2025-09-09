const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send Phone OTP using Twilio Verify
const sendPhoneOTP = async (phoneNumber, otp) => {
  try {
    // For development, we'll just log the OTP
    console.log(`📱 SMS OTP for ${phoneNumber}: ${otp}`);
    
    // In production, you would use Twilio Verify:
    // const verification = await twilioClient.verify.v2
    //   .services('VA3f3539548e41c1b6def2b7b85ca2a3e9')
    //   .verifications
    //   .create({
    //     to: phoneNumber,
    //     channel: 'sms'
    //   });
    
    return true;
  } catch (error) {
    console.error('Phone OTP sending failed:', error);
    throw error;
  }
};

// Verify Phone OTP using Twilio Verify
const verifyPhoneOTP = async (phoneNumber, otp) => {
  try {
    // For development, accept any 6-digit OTP
    if (otp && otp.length === 6 && /^\d+$/.test(otp)) {
      return true;
    }
    
    // In production, you would use Twilio Verify:
    // const verificationCheck = await twilioClient.verify.v2
    //   .services('VA3f3539548e41c1b6def2b7b85ca2a3e9')
    //   .verificationChecks
    //   .create({
    //     to: phoneNumber,
    //     code: otp
    //   });
    // return verificationCheck.status === 'approved';
    
    return false;
  } catch (error) {
    console.error('Phone OTP verification failed:', error);
    throw error;
  }
};

module.exports = {
  sendPhoneOTP,
  verifyPhoneOTP
};

