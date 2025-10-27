import { io } from 'socket.io-client';

class RealtimeSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.authErrorOccurred = false;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      console.log('⚡ Real-time socket already connected, reusing existing connection');
      return this.socket;
    }

    // Don't attempt to connect if we're already trying to connect
    if (this.socket && this.socket.connecting) {
      console.log('⚡ Real-time socket connection in progress, waiting...');
      return this.socket;
    }

    // Don't attempt to connect if we've had an auth error
    if (this.authErrorOccurred) {
      console.warn('🔐 Authentication error previously occurred - not attempting to connect');
      return null;
    }

    const serverUrl = import.meta.env.VITE_REALTIME_URL || 'http://localhost:5004';
    
    console.log(`⚡ Connecting to real-time server: ${serverUrl}`);
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket'], // Force WebSocket for maximum performance
      timeout: 10000, // Reduced timeout for faster connection
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5, // More attempts for reliability
      reconnectionDelay: 1000, // Faster reconnection
      reconnectionDelayMax: 5000, // Max 5 seconds
      maxReconnectionAttempts: 5,
      // Performance optimizations
      upgrade: true,
      rememberUpgrade: true,
      // Connection pooling
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
      }
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Real-time Socket.IO server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.authErrorOccurred = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚡ Disconnected from Real-time Socket.IO server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚡ Real-time Socket.IO connection error:', error);
      this.isConnected = false;
      
      // Handle authentication errors
      if (error.message?.includes('Authentication error')) {
        console.warn('⚡ Authentication error - stopping reconnection attempts');
        this.authErrorOccurred = true;
        this.reconnectAttempts = this.maxReconnectAttempts;
        
        // Clear auth data and redirect to login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('dashboardData');
          localStorage.removeItem('organizationData');
          window.location.href = '/login';
        }
      } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.error('⚡ Max reconnection attempts reached');
        if (typeof window !== 'undefined') {
          console.warn('🔄 Connection failed - please refresh the page');
        }
      }
    });

    this.socket.on('error', (error) => {
      console.error('⚡ Real-time Socket.IO error:', error);
    });

    // Heartbeat handling
    this.socket.on('heartbeat_ack', () => {
      // Heartbeat acknowledged
    });
  }

  // Student Methods
  joinExamSession(examId, sessionId, deviceInfo, networkInfo, onJoined) {
    if (!this.socket) {
      console.error('❌ Real-time socket not connected - cannot join exam session');
      throw new Error('Real-time socket not connected');
    }

    if (!this.socket.connected) {
      console.warn('⚠️ Real-time socket exists but not connected yet - waiting...');
      this.socket.once('connect', () => {
        console.log('✅ Real-time socket connected, now joining exam session');
        this.socket.emit('join_exam_session', {
          examId,
          sessionId,
          deviceInfo,
          networkInfo
        });
        
        // Set up exam session joined listener
        this.socket.once('exam_session_joined', (data) => {
          console.log('📝 Exam session joined:', data);
          if (onJoined) onJoined(data);
        });
      });
    } else {
      console.log('⚡ Joining exam session:', examId);
      this.socket.emit('join_exam_session', {
        examId,
        sessionId,
        deviceInfo,
        networkInfo
      });
      
      // Set up exam session joined listener
      this.socket.once('exam_session_joined', (data) => {
        console.log('📝 Exam session joined:', data);
        if (onJoined) onJoined(data);
      });
    }
  }

  submitAnswer(questionId, answer, timeSpent) {
    if (!this.socket) {
      throw new Error('Real-time socket not connected');
    }

    this.socket.emit('submit_answer', {
      questionId,
      answer,
      timeSpent
    });
  }

  // Auto-save answers
  autoSaveAnswers(examId, answers, timeRemaining) {
    if (!this.socket) {
      console.warn('Real-time socket not connected, cannot auto-save');
      return;
    }

    this.socket.emit('auto_save_answers', {
      examId,
      answers,
      timeRemaining,
      timestamp: new Date().toISOString()
    });
  }

  // Update progress
  updateProgress(currentQuestion, totalQuestions, answeredCount) {
    if (!this.socket) {
      console.warn('Real-time socket not connected, cannot update progress');
      return;
    }

    this.socket.emit('update_progress', {
      currentQuestion,
      totalQuestions,
      answeredCount,
      timestamp: new Date().toISOString()
    });
  }

  startExam(examId, sessionId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot start exam');
      return;
    }

    this.socket.emit('start_exam', {
      examId,
      sessionId
    });
  }

  pauseExam(examId, sessionId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot pause exam');
      return;
    }

    this.socket.emit('pause_exam', {
      examId,
      sessionId
    });
  }

  resumeExam(examId, sessionId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot resume exam');
      return;
    }

    this.socket.emit('resume_exam', {
      examId,
      sessionId
    });
  }

  updateProgress(examId, sessionId, progress) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot update progress');
      return;
    }

    this.socket.emit('update_progress', {
      examId,
      sessionId,
      progress
    });
  }

  endExam(examId, sessionId, submissionType, finalScore) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot end exam');
      return;
    }

    this.socket.emit('end_exam', {
      examId,
      sessionId,
      submissionType,
      finalScore
    });
  }

  reportSecurityFlag(examId, sessionId, flagType, details) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot report security flag');
      return;
    }

    this.socket.emit('report_security_flag', {
      examId,
      sessionId,
      flagType,
      details
    });
  }


  // Teacher Methods
  joinMonitoring(examId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot join monitoring');
      return;
    }

    this.socket.emit('join_monitoring', {
      examId
    });
  }

  leaveMonitoring(examId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot leave monitoring');
      return;
    }

    this.socket.emit('leave_monitoring', {
      examId
    });
  }

  // Heartbeat
  sendHeartbeat() {
    if (!this.socket) {
      return;
    }

    this.socket.emit('heartbeat');
  }

  // Event Listeners
  onExamSessionJoined(callback) {
    if (!this.socket) return;
    this.socket.on('exam_session_joined', callback);
    this.addEventListener('exam_session_joined', callback);
  }

  onExamError(callback) {
    if (!this.socket) return;
    this.socket.on('exam_error', callback);
    this.addEventListener('exam_error', callback);
  }

  onExamStarted(callback) {
    if (!this.socket) return;
    this.socket.on('exam_started', callback);
    this.addEventListener('exam_started', callback);
  }

  onExamEnded(callback) {
    if (!this.socket) return;
    this.socket.on('exam_ended', callback);
    this.addEventListener('exam_ended', callback);
  }

  onExamPaused(callback) {
    if (!this.socket) return;
    this.socket.on('exam_paused', callback);
    this.addEventListener('exam_paused', callback);
  }

  onExamResumed(callback) {
    if (!this.socket) return;
    this.socket.on('exam_resumed', callback);
    this.addEventListener('exam_resumed', callback);
  }

  onTimeUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('time_update', callback);
    this.addEventListener('time_update', callback);
  }

  onProgressUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('progress_update', callback);
    this.addEventListener('progress_update', callback);
  }

  onSecurityAlert(callback) {
    if (!this.socket) return;
    this.socket.on('security_alert', callback);
    this.addEventListener('security_alert', callback);
  }

  onStudentJoined(callback) {
    if (!this.socket) return;
    this.socket.on('student_joined', callback);
    this.addEventListener('student_joined', callback);
  }

  onStudentDisconnected(callback) {
    if (!this.socket) return;
    this.socket.on('student_disconnected', callback);
    this.addEventListener('student_disconnected', callback);
  }

  onMonitoringJoined(callback) {
    if (!this.socket) return;
    this.socket.on('monitoring_joined', callback);
    this.addEventListener('monitoring_joined', callback);
  }

  onMonitoringError(callback) {
    if (!this.socket) return;
    this.socket.on('monitoring_error', callback);
    this.addEventListener('monitoring_error', callback);
  }

  onAnswerSubmitted(callback) {
    if (!this.socket) return;
    this.socket.on('answer_submitted', callback);
    this.addEventListener('answer_submitted', callback);
  }

  onExamAutoSubmitted(callback) {
    if (!this.socket) return;
    this.socket.on('exam_auto_submitted', callback);
    this.addEventListener('exam_auto_submitted', callback);
  }

  onScreenShareRequest(callback) {
    if (!this.socket) return;
    this.socket.on('screen_share_request', callback);
    this.addEventListener('screen_share_request', callback);
  }

  onError(callback) {
    if (!this.socket) return;
    this.socket.on('error', callback);
    this.addEventListener('error', callback);
  }

  onStudentLeft(callback) {
    if (!this.socket) return;
    this.socket.on('student_left', callback);
    this.addEventListener('student_left', callback);
  }

  onExamStartedMonitoring(callback) {
    if (!this.socket) return;
    this.socket.on('exam_started_monitoring', callback);
    this.addEventListener('exam_started_monitoring', callback);
  }

  onActiveSessionsResponse(callback) {
    if (!this.socket) return;
    this.socket.on('active_sessions_response', callback);
    this.addEventListener('active_sessions_response', callback);
  }

  // Question synchronization methods
  requestQuestions(examId) {
    console.log('📚 Requesting questions for exam:', examId);
    console.log('📚 Socket connected:', this.socket?.connected);
    console.log('📚 Socket exists:', !!this.socket);
    
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot request questions');
      return;
    }

    console.log('📚 Emitting request_questions event');
    this.socket.emit('request_questions', {
      examId
    });
  }

  syncQuestions(examId, questionBankId, options = {}) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot sync questions');
      return;
    }

    this.socket.emit('sync_questions', {
      examId,
      questionBankId,
      options
    });
  }

  // Question event listeners
  onQuestionsReceived(callback) {
    if (!this.socket) return;
    this.socket.on('questions_received', callback);
    this.addEventListener('questions_received', callback);
  }

  onQuestionError(callback) {
    if (!this.socket) return;
    this.socket.on('question_error', callback);
    this.addEventListener('question_error', callback);
  }

  onQuestionsSynced(callback) {
    if (!this.socket) return;
    this.socket.on('questions_synced', callback);
    this.addEventListener('questions_synced', callback);
  }

  onSyncSuccess(callback) {
    if (!this.socket) return;
    this.socket.on('sync_success', callback);
    this.addEventListener('sync_success', callback);
  }

  onSyncError(callback) {
    if (!this.socket) return;
    this.socket.on('sync_error', callback);
    this.addEventListener('sync_error', callback);
  }

  // Additional methods for monitoring
  requestActiveSessions(examId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot request active sessions');
      return;
    }

    this.socket.emit('request_active_sessions', {
      examId
    });
  }

  requestScreenShare(sessionId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Real-time socket not connected, cannot request screen share');
      return;
    }

    this.socket.emit('request_screen_share', {
      sessionId
    });
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onExamEnded(callback) {
    if (!this.socket) return;
    this.socket.on('exam_ended', callback);
    this.addEventListener('exam_ended', callback);
  }

  // Monitoring Event Listeners
  onMonitoringJoined(callback) {
    if (!this.socket) return;
    this.socket.on('monitoring_joined', callback);
    this.addEventListener('monitoring_joined', callback);
  }

  onStudentJoined(callback) {
    if (!this.socket) return;
    this.socket.on('student_joined', callback);
    this.addEventListener('student_joined', callback);
  }

  onStudentDisconnected(callback) {
    if (!this.socket) return;
    this.socket.on('student_disconnected', callback);
    this.addEventListener('student_disconnected', callback);
  }

  onProgressUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('progress_update', callback);
    this.addEventListener('progress_update', callback);
  }

  onTimeUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('time_update', callback);
    this.addEventListener('time_update', callback);
  }

  onMonitoringError(callback) {
    if (!this.socket) return;
    this.socket.on('monitoring_error', callback);
    this.addEventListener('monitoring_error', callback);
  }

  // Generic event listener management
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Utility Methods
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.authErrorOccurred = false;
    this.eventListeners.clear();
  }

  resetAuthError() {
    this.authErrorOccurred = false;
  }

  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  isSocketReady() {
    return this.socket && this.socket.connected && !this.authErrorOccurred;
  }

  reconnectWithToken(token) {
    console.log('🔄 Force reconnecting real-time socket with new token...');
    this.disconnect();
    this.authErrorOccurred = false;
    this.reconnectAttempts = 0;
    return this.connect(token);
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.eventListeners.clear();
  }

  // Start heartbeat
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.sendHeartbeat();
      }
    }, 10000); // Send heartbeat every 10 seconds for faster response
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create and export a singleton instance
const realtimeSocketService = new RealtimeSocketService();
export default realtimeSocketService;
