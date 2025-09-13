const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Email OTP configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email transporter connection
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('📧 Email transporter ready to send emails');
  }
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('📱 Twilio client initialized successfully');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email OTP
const sendEmailOTP = async (email, purpose = 'verification') => {
  try {
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otp = new OTP({
      email,
      otp: otpCode,
      purpose,
      expiresAt,
      type: 'email'
    });

    await otp.save();


    // Send email with beautiful template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Evalon - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Evalon Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Evalon
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">
                Educational Management Platform
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600; text-align: center;">
                Email Verification
              </h2>
              
              <p style="color: #6b7280; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                Please use the verification code below to complete your registration:
              </p>
              
              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                  Verification Code
                </p>
                <h1 style="color: #1f2937; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otpCode}
                </h1>
              </div>
              
              <!-- Info -->
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                  ⏰ This code will expire in <strong>10 minutes</strong>
                </p>
              </div>
              
              <p style="color: #6b7280; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; text-align: center;">
                If you didn't request this verification code, please ignore this email or contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 Evalon. All rights reserved.
              </p>
              <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">
                This is an automated message, please do not reply.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`📧 Email OTP sent to ${email}: ${otpCode}`);
    return { success: true, message: 'OTP sent successfully' };

  } catch (error) {
    console.error('Email OTP error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Send Phone OTP
const sendPhoneOTP = async (phoneNumber, purpose = 'verification') => {
  try {

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otp = new OTP({
      phone: phoneNumber,
      otp: otpCode,
      purpose,
      expiresAt,
      type: 'phone'
    });

    await otp.save();

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Your Evalon verification OTP is: ${otpCode}. This OTP will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      to: phoneNumber
    });

    console.log(`📱 SMS sent to ${phoneNumber}: ${otpCode}`);
    return { success: true, message: 'OTP sent successfully', messageId: message.sid };

  } catch (error) {
    console.error('Phone OTP error:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21608) {
      return { 
        success: false, 
        message: 'Phone number not verified in Twilio trial account. Please verify the number or upgrade your Twilio account.',
        error: 'UNVERIFIED_NUMBER'
      };
    }
    
    return { success: false, message: 'Failed to send OTP', error: error.message };
  }
};

// Verify Email OTP
const verifyEmailOTP = async (email, otpCode, purpose = 'verification') => {
  try {
    const otp = await OTP.findOne({
      email,
      otp: otpCode,
      purpose,
      type: 'email',
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otp) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    console.log(`✅ Email OTP verified for ${email}`);
    return { success: true, message: 'OTP verified successfully' };

  } catch (error) {
    console.error('Email OTP verification error:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Verify Phone OTP
const verifyPhoneOTP = async (phoneNumber, otpCode, purpose = 'verification') => {
  try {
    const otp = await OTP.findOne({
      phone: phoneNumber,
      otp: otpCode,
      purpose,
      type: 'phone',
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otp) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    console.log(`✅ Phone OTP verified for ${phoneNumber}`);
    return { success: true, message: 'OTP verified successfully' };

  } catch (error) {
    console.error('Phone OTP verification error:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  } catch (error) {
    console.error('OTP cleanup error:', error);
    return 0;
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredOTPs, 3600000);

// Organization-specific OTP functions (for API routes)
const sendEmailOTPForOrganization = async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await sendEmailOTP(email, purpose);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Organization email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email OTP',
      error: error.message
    });
  }
};

const verifyEmailOTPForOrganization = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Convert email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();
    const result = await verifyEmailOTP(normalizedEmail, otp, 'registration');
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Organization email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: error.message
    });
  }
};

const sendPhoneOTPForOrganization = async (req, res) => {
  try {
    const { phone, countryCode = '+91', purpose = 'registration' } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const fullPhoneNumber = countryCode + phone;
    const result = await sendPhoneOTP(fullPhoneNumber, purpose);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Organization phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone OTP',
      error: error.message
    });
  }
};

const verifyPhoneOTPForOrganization = async (req, res) => {
  try {
    const { phone, countryCode = '+91', otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const fullPhoneNumber = countryCode + phone;
    const result = await verifyPhoneOTP(fullPhoneNumber, otp, 'registration');
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Organization phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: error.message
    });
  }
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendPhoneOTP,
  verifyEmailOTP,
  verifyPhoneOTP,
  cleanupExpiredOTPs,
  // Organization-specific functions
  sendEmailOTPForOrganization,
  verifyEmailOTPForOrganization,
  sendPhoneOTPForOrganization,
  verifyPhoneOTPForOrganization
};
