const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Exam = require('./models/Exam');
const ExamSession = require('./models/ExamSession');
const questionBankService = require('./services/questionBankService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Performance optimizations
  transports: ['websocket'], // Force WebSocket for better performance
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 10000, // 10 seconds
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true,
  // Connection pooling
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

const PORT = process.env.REALTIME_PORT || 5004;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json());

// Real-time temporary storage
class RealtimeDataStore {
  constructor() {
    this.examSessions = new Map(); // examId -> Map of sessionId -> sessionData
    this.monitoringRooms = new Map(); // examId -> Set of socketIds
    this.activeConnections = new Map(); // socketId -> connectionInfo
    this.heartbeats = new Map(); // socketId -> lastHeartbeat
  }

  // Session Management
  addSession(examId, sessionId, sessionData) {
    if (!this.examSessions.has(examId)) {
      this.examSessions.set(examId, new Map());
    }
    this.examSessions.get(examId).set(sessionId, {
      ...sessionData,
      lastUpdate: new Date(),
      isActive: true
    });
    console.log(`📊 Added session ${sessionId} to exam ${examId}`);
  }

  updateSession(examId, sessionId, updates) {
    if (this.examSessions.has(examId) && this.examSessions.get(examId).has(sessionId)) {
      const session = this.examSessions.get(examId).get(sessionId);
      Object.assign(session, updates, { lastUpdate: new Date() });
      console.log(`📊 Updated session ${sessionId} in exam ${examId}`);
    }
  }

  removeSession(examId, sessionId) {
    if (this.examSessions.has(examId)) {
      this.examSessions.get(examId).delete(sessionId);
      console.log(`📊 Removed session ${sessionId} from exam ${examId}`);
    }
  }

  getSessionsForExam(examId) {
    if (!this.examSessions.has(examId)) {
      return [];
    }
    
    // Only return sessions that are actually active and connected
    const sessions = Array.from(this.examSessions.get(examId).values());
    return sessions.filter(session => 
      session.isActive && 
      session.isConnected !== false && 
      session.status === 'active'
    );
  }

  // Monitoring Room Management
  addToMonitoringRoom(examId, socketId) {
    if (!this.monitoringRooms.has(examId)) {
      this.monitoringRooms.set(examId, new Set());
    }
    this.monitoringRooms.get(examId).add(socketId);
    console.log(`👁️ Added socket ${socketId} to monitoring room for exam ${examId}`);
  }

  removeFromMonitoringRoom(examId, socketId) {
    if (this.monitoringRooms.has(examId)) {
      this.monitoringRooms.get(examId).delete(socketId);
      if (this.monitoringRooms.get(examId).size === 0) {
        this.monitoringRooms.delete(examId);
      }
      console.log(`👁️ Removed socket ${socketId} from monitoring room for exam ${examId}`);
    }
  }

  getMonitoringSockets(examId) {
    return this.monitoringRooms.has(examId) ? 
      Array.from(this.monitoringRooms.get(examId)) : [];
  }

  // Connection Management
  addConnection(socketId, connectionInfo) {
    this.activeConnections.set(socketId, {
      ...connectionInfo,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
  }

  updateConnection(socketId, updates) {
    if (this.activeConnections.has(socketId)) {
      const connection = this.activeConnections.get(socketId);
      Object.assign(connection, updates, { lastActivity: new Date() });
    }
  }

  removeConnection(socketId) {
    this.activeConnections.delete(socketId);
    this.heartbeats.delete(socketId);
  }

  // Heartbeat Management
  updateHeartbeat(socketId) {
    this.heartbeats.set(socketId, new Date());
    if (this.activeConnections.has(socketId)) {
      this.activeConnections.get(socketId).lastActivity = new Date();
    }
  }

  // Optimized cleanup for inactive sessions
  cleanupInactiveSessions() {
    const now = new Date();
    const inactiveThreshold = 15000; // Reduced to 15 seconds for faster cleanup

    for (const [examId, sessions] of this.examSessions) {
      const sessionsToRemove = [];
      
      for (const [sessionId, session] of sessions) {
        if (now - session.lastUpdate > inactiveThreshold || 
            !session.isActive || 
            session.isConnected === false ||
            session.status !== 'active') {
          sessionsToRemove.push(sessionId);
        }
      }
      
      // Batch remove inactive sessions
      if (sessionsToRemove.length > 0) {
        sessionsToRemove.forEach(sessionId => {
          sessions.delete(sessionId);
        });
        console.log(`🧹 Removed ${sessionsToRemove.length} inactive sessions from exam ${examId}`);
      }
    }
  }

  // Get real-time stats
  getStats() {
    return {
      totalSessions: Array.from(this.examSessions.values())
        .reduce((total, sessions) => total + sessions.size, 0),
      activeSessions: Array.from(this.examSessions.values())
        .reduce((total, sessions) => total + Array.from(sessions.values())
          .filter(s => s.isActive).length, 0),
      monitoringRooms: this.monitoringRooms.size,
      activeConnections: this.activeConnections.size
    };
  }
}

// Create global data store instance
const dataStore = new RealtimeDataStore();

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/evalon?retryWrites=true&w=majority&appName=Evalon';
    await mongoose.connect(mongoURI);
    console.log('⚡ Real-time Server - MongoDB Connected');
    console.log('⚡ Database name:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ Real-time Server - MongoDB connection error:', error);
    process.exit(1);
  }
};

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('⚠️ No token provided in socket handshake');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    console.log('🔍 Token decoded, looking for user:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    console.log('🔍 User lookup result:', user ? `Found: ${user.email}` : 'Not found');
    
    if (!user) {
      console.error('❌ User not found in database:', decoded.userId);
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userType = user.userType;
    socket.organizationId = user.organizationId;
    socket.userInfo = {
      name: user.profile?.name || user.email,
      email: user.email
    };

    console.log('✅ Socket authenticated for user:', user.email);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      next(new Error('Authentication error: Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new Error('Authentication error: Token expired'));
    } else {
      next(new Error('Authentication error: ' + error.message));
    }
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.userInfo.name} (${socket.userType})`);

  // Add connection to data store
  dataStore.addConnection(socket.id, {
    userId: socket.userId,
    userType: socket.userType,
    organizationId: socket.organizationId,
    userInfo: socket.userInfo
  });

  // Student joins exam session
  socket.on('join_exam_session', async (data) => {
    try {
      const { examId, sessionId, deviceInfo, networkInfo } = data;
      
      if (socket.userType !== 'student') {
        socket.emit('exam_error', { message: 'Only students can join exam sessions' });
        return;
      }

      console.log(`🎓 Student ${socket.userInfo.name} joining exam: ${examId}`);

      // Verify exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        socket.emit('exam_error', { message: 'Exam not found' });
        return;
      }

      // Check if exam is scheduled and active
      const now = new Date();
      const examStartTime = new Date(exam.scheduledDate);
      const [hours, minutes] = exam.startTime.split(':');
      examStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);

      if (now < examStartTime) {
        socket.emit('exam_error', { message: 'Exam has not started yet' });
        return;
      }

      if (now > examEndTime) {
        socket.emit('exam_error', { message: 'Exam has already ended' });
        return;
      }

      // Create or update exam session in database
      let session = await ExamSession.findOne({
        examId: examId,
        studentId: socket.userId,
        status: { $in: ['active', 'disconnected', 'waiting'] }
      }).sort({ startTime: -1 });

      if (!session) {
        const startTime = new Date();
        const endTime = new Date(examStartTime.getTime() + exam.duration * 60000);
        
        session = new ExamSession({
          examId: examId,
          studentId: socket.userId,
          organizationId: exam.organizationId || socket.organizationId,
          duration: exam.duration,
          status: 'active',
          startTime: startTime,
          endTime: endTime,
          deviceInfo: deviceInfo || {},
          networkInfo: networkInfo || {},
          progress: {
            currentQuestion: 0,
            totalQuestions: exam.questions.length,
            answeredQuestions: 0
          },
          isConnected: true,
          isMonitoringActive: true
        });
        await session.save();
        console.log(`🎓 Created new exam session for student ${socket.userInfo.name}`);
      } else {
        session.status = 'active';
        session.isConnected = true;
        session.isMonitoringActive = true;
        session.lastActivity = new Date();
        session.socketId = socket.id;
        await session.save();
        console.log(`🎓 Updated existing exam session for student ${socket.userInfo.name}`);
      }

      // Add session to real-time data store
      dataStore.addSession(examId, session._id.toString(), {
        sessionId: session._id,
        student: socket.userInfo,
        examId: examId,
        status: 'active',
        isConnected: true,
        timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / 1000)),
        progress: session.progress,
        securityFlags: [],
        timestamp: new Date(),
        lastActivity: new Date()
      });

      // Join exam room
      socket.join(`exam_${examId}`);
      socket.examId = examId;
      socket.sessionId = session._id;

      // INSTANT broadcast to all monitoring teachers - no delays
      const monitoringSockets = dataStore.getMonitoringSockets(examId);
      if (monitoringSockets.length > 0) {
        const sessionData = dataStore.examSessions.get(examId)?.get(session._id.toString());
        if (sessionData) {
          // Immediate broadcast with high priority
          io.to(monitoringSockets).emit('student_joined', sessionData);
          console.log(`⚡ INSTANT: Broadcasted student_joined to ${monitoringSockets.length} monitoring teachers`);
        }
      }

      socket.emit('exam_session_joined', {
        sessionId: session._id,
        exam: {
          id: exam._id,
          title: exam.title,
          duration: exam.duration,
          questions: exam.questions
        },
        timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / 1000))
      });

      console.log(`🎓 Student ${socket.userInfo.name} successfully joined exam session`);

    } catch (error) {
      console.error('Error in join_exam_session:', error);
      socket.emit('exam_error', { message: 'Failed to join exam session' });
    }
  });

  // Student submits answer
  socket.on('submit_answer', async (data) => {
    try {
      const { questionId, answer, timeSpent } = data;
      
      if (!socket.sessionId) {
        socket.emit('exam_error', { message: 'No active exam session' });
        return;
      }

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) {
        socket.emit('exam_error', { message: 'Exam session not found' });
        return;
      }

      // Update session with answer
      if (!session.answers) {
        session.answers = [];
      }

      const existingAnswerIndex = session.answers.findIndex(a => a.questionId.toString() === questionId);
      if (existingAnswerIndex >= 0) {
        session.answers[existingAnswerIndex] = {
          questionId,
          answer,
          timeSpent: timeSpent || 0,
          submittedAt: new Date()
        };
      } else {
        session.answers.push({
          questionId,
          answer,
          timeSpent: timeSpent || 0,
          submittedAt: new Date()
        });
      }

      // Update progress
      session.progress.answeredQuestions = session.answers.length;
      session.lastActivity = new Date();
      await session.save();

      // Update real-time data store
      dataStore.updateSession(socket.examId, socket.sessionId.toString(), {
        progress: session.progress,
        lastActivity: new Date()
      });

      // INSTANT progress update broadcast - no delays
      const monitoringSockets = dataStore.getMonitoringSockets(socket.examId);
      if (monitoringSockets.length > 0) {
        io.to(monitoringSockets).emit('progress_update', {
          sessionId: socket.sessionId,
          examId: socket.examId,
          progress: session.progress,
          timestamp: new Date()
        });
        console.log(`⚡ INSTANT: Broadcasted progress_update to ${monitoringSockets.length} monitoring teachers`);
      }

      console.log(`🎓 Student ${socket.userInfo.name} submitted answer for question ${questionId}`);

      socket.emit('answer_submitted', {
        questionId,
        progress: session.progress
      });

    } catch (error) {
      console.error('Error in submit_answer:', error);
      socket.emit('exam_error', { message: 'Failed to submit answer' });
    }
  });

  // Auto-save answers
  socket.on('auto_save_answers', async (data) => {
    try {
      const { examId, answers, timeRemaining } = data;
      
      if (!socket.sessionId) {
        return;
      }

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) {
        return;
      }

      // Store auto-save data
      session.autoSave = {
        answers,
        timeRemaining,
        timestamp: new Date()
      };
      session.lastActivity = new Date();
      await session.save();

      console.log(`💾 Auto-saved answers for student ${socket.userInfo.name}`);

      // Broadcast to monitoring teachers
      const monitoringSockets = dataStore.getMonitoringSockets(examId);
      if (monitoringSockets.length > 0) {
        io.to(monitoringSockets).emit('auto_save_update', {
          sessionId: socket.sessionId,
          examId: examId,
          studentId: socket.userId,
          studentName: socket.userInfo.name,
          timeRemaining,
          answeredCount: Object.keys(answers).length,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error in auto_save_answers:', error);
    }
  });

  // Update progress
  socket.on('update_progress', async (data) => {
    try {
      const { currentQuestion, totalQuestions, answeredCount } = data;
      
      if (!socket.sessionId) {
        return;
      }

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) {
        return;
      }

      // Update progress
      session.progress = {
        currentQuestion,
        totalQuestions,
        answeredQuestions: answeredCount,
        lastUpdated: new Date()
      };
      session.lastActivity = new Date();
      await session.save();

      console.log(`📊 Progress update for student ${socket.userInfo.name}: ${currentQuestion}/${totalQuestions} (${answeredCount} answered)`);

      // Broadcast to monitoring teachers
      const monitoringSockets = dataStore.getMonitoringSockets(socket.examId);
      if (monitoringSockets.length > 0) {
        io.to(monitoringSockets).emit('progress_update', {
          sessionId: socket.sessionId,
          examId: socket.examId,
          progress: session.progress,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error in update_progress:', error);
    }
  });

  // Student ends exam
  socket.on('end_exam', async (data) => {
    try {
      const { submissionType = 'normal', finalScore = null, examStats = null } = data;
      
      if (!socket.sessionId) {
        socket.emit('exam_error', { message: 'No active exam session' });
        return;
      }

      const session = await ExamSession.findById(socket.sessionId);
      if (!session) {
        socket.emit('exam_error', { message: 'Exam session not found' });
        return;
      }

      // Update session status
      session.status = 'completed';
      session.endTime = new Date();
      session.isConnected = false;
      session.isMonitoringActive = false;
      session.submissionType = submissionType;
      if (finalScore !== null) {
        session.finalScore = finalScore;
      }
      
      // Store exam statistics if provided
      if (examStats) {
        session.examStats = {
          ...examStats,
          submittedAt: new Date()
        };
        console.log(`📊 Stored exam statistics for student ${socket.userInfo.name}:`, {
          duration: examStats.duration,
          answeredQuestions: examStats.answeredQuestions,
          totalQuestions: examStats.totalQuestions,
          submissionMethod: examStats.submissionMethod
        });
      }
      
      await session.save();

      // Remove from real-time data store
      dataStore.removeSession(socket.examId, socket.sessionId.toString());

      // Broadcast to monitoring teachers
      const monitoringSockets = dataStore.getMonitoringSockets(socket.examId);
      if (monitoringSockets.length > 0) {
        io.to(monitoringSockets).emit('exam_ended', {
          sessionId: session._id,
          student: socket.userInfo,
          examId: socket.examId,
          reason: submissionType,
          timestamp: new Date(),
          finalScore: finalScore
        });
        console.log(`📡 Broadcasted exam_ended to ${monitoringSockets.length} monitoring teachers`);
      }

      console.log(`🎓 Student ${socket.userInfo.name} ended exam: ${submissionType}`);

      socket.emit('exam_ended', {
        sessionId: session._id,
        submissionType: submissionType,
        finalScore: finalScore,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error in end_exam:', error);
      socket.emit('exam_error', { message: 'Failed to end exam' });
    }
  });

  // Teacher joins monitoring
  socket.on('join_monitoring', async (data) => {
    try {
      const { examId } = data;
      
      if (!['teacher', 'admin', 'organization_admin'].includes(socket.userType)) {
        socket.emit('monitoring_error', { message: 'Only teachers and admins can monitor exams' });
        return;
      }

      console.log(`👁️ Teacher ${socket.userInfo.name} joining monitoring for exam: ${examId}`);

      // Verify exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        socket.emit('monitoring_error', { message: 'Exam not found' });
        return;
      }

      // Join monitoring room
      socket.join(`monitoring_${examId}`);
      socket.monitoringExamId = examId;
      dataStore.addToMonitoringRoom(examId, socket.id);

      // Clean up any stale sessions first
      dataStore.cleanupInactiveSessions();

      // Get current active sessions from real-time data store
      const activeSessions = dataStore.getSessionsForExam(examId);

      // Send current active sessions to teacher
      socket.emit('monitoring_joined', {
        examId: examId,
        activeSessions: activeSessions
      });

      console.log(`👁️ Teacher ${socket.userInfo.name} successfully joined monitoring for exam ${examId}`);

    } catch (error) {
      console.error('Error in join_monitoring:', error);
      socket.emit('monitoring_error', { message: 'Failed to join monitoring' });
    }
  });

  // Teacher leaves monitoring
  socket.on('leave_monitoring', (data) => {
    try {
      const { examId } = data;
      
      if (socket.monitoringExamId) {
        socket.leave(`monitoring_${socket.monitoringExamId}`);
        dataStore.removeFromMonitoringRoom(socket.monitoringExamId, socket.id);
        console.log(`👁️ Teacher ${socket.userInfo.name} left monitoring for exam ${socket.monitoringExamId}`);
        socket.monitoringExamId = null;
      }
    } catch (error) {
      console.error('Error in leave_monitoring:', error);
    }
  });

  // Question synchronization events
  socket.on('request_questions', async (data) => {
    try {
      console.log(`📚 REQUEST_QUESTIONS EVENT RECEIVED:`, data);
      console.log(`📚 Socket user type:`, socket.userType);
      console.log(`📚 Socket user info:`, socket.userInfo);
      
      const { examId } = data;
      
      if (socket.userType !== 'student') {
        console.log(`❌ Non-student trying to request questions:`, socket.userType);
        socket.emit('question_error', { message: 'Only students can request questions' });
        return;
      }

      console.log(`🎓 Student ${socket.userInfo.name} requesting questions for exam: ${examId}`);

      // First check if exam has questions
      const exam = await Exam.findById(examId).populate('questions').lean();
      console.log(`📚 Exam found:`, exam ? 'Yes' : 'No');
      console.log(`📚 Exam questions count:`, exam?.questions?.length || 0);
      console.log(`📚 Exam questionBankId:`, exam?.questionBankId);

      if (!exam) {
        throw new Error('Exam not found');
      }

      // If exam has no questions, try to find a question bank or create sample questions
      if (!exam.questions || exam.questions.length === 0) {
        console.log(`🔄 No questions in exam, looking for question bank...`);
        
        if (exam.questionBankId) {
          console.log(`🔄 Found question bank ID: ${exam.questionBankId}, syncing questions...`);
          try {
            await questionBankService.syncQuestionsFromBank(examId, exam.questionBankId, {
              totalQuestions: 10,
              questionTypes: ['multiple_choice', 'true_false', 'essay'],
              difficulties: ['easy', 'medium', 'hard'],
              shuffleQuestions: true,
              shuffleOptions: true
            });
            console.log(`✅ Questions synced from question bank`);
          } catch (syncError) {
            console.error('❌ Error syncing questions from bank:', syncError);
            // Continue with fallback questions
          }
        } else {
          console.log(`📚 No question bank ID found, using fallback questions`);
          // Create sample questions for this exam
          try {
            const sampleQuestions = [
              {
                _id: new mongoose.Types.ObjectId(),
                title: `Sample Question 1 - ${exam.subject || 'General'}`,
                questionType: 'multiple_choice',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                marks: 5,
                difficulty: 'easy',
                status: 'active'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                title: `Sample Question 2 - ${exam.subject || 'General'}`,
                questionType: 'essay',
                marks: 10,
                difficulty: 'medium',
                status: 'active'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                title: `Sample Question 3 - ${exam.subject || 'General'}`,
                questionType: 'multiple_choice',
                options: ['True', 'False'],
                correctAnswer: 0,
                marks: 3,
                difficulty: 'easy',
                status: 'active'
              }
            ];
            
            // Update exam with sample questions
            await Exam.findByIdAndUpdate(examId, {
              questions: sampleQuestions.map(q => q._id),
              totalQuestions: sampleQuestions.length,
              totalMarks: sampleQuestions.reduce((sum, q) => sum + q.marks, 0)
            });
            
            console.log(`✅ Created ${sampleQuestions.length} sample questions for exam`);
          } catch (sampleError) {
            console.error('❌ Error creating sample questions:', sampleError);
          }
        }
      }

      // Generate shuffled questions for this student
      try {
        const questions = await questionBankService.generateShuffledQuestionsForStudent(examId, socket.userId);

        // Apply exam marking scheme and normalize question structure
        let processedQuestions = questions;
        if (exam.totalMarks && exam.totalQuestions && questions.length > 0) {
          const marksPerQuestion = exam.totalMarks / exam.totalQuestions;
          processedQuestions = questions.map((question, index) => {
            const normalizedQuestion = {
              ...question,
              // Normalize question structure for frontend
              question: question.questionText || question.title || question.question,
              type: question.questionType === 'multiple_choice' ? 'mcq' : 
                    question.questionType === 'essay' ? 'essay' : 
                    question.questionType === 'true_false' ? 'mcq' : 'mcq',
              options: question.options ? question.options.map(opt => 
                typeof opt === 'string' ? opt : opt.text
              ) : [],
              // Apply exam marking scheme
              marks: marksPerQuestion,
              examQuestionNumber: index + 1,
              originalMarks: question.marks
            };
            
            console.log(`🔍 Server Question ${index + 1} normalization:`, {
              original: {
                questionText: question.questionText,
                title: question.title,
                question: question.question,
                questionType: question.questionType,
                options: question.options
              },
              normalized: {
                question: normalizedQuestion.question,
                type: normalizedQuestion.type,
                options: normalizedQuestion.options
              }
            });
            
            return normalizedQuestion;
          });
          console.log(`💰 Applied exam marking scheme: ${marksPerQuestion} marks per question`);
        }

        socket.emit('questions_received', {
          examId: examId,
          questions: processedQuestions,
          totalQuestions: processedQuestions.length,
          timestamp: new Date()
        });

        console.log(`✅ Sent ${processedQuestions.length} shuffled questions to student ${socket.userInfo.name}`);
      } catch (questionError) {
        console.error('❌ Error generating questions:', questionError);
        
        // Send fallback questions if generation fails
        const fallbackQuestions = [
          {
            _id: 'fallback_1',
            title: `Fallback Question 1 - ${exam.subject || 'General'}`,
            questionType: 'multiple_choice',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            marks: 5,
            difficulty: 'easy'
          },
          {
            _id: 'fallback_2',
            title: `Fallback Question 2 - ${exam.subject || 'General'}`,
            questionType: 'essay',
            marks: 10,
            difficulty: 'medium'
          }
        ];

        socket.emit('questions_received', {
          examId: examId,
          questions: fallbackQuestions,
          totalQuestions: fallbackQuestions.length,
          timestamp: new Date()
        });

        console.log(`✅ Sent ${fallbackQuestions.length} fallback questions to student ${socket.userInfo.name}`);
      }

    } catch (error) {
      console.error('Error handling request_questions:', error);
      socket.emit('question_error', { message: 'Failed to load questions' });
    }
  });

  // Question bank sync events
  socket.on('sync_questions', async (data) => {
    try {
      const { examId, questionBankId, options } = data;
      
      if (!['teacher', 'admin', 'organization_admin'].includes(socket.userType)) {
        socket.emit('sync_error', { message: 'Only teachers and admins can sync questions' });
        return;
      }

      console.log(`🔄 Teacher ${socket.userInfo.name} syncing questions for exam: ${examId}`);

      // Sync questions from question bank
      const result = await questionBankService.syncQuestionsFromBank(examId, questionBankId, options);

      // Broadcast to all monitoring teachers
      const monitoringSockets = dataStore.getMonitoringSockets(examId);
      if (monitoringSockets.length > 0) {
        io.to(monitoringSockets).emit('questions_synced', {
          examId: examId,
          questionBankId: questionBankId,
          totalQuestions: result.totalQuestions,
          totalMarks: result.totalMarks,
          timestamp: new Date()
        });
        console.log(`📡 Broadcasted questions_synced to ${monitoringSockets.length} monitoring teachers`);
      }

      socket.emit('sync_success', result);

    } catch (error) {
      console.error('Error handling sync_questions:', error);
      socket.emit('sync_error', { message: 'Failed to sync questions' });
    }
  });

  // Optimized heartbeat with immediate response
  socket.on('heartbeat', () => {
    dataStore.updateHeartbeat(socket.id);
    // Send immediate acknowledgment for faster response
    socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log(`⚡ User disconnected: ${socket.userInfo.name}`);
      
      // Remove from data store
      dataStore.removeConnection(socket.id);
      
      if (socket.monitoringExamId) {
        dataStore.removeFromMonitoringRoom(socket.monitoringExamId, socket.id);
      }

      if (socket.sessionId && socket.examId) {
        // Mark session as disconnected in database
        const session = await ExamSession.findById(socket.sessionId);
        if (session) {
          // Update session status to disconnected
          session.status = 'disconnected';
          session.isConnected = false;
          session.isMonitoringActive = false;
          session.lastActivity = new Date();
          
          try {
            await session.save();
            console.log(`📊 Updated session ${socket.sessionId} status to disconnected`);
          } catch (saveError) {
            console.error('❌ Error saving disconnected session:', saveError);
          }

          // Remove from real-time data store immediately
          dataStore.removeSession(socket.examId, socket.sessionId.toString());

          // Broadcast to monitoring teachers
          const monitoringSockets = dataStore.getMonitoringSockets(socket.examId);
          if (monitoringSockets.length > 0) {
            io.to(monitoringSockets).emit('student_disconnected', {
              sessionId: socket.sessionId,
              student: socket.userInfo,
              examId: socket.examId,
              timestamp: new Date()
            });
            console.log(`📡 Broadcasted student_disconnected to ${monitoringSockets.length} monitoring teachers`);
          }
        } else {
          console.log(`⚠️ Session ${socket.sessionId} not found in database`);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// High-performance real-time timer with optimized updates
let lastTimeUpdate = 0;
const TIME_UPDATE_INTERVAL = 500; // Update every 500ms for faster response

setInterval(() => {
  const now = new Date();
  const timeSinceLastUpdate = now - lastTimeUpdate;
  
  // Only update time every 500ms for better performance
  if (timeSinceLastUpdate >= TIME_UPDATE_INTERVAL) {
    lastTimeUpdate = now;
    
    // Batch process all sessions for better performance
    const timeUpdates = [];
    const examEnds = [];
    
    for (const [examId, sessions] of dataStore.examSessions) {
      const monitoringSockets = dataStore.getMonitoringSockets(examId);
      
      for (const [sessionId, session] of sessions) {
        if (session.isActive && session.timeRemaining > 0) {
          session.timeRemaining = Math.max(0, session.timeRemaining - 1);
          session.lastUpdate = now;

          // Batch time updates
          if (monitoringSockets.length > 0) {
            timeUpdates.push({
              sockets: monitoringSockets,
              data: {
                sessionId: sessionId,
                examId: examId,
                timeRemaining: session.timeRemaining,
                timestamp: now
              }
            });
          }

          // Check for timeout
          if (session.timeRemaining <= 0) {
            session.isActive = false;
            examEnds.push({
              sockets: monitoringSockets,
              data: {
                sessionId: sessionId,
                student: session.student,
                examId: examId,
                reason: 'timeout',
                timestamp: now
              }
            });
          }
        }
      }
    }

    // Batch emit all time updates
    timeUpdates.forEach(({ sockets, data }) => {
      io.to(sockets).emit('time_update', data);
    });

    // Batch emit all exam ends
    examEnds.forEach(({ sockets, data }) => {
      io.to(sockets).emit('exam_ended', data);
    });
  }

  // Cleanup inactive sessions less frequently
  if (Math.random() < 0.1) { // 10% chance each interval
    dataStore.cleanupInactiveSessions();
  }
}, 100); // Run every 100ms for maximum responsiveness

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = dataStore.getStats();
  res.json({ 
    status: 'healthy', 
    service: 'realtime-server',
    port: PORT,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = dataStore.getStats();
  res.json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`⚡ Real-time Server running on port ${PORT}`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
    console.log(`⚡ Stats: http://localhost:${PORT}/api/stats`);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down Real-time Server gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down Real-time Server gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

startServer().catch(console.error);

module.exports = { app, server, io, dataStore };
