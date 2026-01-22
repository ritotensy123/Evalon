const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Organization reference
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  
  // Subject and class information
  subject: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  
  // Teacher who created the question bank
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Questions in this bank
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  
  // Question bank statistics
  totalQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  questionsByType: {
    multiple_choice: { type: Number, default: 0, min: 0 },
    subjective: { type: Number, default: 0, min: 0 },
    true_false: { type: Number, default: 0, min: 0 },
    numeric: { type: Number, default: 0, min: 0 }
  },
  questionsByDifficulty: {
    easy: { type: Number, default: 0, min: 0 },
    medium: { type: Number, default: 0, min: 0 },
    hard: { type: Number, default: 0, min: 0 }
  },
  totalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
questionBankSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
questionBankSchema.index({ organizationId: 1, subject: 1 });
questionBankSchema.index({ organizationId: 1, createdBy: 1 });
questionBankSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);

