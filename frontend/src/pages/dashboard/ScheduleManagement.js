import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { examAPI } from '../../services/api';

const ScheduleManagement = ({ onNavigateToModule }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // Load exams for scheduling
  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examAPI.getExams({
        status: 'scheduled',
        limit: 100
      });
      
      if (response.success) {
        setExams(response.data.exams || []);
      } else {
        setError('Failed to load exams');
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Get exams for a specific date
  const getExamsForDate = (date) => {
    return exams.filter(exam => {
      const examDate = new Date(exam.scheduledDate);
      return examDate.toDateString() === date.toDateString();
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (time) => {
    return time || 'Not specified';
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Navigate calendar
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Handle exam selection
  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setShowExamDetails(true);
  };

  // Schedule exam (move from draft to scheduled)
  const handleScheduleExam = async (exam) => {
    try {
      setLoading(true);
      const response = await examAPI.updateExamStatus(exam._id, 'scheduled');
      if (response.success) {
        loadExams(); // Reload exams
      }
    } catch (error) {
      console.error('Error scheduling exam:', error);
      setError('Failed to schedule exam');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">📅 Exam Schedule</h1>
          <p className="text-xs text-gray-600">Click on exam events to go to exam module</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Previous month"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-1.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = day.toDateString() === today.toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const dayExams = getExamsForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] border-r border-b border-gray-200 last:border-r-0 p-1.5 transition-all duration-200 ${
                  isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : ''} ${
                  isSelected ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' : ''
                } cursor-pointer`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-700 bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs' : ''} ${
                  isSelected ? 'text-purple-700' : ''
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Exam indicators - very compact */}
                <div className="space-y-0.5">
                  {dayExams.slice(0, 1).map((exam, examIndex) => (
                    <div
                      key={examIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to exam module
                        if (onNavigateToModule) {
                          onNavigateToModule('exams');
                        }
                      }}
                      className="text-xs p-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded cursor-pointer hover:from-purple-200 hover:to-blue-200 transition-all duration-200 border border-purple-200 hover:border-purple-300"
                      title={`${exam.title} - ${exam.subject} at ${formatTime(exam.startTime)}`}
                    >
                      <div className="font-medium truncate text-xs">{exam.title}</div>
                    </div>
                  ))}
                  {dayExams.length > 1 && (
                    <div className="text-xs text-gray-500 bg-gray-100 rounded p-0.5 text-center">
                      +{dayExams.length - 1}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Exams */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-purple-600" />
              Exams on {formatDate(selectedDate)}
            </h3>
            <p className="text-gray-600 text-xs">
              {getExamsForDate(selectedDate).length} exam{getExamsForDate(selectedDate).length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          
          <div className="p-3">
            {getExamsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">No exams scheduled</h4>
                <p className="text-xs text-gray-500">This date is free from exams</p>
              </div>
            ) : (
              <div className="grid gap-1.5">
                {getExamsForDate(selectedDate).map((exam) => (
                  <div
                    key={exam._id}
                    className="group flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded hover:from-purple-50 hover:to-blue-50 cursor-pointer transition-all duration-200 border border-gray-200 hover:border-purple-200"
                    onClick={() => {
                      // Navigate to exam module
                      if (onNavigateToModule) {
                        onNavigateToModule('exams');
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <h4 className="font-semibold text-gray-900 text-xs">{exam.title}</h4>
                        <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                          exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span className="flex items-center">
                          <BookOpen className="w-2.5 h-2.5 mr-0.5 text-purple-600" />
                          <span className="font-medium">{exam.subject}</span>
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5 text-blue-600" />
                          <span className="font-medium">{formatTime(exam.startTime)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to exam module
                          if (onNavigateToModule) {
                            onNavigateToModule('exams');
                          }
                        }}
                        className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded transition-all duration-200"
                        title="Go to exam module"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Details Modal */}
      {showExamDetails && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-purple-600" />
                    Exam Details
                  </h3>
                  <p className="text-gray-600 mt-1">Complete information about the scheduled exam</p>
                </div>
                <button
                  onClick={() => setShowExamDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedExam.title}</h4>
                  <p className="text-gray-600">{selectedExam.description || 'No description provided'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Subject</label>
                    </div>
                    <p className="text-gray-900 font-medium">{selectedExam.subject}</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Class</label>
                    </div>
                    <p className="text-gray-900 font-medium">{selectedExam.class}</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-green-600 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Date</label>
                    </div>
                    <p className="text-gray-900 font-medium">{formatDate(new Date(selectedExam.scheduledDate))}</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-orange-600 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Time</label>
                    </div>
                    <p className="text-gray-900 font-medium">{formatTime(selectedExam.startTime)}</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-red-600 mr-2" />
                      <label className="text-sm font-semibold text-gray-700">Duration</label>
                    </div>
                    <p className="text-gray-900 font-medium">{selectedExam.duration} minutes</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <span className="w-5 h-5 bg-blue-100 rounded-full mr-2"></span>
                      <label className="text-sm font-semibold text-gray-700">Status</label>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedExam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedExam.status}
                    </span>
                  </div>
                </div>

                {selectedExam.questionBankId && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">📚</span>
                      <h5 className="text-lg font-bold text-green-900">Assigned Question Bank</h5>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-green-800 font-semibold text-lg mb-2">{selectedExam.questionBankId.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-green-700">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {selectedExam.questionBankId.totalQuestions} questions
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {selectedExam.questionBankId.totalMarks} marks
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowExamDetails(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {selectedExam.status === 'draft' && (
                    <button
                      onClick={() => handleScheduleExam(selectedExam)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
                    >
                      📅 Schedule Exam
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
