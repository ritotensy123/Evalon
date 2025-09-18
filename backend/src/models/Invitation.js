const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student', 'sub_admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  token: {
    type: String,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    firstName: String,
    lastName: String,
    department: String,
    phone: String,
    customMessage: String
  }
}, {
  timestamps: true
});

// Indexes
invitationSchema.index({ email: 1, organizationId: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ status: 1 });

// Static methods
invitationSchema.statics.findByToken = function(token) {
  return this.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } });
};

invitationSchema.statics.findPendingByEmail = function(email, organizationId) {
  return this.findOne({ 
    email, 
    organizationId, 
    status: 'pending', 
    expiresAt: { $gt: new Date() } 
  });
};

invitationSchema.statics.findByOrganization = function(organizationId, status = null) {
  const query = { organizationId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('invitedBy', 'email profile').sort({ createdAt: -1 });
};

// Instance methods
invitationSchema.methods.accept = function(userId) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

invitationSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

invitationSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Pre-save middleware to generate token
invitationSchema.pre('save', function(next) {
  if (this.isNew && !this.token) {
    const crypto = require('crypto');
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Invitation', invitationSchema);
