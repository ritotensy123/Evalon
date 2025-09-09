const OTP = require('../models/OTP');
const { getAuth } = require('../config/firebase');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { validationResult } = require('express-validator');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send Email OTP
const sendEmailOTP = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, purpose = 'registration' } = req.body;

    // Create OTP record
    const otpRecord = await OTP.createEmailOTP(email, purpose);

    // For development, just log the OTP instead of sending email
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log(`📧 Email OTP for ${email}: ${otpRecord.otp}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP generated successfully (development mode)',
        data: {
          email,
          otp: otpRecord.otp, // Only in development
          expiresIn: '10 minutes'
        }
      });
      return;
    }

    // Send email with OTP (production mode)
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"Evalon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Evalon - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Evalon</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for registering with Evalon! Please use the following verification code to complete your email verification:
            </p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpRecord.otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 Evalon. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email successfully',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Error in sendEmailOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Verify Email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email,
      type: 'email',
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email or OTP already verified'
      });
    }

    // Verify OTP
    await otpRecord.verifyOTP(otp);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error in verifyEmailOTP:', error);
    
    if (error.message.includes('expired') || error.message.includes('Invalid') || error.message.includes('exceeded')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Send Phone OTP using Twilio Verify
const sendPhoneOTP = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, countryCode = '+91', purpose = 'registration' } = req.body;

    // Format phone number with country code
    const fullPhoneNumber = `${countryCode}${phone}`;

    // For development, just log the OTP instead of sending SMS
    if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid') {
      const devOTP = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`📱 Phone OTP for ${fullPhoneNumber}: ${devOTP}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP generated successfully (development mode)',
        data: {
          phone: fullPhoneNumber,
          otp: devOTP, // Only in development
          expiresIn: '10 minutes'
        }
      });
      return;
    }

    // Send SMS via Twilio Verify (production mode)
    try {
      const verification = await twilioClient.verify.v2
        .services('VA3f3539548e41c1b6def2b7b85ca2a3e9')
        .verifications
        .create({
          to: fullPhoneNumber,
          channel: 'sms'
        });
      
      console.log(`📱 SMS sent successfully to ${fullPhoneNumber}: ${verification.sid}`);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to phone successfully',
        data: {
          phone: fullPhoneNumber,
          expiresIn: '10 minutes',
          verificationSid: verification.sid,
          status: verification.status
        }
      });
      
    } catch (smsError) {
      console.error('❌ SMS sending failed:', smsError.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS OTP',
        error: process.env.NODE_ENV === 'development' ? smsError.message : 'SMS service unavailable'
      });
    }

  } catch (error) {
    console.error('Error in sendPhoneOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Verify Phone OTP using Twilio Verify
const verifyPhoneOTP = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phone, countryCode = '+91', otp } = req.body;

    // Verify OTP using Twilio Verify
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services('VA3f3539548e41c1b6def2b7b85ca2a3e9')
        .verificationChecks
        .create({
          to: `${countryCode}${phone}`,
          code: otp
        });

      if (verificationCheck.status === 'approved') {
        res.status(200).json({
          success: true,
          message: 'Phone verified successfully',
          data: {
            phone: `${countryCode}${phone}`,
            verified: true,
            status: verificationCheck.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid OTP or verification failed',
          data: {
            status: verificationCheck.status
          }
        });
      }
    } catch (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      res.status(400).json({
        success: false,
        message: 'Verification failed',
        error: process.env.NODE_ENV === 'development' ? verifyError.message : 'Invalid OTP'
      });
    }

  } catch (error) {
    console.error('Error in verifyPhoneOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email, phone, countryCode, type } = req.body;

    if (type === 'email' && email) {
      // Delete existing OTPs
      await OTP.deleteMany({ email, type: 'email' });
      // Send new email OTP
      return await sendEmailOTP(req, res);
    } else if (type === 'phone' && phone) {
      // Delete existing OTPs
      await OTP.deleteMany({ phone, type: 'phone' });
      // Send new phone OTP
      return await sendPhoneOTP(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Please provide email or phone with type.'
      });
    }

  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

module.exports = {
  sendEmailOTP,
  verifyEmailOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
  resendOTP
};
