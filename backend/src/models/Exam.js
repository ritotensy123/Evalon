const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  // Basic exam information
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
  department: {
    type: String,
    required: false,
    trim: true
  },
  
  // Teacher who created the exam
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Assigned teachers (can be multiple)
  assignedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Question Bank reference
  questionBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
    required: false
  },
  
  // Exam scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: false
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  
  // Exam configuration
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Exam type and difficulty
  examType: {
    type: String,
    enum: ['mcq', 'subjective', 'mixed', 'quiz', 'test', 'midterm', 'final', 'assignment'],
    default: 'mcq'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // Exam status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired'],
    default: 'draft'
  },
  
  // Instructions and settings
  instructions: {
    type: String,
    trim: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 0 // percentage penalty
  },
  
  // Question selection
  questionSelection: {
    type: String,
    enum: ['manual', 'random', 'weighted'],
    default: 'manual'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  
  // Student enrollment
  enrolledStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Exam results and analytics
  results: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String
    },
    submittedAt: {
      type: Date
    },
    timeSpent: {
      type: Number // in minutes
    },
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      selectedAnswer: String,
      isCorrect: Boolean,
      marksObtained: Number
    }]
  }],
  
  // Analytics
  averageScore: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  lowestScore: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  
  // Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: true
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
examSchema.index({ organizationId: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ subject: 1 });
examSchema.index({ class: 1 });
examSchema.index({ scheduledDate: 1 });
examSchema.index({ status: 1 });
examSchema.index({ examType: 1 });

// Virtual for total enrolled students
examSchema.virtual('totalEnrolledStudents').get(function() {
  return this.enrolledStudents.length;
});

// Virtual for total completed students
examSchema.virtual('totalCompletedStudents').get(function() {
  return this.results.length;
});

// Virtual for exam duration in hours
examSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Pre-save middleware to update analytics
examSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate analytics if results exist
  if (this.results && this.results.length > 0) {
    const scores = this.results.map(result => result.percentage);
    this.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    this.highestScore = Math.max(...scores);
    this.lowestScore = Math.min(...scores);
    this.completionRate = (this.results.length / this.enrolledStudents.length) * 100;
  }
  
  next();
});

// Method to enroll student
examSchema.methods.enrollStudent = function(studentId) {
  const isAlreadyEnrolled = this.enrolledStudents.some(
    student => student.studentId.toString() === studentId.toString()
  );
  
  if (!isAlreadyEnrolled) {
    this.enrolledStudents.push({
      studentId,
      enrolledAt: new Date()
    });
  }
  
  return this.save();
};

// Method to submit exam result
examSchema.methods.submitResult = function(studentId, answers, timeSpent) {
  const result = {
    studentId,
    answers,
    timeSpent,
    submittedAt: new Date()
  };
  
  // Calculate score
  let totalMarks = 0;
  let obtainedMarks = 0;
  
  answers.forEach(answer => {
    if (answer.isCorrect) {
      obtainedMarks += answer.marksObtained || 1;
    }
    totalMarks += 1; // Assuming each question is worth 1 mark by default
  });
  
  result.score = obtainedMarks;
  result.percentage = (obtainedMarks / totalMarks) * 100;
  
  // Determine grade based on percentage
  if (result.percentage >= 90) result.grade = 'A+';
  else if (result.percentage >= 80) result.grade = 'A';
  else if (result.percentage >= 70) result.grade = 'B+';
  else if (result.percentage >= 60) result.grade = 'B';
  else if (result.percentage >= 50) result.grade = 'C';
  else result.grade = 'F';
  
  this.results.push(result);
  return this.save();
};

// Static method to get exams by organization
examSchema.statics.getExamsByOrganization = function(organizationId, filters = {}) {
  const query = { organizationId };
  
  if (filters.status) query.status = filters.status;
  if (filters.subject) query.subject = filters.subject;
  if (filters.class) query.class = filters.class;
  if (filters.examType) query.examType = filters.examType;
  if (filters.createdBy) query.createdBy = filters.createdBy;
  
  return this.find(query)
    .populate('createdBy', 'profile firstName lastName')
    .populate('questions')
    .sort({ scheduledDate: -1 });
};

// Static method to get exam statistics
examSchema.statics.getExamStatistics = function(organizationId) {
  return this.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        scheduledExams: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        completedExams: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        draftExams: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        averageScore: { $avg: '$averageScore' },
        totalStudents: { $sum: { $size: '$enrolledStudents' } }
      }
    }
  ]);
};

module.exports = mongoose.model('Exam', examSchema);
