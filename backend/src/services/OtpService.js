/**
 * OtpService
 * Service layer for OTP operations
 * Handles OTP generation, verification, and business logic
 */

const OtpRepository = require('../repositories/OtpRepository');
const AppError = require('../utils/AppError');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Twilio configuration
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

class OtpService {
  /**
   * Generate a 6-digit OTP
   * @returns {string} - Generated OTP code
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create email OTP
   * @param {string} email - Email address
   * @param {string} purpose - OTP purpose (default: 'registration')
   * @returns {Promise<Object>} - Created OTP document
   * @throws {AppError} - If validation fails
   */
  async createEmailOTP(email, purpose = 'registration') {
    if (!email) {
      throw AppError.badRequest('Email address is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest('Invalid email format');
    }

    // Delete any existing OTPs for this email
    await OtpRepository.deleteMany({ email: email.toLowerCase(), type: 'email' });

    const otpCode = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = await OtpRepository.create({
      email: email.toLowerCase(),
      otp: otpCode,
      type: 'email',
      purpose,
      expiresAt
    });

    return otp;
  }

  /**
   * Send email OTP (creates OTP and sends email)
   * @param {string} email - Email address
   * @param {string} purpose - OTP purpose (default: 'verification')
   * @returns {Promise<Object>} - Send result
   * @throws {AppError} - If validation fails
   */
  async sendEmailOTP(email, purpose = 'verification') {
    try {
      // SECURITY: Do NOT use this method for organization registration
      // Organization OTPs MUST use sendOrganizationOtpEmail()
      if (purpose === 'registration') {
        console.error('❌ [SECURITY] sendEmailOTP() called with purpose="registration"');
        console.error('❌ [SECURITY] Organization OTPs MUST use sendOrganizationOtpEmail()');
        throw AppError.internal('Invalid OTP method for organization registration. Use sendOrganizationOtpEmail() instead.');
      }
      
      console.log('📧 [GENERIC OTP] Using GENERIC OTP EMAIL TEMPLATE (NOT organization)');
      const otp = await this.createEmailOTP(email, purpose);

      // Send email with OTP
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email - Evalon',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email - Evalon</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px; text-align: center;">
                  <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e5e5; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <tr>
                      <td style="padding: 48px 40px 32px 40px; text-align: center;">
                        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.3px;">Evalon</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 32px 40px;">
                        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Verify your email</h2>
                        <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #666666;">Please use the verification code below to complete your registration.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 32px 40px; text-align: center;">
                        <div style="display: inline-block; padding: 24px 32px; background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; margin: 0 auto;">
                          <div style="font-size: 32px; font-weight: 600; letter-spacing: 6px; color: #1a1a1a; font-family: 'Courier New', 'Monaco', monospace; line-height: 1.2;">${otp.otp}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 24px 40px;">
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #888888; text-align: center;">This code will expire in 10 minutes.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #888888; text-align: center;">If you didn't request this verification code, you can safely ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #999999; text-align: center;">© ${new Date().getFullYear()} Evalon. All rights reserved.</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 1.4; color: #999999; text-align: center;">This is an automated message. Please do not reply.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      await emailTransporter.sendMail(mailOptions);

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Email OTP error:', error);
      throw AppError.internal('Failed to send OTP');
    }
  }

  /**
   * Send organization OTP email (dedicated method for organization registration)
   * @param {string} email - Email address
   * @param {string} registrationToken - Registration token (optional, for getting org name)
   * @param {string} purpose - OTP purpose (default: 'registration')
   * @returns {Promise<Object>} - Send result
   * @throws {AppError} - If validation fails
   */
  async sendOrganizationOtpEmail(email, registrationToken = null, purpose = 'registration') {
    try {
      console.log('========================================');
      console.log('📧 [ORGANIZATION OTP] TEMPLATE: organization-otp-email-template');
      console.log('📧 [ORGANIZATION OTP] METHOD: sendOrganizationOtpEmail');
      console.log('📧 [ORGANIZATION OTP] Using ORGANIZATION OTP EMAIL TEMPLATE');
      console.log('========================================');
      
      const otp = await this.createEmailOTP(email, purpose);
      console.log('📧 [ORGANIZATION OTP] OTP created:', otp.otp.substring(0, 2) + '****');

      // Get organization name from registration token if available
      let organizationName = null;
      if (registrationToken) {
        try {
          const { retrieve } = require('../utils/tempStorage');
          const registrationData = retrieve(registrationToken);
          if (registrationData && registrationData.organisationName) {
            organizationName = registrationData.organisationName;
            console.log('📧 [ORGANIZATION OTP] Organization name found:', organizationName);
          }
        } catch (error) {
          console.log('📧 [ORGANIZATION OTP] Could not retrieve organization name from token');
        }
      }

      // Organization-specific OTP email template
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email - Evalon',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email - Evalon</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px; text-align: center;">
                  <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e5e5; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <tr>
                      <td style="padding: 48px 40px 32px 40px; text-align: center;">
                        <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                          <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0c4a6e; text-transform: uppercase; letter-spacing: 1px;">ORGANIZATION REGISTRATION OTP</p>
                        </div>
                        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.3px;">Evalon</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 32px 40px;">
                        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Verify your email</h2>
                        <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #666666;">${organizationName ? `Please use the verification code below to complete your registration for <strong>${organizationName}</strong>.` : 'Please use the verification code below to complete your registration.'}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 32px 40px; text-align: center;">
                        <div style="display: inline-block; padding: 24px 32px; background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; margin: 0 auto;">
                          <div style="font-size: 32px; font-weight: 600; letter-spacing: 6px; color: #1a1a1a; font-family: 'Courier New', 'Monaco', monospace; line-height: 1.2;">${otp.otp}</div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 24px 40px;">
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #888888; text-align: center;">This code will expire in 10 minutes.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #888888; text-align: center;">If you didn't request this verification code, you can safely ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #999999; text-align: center;">© ${new Date().getFullYear()} Evalon. All rights reserved.</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; line-height: 1.4; color: #999999; text-align: center;">This is an automated message. Please do not reply.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      console.log('📧 [ORGANIZATION OTP] Preparing to send email...');
      console.log('📧 [ORGANIZATION OTP] Email to:', email);
      console.log('📧 [ORGANIZATION OTP] Subject:', mailOptions.subject);
      console.log('📧 [ORGANIZATION OTP] Template contains: "ORGANIZATION REGISTRATION OTP" marker');
      console.log('📧 [ORGANIZATION OTP] HTML length:', mailOptions.html.length, 'characters');
      
      const result = await emailTransporter.sendMail(mailOptions);
      
      console.log('✅ [ORGANIZATION OTP] Email sent successfully');
      console.log('✅ [ORGANIZATION OTP] Message ID:', result.messageId);
      console.log('✅ [ORGANIZATION OTP] Response:', result.response);
      console.log('========================================');

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('❌ [ORGANIZATION OTP] Email OTP error:', error);
      throw AppError.internal('Failed to send OTP');
    }
  }

  /**
   * Create phone OTP
   * @param {string} phone - Phone number
   * @param {string} countryCode - Country code (default: '+91')
   * @param {string} purpose - OTP purpose (default: 'registration')
   * @returns {Promise<Object>} - Created OTP document
   * @throws {AppError} - If validation fails
   */
  async createPhoneOTP(phone, countryCode = '+91', purpose = 'registration') {
    if (!phone) {
      throw AppError.badRequest('Phone number is required');
    }

    // Delete any existing OTPs for this phone
    await OtpRepository.deleteMany({ phone, type: 'phone' });

    const otpCode = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = await OtpRepository.create({
      phone,
      countryCode,
      otp: otpCode,
      type: 'phone',
      purpose,
      expiresAt
    });

    return otp;
  }

  /**
   * Send phone OTP (creates OTP and sends SMS)
   * @param {string} phoneNumber - Phone number
   * @param {string} purpose - OTP purpose (default: 'verification')
   * @returns {Promise<Object>} - Send result
   * @throws {AppError} - If validation fails
   */
  async sendPhoneOTP(phoneNumber, purpose = 'verification') {
    try {
      const otp = await this.createPhoneOTP(phoneNumber, '+91', purpose);

      if (!twilioClient) {
        throw AppError.internal('Twilio client not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
      }

      // Ensure phone number has country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      // Send SMS
      const message = await twilioClient.messages.create({
        body: `Your Evalon verification OTP is: ${otp.otp}. This OTP will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      return { success: true, message: 'OTP sent successfully', messageId: message.sid };
    } catch (error) {
      console.error('Phone OTP error:', error);

      // Handle specific Twilio errors
      if (error.code === 21608) {
        throw AppError.badRequest('Phone number not verified in Twilio trial account. Please verify the number or upgrade your Twilio account.');
      }

      if (error.code === 20003) {
        throw AppError.internal('Twilio authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
      }

      if (error.code === 21211) {
        throw AppError.badRequest('Invalid phone number format. Please provide a valid phone number with country code.');
      }

      throw AppError.internal(`Failed to send OTP: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Verify email OTP
   * @param {string} email - Email address
   * @param {string} otpCode - OTP code to verify
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object>} - Verification result
   * @throws {AppError} - If verification fails
   */
  async verifyEmailOTP(email, otpCode, purpose = 'registration') {
    if (!email || !otpCode) {
      throw AppError.badRequest('Email and OTP code are required');
    }

    const otp = await OtpRepository.findValidOTP({
      email: email.toLowerCase(),
      type: 'email',
      purpose
    });

    if (!otp) {
      throw AppError.badRequest('Invalid or expired OTP');
    }

    if (otp.attempts >= 5) {
      throw AppError.badRequest('Maximum verification attempts exceeded');
    }

    // Increment attempts
    await OtpRepository.updateById(otp._id, { $inc: { attempts: 1 } });

    if (otp.otp !== otpCode) {
      throw AppError.badRequest('Invalid OTP code');
    }

    // Mark as verified
    await OtpRepository.updateById(otp._id, { verified: true });

    return {
      success: true,
      message: 'OTP verified successfully',
      otp: otp._id
    };
  }

  /**
   * Verify email OTP (legacy method for compatibility)
   * @param {string} email - Email address
   * @param {string} otpCode - OTP code to verify
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object>} - Verification result
   */
  async verifyEmailOTPLegacy(email, otpCode, purpose = 'verification') {
    try {
      return await this.verifyEmailOTP(email, otpCode, purpose);
    } catch (error) {
      if (error instanceof AppError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  /**
   * Verify phone OTP
   * @param {string} phone - Phone number
   * @param {string} otpCode - OTP code to verify
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object>} - Verification result
   * @throws {AppError} - If verification fails
   */
  async verifyPhoneOTP(phone, otpCode, purpose = 'registration') {
    if (!phone || !otpCode) {
      throw AppError.badRequest('Phone number and OTP code are required');
    }

    const otp = await OtpRepository.findValidOTP({
      phone,
      type: 'phone',
      purpose
    });

    if (!otp) {
      throw AppError.badRequest('Invalid or expired OTP');
    }

    if (otp.attempts >= 5) {
      throw AppError.badRequest('Maximum verification attempts exceeded');
    }

    // Increment attempts
    await OtpRepository.updateById(otp._id, { $inc: { attempts: 1 } });

    if (otp.otp !== otpCode) {
      throw AppError.badRequest('Invalid OTP code');
    }

    // Mark as verified
    await OtpRepository.updateById(otp._id, { verified: true });

    return {
      success: true,
      message: 'OTP verified successfully',
      otp: otp._id
    };
  }

  /**
   * Verify phone OTP (legacy method for compatibility)
   * @param {string} phoneNumber - Phone number
   * @param {string} otpCode - OTP code to verify
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object>} - Verification result
   */
  async verifyPhoneOTPLegacy(phoneNumber, otpCode, purpose = 'verification') {
    try {
      return await this.verifyPhoneOTP(phoneNumber, otpCode, purpose);
    } catch (error) {
      if (error instanceof AppError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  /**
   * Get OTP by ID
   * @param {string} otpId - OTP ID
   * @returns {Promise<Object>} - OTP document
   * @throws {AppError} - If OTP not found
   */
  async getOTPById(otpId) {
    if (!otpId) {
      throw AppError.badRequest('OTP ID is required');
    }

    const otp = await OtpRepository.findById(otpId);
    if (!otp) {
      throw AppError.notFound('OTP not found');
    }

    return otp;
  }

  /**
   * Delete expired OTPs
   * @returns {Promise<Object>} - Delete result
   */
  async deleteExpiredOTPs() {
    try {
      const result = await OtpRepository.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      return result;
    } catch (error) {
      throw AppError.internal(`Failed to delete expired OTPs: ${error.message}`);
    }
  }

  /**
   * Get OTP statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - OTP statistics
   */
  async getOTPStats(filters = {}) {
    try {
      const filter = {};
      if (filters.type) filter.type = filters.type;
      if (filters.purpose) filter.purpose = filters.purpose;

      const total = await OtpRepository.count(filter);
      const verified = await OtpRepository.count({ ...filter, verified: true });
      const expired = await OtpRepository.count({
        ...filter,
        expiresAt: { $lt: new Date() }
      });

      return {
        total,
        verified,
        expired,
        pending: total - verified - expired
      };
    } catch (error) {
      throw AppError.internal(`Failed to get OTP statistics: ${error.message}`);
    }
  }

  /**
   * Cleanup expired OTPs (wrapper for compatibility)
   * @returns {Promise<number>} - Number of deleted OTPs
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await this.deleteExpiredOTPs();
      return result.deletedCount || 0;
    } catch (error) {
      console.error('OTP cleanup error:', error);
      return 0;
    }
  }
}

module.exports = new OtpService();

