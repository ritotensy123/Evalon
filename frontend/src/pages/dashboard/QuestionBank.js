import React, { useState, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  FileText,
  CheckSquare,
  Square,
  RefreshCw,
  Loader2,
  Save,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { questionAPI, questionBankAPI } from '../../services/api';

const QuestionBank = ({ questionBankId }) => {
  // Main state
  const [questions, setQuestions] = useState([]);
  const [questionBank, setQuestionBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalQuestions: 0,
    questionsBySubject: {},
    questionsByDifficulty: {},
    questionsByType: {}
  });

  // Pagination and filters
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalQuestions: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    searchText: '',
    subject: '',
    difficulty: '',
    questionType: '',
    page: 1,
    limit: 10
  });

  // Create/Edit question state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    title: '',
    questionText: '',
    questionType: 'multiple_choice',
    subject: '',
    category: '',
    difficulty: 'easy',
    marks: 1,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '',
    explanation: '',
    tags: []
  });

  // Load data on component mount
  useEffect(() => {
    if (questionBankId) {
      loadQuestionBank();
      loadQuestions();
      loadStatistics();
    }
  }, [questionBankId, filters]);

  // Load question bank details
  const loadQuestionBank = async () => {
    try {
      const response = await questionBankAPI.getQuestionBankById(questionBankId);
      if (response.success) {
        setQuestionBank(response.data.questionBank);
      }
    } catch (error) {
      console.error('Error loading question bank:', error);
      setError('Failed to load question bank');
    }
  };

  // Load questions from API
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await questionBankAPI.getQuestionsInBank(questionBankId);
      if (response.success) {
        setQuestions(response.data.questions || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await questionBankAPI.getQuestionBankStatistics(questionBankId);
      if (response.success) {
        setStatistics(response.data.statistics || {});
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Create new question
  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      title: '',
      questionText: '',
      questionType: 'multiple_choice',
      subject: '',
      category: '',
      difficulty: 'easy',
      marks: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      explanation: '',
      tags: []
    });
    setShowQuestionModal(true);
  };

  // Edit question
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionFormData({
      title: question.title || '',
      questionText: question.questionText || '',
      questionType: question.questionType || 'multiple_choice',
      subject: question.subject || '',
      category: question.category || '',
      difficulty: question.difficulty || 'easy',
      marks: question.marks || 1,
      options: question.options || [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      tags: question.tags || []
    });
    setShowQuestionModal(true);
  };

  // Save question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate form
      if (!questionFormData.questionText || !questionFormData.subject) {
        setError('Please fill in all required fields');
        return;
      }

      if (questionFormData.questionType === 'multiple_choice') {
        const hasCorrectOption = questionFormData.options.some(option => option.isCorrect);
        if (!hasCorrectOption) {
          setError('Please select at least one correct option');
          return;
        }
      }

      let response;
      if (editingQuestion) {
        response = await questionAPI.updateQuestion(editingQuestion._id, questionFormData);
      } else {
        // Add question to the question bank
        response = await questionBankAPI.addQuestionsToBank(questionBankId, [questionFormData]);
      }

      if (response.success) {
        setShowQuestionModal(false);
        setEditingQuestion(null);
        loadQuestions();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error saving question:', error);
      setError('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await questionBankAPI.removeQuestionFromBank(questionBankId, questionId);
        if (response.success) {
          loadQuestions();
          loadStatistics();
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        setError('Failed to delete question');
      }
    }
  };

  // Duplicate question
  const handleDuplicateQuestion = async (question) => {
    try {
      const response = await questionAPI.duplicateQuestion(question._id);
      if (response.success) {
        loadQuestions();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error duplicating question:', error);
      setError('Failed to duplicate question');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset to page 1 when changing other filters
    }));
  };

  // Handle option change
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...questionFormData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  // Add new option
  const addOption = () => {
    setQuestionFormData({
      ...questionFormData,
      options: [...questionFormData.options, { text: '', isCorrect: false }]
    });
  };

  // Remove option
  const removeOption = (index) => {
    const newOptions = questionFormData.options.filter((_, i) => i !== index);
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  // Difficulty configuration
  const difficultyConfig = {
    easy: { label: 'Easy', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    hard: { label: 'Hard', color: 'bg-red-100 text-red-800' }
  };

  // Question type configuration
  const questionTypeConfig = {
    multiple_choice: { label: 'Multiple Choice', icon: CheckSquare },
    subjective: { label: 'Subjective', icon: FileText },
    true_false: { label: 'True/False', icon: Square },
    numeric: { label: 'Numeric', icon: TrendingUp }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {questionBank ? questionBank.name : 'Question Bank'}
            </h1>
            <p className="text-gray-600">
              {questionBank ? `${questionBank.subject} - ${questionBank.class}` : 'Manage and organize questions for your exams'}
            </p>
            {questionBank?.description && (
              <p className="text-gray-500 mt-1">{questionBank.description}</p>
            )}
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Question Banks</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Multiple Choice</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.questionsByType?.multiple_choice || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Edit className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subjective</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.questionsByType?.subjective || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Difficulty</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.questionsByDifficulty?.easy > statistics.questionsByDifficulty?.hard ? 'Easy' : 'Medium'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleCreateQuestion}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {Object.keys(statistics.questionsBySubject || {}).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filters.questionType}
              onChange={(e) => handleFilterChange('questionType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="subjective">Subjective</option>
              <option value="true_false">True/False</option>
              <option value="numeric">Numeric</option>
            </select>

            <button
              onClick={loadQuestions}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
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

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-4">Create your first question to get started</p>
              <button
                onClick={handleCreateQuestion}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Question
              </button>
            </div>
          ) : (
            questions.map((question) => {
              const QuestionTypeIcon = questionTypeConfig[question.questionType]?.icon || FileText;
              
              return (
                <div key={question._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {question.title || 'Untitled Question'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyConfig[question.difficulty]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {difficultyConfig[question.difficulty]?.label || question.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          <QuestionTypeIcon className="w-3 h-3 inline mr-1" />
                          {questionTypeConfig[question.questionType]?.label || question.questionType}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {question.marks} marks
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{question.questionText}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {question.subject}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {question.createdAt ? new Date(question.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {question.analytics?.totalAttempts > 0 && (
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {question.analytics.totalAttempts} attempts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(question)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalQuestions)} of {pagination.totalQuestions} questions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Create New Question'}
                </h2>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                  <input
                    type="text"
                    value={questionFormData.title}
                    onChange={(e) => setQuestionFormData({...questionFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter question title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                  <textarea
                    value={questionFormData.questionText}
                    onChange={(e) => setQuestionFormData({...questionFormData, questionText: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter the question text"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                    <select
                      value={questionFormData.questionType}
                      onChange={(e) => setQuestionFormData({...questionFormData, questionType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="subjective">Subjective</option>
                      <option value="true_false">True/False</option>
                      <option value="numeric">Numeric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                    <select
                      value={questionFormData.difficulty}
                      onChange={(e) => setQuestionFormData({...questionFormData, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      value={questionFormData.subject}
                      onChange={(e) => setQuestionFormData({...questionFormData, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={questionFormData.category}
                      onChange={(e) => setQuestionFormData({...questionFormData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Algebra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks *</label>
                    <input
                      type="number"
                      value={questionFormData.marks}
                      onChange={(e) => setQuestionFormData({...questionFormData, marks: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Options for Multiple Choice */}
                {questionFormData.questionType === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                    {questionFormData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Option ${index + 1}`}
                        />
                        {questionFormData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                {/* Correct Answer for Non-MCQ */}
                {questionFormData.questionType !== 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                    <textarea
                      value={questionFormData.correctAnswer}
                      onChange={(e) => setQuestionFormData({...questionFormData, correctAnswer: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="2"
                      placeholder="Enter the correct answer"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                  <textarea
                    value={questionFormData.explanation}
                    onChange={(e) => setQuestionFormData({...questionFormData, explanation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="2"
                    placeholder="Enter explanation for the answer"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;