import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Calendar,
  Timer,
  Shield,
  Monitor,
  Mic,
  Camera,
  ArrowRight,
  ArrowLeft,
  Zap,
  Star,
  Target,
  Award,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';
import realtimeSocketService from '../../services/realtimeSocketService';
import { examAPI } from '../../services/api';
import AIProctoringService from '../../services/aiProctoringService';

const StudentExamInterface = ({ exam, onClose, user }) => {
  // Exam flow stages
  const [currentStage, setCurrentStage] = useState('details'); // details, checks, rules, countdown, exam
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0); // Will be set when exam starts
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamPaused, setIsExamPaused] = useState(false);
  const [countdownData, setCountdownData] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attemptsToLeave, setAttemptsToLeave] = useState(0);
  const [allowFullscreenExit, setAllowFullscreenExit] = useState(false);
  const [securityWarning, setSecurityWarning] = useState(null);
  
  // Time synchronization states
  const [serverTime, setServerTime] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const [examEndTime, setExamEndTime] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Device test states
  const [cameraTest, setCameraTest] = useState({ status: 'pending', stream: null });
  const [microphoneTest, setMicrophoneTest] = useState({ status: 'pending', level: 0 });
  const [deviceTestPassed, setDeviceTestPassed] = useState(false);
  
  // AI Face Detection states
  const [faceDetectionStatus, setFaceDetectionStatus] = useState({ status: 'pending', message: '' });
  const [aiServiceAvailable, setAiServiceAvailable] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [faceValidationActive, setFaceValidationActive] = useState(false);
  
  // Instructions agreement
  const [instructionsAgreed, setInstructionsAgreed] = useState(false);
  
  // Socket and session management
  const [sessionId, setSessionId] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState('inactive');
  
  // Exam questions state
  const [examQuestions, setExamQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Time synchronization functions
  const syncWithServer = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:5001/api/time', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const endTime = Date.now();
      const networkDelay = (endTime - startTime) / 2;
      
      if (response.ok) {
        const serverTimeData = await response.json();
        const serverTimestamp = new Date(serverTimeData.timestamp).getTime();
        const adjustedServerTime = serverTimestamp + networkDelay;
        const clientTime = Date.now();
        
        setTimeOffset(adjustedServerTime - clientTime);
        setServerTime(new Date(adjustedServerTime));
        setLastSyncTime(new Date());
        
        console.log('🕐 Time synchronized:', {
          serverTime: new Date(adjustedServerTime).toISOString(),
          clientTime: new Date(clientTime).toISOString(),
          offset: timeOffset,
          networkDelay: networkDelay
        });
        
        return adjustedServerTime;
      } else {
        console.warn('⚠️ Server time sync failed, using client time');
        setServerTime(new Date());
        setLastSyncTime(new Date());
        return Date.now();
      }
    } catch (error) {
      console.error('❌ Time sync error:', error);
      setServerTime(new Date());
      setLastSyncTime(new Date());
      return Date.now();
    }
  };

  const getSynchronizedTime = () => {
    return new Date(Date.now() + timeOffset);
  };

  const calculateExamTimes = () => {
    try {
      let scheduledDateTime;
      
      if (exam.scheduledDate instanceof Date) {
        scheduledDateTime = new Date(exam.scheduledDate);
        const [hours, minutes] = exam.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (typeof exam.scheduledDate === 'string') {
        let datePart;
        if (exam.scheduledDate.includes('T')) {
          datePart = exam.scheduledDate.split('T')[0];
        } else {
          datePart = exam.scheduledDate;
        }
        scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
      } else {
        console.error('Invalid exam date format');
        return;
      }
      
      if (isNaN(scheduledDateTime.getTime())) {
        console.error('Invalid date created');
        return;
      }
      
      setExamStartTime(scheduledDateTime);
      setExamEndTime(new Date(scheduledDateTime.getTime() + exam.duration * 60 * 1000));
      
      console.log('📅 Exam times calculated:', {
        startTime: scheduledDateTime.toISOString(),
        endTime: new Date(scheduledDateTime.getTime() + exam.duration * 60 * 1000).toISOString(),
        duration: exam.duration
      });
    } catch (error) {
      console.error('Error calculating exam times:', error);
    }
  };
  
  // Helper function to get browser info
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  // Student info from user context
  const studentInfo = {
    name: user?.profile?.firstName && user?.profile?.lastName 
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.email || 'Student',
    studentId: user?.profile?.studentId || user?.id || 'N/A',
    class: exam.class,
    subject: exam.subject
  };

  // Process questions for exam based on exam configuration
  const processQuestionsForExam = (questions, examConfig) => {
    console.log('🔄 Processing questions for exam:', {
      totalQuestions: examConfig.totalQuestions,
      totalMarks: examConfig.totalMarks,
      availableQuestions: questions.length
    });

    if (!questions || questions.length === 0) {
      console.log('⚠️ No questions available to process');
      return [];
    }

    // Step 1: Shuffle questions for random selection
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    console.log('🔀 Questions shuffled:', shuffledQuestions.length);

    // Step 2: Select only the required number of questions
    const selectedQuestions = shuffledQuestions.slice(0, examConfig.totalQuestions || questions.length);
    console.log('📝 Selected questions count:', selectedQuestions.length);

    // Step 3: Apply exam marking scheme
    const marksPerQuestion = examConfig.totalMarks && examConfig.totalQuestions 
      ? examConfig.totalMarks / examConfig.totalQuestions 
      : 1; // Default to 1 mark per question

    console.log('💰 Calculated marks per question:', marksPerQuestion);

    // Step 4: Update question marks to match exam scheme and normalize structure
    const processedQuestions = selectedQuestions.map((question, index) => {
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
        correctAnswer: question.correctAnswer,
        correctAnswers: question.correctAnswers,
        // Apply exam marking scheme
        marks: marksPerQuestion, // Override individual question marks
        examQuestionNumber: index + 1, // Add question number for exam
        originalMarks: question.marks // Keep original marks for reference
      };
      
      console.log(`🔍 Question ${index + 1} normalization:`, {
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

    console.log('✅ Questions processed successfully:', {
      originalCount: questions.length,
      selectedCount: processedQuestions.length,
      marksPerQuestion: marksPerQuestion,
      totalMarks: processedQuestions.reduce((sum, q) => sum + q.marks, 0)
    });

    return processedQuestions;
  };

  // Load questions from exam or question bank
  const loadQuestions = async () => {
    try {
      setQuestionsLoading(true);
      console.log('📚 Loading questions for exam:', exam._id);
      console.log('📚 Exam object:', exam);
      console.log('📚 Exam questions:', exam.questions);
      
      // First try to get questions from the exam
      if (exam.questions && exam.questions.length > 0) {
        console.log('📚 Found questions in exam:', exam.questions.length);
        const processedQuestions = processQuestionsForExam(exam.questions, exam);
        setExamQuestions(processedQuestions);
        setQuestionsLoaded(true);
        setQuestionsLoading(false);
        return;
      }
      
      // If no questions in exam, use fallback immediately and try question bank in background
      console.log('📚 No questions in exam, using fallback questions immediately');
      setQuestionsLoading(false);
      
      // Try to request from question bank in background
      setTimeout(() => {
        try {
          if (realtimeSocketService.isSocketConnected()) {
            realtimeSocketService.requestQuestions(exam._id);
            console.log('📚 Question request sent to real-time server (background)');
          } else {
            console.log('📚 Socket not connected, using fallback questions');
          }
        } catch (error) {
          console.log('📚 Question bank request failed, using fallback questions');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      setQuestionsLoading(false);
    }
  };

  // Use exam questions or fallback to sample questions
  const fallbackQuestions = [
    {
      id: 1,
      question: `What is the main topic of this ${exam.subject || 'exam'}?`,
      type: "mcq",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      marks: 5
    },
    {
      id: 2,
      question: `Explain a key concept related to ${exam.subject || 'the subject'}.`,
      type: "essay",
      marks: 10
    },
    {
      id: 3,
      question: `Which of the following are important in ${exam.subject || 'this field'}?`,
      type: "multiple",
      options: ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
      correctAnswers: [0, 1],
      marks: 8
    }
  ];

  // Process questions based on exam configuration
  const questions = examQuestions.length > 0 
    ? examQuestions 
    : processQuestionsForExam(fallbackQuestions, exam);

  // Timer effect with synchronized time - starts when exam begins
  useEffect(() => {
    if (isExamStarted && !isExamPaused && examStartTime && examEndTime) {
      const timer = setInterval(() => {
        const currentTime = getSynchronizedTime();
        const remainingMs = examEndTime.getTime() - currentTime.getTime();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        
        setTimeRemaining(remainingSeconds);
        
        console.log('⏰ Timer update:', {
          currentTime: currentTime.toISOString(),
          examStartTime: examStartTime.toISOString(),
          examEndTime: examEndTime.toISOString(),
          remainingSeconds: remainingSeconds,
          remainingMinutes: Math.floor(remainingSeconds / 60)
        });
        
        if (remainingSeconds <= 0) {
          console.log('⏰ Time up! Auto-submitting exam...');
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isExamStarted, isExamPaused, examStartTime, examEndTime, timeOffset]);

  // Initialize socket connection and time synchronization
  useEffect(() => {
    const initializeExam = async () => {
      // Initialize time sync
      await syncWithServer();
      calculateExamTimes();
      
      // Initialize socket connection
      const token = localStorage.getItem('authToken');
      if (token && !realtimeSocketService.isSocketConnected()) {
        const socket = realtimeSocketService.connect(token);
        
        // Set up socket event listeners
        realtimeSocketService.onExamSessionJoined((data) => {
          console.log('📝 Exam session joined:', data);
          setSessionId(data.sessionId);
          setIsSocketConnected(true);
          setMonitoringStatus('active');
        });
        
        realtimeSocketService.onExamStarted((data) => {
          console.log('🚀 Exam started via socket:', data);
          setIsExamStarted(true);
          setCurrentStage('exam');
          setTimeRemaining(data.timeRemaining);
          setMonitoringStatus('active');
        });
        
        realtimeSocketService.onTimeUpdate((data) => {
          setTimeRemaining(data.timeRemaining);
        });
        
        realtimeSocketService.onExamAutoSubmitted((data) => {
          console.log('⏰ Exam auto-submitted:', data);
          alert('Exam time has expired. Your exam has been automatically submitted.');
          onClose();
        });
        
        realtimeSocketService.onScreenShareRequest((data) => {
          console.log('📹 Screen share requested:', data);
          // Handle screen share request from teacher
          if (window.confirm('A teacher is requesting to view your screen. Allow?')) {
            // Implement screen sharing logic here
            console.log('Screen sharing accepted');
          }
        });
        
        realtimeSocketService.onError((error) => {
          console.error('Socket error:', error);
        });

        // Question synchronization event listeners
        realtimeSocketService.onQuestionsReceived((data) => {
          console.log('📚 Questions received from question bank:', data);
          console.log('📚 Questions data type:', typeof data);
          console.log('📚 Questions data keys:', Object.keys(data || {}));
          if (data.questions && data.questions.length > 0) {
            console.log('📚 Processing questions for exam:', exam._id);
            console.log('📚 Exam totalQuestions:', exam.totalQuestions);
            console.log('📚 Exam totalMarks:', exam.totalMarks);
            
            // Process questions based on exam configuration
            const processedQuestions = processQuestionsForExam(data.questions, exam);
            console.log('📚 Processed questions:', processedQuestions);
            
            setExamQuestions(processedQuestions);
            setQuestionsLoaded(true);
            setQuestionsLoading(false);
            console.log('✅ Questions loaded successfully:', processedQuestions.length);
          } else {
            console.log('📚 No questions in received data, using fallback');
            setQuestionsLoading(false);
          }
        });

        realtimeSocketService.onQuestionError((error) => {
          console.error('❌ Question error:', error);
          console.log('📚 Using fallback questions due to error');
          setQuestionsLoading(false);
          // Don't show alert, just use fallback questions
        });
        
        // Join exam session
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          browser: getBrowserInfo(),
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        };
        
        const networkInfo = {
          ipAddress: 'unknown', // Will be detected by server
          location: {
            country: 'unknown',
            region: 'unknown',
            city: 'unknown'
          }
        };
        
        realtimeSocketService.joinExamSession(exam._id, null, deviceInfo, networkInfo, (sessionData) => {
          // Request questions after exam session is joined
          console.log('📚 Session joined, requesting questions...');
          realtimeSocketService.requestQuestions(exam._id);
        });
      }
    };
    
    initializeExam();
    
    // Load questions
    loadQuestions();
    
    // Questions are now loaded immediately with fallback
    
    // Sync with server every 30 seconds
    const syncInterval = setInterval(syncWithServer, 30000);
    
    // Send heartbeat every 5 seconds for faster response
    const heartbeatInterval = setInterval(() => {
      if (isSocketConnected) {
        realtimeSocketService.sendHeartbeat();
      }
    }, 5000);
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(heartbeatInterval);
      // Clean up socket connection
      if (sessionId) {
        realtimeSocketService.endExam('abandoned');
      }
    };
  }, [exam.scheduledDate, exam.startTime, exam.duration, exam._id]);

  // Cleanup effect to remove student from monitoring when component unmounts
  useEffect(() => {
    return () => {
      // This runs when the component unmounts (student exits exam interface)
      console.log('🚪 Student component unmounting, cleaning up session');
      endExamSession('exited');
    };
  }, [sessionId]);

  // Proctoring and security monitoring
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🚨 Tab switched or window hidden during exam!');
        // Report security flag via socket
        if (sessionId && isSocketConnected) {
          realtimeSocketService.reportSecurityFlag('tab_switch', 'Student switched tabs or minimized window', 'medium');
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (isExamStarted && sessionId) {
        // End the exam session when student leaves
        console.log('🚪 Student leaving exam interface, ending session');
        endExamSession('exited');
      }
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress may be lost.';
      return e.returnValue;
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      console.log('🚨 Right-click disabled during exam');
      // Report security flag via socket
      if (sessionId && isSocketConnected) {
        realtimeSocketService.reportSecurityFlag('right_click', 'Student attempted to right-click', 'low');
      }
    };

    const handleKeyDown = (e) => {
      // ULTRA STRICT MODE: Block ALL keyboard input except typing in answer fields
      
      // Check if the event is from an input field where typing should be allowed
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.contentEditable === 'true' ||
                          e.target.closest('[contenteditable="true"]') ||
                          e.target.closest('input') ||
                          e.target.closest('textarea');

      // If it's not an input field, block ALL keys
      if (!isInputField) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚨 ALL keyboard input blocked outside input fields:', e.key);
        return false;
      }

      // Even in input fields, block dangerous keys
      const dangerousKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 
                           'Tab', 'PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Delete', 'Home', 'End', 
                           'PageUp', 'PageDown', 'Meta', 'OS', 'Win'];
      
      if (dangerousKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚨 Dangerous key blocked even in input field:', e.key);
        setSecurityWarning(`${e.key} key is disabled during exam.`);
        setTimeout(() => setSecurityWarning(null), 3000);
        if (sessionId && isSocketConnected) {
          realtimeSocketService.reportSecurityFlag('dangerous_key_blocked', `Student attempted to use ${e.key}`, 'high');
        }
        return false;
      }

      // Block ALL modifier key combinations
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚨 Modifier key combination blocked:', e.key);
        setSecurityWarning('Keyboard shortcuts are disabled during exam.');
        setTimeout(() => setSecurityWarning(null), 3000);
        if (sessionId && isSocketConnected) {
          realtimeSocketService.reportSecurityFlag('modifier_combination_blocked', `Student attempted modifier+${e.key}`, 'high');
        }
        return false;
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (!allowFullscreenExit) {
          console.log('🚨 Student attempted to exit fullscreen - forcing back to fullscreen');
          // Force back to fullscreen immediately
          setTimeout(() => {
            enterFullscreen();
          }, 50);
          // Report security flag via socket
          if (sessionId && isSocketConnected) {
            realtimeSocketService.reportSecurityFlag('fullscreen_exit_attempt', 'Student attempted to exit fullscreen mode', 'high');
          }
          // Show warning to student
          setSecurityWarning('Fullscreen mode is required. You cannot exit during the exam.');
          setTimeout(() => setSecurityWarning(null), 3000);
        } else {
          console.log('✅ Student exited fullscreen mode (allowed)');
          setIsFullscreen(false);
        }
      } else {
        setIsFullscreen(true);
      }
    };

    // Continuous fullscreen monitoring with aggressive enforcement
    const enforceFullscreen = () => {
      if (isExamStarted && !allowFullscreenExit && !document.fullscreenElement) {
        console.log('🚨 Fullscreen enforcement - forcing back to fullscreen');
        // Use multiple methods to ensure fullscreen is maintained
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
            // Try alternative methods
            if (element.webkitRequestFullscreen) {
              element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
              element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
              element.msRequestFullscreen();
            }
          });
        }
        setIsFullscreen(true);
      }
    };

    // Override the browser's native fullscreen exit behavior
    const overrideFullscreenAPI = () => {
      if (isExamStarted && !allowFullscreenExit) {
        // Store original exitFullscreen method
        if (!document._originalExitFullscreen) {
          document._originalExitFullscreen = document.exitFullscreen;
        }
        
        // Override exitFullscreen to prevent ESC key from working
        document.exitFullscreen = () => {
          console.log('🚨 exitFullscreen() called - blocking and forcing back to fullscreen');
          setSecurityWarning('Fullscreen exit blocked. Use the Exit button to leave the exam.');
          setTimeout(() => setSecurityWarning(null), 3000);
          
          // Force back to fullscreen immediately
          setTimeout(() => {
            enterFullscreen();
          }, 10);
          
          // Report security violation
          if (sessionId && isSocketConnected) {
            realtimeSocketService.reportSecurityFlag('fullscreen_exit_blocked', 'Student attempted to exit fullscreen via API', 'high');
          }
          
          return Promise.reject(new Error('Fullscreen exit blocked during exam'));
        };
      }
    };

    // Additional security: Block window focus/blur events that might indicate tab switching
    const handleWindowBlur = () => {
      console.log('🚨 Window lost focus - possible tab switch attempt');
      if (sessionId && isSocketConnected) {
        realtimeSocketService.reportSecurityFlag('window_blur', 'Student window lost focus - possible tab switch', 'medium');
      }
    };

    const handleWindowFocus = () => {
      console.log('🔄 Window regained focus');
      if (sessionId && isSocketConnected) {
        realtimeSocketService.reportSecurityFlag('window_focus', 'Student window regained focus', 'low');
      }
    };

    // Additional strict security handlers
    const handleKeyUp = (e) => {
      // Block ALL dangerous keys on keyup
      const dangerousKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 
                           'Tab', 'PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Delete', 'Home', 'End', 
                           'PageUp', 'PageDown', 'Meta', 'OS', 'Win'];
      
      if (dangerousKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleKeyPress = (e) => {
      // Block ALL dangerous keys on keypress
      const dangerousKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 
                           'Tab', 'PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Delete', 'Home', 'End', 
                           'PageUp', 'PageDown', 'Meta', 'OS', 'Win'];
      
      if (dangerousKeys.includes(e.key) || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Block mouse wheel events that might be used to scroll out of view
    const handleWheel = (e) => {
      // Allow normal scrolling within the exam interface
      // This is mainly to prevent any wheel-based shortcuts
    };

    // Block any attempt to resize the window
    const handleResize = () => {
      console.log('🚨 Window resize detected during exam');
      if (sessionId && isSocketConnected) {
        realtimeSocketService.reportSecurityFlag('window_resize', 'Student attempted to resize window', 'medium');
      }
    };

    // Global keyboard event handler with capture phase (highest priority)
    const handleGlobalKeyDown = (e) => {
      // Block ESC key at the highest priority level
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🚨 ESC key blocked at global level');
        setSecurityWarning('ESC key is completely disabled. Use the Exit button to leave the exam.');
        setTimeout(() => setSecurityWarning(null), 3000);
        if (sessionId && isSocketConnected) {
          realtimeSocketService.reportSecurityFlag('esc_key_global_blocked', 'Student attempted to use ESC key', 'high');
        }
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Add global keyboard handler with capture phase (highest priority)
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('resize', handleResize);
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Override the fullscreen API immediately
    overrideFullscreenAPI();
    
    // Continuous fullscreen enforcement - check every 50ms for maximum security
    const fullscreenEnforcementInterval = setInterval(() => {
      enforceFullscreen();
      overrideFullscreenAPI(); // Re-apply override in case it gets reset
    }, 50);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('wheel', handleWheel);
      clearInterval(fullscreenEnforcementInterval);
      
      // Restore original exitFullscreen method
      if (document._originalExitFullscreen) {
        document.exitFullscreen = document._originalExitFullscreen;
        delete document._originalExitFullscreen;
      }
    };
  }, [isExamStarted, sessionId, isSocketConnected]);

  // Countdown is now handled by WebSocket events and local calculations
  // No need for frequent API calls - WebSocket provides real-time updates

  // Fullscreen effect - enter fullscreen immediately when component mounts
  useEffect(() => {
    enterFullscreen();
  }, []);

  // Auto-run device tests when entering checks stage - REMOVED for manual control
  // User will click "Test" button to see camera preview

  // Cleanup camera stream when component unmounts or stage changes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Device test functions - Industry standard brief checks with AI face detection
  const testCamera = async () => {
    try {
      setCameraTest({ status: 'testing', stream: null });
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      // Store stream for video preview
      setCameraStream(stream);
      setFaceValidationActive(true);
      
      // AI Face Detection with continuous monitoring
      if (aiServiceAvailable) {
        setFaceDetectionStatus({ status: 'testing', message: 'Detecting face...' });
        
        // Set up continuous face detection
        const startFaceDetection = async () => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for video to load
          
          let detectionCount = 0;
          const maxDetections = 5; // Check 5 times
          
          const detectFaces = async () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              
              const base64Image = canvas.toDataURL('image/jpeg', 0.8);
              
              // Call AI service
              const result = await AIProctoringService.detectFaces(base64Image);
              
              if (result.success && result.status === 'valid') {
                detectionCount++;
                setFaceDetectionStatus({ 
                  status: 'success', 
                  message: `✓ Face detected (${detectionCount}/${maxDetections})` 
                });
              } else if (result.success && result.status === 'multiple') {
                // FAIL - Multiple faces detected
                setFaceDetectionStatus({ 
                  status: 'failed', 
                  message: '⚠ Multiple faces detected - suspicious activity' 
                });
                setCameraTest({ status: 'failed', stream: null });
                // Stop camera stream immediately
                setTimeout(() => {
                  stream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                  setFaceValidationActive(false);
                }, 2000);
                return; // Stop on multiple faces
              } else {
                // FAIL - No face detected
                setFaceDetectionStatus({ 
                  status: 'failed', 
                  message: '✗ No face detected - please ensure face is visible' 
                });
                setCameraTest({ status: 'failed', stream: null });
                // Stop camera stream
                setTimeout(() => {
                  stream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                  setFaceValidationActive(false);
                }, 2000);
                return;
              }
              
              // Continue detection if not reached max
              if (detectionCount < maxDetections && result.status === 'valid') {
                setTimeout(detectFaces, 1000); // Check every second
              } else if (detectionCount >= maxDetections) {
                // SUCCESS - Face validation complete
                setFaceDetectionStatus({ 
                  status: 'success', 
                  message: '✓ Face validation complete' 
                });
                // Stop camera stream after validation
                setTimeout(() => {
                  stream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                  setFaceValidationActive(false);
                }, 2000);
              }
            } catch (error) {
              console.error('AI face detection error:', error);
              setFaceDetectionStatus({ 
                status: 'failed', 
                message: '⚠ Face detection error' 
              });
              setCameraTest({ status: 'failed', stream: null });
            }
          };
          
          detectFaces();
        };
        
        startFaceDetection().catch(error => {
          console.error('Face detection setup error:', error);
        });
      } else {
        // No AI service - just show camera for 3 seconds
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
          setFaceValidationActive(false);
        }, 3000);
      }
      
      setCameraTest({ status: 'success', stream });
      return true;
    } catch (error) {
      setCameraTest({ status: 'failed', stream: null });
      return false;
    }
  };

  const testMicrophone = async () => {
    try {
      setMicrophoneTest({ status: 'testing', stream: null });
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      setMicrophoneTest({ status: 'success', stream });
      // Stop stream after brief test
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 1500);
      return true;
    } catch (error) {
      setMicrophoneTest({ status: 'failed', stream: null });
      return false;
    }
  };

  const runDeviceTests = async () => {
    // Check AI service availability
    const aiAvailable = await AIProctoringService.isAvailable();
    setAiServiceAvailable(aiAvailable);
    
    if (aiAvailable) {
      console.log('✓ AI Face Detection Service is available');
    } else {
      console.warn('⚠ AI Face Detection Service is not available, using basic camera test');
    }
    
    // Run tests in parallel for faster completion
    const results = await Promise.all([testCamera(), testMicrophone()]);
    setDeviceTestPassed(results.every(result => result === true));
  };

  // Check if exam should start (when current time >= scheduled time)
  useEffect(() => {
    if (currentStage === 'countdown' && examStartTime) {
      const checkExamStart = () => {
        const currentTime = getSynchronizedTime();
        
        console.log('🕐 Checking exam start:', {
          currentTime: currentTime.toISOString(),
          examStartTime: examStartTime.toISOString(),
          shouldStart: currentTime >= examStartTime
        });
        
        if (currentTime >= examStartTime) {
          console.log('✅ Exam starting now!');
          setCurrentStage('exam');
          setIsExamStarted(true);
          
          // Start exam via socket
          if (sessionId && isSocketConnected) {
            realtimeSocketService.startExam(sessionId);
          }
          
          // Initialize timer with full duration when exam starts
          const fullDurationSeconds = exam.duration * 60;
          setTimeRemaining(fullDurationSeconds);
          
          console.log('⏰ Exam timer initialized:', {
            duration: exam.duration,
            durationSeconds: fullDurationSeconds,
            examStartTime: examStartTime.toISOString(),
            examEndTime: examEndTime.toISOString()
          });
        }
      };

      // Check immediately
      checkExamStart();

      // Check every second
      const interval = setInterval(checkExamStart, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStage, examStartTime, timeOffset]);

  // Real-time countdown update for countdown screen
  useEffect(() => {
    if (currentStage === 'countdown' && examStartTime) {
      const updateCountdown = () => {
        const currentTime = getSynchronizedTime();
        const timeDiff = examStartTime.getTime() - currentTime.getTime();
        
        if (timeDiff <= 0) {
          // Exam should start now
          setCurrentStage('exam');
          setIsExamStarted(true);
        }
      };

      // Update countdown every second
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStage, examStartTime, timeOffset]);

  // Prevent leaving exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isExamStarted) {
        if (sessionId) {
          // End the exam session when student leaves
          console.log('🚪 Student leaving exam interface, ending session');
          endExamSession('exited');
        }
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the exam? Your progress may be lost.';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (isExamStarted && document.hidden) {
        setAttemptsToLeave(prev => prev + 1);
        if (attemptsToLeave >= 2) {
          alert('Warning: Multiple attempts to leave the exam detected. This may result in exam termination.');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isExamStarted, attemptsToLeave]);

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    // Allow fullscreen exit when explicitly requested
    setAllowFullscreenExit(true);
    
    // Restore original exitFullscreen method before exiting
    if (document._originalExitFullscreen) {
      document.exitFullscreen = document._originalExitFullscreen;
    }
    
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 900) return 'text-yellow-600'; // Less than 15 minutes
    return 'text-green-600';
  };


  const handlePauseExam = () => {
    setIsExamPaused(!isExamPaused);
  };

  // Track time spent on each question
  const [questionStartTime, setQuestionStartTime] = useState({});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);

  const handleAnswerChange = (questionId, answer) => {
    const currentTime = Date.now();
    const timeSpent = questionStartTime[questionId] 
      ? Math.floor((currentTime - questionStartTime[questionId]) / 1000)
      : 0;

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Report answer submission via socket with proper timing
    if (sessionId && isSocketConnected) {
      realtimeSocketService.submitAnswer(questionId, answer, timeSpent);
    }

    // Auto-save every 30 seconds
    if (autoSaveEnabled) {
      const now = Date.now();
      if (!lastAutoSave || now - lastAutoSave > 30000) {
        autoSaveAnswers();
        setLastAutoSave(now);
      }
    }

    // Reset timer for next question
    setQuestionStartTime(prev => ({
      ...prev,
      [questionId]: currentTime
    }));
  };

  // Auto-save answers function
  const autoSaveAnswers = async () => {
    try {
      const saveData = {
        examId: exam._id,
        answers: answers,
        timestamp: new Date().toISOString(),
        timeRemaining: timeRemaining
      };
      
      // Save to localStorage as backup
      localStorage.setItem(`exam_${exam._id}_backup`, JSON.stringify(saveData));
      
      // Send to server via socket
      if (sessionId && isSocketConnected) {
        realtimeSocketService.autoSaveAnswers(exam._id, answers, timeRemaining);
      }
      
      console.log('💾 Auto-save completed');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  };

  // Enhanced exam submission with validation
  const handleSubmitExam = async () => {
    if (submissionInProgress) {
      console.log('⚠️ Submission already in progress');
      return;
    }

    // Validate submission
    const validationResult = validateExamSubmission();
    if (!validationResult.isValid) {
      alert(`Cannot submit exam: ${validationResult.message}`);
      return;
    }

    // Show confirmation with summary
    const summary = generateSubmissionSummary();
    const confirmed = window.confirm(
      `Submit Exam?\n\n` +
      `Questions Answered: ${summary.answeredQuestions}/${summary.totalQuestions}\n` +
      `Time Remaining: ${formatTime(timeRemaining)}\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    setSubmissionInProgress(true);

    try {
      // Final auto-save before submission
      await autoSaveAnswers();
      
      // Calculate final score and statistics
      const finalScore = calculateScore();
      const examStats = generateExamStatistics();
      
      // Submit exam via socket
      if (sessionId && isSocketConnected) {
        realtimeSocketService.endExam('normal', finalScore, examStats);
      }
      
      // Clear backup data
      localStorage.removeItem(`exam_${exam._id}_backup`);
      
      alert('Exam submitted successfully!');
      onClose();
    } catch (error) {
      console.error('❌ Submission failed:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmissionInProgress(false);
    }
  };

  // Enhanced exam validation
  const validateExamSubmission = () => {
    // Check if exam is still active
    if (!isExamStarted) {
      return { isValid: false, message: 'Exam has not started yet' };
    }

    // Check if exam is paused
    if (isExamPaused) {
      return { isValid: false, message: 'Please resume the exam before submitting' };
    }

    // Check if time has expired
    if (timeRemaining <= 0) {
      return { isValid: false, message: 'Exam time has expired' };
    }

    // Check for minimum answer requirement (if any)
    const answeredQuestions = Object.keys(answers).length;
    const minimumAnswers = Math.ceil(questions.length * 0.5); // At least 50% answered
    
    if (answeredQuestions < minimumAnswers) {
      return { 
        isValid: false, 
        message: `Please answer at least ${minimumAnswers} questions before submitting` 
      };
    }

    return { isValid: true };
  };

  // Generate submission summary
  const generateSubmissionSummary = () => {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    
    return {
      answeredQuestions,
      totalQuestions,
      unansweredQuestions,
      timeRemaining: formatTime(timeRemaining),
      percentageAnswered: Math.round((answeredQuestions / totalQuestions) * 100)
    };
  };

  // Generate comprehensive exam statistics
  const generateExamStatistics = () => {
    const currentTime = Date.now();
    const examDuration = examStartTime ? Math.floor((currentTime - examStartTime) / 1000) : 0;
    
    const questionStats = questions.map(question => {
      const answer = answers[question.id];
      const timeSpent = questionStartTime[question.id] 
        ? Math.floor((currentTime - questionStartTime[question.id]) / 1000)
        : 0;
      
      return {
        questionId: question.id,
        answered: !!answer,
        timeSpent,
        answerType: question.type,
        marks: question.marks
      };
    });

    return {
      examId: exam._id,
      studentId: user?.id,
      startTime: examStartTime,
      endTime: currentTime,
      duration: examDuration,
      timeRemaining,
      totalQuestions: questions.length,
      answeredQuestions: Object.keys(answers).length,
      questionStats,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attemptsToLeave,
      isFullscreen,
      submissionMethod: 'manual'
    };
  };

  // Calculate exam score with detailed breakdown
  const calculateScore = () => {
    let totalMarks = 0;
    let earnedMarks = 0;
    let correctAnswers = 0;
    
    questions.forEach(question => {
      totalMarks += question.marks || 1;
      const studentAnswer = answers[question.id];
      
      if (studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '') {
        // Check if answer is correct based on question type
        let isCorrect = false;
        
        if (question.type === 'mcq') {
          isCorrect = studentAnswer === question.correctAnswer;
        } else if (question.type === 'multiple') {
          // For multiple choice, check if all correct answers are selected
          const correctAnswers = question.correctAnswers || [];
          isCorrect = Array.isArray(studentAnswer) && 
                     correctAnswers.every(correct => studentAnswer.includes(correct));
        } else if (question.type === 'essay') {
          // For essay questions, give partial credit based on length and content
          const minLength = 50; // Minimum characters for partial credit
          isCorrect = studentAnswer.length >= minLength;
        }
        
        if (isCorrect) {
          earnedMarks += question.marks || 1;
          correctAnswers++;
        }
      }
    });
    
    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    
    return {
      totalMarks,
      earnedMarks,
      percentage,
      correctAnswers,
      totalQuestions: questions.length
    };
  };

  // Auto-submit when time expires
  const handleAutoSubmit = async () => {
    if (submissionInProgress) {
      console.log('⚠️ Auto-submit already in progress');
      return;
    }

    console.log('⏰ Auto-submitting exam due to time expiration');
    setSubmissionInProgress(true);

    try {
      // Final auto-save before auto-submission
      await autoSaveAnswers();
      
      // Calculate final score and statistics
      const finalScore = calculateScore();
      const examStats = generateExamStatistics();
      examStats.submissionMethod = 'auto_time_expired';
      
      // Submit exam via socket
      if (sessionId && isSocketConnected) {
        realtimeSocketService.endExam('time_expired', finalScore, examStats);
      }
      
      // Clear backup data
      localStorage.removeItem(`exam_${exam._id}_backup`);
      
      alert('Exam automatically submitted due to time expiration!');
      onClose();
    } catch (error) {
      console.error('❌ Auto-submission failed:', error);
      alert('Auto-submission failed. Please contact support.');
    } finally {
      setSubmissionInProgress(false);
    }
  };

  // Enhanced timing with warnings
  const getTimeWarning = () => {
    if (timeRemaining <= 0) return { level: 'critical', message: 'Time expired!' };
    if (timeRemaining <= 60) return { level: 'critical', message: 'Less than 1 minute remaining!' };
    if (timeRemaining <= 300) return { level: 'warning', message: 'Less than 5 minutes remaining!' };
    if (timeRemaining <= 900) return { level: 'info', message: 'Less than 15 minutes remaining!' };
    return null;
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      // Auto-save before moving to next question
      autoSaveAnswers();
      setCurrentQuestion(currentQuestion + 1);
      
      // Update progress via socket
      if (sessionId && isSocketConnected) {
        const answeredCount = Object.keys(answers).length;
        realtimeSocketService.updateProgress(currentQuestion + 1, questions.length, answeredCount);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      
      // Update progress via socket
      if (sessionId && isSocketConnected) {
        const answeredCount = Object.keys(answers).length;
        realtimeSocketService.updateProgress(currentQuestion - 1, questions.length, answeredCount);
      }
    }
  };

  const handleCloseExam = () => {
    if (currentStage === 'exam' && isExamStarted) {
      setShowWarning(true);
    } else {
      // End session when closing exam interface
      console.log('🚪 Student closing exam interface');
      endExamSession('exited');
      onClose();
    }
  };

  // Centralized function to end exam session
  const endExamSession = (reason = 'exited') => {
    if (sessionId) {
      console.log('📡 Ending exam session:', sessionId, 'Reason:', reason);
      try {
        realtimeSocketService.endExam(reason);
        console.log('✅ Exam end signal sent');
      } catch (error) {
        console.error('❌ Error ending exam:', error);
        // Fallback: try to send via API if socket fails
        sendExitViaAPI(reason);
      }
    } else {
      console.log('⚠️ No session ID available for cleanup');
    }
  };

  // Fallback method to send exit via API if socket fails
  const sendExitViaAPI = async (reason) => {
    try {
      console.log('🔄 Attempting to send exit via API as fallback');
      // You could add an API endpoint here to handle exam exit
      // For now, just log that we tried
      console.log('📡 Fallback API call would be made here for reason:', reason);
    } catch (error) {
      console.error('❌ Fallback API call also failed:', error);
    }
  };

  const confirmClose = () => {
    if (window.confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
      // End session when confirming close
      console.log('🚪 Student confirming exam exit');
      endExamSession('exited');
      onClose();
    }
  };

  if (!exam) return null;

  // Show loading state while questions are being loaded
  if (questionsLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Questions</h3>
          <p className="text-gray-600 mb-4">Please wait while we load your exam questions...</p>
          <div className="text-sm text-gray-500">
            This may take a moment depending on your connection
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600">{exam.subject} • {exam.class}</p>
            </div>
            <div className="flex items-center gap-4">
              {(isExamStarted || countdownData) && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Timer className="w-4 h-4 text-gray-600" />
                  <span className={`text-lg font-semibold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </span>
                  {getTimeWarning() && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getTimeWarning().level === 'critical' 
                        ? 'bg-red-100 text-red-800 animate-pulse' 
                        : getTimeWarning().level === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getTimeWarning().message}
                    </div>
                  )}
                </div>
              )}
              {currentStage !== 'exam' && (
                <button
                  onClick={handleCloseExam}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {currentStage === 'exam' && (
                <>
                  <button
                    onClick={handleCloseExam}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    title="Exit Exam (Progress will be lost)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Security Warning Toast */}
        {securityWarning && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{securityWarning}</span>
          </div>
        )}


        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStage === 'details' && (
            /* Exam Details Screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Details</h2>
                <p className="text-gray-600">Please verify your information</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-900">{studentInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Student ID:</span>
                    <p className="font-medium text-gray-900">{studentInfo.studentId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Class:</span>
                    <p className="font-medium text-gray-900">{studentInfo.class}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Subject:</span>
                    <p className="font-medium text-gray-900">{studentInfo.subject}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium text-gray-900">{exam.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Questions:</span>
                    <p className="font-medium text-gray-900">{questions.length}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStage('checks')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStage === 'rules' && (
            /* Rules Screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Rules</h2>
                <p className="text-gray-600">Please read and agree to the terms</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Important Rules</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• Exam is conducted in full-screen mode with monitoring</li>
                  <li>• Camera and microphone will be active during the exam</li>
                  <li>• You cannot leave the exam once started</li>
                  <li>• No external resources or help allowed</li>
                  <li>• All answers are auto-saved</li>
                  <li>• Submit before time expires</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={instructionsAgreed}
                    onChange={(e) => setInstructionsAgreed(e.target.checked)}
                    className="mr-3 w-4 h-4 mt-1"
                  />
                  <label htmlFor="agree-terms" className="text-gray-700 text-sm">
                    I have read and agree to the exam instructions and academic integrity policy
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStage('checks')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Check if there's time pending before exam starts
                    if (examStartTime && getSynchronizedTime() < examStartTime) {
                      setCurrentStage('countdown');
                    } else {
                      // Start exam directly if time has passed
                      setCurrentStage('exam');
                      setIsExamStarted(true);
                    }
                  }}
                  disabled={!instructionsAgreed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStage === 'checks' && (
            /* System Checks Screen */
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">System Checks</h2>
                <p className="text-gray-600 text-sm">Quick verification of required devices</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="space-y-4">
                  {/* Camera Check with AI Face Detection */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm">📹</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Camera</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          cameraTest.status === 'success' ? 'text-green-600' :
                          cameraTest.status === 'failed' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {cameraTest.status === 'success' ? '✓ Detected' :
                           cameraTest.status === 'failed' ? '✗ Not found' :
                           'Checking...'}
                        </span>
                        <button
                          onClick={testCamera}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    
                    {/* AI Face Detection Status */}
                    {aiServiceAvailable && (
                      <div className="ml-11 mt-2">
                        <div className={`text-xs px-2 py-1 rounded ${
                          faceDetectionStatus.status === 'success' ? 'bg-green-100 text-green-700' :
                          faceDetectionStatus.status === 'failed' ? 'bg-red-100 text-red-700' :
                          faceDetectionStatus.status === 'testing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {faceDetectionStatus.message || 'Pending face detection...'}
                        </div>
                      </div>
                    )}
                    
                    {!aiServiceAvailable && (
                      <div className="ml-11 mt-2">
                        <div className="text-xs text-gray-500 italic">
                          AI face detection unavailable
                        </div>
                      </div>
                    )}
                    
                    {/* Camera Video Preview with AI Validation */}
                    {cameraStream && (
                      <div className="ml-11 mt-4 mb-4">
                        <div className="relative">
                          <video
                            ref={(video) => {
                              if (video && cameraStream) {
                                video.srcObject = cameraStream;
                                video.play().catch(error => {
                                  // Ignore play() interruptions - this is normal in React StrictMode
                                  console.log('Video play interrupted (normal in dev mode)');
                                });
                              }
                            }}
                            autoPlay
                            muted
                            playsInline
                            className="w-full max-w-md rounded-lg border-2 border-blue-500 shadow-lg"
                            style={{ maxHeight: '300px' }}
                          />
                          {/* AI Validation Overlay */}
                          {faceValidationActive && (
                            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              faceDetectionStatus.status === 'success' ? 'bg-green-500 text-white animate-pulse' :
                              faceDetectionStatus.status === 'failed' ? 'bg-red-500 text-white' :
                              faceDetectionStatus.status === 'testing' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {faceDetectionStatus.status === 'success' && '✓ Validated'}
                              {faceDetectionStatus.status === 'failed' && faceDetectionStatus.message.includes('Multiple') ? '✗ Multiple Faces!' : '✗ No Face!'}
                              {faceDetectionStatus.status === 'testing' && '🔍 Detecting...'}
                              {faceDetectionStatus.status === 'pending' && '⏳ Waiting...'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Microphone Check */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm">🎤</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Microphone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        microphoneTest.status === 'success' ? 'text-green-600' :
                        microphoneTest.status === 'failed' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {microphoneTest.status === 'success' ? '✓ Detected' :
                         microphoneTest.status === 'failed' ? '✗ Not found' :
                         'Checking...'}
                      </span>
                      <button
                        onClick={testMicrophone}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Test All Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={runDeviceTests}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Run All Tests
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {deviceTestPassed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-green-800 text-sm font-medium">All devices verified successfully</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStage('details')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStage('rules')}
                  disabled={!deviceTestPassed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStage === 'countdown' && (
            /* Countdown Screen */
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Exam Starting Soon</h2>
                <p className="text-gray-600">Please wait for the countdown to complete</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-8 border-2 border-blue-200">
                <Clock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Time Remaining</h3>
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {examStartTime ? Math.max(0, Math.ceil((examStartTime.getTime() - getSynchronizedTime().getTime()) / 1000)) : 0}
                </div>
                <p className="text-gray-600 text-lg">seconds until exam starts</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 mb-2">Ready to Start</h3>
                <p className="text-green-700 text-sm">
                  All checks completed. The exam will begin automatically when the countdown reaches zero.
                </p>
              </div>

              <button
                onClick={() => setCurrentStage('rules')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {currentStage === 'exam' && (
            /* Exam Interface */
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold">
                    Question {currentQuestion + 1} of {questions.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Full Screen</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                    <Monitor className="w-4 h-4" />
                    <span className="text-sm font-medium">Monitoring Active</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Navigation */}
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
                <div className="flex flex-wrap gap-3">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-12 h-12 rounded-xl font-semibold transition-all duration-200 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                        index === currentQuestion
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : answers[questions[index].id]
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span>Unanswered</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-700">
                      {Object.keys(answers).length} / {questions.length} answered
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Question */}
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-8 mb-8 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{currentQuestion + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Question {currentQuestion + 1}</h3>
                      <p className="text-sm text-gray-500">Read carefully and select your answer</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-4 py-2 rounded-xl font-semibold">
                    {questions[currentQuestion].marks} marks
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-lg text-gray-800 leading-relaxed">{questions[currentQuestion].question}</p>
                </div>

                {/* Answer Options */}
                <div className="mt-6">
                  {questions[currentQuestion].type === 'mcq' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Select your answer:</h4>
                      {questions[currentQuestion].options.map((option, index) => (
                        <label key={index} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                          answers[questions[currentQuestion].id] === index
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name={`question-${questions[currentQuestion].id}`}
                            value={index}
                            checked={answers[questions[currentQuestion].id] === index}
                            onChange={(e) => handleAnswerChange(questions[currentQuestion].id, parseInt(e.target.value))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 mr-4"
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${
                              answers[questions[currentQuestion].id] === index
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-gray-800 font-medium">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {questions[currentQuestion].type === 'essay' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Write your answer:</h4>
                      <textarea
                        value={answers[questions[currentQuestion].id] || ''}
                        onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
                        placeholder="Type your detailed answer here..."
                        className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 font-medium"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        {answers[questions[currentQuestion].id]?.length || 0} characters
                      </div>
                    </div>
                  )}

                  {questions[currentQuestion].type === 'multiple' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Select all correct answers:</h4>
                      {questions[currentQuestion].options.map((option, index) => (
                        <label key={index} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                          answers[questions[currentQuestion].id]?.includes(index)
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={answers[questions[currentQuestion].id]?.includes(index) || false}
                            onChange={(e) => {
                              const currentAnswers = answers[questions[currentQuestion].id] || [];
                              if (e.target.checked) {
                                handleAnswerChange(questions[currentQuestion].id, [...currentAnswers, index]);
                              } else {
                                handleAnswerChange(questions[currentQuestion].id, currentAnswers.filter(i => i !== index));
                              }
                            }}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mr-4"
                          />
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${
                              answers[questions[currentQuestion].id]?.includes(index)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-gray-800 font-medium">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="group px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Auto-save</div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        autoSaveEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        autoSaveEnabled ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {autoSaveEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {lastAutoSave && (
                      <div className="text-xs text-gray-400 mt-1">
                        Last saved: {new Date(lastAutoSave).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  {currentQuestion === questions.length - 1 && (
                    <button
                      onClick={handleSubmitExam}
                      className="group px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                    >
                      <span>Submit Exam</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === questions.length - 1}
                  className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Exit Exam Warning</h3>
              </div>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Are you sure you want to exit the exam? Your progress will be lost and you may not be able to re-enter.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClose}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Exit Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamInterface;
