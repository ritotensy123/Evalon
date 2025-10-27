import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Send,
  Save
} from 'lucide-react';
import realtimeSocketService from '../../services/realtimeSocketService';
import { useAuth } from '../../contexts/AuthContext';

const RealtimeStudentExam = ({ examId, examData, onExamComplete }) => {
  const { userData } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    currentQuestion: 0,
    totalQuestions: 0,
    answeredQuestions: 0
  });

  const questionStartTime = useRef(null);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!userData?.token || !examId) return;

    // Connect to real-time service
    const socket = realtimeSocketService.connect(userData.token);
    if (socket) {
      setIsConnected(true);
      startHeartbeat();
    }

    // Set up event listeners
    setupEventListeners();

    // Join exam session
    joinExamSession();

    return () => {
      if (sessionId) {
        realtimeSocketService.endExam('normal');
      }
      realtimeSocketService.stopHeartbeat();
      realtimeSocketService.disconnect();
    };
  }, [userData?.token, examId]);

  const setupEventListeners = () => {
    // Session joined
    realtimeSocketService.onExamSessionJoined((data) => {
      console.log('📝 Exam session joined:', data);
      setSessionId(data.sessionId);
      setTimeRemaining(data.timeRemaining);
      setProgress({
        currentQuestion: 0,
        totalQuestions: data.exam.questions.length,
        answeredQuestions: 0
      });
      setError(null);
    });

    // Time update
    realtimeSocketService.onTimeUpdate((data) => {
      setTimeRemaining(data.timeRemaining);
    });

    // Answer submitted
    realtimeSocketService.onAnswerSubmitted((data) => {
      console.log('✅ Answer submitted:', data);
      setProgress(data.progress);
    });

    // Exam ended
    realtimeSocketService.onExamEnded((data) => {
      console.log('🏁 Exam ended:', data);
      setExamStarted(false);
      if (onExamComplete) {
        onExamComplete(data);
      }
    });

    // Error handling
    realtimeSocketService.onExamError((error) => {
      console.error('❌ Exam error:', error);
      setError(error.message);
    });
  };

  const joinExamSession = async () => {
    if (!examId) return;

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
      };

      const networkInfo = {
        connectionType: navigator.connection?.effectiveType || 'unknown',
        timestamp: new Date().toISOString()
      };

      realtimeSocketService.joinExamSession(examId, null, deviceInfo, networkInfo);
    } catch (error) {
      console.error('Failed to join exam session:', error);
      setError('Failed to join exam session');
    }
  };

  const startHeartbeat = () => {
    realtimeSocketService.startHeartbeat();
  };

  const startExam = () => {
    setExamStarted(true);
    setCurrentQuestion(0);
    questionStartTime.current = Date.now();
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitAnswer = async (questionId) => {
    if (!sessionId || !answers[questionId]) return;

    setIsSubmitting(true);
    try {
      const timeSpent = questionStartTime.current ? 
        Math.floor((Date.now() - questionStartTime.current) / 1000) : 0;

      realtimeSocketService.submitAnswer(questionId, answers[questionId], timeSpent);
      
      // Update local progress
      setProgress(prev => ({
        ...prev,
        answeredQuestions: prev.answeredQuestions + 1
      }));

      // Move to next question
      if (currentQuestion < examData.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        questionStartTime.current = Date.now();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setError('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const endExam = async () => {
    if (!sessionId) return;

    try {
      realtimeSocketService.endExam('normal');
    } catch (error) {
      console.error('Failed to end exam:', error);
      setError('Failed to end exam');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentQuestion = () => {
    if (!examData?.questions || currentQuestion >= examData.questions.length) {
      return null;
    }
    return examData.questions[currentQuestion];
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Connecting to exam...</h3>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CircularProgress />
          <p className="mt-4">Joining exam session...</p>
        </CardContent>
      </Card>
    );
  }

  if (!examStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-600" />
            Ready to Start Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{examData?.title || 'Exam'}</h3>
              <p className="text-gray-600 mb-4">
                Duration: {examData?.duration || 60} minutes
              </p>
              <p className="text-gray-600 mb-6">
                Questions: {examData?.questions?.length || 0}
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button
                variant="contained"
                size="large"
                onClick={startExam}
                startIcon={<CheckCircle className="w-5 h-5" />}
              >
                Start Exam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = getCurrentQuestion();
  if (!question) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Exam Completed!</h3>
          <p className="text-gray-600 mb-4">
            You have answered all questions.
          </p>
          <Button
            variant="contained"
            onClick={endExam}
            startIcon={<Send className="w-4 h-4" />}
          >
            Submit Exam
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status and Timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="font-medium">
                  {progress.answeredQuestions} / {progress.totalQuestions}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Time Remaining</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle>
            Question {currentQuestion + 1} of {examData.questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-lg font-medium">
              {question.question}
            </div>
            
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question_${question._id}`}
                    value={option}
                    checked={answers[question._id] === option}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outlined"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  startIcon={<Save className="w-4 h-4" />}
                  disabled={!answers[question._id] || isSubmitting}
                >
                  Save Answer
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Send className="w-4 h-4" />}
                  disabled={!answers[question._id] || isSubmitting}
                  onClick={() => submitAnswer(question._id)}
                >
                  {isSubmitting ? <CircularProgress size={20} /> : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeStudentExam;
