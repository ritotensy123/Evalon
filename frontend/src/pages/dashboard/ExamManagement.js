import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { examAPI, questionBankAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ExamManagement = () => {
  // Get auth context
  const { user, organizationData } = useAuth();
  
  // Main state
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalExams: 0,
    activeExams: 0,
    scheduledExams: 0,
    completedExams: 0
  });

  // Create exam state
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examFormData, setExamFormData] = useState({
    title: '',
    subject: '',
    class: '',
    examType: 'mcq',
    totalQuestions: 0,
    marksPerQuestion: 0,
    totalMarks: 0,
    scheduledDate: '',
    startTime: '',
    duration: 0
  });

  // Assign question bank to exam state
  const [selectedExam, setSelectedExam] = useState(null);
  const [showAssignQuestionBank, setShowAssignQuestionBank] = useState(false);
  const [availableQuestionBanks, setAvailableQuestionBanks] = useState([]);
  const [selectedQuestionBank, setSelectedQuestionBank] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadExams();
    loadStatistics();
  }, []);

  // Load exams from API
  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examAPI.getExams();
      if (response.success) {
        setExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await examAPI.getExams({ limit: 1000 });
      if (response.success) {
        const allExams = response.data.exams || [];
        setStatistics({
          totalExams: allExams.length,
          activeExams: allExams.filter(exam => exam.status === 'active').length,
          scheduledExams: allExams.filter(exam => exam.status === 'scheduled').length,
          completedExams: allExams.filter(exam => exam.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Create new exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Calculate total marks
      const totalMarks = examFormData.totalQuestions * examFormData.marksPerQuestion;
      
      // Add organizationId and createdBy for new exams
      const examData = {
        ...examFormData,
        totalMarks: totalMarks,
        organizationId: organizationData?.id,
        createdBy: user?.id
      };
      const response = await examAPI.createExam(examData);
      if (response.success) {
        setExams([response.data.exam, ...exams]);
        setShowCreateExam(false);
        setExamFormData({
          title: '',
          subject: '',
          class: '',
          examType: 'mcq',
          totalQuestions: 0,
          marksPerQuestion: 0,
          totalMarks: 0,
          scheduledDate: '',
          startTime: '',
          duration: 0
        });
        loadStatistics();
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      setError('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  // Load available question banks for exam
  const loadAvailableQuestionBanks = async (exam) => {
    try {
      setLoading(true);
      const response = await questionBankAPI.getQuestionBanks({
        subject: exam.subject,
        status: 'active',
        limit: 100
      });
      if (response.success) {
        setAvailableQuestionBanks(response.data.questionBanks || []);
      }
    } catch (error) {
      console.error('Error loading available question banks:', error);
      setError('Failed to load available question banks');
    } finally {
      setLoading(false);
    }
  };

  // Assign question bank to exam
  const handleAssignQuestionBankToExam = (exam) => {
    setSelectedExam(exam);
    setShowAssignQuestionBank(true);
    loadAvailableQuestionBanks(exam);
  };

  // Save question bank assignment to exam
  const handleSaveQuestionBankToExam = async () => {
    if (!selectedQuestionBank) {
      setError('Please select a question bank');
      return;
    }

    try {
      setLoading(true);
      const response = await examAPI.assignQuestionBankToExam(selectedExam.id, selectedQuestionBank._id);
      if (response.success) {
        setShowAssignQuestionBank(false);
        setSelectedExam(null);
        setSelectedQuestionBank(null);
        setAvailableQuestionBanks([]);
        loadExams();
      }
    } catch (error) {
      console.error('Error assigning question bank to exam:', error);
      setError('Failed to assign question bank to exam');
    } finally {
      setLoading(false);
    }
  };

  // Update exam status
  const handleExamStatusChange = async (examId, newStatus) => {
    try {
      const response = await examAPI.updateExamStatus(examId, newStatus);
      if (response.success) {
        const updatedExams = exams.map(exam => 
          exam.id === examId ? { ...exam, status: newStatus } : exam
        );
        setExams(updatedExams);
        loadStatistics();
      }
    } catch (error) {
      console.error('Error updating exam status:', error);
      setError('Failed to update exam status');
    }
  };

  // Delete exam
  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        const response = await examAPI.deleteExam(examId);
        if (response.success) {
          setExams(exams.filter(exam => exam.id !== examId));
          loadStatistics();
        }
      } catch (error) {
        console.error('Error deleting exam:', error);
        setError('Failed to delete exam');
      }
    }
  };

  // Status configuration
  const statusConfig = {
    scheduled: { 
      label: 'Scheduled', 
      color: 'bg-blue-100 text-blue-800', 
      icon: Calendar 
    },
    active: { 
      label: 'Active', 
      color: 'bg-green-100 text-green-800', 
      icon: Play 
    },
    paused: { 
      label: 'Paused', 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: Pause 
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-gray-100 text-gray-800', 
      icon: CheckCircle 
    }
  };

  // Exam type configuration
  const examTypeConfig = {
    mcq: { label: 'MCQ', icon: BookOpen },
    subjective: { label: 'Subjective', icon: Edit }
  };

  if (loading && exams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Management</h1>
        <p className="text-gray-600">Create and manage exams with questions from the question bank</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.activeExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.scheduledExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.completedExams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateExam(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
          </div>
          <button
            onClick={loadExams}
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exams</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {exams.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
              <p className="text-gray-600 mb-4">Create your first exam to get started</p>
              <button
                onClick={() => setShowCreateExam(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Exam
              </button>
            </div>
          ) : (
            exams.map((exam) => {
              const StatusIcon = statusConfig[exam.status].icon;
              const ExamTypeIcon = examTypeConfig[exam.examType].icon;
              
              return (
                <div key={exam.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[exam.status].color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusConfig[exam.status].label}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          <ExamTypeIcon className="w-3 h-3 inline mr-1" />
                          {examTypeConfig[exam.examType].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          {exam.subject} - {exam.class}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {exam.scheduledDate} at {exam.startTime}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {exam.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {exam.questionsAdded}/{exam.totalQuestions} questions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {exam.status === 'scheduled' && !exam.questionBankId && (
                        <button
                          onClick={() => handleAssignQuestionBankToExam(exam)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Assign Question Bank
                        </button>
                      )}
                      {exam.status === 'scheduled' && (
                        <button
                          onClick={() => handleExamStatusChange(exam.id, 'active')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Start
                        </button>
                      )}
                      {exam.status === 'active' && (
                        <button
                          onClick={() => handleExamStatusChange(exam.id, 'paused')}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          Pause
                        </button>
                      )}
                      {exam.status === 'paused' && (
                        <button
                          onClick={() => handleExamStatusChange(exam.id, 'active')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Exam</h2>
                <button
                  onClick={() => setShowCreateExam(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={examFormData.title}
                    onChange={(e) => setExamFormData({...examFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Mid-term Exam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={examFormData.subject}
                    onChange={(e) => setExamFormData({...examFormData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter subject name (e.g., Mathematics, Science, English)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <input
                    type="text"
                    value={examFormData.class}
                    onChange={(e) => setExamFormData({...examFormData, class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Grade 10A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={examFormData.examType}
                    onChange={(e) => setExamFormData({...examFormData, examType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mcq">Multiple Choice Questions (MCQ)</option>
                    <option value="subjective">Subjective Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                  <input
                    type="number"
                    value={examFormData.totalQuestions}
                    onChange={(e) => setExamFormData({...examFormData, totalQuestions: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marks per Question</label>
                  <input
                    type="number"
                    value={examFormData.marksPerQuestion}
                    onChange={(e) => setExamFormData({...examFormData, marksPerQuestion: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                  <input
                    type="date"
                    value={examFormData.scheduledDate}
                    onChange={(e) => setExamFormData({...examFormData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={examFormData.startTime}
                    onChange={(e) => setExamFormData({...examFormData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={examFormData.duration}
                    onChange={(e) => setExamFormData({...examFormData, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                {/* Total Marks Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Total Marks:</span>
                    <span className="text-lg font-bold text-blue-900">
                      {examFormData.totalQuestions * examFormData.marksPerQuestion}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {examFormData.totalQuestions} questions × {examFormData.marksPerQuestion} marks each
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateExam(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Question Bank Modal */}
      {showAssignQuestionBank && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Question Bank to {selectedExam.title}</h2>
                <button
                  onClick={() => {
                    setShowAssignQuestionBank(false);
                    setSelectedExam(null);
                    setSelectedQuestionBank(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Available Question Banks</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableQuestionBanks.map((questionBank) => (
                    <div
                      key={questionBank._id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedQuestionBank?._id === questionBank._id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedQuestionBank(questionBank)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{questionBank.name}</h4>
                          {questionBank.description && (
                            <p className="text-sm text-gray-600 mb-3">{questionBank.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {questionBank.subject} - {questionBank.class}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {questionBank.totalQuestions} questions
                            </span>
                            <span className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {questionBank.totalMarks} total marks
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {Object.entries(questionBank.questionsByType || {}).map(([type, count]) => (
                              count > 0 && (
                                <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {type}: {count}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                        {selectedQuestionBank?._id === questionBank._id && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuestionBank && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Selected Question Bank</h4>
                  <p className="text-purple-800">{selectedQuestionBank.name}</p>
                  <p className="text-sm text-purple-700">
                    {selectedQuestionBank.totalQuestions} questions • {selectedQuestionBank.totalMarks} total marks
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowAssignQuestionBank(false);
                    setSelectedExam(null);
                    setSelectedQuestionBank(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestionBankToExam}
                  disabled={loading || !selectedQuestionBank}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Question Bank'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;