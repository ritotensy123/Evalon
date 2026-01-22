const { io } = require('socket.io-client');

console.log('🧪 Testing Real-time WebSocket Integration...\n');

// Test with actual JWT token from your system
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjOTA5Y2VlNDg5YWY4Y2ZmNGVlNzAiLCJlbWFpbCI6Im1hcnlsb2lkOTM2QGdtYWlsLmNvbSIsInVzZXJUeXBlIjoidGVhY2hlciIsImlhdCI6MTczMjY0NzQwMCwiZXhwIjoxNzMzMjUyMjAwfQ.YourActualTokenHere'; // Replace with actual token
const testExamId = '68ff9f93aab9975c5f26bf64';

// Test 1: Teacher connects to real-time server
console.log('👁️ Test 1: Teacher connecting to real-time server...');
const teacherSocket = io('http://localhost:5004', {
  auth: { token: testToken }
});

teacherSocket.on('connect', () => {
  console.log('✅ Teacher connected to real-time server');
  
  // Join monitoring room
  teacherSocket.emit('join_monitoring', { examId: testExamId });
  console.log('📊 Teacher joined monitoring room');
});

teacherSocket.on('monitoring_joined', (data) => {
  console.log('👁️ Teacher monitoring joined:', {
    examId: data.examId,
    activeSessions: data.activeSessions?.length || 0
  });
});

teacherSocket.on('student_joined', (data) => {
  console.log('🎓 Teacher received student joined:', {
    sessionId: data.sessionId,
    student: data.student?.name || 'Unknown',
    status: data.status
  });
});

teacherSocket.on('student_disconnected', (data) => {
  console.log('🔌 Teacher received student disconnected:', {
    sessionId: data.sessionId,
    student: data.student?.name || 'Unknown'
  });
});

teacherSocket.on('progress_update', (data) => {
  console.log('📈 Teacher received progress update:', {
    sessionId: data.sessionId,
    progress: data.progress
  });
});

teacherSocket.on('time_update', (data) => {
  console.log('⏰ Teacher received time update:', {
    sessionId: data.sessionId,
    timeRemaining: data.timeRemaining
  });
});

// Test 2: Student connects to real-time server
setTimeout(() => {
  console.log('\n🎓 Test 2: Student connecting to real-time server...');
  const studentSocket = io('http://localhost:5004', {
    auth: { token: testToken }
  });

  studentSocket.on('connect', () => {
    console.log('✅ Student connected to real-time server');
    
    // Join exam session
    studentSocket.emit('join_exam_session', {
      examId: testExamId,
      sessionId: null,
      deviceInfo: {
        userAgent: 'Test Browser',
        platform: 'Test Platform',
        language: 'en-US',
        screenResolution: '1920x1080',
        timestamp: new Date().toISOString()
      },
      networkInfo: {
        connectionType: 'wifi',
        timestamp: new Date().toISOString()
      }
    });
    console.log('📝 Student joined exam session');
  });

  studentSocket.on('exam_session_joined', (data) => {
    console.log('📝 Student exam session joined:', {
      sessionId: data.sessionId,
      timeRemaining: data.timeRemaining
    });
    
    // Simulate submitting answers
    setTimeout(() => {
      console.log('📝 Student submitting answer...');
      studentSocket.emit('submit_answer', {
        questionId: 'q1',
        answer: 'Option A',
        timeSpent: 30
      });
    }, 2000);

    // Simulate ending exam
    setTimeout(() => {
      console.log('🏁 Student ending exam...');
      studentSocket.emit('end_exam', {
        submissionType: 'normal',
        finalScore: 85
      });
    }, 5000);
  });

  studentSocket.on('answer_submitted', (data) => {
    console.log('✅ Student answer submitted:', data);
  });

  studentSocket.on('exam_ended', (data) => {
    console.log('🏁 Student exam ended:', data);
  });

  studentSocket.on('exam_error', (error) => {
    console.error('❌ Student exam error:', error);
  });

}, 2000);

// Test 3: Heartbeat test
setInterval(() => {
  if (teacherSocket.connected) {
    teacherSocket.emit('heartbeat');
  }
}, 30000);

// Cleanup after test
setTimeout(() => {
  console.log('\n🧹 Cleaning up test connections...');
  teacherSocket.disconnect();
  process.exit(0);
}, 10000);

console.log('\n⏱️ Test will run for 10 seconds...');
console.log('📡 Make sure the real-time server is running on port 5004');
console.log('🔑 Update the testToken variable with a valid JWT token\n');
