import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  BarChart3,
  X
} from 'lucide-react';

const ExamEvaluator = ({ exam, onClose, onExamStart, onExamEnd, timeRemaining = 0, isTimerRunning = false }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [studentsOnline, setStudentsOnline] = useState(0);
  const [submissions, setSubmissions] = useState(0);

  // Check if exam can actually be started (at scheduled time)
  const canActuallyStartExam = () => {
    if (!exam.scheduledDate || !exam.startTime) return false;
    
    const now = new Date();
    
    // Handle different date formats - extract just the date part
    let scheduledDateStr;
    if (exam.scheduledDate instanceof Date) {
      scheduledDateStr = exam.scheduledDate.toISOString().split('T')[0];
    } else if (typeof exam.scheduledDate === 'string') {
      if (exam.scheduledDate.includes('T')) {
        scheduledDateStr = exam.scheduledDate.split('T')[0];
      } else {
        scheduledDateStr = exam.scheduledDate;
      }
    } else {
      return false;
    }
    
    // Create the scheduled date time
    const scheduledDateTime = new Date(`${scheduledDateStr}T${exam.startTime}`);
    
    // Check if the date is valid
    if (isNaN(scheduledDateTime.getTime())) {
      return false;
    }
    
    // Can actually start only at or after the scheduled time
    return now >= scheduledDateTime;
  };

  useEffect(() => {
    // Sync evaluator state with exam status
    if (exam && exam.status === 'active') {
      setExamStarted(true);
    } else if (exam && exam.status === 'scheduled') {
      setExamStarted(false);
    }
  }, [exam]);

  const handleStartExam = () => {
    setExamStarted(true);
    if (onExamStart) {
      onExamStart(exam.id);
    }
  };

  const handleEndExam = () => {
    console.log('🛑 handleEndExam called for exam:', exam.id);
    if (window.confirm('Are you sure you want to end this exam? This action cannot be undone.')) {
      console.log('✅ User confirmed ending exam');
      setExamStarted(false);
      if (onExamEnd) {
        console.log('📞 Calling onExamEnd callback with exam ID:', exam.id);
        onExamEnd(exam.id);
      } else {
        console.warn('⚠️ onExamEnd callback not provided');
      }
      // Close the evaluator after ending the exam
      if (onClose) {
        console.log('🚪 Closing evaluator');
        onClose();
      }
    } else {
      console.log('❌ User cancelled ending exam');
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
    if (!timeRemaining || timeRemaining === 0) return 'text-gray-600';
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 900) return 'text-yellow-600'; // Less than 15 minutes
    return 'text-green-600';
  };

  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Exam Evaluator</h2>
              <h3 className="text-lg font-semibold">{exam.title}</h3>
              <p className="text-blue-100 mt-1">
                {exam.subject} • {exam.class} • {exam.examType.toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Exam Timing Status */}
          {!examStarted && (
            <div className={`mb-6 p-4 rounded-lg border ${
              canActuallyStartExam() 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center">
                <Clock className={`w-5 h-5 mr-2 ${
                  canActuallyStartExam() ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <p className={`font-medium ${
                  canActuallyStartExam() ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {canActuallyStartExam() 
                    ? 'Exam is ready to start at the scheduled time' 
                    : 'Exam will be available to start at the scheduled time'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Status</p>
                  <p className="text-lg font-bold text-green-900">
                    {examStarted ? 'Active' : 'Ready'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Time Remaining</p>
                  <p className={`text-lg font-bold ${getTimeColor()}`}>
                    {timeRemaining ? formatTime(timeRemaining) : '--:--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-800">Students Online</p>
                  <p className="text-lg font-bold text-purple-900">
                    {studentsOnline}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">Submissions</p>
                  <p className="text-lg font-bold text-orange-900">
                    {submissions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Exam Controls</h4>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {!examStarted ? (
                <button
                  onClick={handleStartExam}
                  disabled={!canActuallyStartExam()}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
                    canActuallyStartExam() 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {canActuallyStartExam() ? 'Start Exam Now' : 'Exam Not Ready'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setExamStarted(false)}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Exam
                  </button>
                  <button
                    onClick={handleEndExam}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    End Exam
                  </button>
                </>
              )}
              
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Monitor Students
              </button>
              
              <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </button>
            </div>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Exam Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{exam.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{exam.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{exam.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{exam.examType.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Student Activity</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-800">Active Students</span>
                  <span className="font-semibold text-green-900">{studentsOnline}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">Submissions</span>
                  <span className="font-semibold text-blue-900">{submissions}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-800">Pending</span>
                  <span className="font-semibold text-gray-900">
                    {Math.max(0, studentsOnline - submissions)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="inline-flex items-center px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Close Evaluator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamEvaluator;
