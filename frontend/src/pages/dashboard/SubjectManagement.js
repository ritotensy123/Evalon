import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjectAPI, departmentAPI } from '../../services/api';
import SubjectList from '../../components/subject/SubjectList';
import SubjectForm from '../../components/subject/SubjectForm';
import SubjectStats from '../../components/subject/SubjectStats';

const SubjectManagement = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: '',
    category: '',
    subjectType: '',
    status: 'active'
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchStats();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      
      const response = await subjectAPI.getAll(params);
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (err) {
      setError('Failed to fetch subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await subjectAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateSubject = async (subjectData) => {
    try {
      const response = await subjectAPI.create(subjectData);
      if (response.success) {
        await fetchSubjects();
        await fetchStats();
        setShowForm(false);
        setSelectedSubject(null);
      } else {
        setError(response.message || 'Failed to create subject');
      }
    } catch (err) {
      setError('Failed to create subject');
      console.error('Error creating subject:', err);
    }
  };

  const handleUpdateSubject = async (id, subjectData) => {
    try {
      const response = await subjectAPI.update(id, subjectData);
      if (response.success) {
        await fetchSubjects();
        await fetchStats();
        setShowForm(false);
        setSelectedSubject(null);
      } else {
        setError(response.message || 'Failed to update subject');
      }
    } catch (err) {
      setError('Failed to update subject');
      console.error('Error updating subject:', err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Are you sure you want to archive this subject?')) {
      try {
        const response = await subjectAPI.delete(id);
        if (response.success) {
          await fetchSubjects();
          await fetchStats();
        } else {
          setError(response.message || 'Failed to delete subject');
        }
      } catch (err) {
        setError('Failed to delete subject');
        console.error('Error deleting subject:', err);
      }
    }
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      departmentId: '',
      category: '',
      subjectType: '',
      status: 'active'
    });
  };

  const tabs = [
    { id: 'list', label: 'Subject List', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading subjects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
          <p className="text-gray-600">Manage subjects across your organization's departments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setError(null);
              fetchSubjects();
              fetchDepartments();
              fetchStats();
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="science">Science</option>
                <option value="mathematics">Mathematics</option>
                <option value="language">Language</option>
                <option value="social">Social</option>
                <option value="arts">Arts</option>
                <option value="commerce">Commerce</option>
                <option value="technology">Technology</option>
                <option value="physical">Physical</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Type
              </label>
              <select
                value={filters.subjectType}
                onChange={(e) => handleFilterChange('subjectType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="practical">Practical</option>
                <option value="theory">Theory</option>
                <option value="project">Project</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <SubjectList
              subjects={subjects}
              departments={departments}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
              loading={loading}
            />
          )}

          {activeTab === 'stats' && (
            <SubjectStats stats={stats} />
          )}
        </div>
      </div>

      {/* Subject Form Modal */}
      {showForm && (
        <SubjectForm
          subject={selectedSubject}
          departments={departments}
          onSubmit={selectedSubject ? 
            (data) => handleUpdateSubject(selectedSubject._id, data) :
            handleCreateSubject
          }
          onClose={() => {
            setShowForm(false);
            setSelectedSubject(null);
          }}
        />
      )}
    </div>
  );
};

export default SubjectManagement;
