const nodemailer = require('nodemailer');
require('dotenv').config();
const { config } = require('../config/server');
const { logger } = require('../utils/logger');

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

// Verify email transporter connection
emailTransporter.verify((error, success) => {
  if (error) {
    logger.error('[EMAIL_SERVICE] Email transporter verification failed', { error: error.message });
  } else {
    logger.info('[EMAIL_SERVICE] Email transporter ready to send emails');
  }
});

// Send registration email
const sendRegistrationEmail = async (email, registrationLink, organizationCode, organizationName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Complete Your Registration - Evalon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Evalon!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Complete your registration to get started</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Registration Details</h2>
            <p style="color: #666; line-height: 1.6;">
              You have been invited to join <strong>${organizationName}</strong> on Evalon. 
              Please complete your registration by clicking the link below and setting your password.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Organization Code</h3>
              <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea;">
                ${organizationCode}
              </div>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                You'll need this code to complete your registration.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Complete Registration
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> This registration link will expire in 7 days. 
                If you don't complete your registration within this time, please contact your administrator.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
              If you didn't expect this email, please ignore it. This link is unique to you and should not be shared.
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Registration email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send registration email:', error);
    return { success: false, error: error.message };
  }
};

// Send temporary credentials email for admin-created users
const sendTemporaryCredentialsEmail = async (email, fullName, tempPassword, userType) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Evalon Account - Temporary Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Evalon!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your ${userType} account has been created</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Your ${userType} account has been created by your organization administrator. 
              You can now access the platform using the temporary credentials below.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Login Credentials</h3>
              <div style="margin: 15px 0;">
                <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${email}</p>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;"><strong>Temporary Password:</strong></p>
                  <div style="background: #fff; padding: 10px; border-radius: 3px; font-family: monospace; font-size: 16px; font-weight: bold; color: #667eea; text-align: center; margin-top: 5px;">
                    ${tempPassword}
                  </div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.FRONTEND_URL}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Login to Evalon
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> Please change your password after your first login for security reasons. 
                You'll also be prompted to complete your profile setup.
              </p>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">What's Next?</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li>Login with your temporary credentials</li>
                <li>Change your password to something secure</li>
                <li>Complete your profile information</li>
                <li>Start using Evalon's features</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
              If you didn't expect this email, please contact your organization administrator.
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Temporary credentials email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send temporary credentials email:', error);
    return { success: false, error: error.message };
  }
};

// Send email verification with OTP
const sendEmailVerification = async (email, fullName, otpCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Evalon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Complete your email verification with OTP</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Please verify your email address using the OTP code below. This helps us ensure your account security.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #667eea; display: inline-block;">
                <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500;">Your verification code is:</p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; 
                           padding: 15px 25px; 
                           border-radius: 8px; 
                           font-size: 24px; 
                           font-weight: bold; 
                           letter-spacing: 3px; 
                           margin: 10px 0;
                           font-family: monospace;">
                  ${otpCode}
                </div>
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Note:</strong> This OTP code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
              Enter this code in the verification form to complete your email verification.
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email verification OTP sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send email verification OTP:', error);
    return { success: false, error: error.message };
  }
};

// Send invitation email
const sendInvitationEmail = async (email, invitationLink, role, organizationName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Evalon Account Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Evalon!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to join ${organizationName || 'our platform'}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Evalon Account Invitation</h2>
            <p style="color: #666; line-height: 1.6;">
              You have been invited to join <strong>${organizationName || 'Evalon'}</strong> as a <strong>${role}</strong>. 
              Click the link below to set your password and activate your account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important:</strong> This invitation link will expire in 7 days. 
                If you don't accept the invitation within this time, please contact your administrator.
              </p>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">What's Next?</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li>Click the "Accept Invitation" button above</li>
                <li>Set a secure password for your account</li>
                <li>Complete your profile information</li>
                <li>Start using Evalon's features</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
              If you didn't expect this email, please ignore it. This invitation is unique to you and should not be shared.
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Invitation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendRegistrationEmail,
  sendTemporaryCredentialsEmail,
  sendEmailVerification,
  sendInvitationEmail
};
