const { io } = require('socket.io-client');

// Test script for real-time WebSocket functionality
console.log('🧪 Testing Real-time WebSocket Server...\n');

// Test data
const testToken = 'your-test-jwt-token-here'; // Replace with actual token
const testExamId = 'test-exam-id-123';
const testStudentId = 'test-student-id-456';

// Connect as teacher
console.log('👁️ Connecting as Teacher...');
const teacherSocket = io('http://localhost:5004', {
  auth: { token: testToken }
});

teacherSocket.on('connect', () => {
  console.log('✅ Teacher connected to real-time server');
  
  // Join monitoring room
  teacherSocket.emit('join_monitoring', { examId: testExamId });
});

teacherSocket.on('monitoring_joined', (data) => {
  console.log('📊 Teacher joined monitoring room:', data);
});

teacherSocket.on('student_joined', (data) => {
  console.log('🎓 Student joined (received by teacher):', data);
});

teacherSocket.on('student_disconnected', (data) => {
  console.log('🔌 Student disconnected (received by teacher):', data);
});

teacherSocket.on('progress_update', (data) => {
  console.log('📈 Progress update (received by teacher):', data);
});

teacherSocket.on('time_update', (data) => {
  console.log('⏰ Time update (received by teacher):', data);
});

teacherSocket.on('exam_ended', (data) => {
  console.log('🏁 Exam ended (received by teacher):', data);
});

// Connect as student
setTimeout(() => {
  console.log('\n🎓 Connecting as Student...');
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
  });

  studentSocket.on('exam_session_joined', (data) => {
    console.log('📝 Student joined exam session:', data);
    
    // Simulate submitting answers
    setTimeout(() => {
      console.log('📝 Submitting answer...');
      studentSocket.emit('submit_answer', {
        questionId: 'q1',
        answer: 'Option A',
        timeSpent: 30
      });
    }, 2000);

    // Simulate ending exam
    setTimeout(() => {
      console.log('🏁 Ending exam...');
      studentSocket.emit('end_exam', {
        submissionType: 'normal',
        finalScore: 85
      });
    }, 5000);
  });

  studentSocket.on('answer_submitted', (data) => {
    console.log('✅ Answer submitted (received by student):', data);
  });

  studentSocket.on('exam_ended', (data) => {
    console.log('🏁 Exam ended (received by student):', data);
  });

  studentSocket.on('exam_error', (error) => {
    console.error('❌ Exam error (received by student):', error);
  });

}, 2000);

// Test heartbeat
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
