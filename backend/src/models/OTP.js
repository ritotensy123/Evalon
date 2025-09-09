const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    default: '+91'
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password_reset', 'phone_verification'],
    default: 'registration'
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  }
}, {
  timestamps: true
});

// Index for better query performance
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ phone: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Static method to create email OTP
otpSchema.statics.createEmailOTP = async function(email, purpose = 'registration') {
  // Delete any existing OTPs for this email
  await this.deleteMany({ email, type: 'email' });
  
  const otp = this.generateOTP();
  return await this.create({
    email,
    otp,
    type: 'email',
    purpose
  });
};

// Static method to create phone OTP
otpSchema.statics.createPhoneOTP = async function(phone, countryCode = '+91', purpose = 'registration') {
  // Delete any existing OTPs for this phone
  await this.deleteMany({ phone, type: 'phone' });
  
  const otp = this.generateOTP();
  return await this.create({
    phone,
    countryCode,
    otp,
    type: 'phone',
    purpose
  });
};

// Instance method to verify OTP
otpSchema.methods.verifyOTP = async function(inputOTP) {
  if (this.verified) {
    throw new Error('OTP already verified');
  }
  
  if (this.attempts >= 5) {
    throw new Error('Maximum verification attempts exceeded');
  }
  
  if (new Date() > this.expiresAt) {
    throw new Error('OTP has expired');
  }
  
  this.attempts += 1;
  
  if (this.otp !== inputOTP) {
    await this.save();
    throw new Error('Invalid OTP');
  }
  
  this.verified = true;
  await this.save();
  return true;
};

module.exports = mongoose.model('OTP', otpSchema);

