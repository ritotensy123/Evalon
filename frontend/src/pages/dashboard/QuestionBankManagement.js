import React, { useState, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  Search,
  Filter,
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
import { questionBankAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QuestionBankManagement = () => {
  // Get auth context
  const { user, organizationData } = useAuth();
  
  // Main state
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalQuestionBanks: 0,
    activeBanks: 0,
    draftBanks: 0,
    archivedBanks: 0
  });

  // Pagination and filters
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalQuestionBanks: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    searchText: '',
    subject: '',
    class: '',
    status: '',
    page: 1,
    limit: 10
  });

  // Create/Edit question bank state
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [editingQuestionBank, setEditingQuestionBank] = useState(null);
  const [questionBankFormData, setQuestionBankFormData] = useState({
    name: '',
    description: '',
    subject: '',
    class: '',
    tags: []
  });

  // Load data on component mount
  useEffect(() => {
    loadQuestionBanks();
    loadStatistics();
  }, [filters]);

  // Load question banks from API
  const loadQuestionBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await questionBankAPI.getQuestionBanks(filters);
      if (response.success) {
        setQuestionBanks(response.data.questionBanks || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error loading question banks:', error);
      setError('Failed to load question banks');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await questionBankAPI.getQuestionBanks({ limit: 1000 });
      if (response.success) {
        const allBanks = response.data.questionBanks || [];
        setStatistics({
          totalQuestionBanks: allBanks.length,
          activeBanks: allBanks.filter(bank => bank.status === 'active').length,
          draftBanks: allBanks.filter(bank => bank.status === 'draft').length,
          archivedBanks: allBanks.filter(bank => bank.status === 'archived').length
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Create new question bank
  const handleCreateQuestionBank = () => {
    setEditingQuestionBank(null);
    setQuestionBankFormData({
      name: '',
      description: '',
      subject: '',
      class: '',
      tags: []
    });
    setShowQuestionBankModal(true);
  };

  // Edit question bank
  const handleEditQuestionBank = (questionBank) => {
    setEditingQuestionBank(questionBank);
    setQuestionBankFormData({
      name: questionBank.name || '',
      description: questionBank.description || '',
      subject: questionBank.subject || '',
      class: questionBank.class || '',
      tags: questionBank.tags || []
    });
    setShowQuestionBankModal(true);
  };

  // Save question bank
  const handleSaveQuestionBank = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate form
      if (!questionBankFormData.name || !questionBankFormData.subject || !questionBankFormData.class) {
        setError('Please fill in all required fields');
        return;
      }

      let response;
      if (editingQuestionBank) {
        response = await questionBankAPI.updateQuestionBank(editingQuestionBank._id, questionBankFormData);
      } else {
        // Add organizationId and createdBy for new question banks
        const questionBankData = {
          ...questionBankFormData,
          organizationId: organizationData?.id,
          createdBy: user?.id
        };
        response = await questionBankAPI.createQuestionBank(questionBankData);
      }

      if (response.success) {
        setShowQuestionBankModal(false);
        setEditingQuestionBank(null);
        loadQuestionBanks();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error saving question bank:', error);
      setError('Failed to save question bank');
    } finally {
      setLoading(false);
    }
  };

  // Delete question bank
  const handleDeleteQuestionBank = async (questionBankId) => {
    if (window.confirm('Are you sure you want to delete this question bank? This will also delete all questions in it.')) {
      try {
        const response = await questionBankAPI.deleteQuestionBank(questionBankId);
        if (response.success) {
          loadQuestionBanks();
          loadStatistics();
        }
      } catch (error) {
        console.error('Error deleting question bank:', error);
        setError('Failed to delete question bank');
      }
    }
  };

  // Duplicate question bank
  const handleDuplicateQuestionBank = async (questionBank) => {
    try {
      const response = await questionBankAPI.duplicateQuestionBank(questionBank._id);
      if (response.success) {
        loadQuestionBanks();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error duplicating question bank:', error);
      setError('Failed to duplicate question bank');
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

  // Status configuration
  const statusConfig = {
    draft: { 
      label: 'Draft', 
      color: 'bg-gray-100 text-gray-800' 
    },
    active: { 
      label: 'Active', 
      color: 'bg-green-100 text-green-800' 
    },
    archived: { 
      label: 'Archived', 
      color: 'bg-red-100 text-red-800' 
    }
  };

  if (loading && questionBanks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading question banks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank Management</h1>
        <p className="text-gray-600">Create and manage collections of questions for your exams</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Banks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalQuestionBanks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Banks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.activeBanks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Draft Banks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.draftBanks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Archived Banks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.archivedBanks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleCreateQuestionBank}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question Bank</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search question banks..."
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
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={loadQuestionBanks}
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

      {/* Question Banks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Question Banks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {questionBanks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No question banks found</h3>
              <p className="text-gray-600 mb-4">Create your first question bank to get started</p>
              <button
                onClick={handleCreateQuestionBank}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Question Bank
              </button>
            </div>
          ) : (
            questionBanks.map((questionBank) => (
              <div key={questionBank._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{questionBank.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[questionBank.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusConfig[questionBank.status]?.label || questionBank.status}
                      </span>
                    </div>
                    {questionBank.description && (
                      <p className="text-gray-700 mb-3">{questionBank.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {questionBank.subject} - {questionBank.class}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {questionBank.totalQuestions || 0} questions
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {questionBank.totalMarks || 0} total marks
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {questionBank.createdAt ? new Date(questionBank.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {Object.entries(questionBank.questionsByType || {}).map(([type, count]) => (
                        count > 0 && (
                          <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {type}: {count}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(`/question-bank/${questionBank._id}`, '_blank')}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Manage Questions"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditQuestionBank(questionBank)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateQuestionBank(questionBank)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestionBank(questionBank._id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalQuestionBanks)} of {pagination.totalQuestionBanks} question banks
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

      {/* Create/Edit Question Bank Modal */}
      {showQuestionBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingQuestionBank ? 'Edit Question Bank' : 'Create New Question Bank'}
                </h2>
                <button
                  onClick={() => setShowQuestionBankModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestionBank} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Bank Name *</label>
                  <input
                    type="text"
                    value={questionBankFormData.name}
                    onChange={(e) => setQuestionBankFormData({...questionBankFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Grade 10 - Algebra"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={questionBankFormData.description}
                    onChange={(e) => setQuestionBankFormData({...questionBankFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the purpose and scope of this question bank"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      value={questionBankFormData.subject}
                      onChange={(e) => setQuestionBankFormData({...questionBankFormData, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                    <input
                      type="text"
                      value={questionBankFormData.class}
                      onChange={(e) => setQuestionBankFormData({...questionBankFormData, class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Grade 10A"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuestionBankModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingQuestionBank ? 'Update' : 'Create')}
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

export default QuestionBankManagement;
