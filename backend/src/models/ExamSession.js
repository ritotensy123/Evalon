const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  // Exam and Student Information
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  // Session Status
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'terminated', 'disconnected'],
    default: 'waiting'
  },

  // Timing Information
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  timeRemaining: {
    type: Number, // in seconds
    default: null,
    min: 0
  },

  // Monitoring Information
  isMonitoringActive: {
    type: Boolean,
    default: false
  },
  monitoringStartedAt: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  activityCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Device and Browser Information
  deviceInfo: {
    userAgent: {
      type: String,
      trim: true
    },
    platform: {
      type: String,
      trim: true
    },
    browser: {
      type: String,
      trim: true
    },
    screenResolution: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    },
    language: {
      type: String,
      trim: true
    }
  },

  // Network Information
  networkInfo: {
    ipAddress: {
      type: String,
      trim: true
    },
    location: {
      country: {
        type: String,
        trim: true
      },
      region: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      }
    }
  },

  // Security and Monitoring
  securityFlags: [{
    type: {
      type: String,
      enum: ['tab_switch', 'window_focus', 'copy_paste', 'right_click', 'keyboard_shortcut', 'fullscreen_exit', 'suspicious_activity']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  }],

  // Progress Tracking
  progress: {
    currentQuestion: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    answeredQuestions: {
      type: Number,
      default: 0
    },
    lastAnswerTime: {
      type: Date,
      default: null
    }
  },

  // WebSocket Connection
  socketId: {
    type: String,
    default: null,
    trim: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  lastPing: {
    type: Date,
    default: Date.now
  },

  // Monitoring Teachers/Evaluators
  monitoringTeachers: [{
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Session Metadata
  sessionData: {
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number, // in seconds
        min: 0
      }
    }],
    autoSaveEnabled: {
      type: Boolean,
      default: true
    },
    lastAutoSave: {
      type: Date,
      default: Date.now
    }
  },

  // Completion Information
  completionInfo: {
    submittedAt: {
      type: Date,
      default: null
    },
    submissionType: {
      type: String,
      enum: ['normal', 'auto', 'forced', 'timeout'],
      default: null
    },
    finalScore: {
      type: Number,
      default: null
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: null,
      min: 0
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
  timestamps: true
});

// Indexes for better performance
examSessionSchema.index({ examId: 1, studentId: 1 });
examSessionSchema.index({ organizationId: 1, status: 1 });
examSessionSchema.index({ socketId: 1 });
examSessionSchema.index({ createdAt: -1 });
examSessionSchema.index({ lastActivity: -1 });

// Pre-save middleware to update timestamps
examSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
examSessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.activityCount += 1;
  return this.save();
};

examSessionSchema.methods.addSecurityFlag = function(type, details, severity = 'low') {
  this.securityFlags.push({
    type,
    details,
    severity,
    timestamp: new Date()
  });
  return this.save();
};

examSessionSchema.methods.updateProgress = function(questionIndex, totalQuestions, answeredCount) {
  this.progress.currentQuestion = questionIndex;
  this.progress.totalQuestions = totalQuestions;
  this.progress.answeredQuestions = answeredCount;
  this.progress.lastAnswerTime = new Date();
  return this.save();
};

examSessionSchema.methods.startMonitoring = function() {
  this.isMonitoringActive = true;
  this.monitoringStartedAt = new Date();
  this.status = 'active';
  return this.save();
};

examSessionSchema.methods.endSession = function(submissionType = 'normal', finalScore = null) {
  this.status = 'completed';
  this.endTime = new Date();
  this.completionInfo.submittedAt = new Date();
  this.completionInfo.submissionType = submissionType;
  this.completionInfo.finalScore = finalScore;
  
  if (this.startTime) {
    this.completionInfo.totalTimeSpent = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  return this.save();
};

// Static methods
examSessionSchema.statics.findActiveSessions = function(organizationId) {
  return this.find({
    organizationId,
    status: { $in: ['waiting', 'active', 'paused'] }
  }).populate('examId', 'title subject class duration')
    .populate('studentId', 'profile.firstName profile.lastName email');
};

examSessionSchema.statics.findSessionBySocketId = function(socketId) {
  return this.findOne({ socketId });
};

examSessionSchema.statics.cleanupInactiveSessions = function() {
  const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  return this.updateMany(
    {
      status: { $in: ['waiting', 'active', 'paused'] },
      lastActivity: { $lt: cutoffTime }
    },
    {
      $set: {
        status: 'terminated',
        endTime: new Date(),
        'completionInfo.submissionType': 'timeout'
      }
    }
  );
};

module.exports = mongoose.model('ExamSession', examSessionSchema);
