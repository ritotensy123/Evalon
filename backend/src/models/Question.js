const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Basic question information
  title: {
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
  
  // Question Bank reference
  questionBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
    required: true
  },
  
  // Subject and category
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  
  // Question type and configuration
  questionType: {
    type: String,
    enum: ['multiple_choice', 'essay', 'numeric', 'true_false', 'fill_blank', 'matching'],
    required: true
  },
  
  // Question content
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  
  // Options for multiple choice questions
  options: [{
    text: {
      type: String,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: {
      type: String,
      trim: true
    }
  }],
  
  // Correct answer (for non-multiple choice questions)
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed // Can be string, number, or object
  },
  
  // Answer explanation
  explanation: {
    type: String,
    trim: true
  },
  
  // Question settings
  marks: {
    type: Number,
    required: true,
    min: 0.5,
    max: 100
  },
  timeLimit: {
    type: Number, // in seconds
    default: 60,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // Question metadata
  tags: [{
    type: String,
    trim: true
  }],
  keywords: [{
    type: String,
    trim: true
  }],
  
  // Creator information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Question status
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'review'],
    default: 'draft'
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0
  },
  averageTimeSpent: {
    type: Number,
    default: 0, // in seconds
    min: 0
  },
  
  // Question validation
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  
  // Question versioning
  version: {
    type: Number,
    default: 1
  },
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document']
    },
    url: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    mimeType: {
      type: String,
      trim: true
    }
  }],
  
  // Question settings
  allowPartialCredit: {
    type: Boolean,
    default: false
  },
  showHint: {
    type: Boolean,
    default: false
  },
  hint: {
    type: String,
    trim: true
  },
  
  // Question analytics
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    correctAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
questionSchema.index({ organizationId: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ subjectId: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ organizationId: 1, status: 1 }); // Composite for filtering by org and status
questionSchema.index({ organizationId: 1, subjectId: 1 }); // Composite for org + subject queries
questionSchema.index({ createdAt: -1 }); // For sorting by newest
questionSchema.index({ usageCount: -1 }); // For popular questions
questionSchema.index({ subject: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'analytics.totalAttempts': -1 });
questionSchema.index({ 'analytics.averageScore': -1 });

// Text search index
questionSchema.index({
  title: 'text',
  questionText: 'text',
  tags: 'text',
  keywords: 'text'
});

// Virtual for success rate percentage
questionSchema.virtual('successRatePercentage').get(function() {
  if (this.analytics.totalAttempts === 0) return 0;
  return (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100;
});

// Virtual for question complexity score
questionSchema.virtual('complexityScore').get(function() {
  let score = 0;
  
  // Base score from difficulty
  const difficultyScores = { easy: 1, medium: 2, hard: 3 };
  score += difficultyScores[this.difficulty] || 2;
  
  // Add score based on question type complexity
  const typeScores = {
    multiple_choice: 1,
    true_false: 1,
    numeric: 2,
    fill_blank: 2,
    essay: 3,
    matching: 2
  };
  score += typeScores[this.questionType] || 1;
  
  // Add score based on time limit
  if (this.timeLimit > 300) score += 1; // More than 5 minutes
  if (this.timeLimit > 600) score += 1; // More than 10 minutes
  
  return Math.min(score, 5); // Cap at 5
});

// Pre-save middleware to update analytics
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update success rate
  if (this.analytics.totalAttempts > 0) {
    this.successRate = (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100;
  }
  
  next();
});

// Method to record question attempt
questionSchema.methods.recordAttempt = function(isCorrect, timeSpent) {
  this.analytics.totalAttempts += 1;
  if (isCorrect) {
    this.analytics.correctAttempts += 1;
  }
  
  // Update average time spent
  const totalTime = this.analytics.averageTimeSpent * (this.analytics.totalAttempts - 1) + timeSpent;
  this.analytics.averageTimeSpent = totalTime / this.analytics.totalAttempts;
  
  // Update average score
  const currentScore = this.analytics.averageScore * (this.analytics.totalAttempts - 1);
  const newScore = isCorrect ? 100 : 0;
  this.analytics.averageScore = (currentScore + newScore) / this.analytics.totalAttempts;
  
  return this.save();
};

// Method to validate question
questionSchema.methods.validateQuestion = function(validatorId) {
  this.isValidated = true;
  this.validatedBy = validatorId;
  this.validatedAt = new Date();
  this.status = 'active';
  
  return this.save();
};

// Method to create question version
questionSchema.methods.createVersion = function(updatedData) {
  const newQuestion = this.toObject();
  delete newQuestion._id;
  delete newQuestion.createdAt;
  delete newQuestion.updatedAt;
  
  // Update with new data
  Object.assign(newQuestion, updatedData);
  newQuestion.version = this.version + 1;
  newQuestion.parentQuestion = this._id;
  newQuestion.status = 'draft';
  
  return new Question(newQuestion).save();
};

// Static method to search questions
questionSchema.statics.searchQuestions = function(organizationId, searchParams) {
  const query = { organizationId };
  
  if (searchParams.subject) query.subject = searchParams.subject;
  if (searchParams.category) query.category = searchParams.category;
  if (searchParams.questionType) query.questionType = searchParams.questionType;
  if (searchParams.difficulty) query.difficulty = searchParams.difficulty;
  if (searchParams.status) query.status = searchParams.status;
  if (searchParams.tags && searchParams.tags.length > 0) {
    query.tags = { $in: searchParams.tags };
  }
  
  // Text search
  if (searchParams.searchText) {
    query.$text = { $search: searchParams.searchText };
  }
  
  return this.find(query)
    .populate('createdBy', 'profile firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get question statistics
questionSchema.statics.getQuestionStatistics = function(organizationId) {
  return this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        activeQuestions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        draftQuestions: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        averageDifficulty: { $avg: '$analytics.difficultyRating' },
        totalUsage: { $sum: '$usageCount' },
        averageSuccessRate: { $avg: '$successRate' }
      }
    }
  ]);
};

// Static method to get questions by subject
questionSchema.statics.getQuestionsBySubject = function(organizationId, subject) {
  return this.find({ organizationId, subject, status: 'active' })
    .populate('createdBy', 'profile firstName lastName')
    .sort({ 'analytics.averageScore': -1 });
};

// Static method to get popular questions
questionSchema.statics.getPopularQuestions = function(organizationId, limit = 10) {
  return this.find({ organizationId, status: 'active' })
    .sort({ 'analytics.totalAttempts': -1, 'analytics.averageScore': -1 })
    .limit(limit)
    .populate('createdBy', 'profile firstName lastName');
};

module.exports = mongoose.model('Question', questionSchema);
