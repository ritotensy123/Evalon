import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Upload,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  Plus,
  FileText,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  BookOpen,
  Calendar,
  Phone,
  MapPin,
  User,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Target,
  Users as UsersIcon,
  School,
  Book,
  PenTool,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle as XCircleIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementAPI } from '../../services/api';
import { studentService } from '../../services/studentAPI';
import UserForm from '../../components/userManagement/UserForm';
import BulkStudentUpload from '../../components/userManagement/BulkStudentUpload';
import UserDetailsModal from '../../components/userManagement/UserDetailsModal';
import DeleteConfirmationModal from '../../components/userManagement/DeleteConfirmationModal';
import '../../styles/userManagement.css';

const StudentManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  
  // Data states
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    suspended: 0,
    byGrade: {},
    byDepartment: {},
    newThisMonth: 0,
    emailVerified: 0,
    phoneVerified: 0
  });
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  // Get organization ID from user context
  const organizationId = user?.organizationId || user?.organization?._id;

  // Fetch data functions
  const fetchStudentStats = async () => {
    if (!user || !user.token) {
      console.log('No user or token available');
      return;
    }
    try {
      console.log('📊 Fetching student stats...');
      const response = await studentService.getStudentStats();
      console.log('📊 Student stats response:', response);
      if (response.stats) {
        setStats(response.stats);
        console.log('📊 Student stats updated:', response.stats);
      } else {
        console.log('📊 No stats in response:', response);
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Don't set error state for stats, just log it
    }
  };

  const fetchStudents = async () => {
    if (!user || !user.token) {
      console.log('No user or token available for fetching students');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        search: searchTerm,
        grade: filterGrade !== 'all' ? filterGrade : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        department: filterDepartment !== 'all' ? filterDepartment : undefined,
      };

      console.log('📚 Fetching students with params:', params);
      const response = await studentService.getStudents(params);
      console.log('📚 Students response:', response);
      
      if (response.students) {
        setStudents(response.students);
        console.log('📚 Students updated:', response.students.length, 'students');
      } else {
        setStudents([]);
        console.log('📚 No students in response, setting empty array');
      }
      
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      }));
      
      console.log('📚 Pagination updated:', {
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching grade distribution...');
      const response = await studentService.getStudentStats();
      console.log('📊 Grade distribution response:', response);
      setGradeDistribution(response.gradeDistribution || []);
      console.log('📊 Grade distribution updated:', response.gradeDistribution);
    } catch (error) {
      console.error('Error fetching grade distribution:', error);
    }
  };

  const fetchDepartmentDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching department distribution...');
      const response = await studentService.getStudentStats();
      console.log('📊 Department distribution response:', response);
      setDepartmentDistribution(response.departmentDistribution || []);
      console.log('📊 Department distribution updated:', response.departmentDistribution);
    } catch (error) {
      console.error('Error fetching department distribution:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching recent activity...');
      const response = await userManagementAPI.getRecentActivity(organizationId, 5);
      console.log('📊 Recent activity response:', response);
      if (response.success) {
        setRecentActivity(response.data);
        console.log('📊 Recent activity updated:', response.data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchStudentStats();
      fetchGradeDistribution();
      fetchDepartmentDistribution();
      fetchRecentActivity();
    }
  }, [user, organizationId]);

  useEffect(() => {
    if (user && user.token) {
      fetchStudents();
    }
  }, [user, organizationId, pagination.current, searchTerm, filterGrade, filterStatus, filterDepartment]);

  // Refresh data when switching to overview tab
  useEffect(() => {
    if (user && user.token && activeTab === 'overview') {
      console.log('🔄 Refreshing student overview data...');
      refreshData();
    }
  }, [activeTab, user, organizationId]);

  // Refresh function
  const refreshData = async () => {
    setError(null);
    console.log('🔄 Refreshing student data...');
    await Promise.all([
      fetchStudents(),
      fetchStudentStats(),
      fetchGradeDistribution(),
      fetchDepartmentDistribution(),
      fetchRecentActivity()
    ]);
    console.log('✅ Student data refreshed');
  };

  // Event handlers
  const handleAddStudent = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditStudent = (student) => {
    setSelectedUser(student);
    setShowUserForm(true);
  };

  const handleViewStudent = (student) => {
    setSelectedUser(student);
    setShowUserDetails(true);
  };

  const handleDeleteStudent = (student) => {
    setUserToDelete(student);
    setShowDeleteConfirmation(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkConfirmation(true);
  };

  const handleUserFormSave = async (userData) => {
    try {
      const response = selectedUser 
        ? await userManagementAPI.updateUser(selectedUser._id, { ...userData, userType: 'student' })
        : await userManagementAPI.createUser({ ...userData, userType: 'student' });
      
      if (response.success) {
        setShowUserForm(false);
        setSelectedUser(null);
        fetchStudents();
        fetchStudentStats();
      }
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const response = await userManagementAPI.deleteUser(userToDelete._id);
      if (response.success) {
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
        fetchStudents();
        fetchStudentStats();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleBulkActionConfirm = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    try {
      let response;
      if (bulkAction === 'activate' || bulkAction === 'suspend') {
        response = await studentService.bulkUpdateStatus(selectedUsers.map(u => u._id), bulkAction);
      } else if (bulkAction === 'export') {
        response = await studentService.exportStudents({ studentIds: selectedUsers.map(u => u._id) });
        // Handle file download
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'students_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        response = await userManagementAPI.bulkAction(selectedUsers.map(u => u._id), bulkAction);
      }
      
      if (response.success !== false) {
        setShowBulkConfirmation(false);
        setSelectedUsers([]);
        setShowBulkActions(false);
        fetchStudents();
        fetchStudentStats();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'grade':
        setFilterGrade(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
      case 'department':
        setFilterDepartment(value);
        break;
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handleUserSelect = (user, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    }
  };

  const handleToggleStudentStatus = async (student, action) => {
    try {
      const response = await studentService.toggleStudentStatus(student._id, action);
      if (response.success !== false) {
        fetchStudents();
        fetchStudentStats();
      }
    } catch (error) {
      console.error('Error toggling student status:', error);
    }
  };

  const handleAssignToDepartment = async (department) => {
    if (!selectedUser) return;
    
    try {
      const response = await studentService.assignToDepartment(selectedUser._id, department._id);
      if (response.success !== false) {
        fetchStudents();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error assigning student to department:', error);
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedUsers(students);
    } else {
      setSelectedUsers([]);
    }
  };

  // Tab configuration - simplified
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" />, count: stats.total },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="w-4 h-4" /> },
  ];

  // Grade options
  const gradeOptions = [
    { value: 'all', label: 'All Grades' },
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Science', label: 'Science' },
    { value: 'English', label: 'English' },
    { value: 'History', label: 'History' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Physical Education', label: 'Physical Education' },
    { value: 'Art', label: 'Art' },
    { value: 'Music', label: 'Music' },
  ];

  const bulkActions = [
    { value: 'activate', label: 'Activate Selected', icon: <UserCheck className="w-4 h-4" /> },
    { value: 'suspend', label: 'Suspend Selected', icon: <UserX className="w-4 h-4" /> },
    { value: 'delete', label: 'Delete Selected', icon: <Trash2 className="w-4 h-4" /> },
    { value: 'export', label: 'Export Selected', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div>
          <h1 className="user-management-title">Student Management</h1>
          <p className="user-management-subtitle">Manage and monitor all students in your organization</p>
        </div>
        <div className="user-management-actions">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleBulkUpload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="user-management-tabs">
        <div className="user-management-tab-nav">
          <div className="user-management-tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`user-management-tab ${activeTab === tab.id ? 'active' : 'inactive'}`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="user-management-tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Stats Cards - Simplified */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">New This Month</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.newThisMonth}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Distribution */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">By Grade</h4>
                    <div className="space-y-2">
                      {gradeDistribution.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Grade {item.grade}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">By Department</h4>
                    <div className="space-y-2">
                      {departmentDistribution.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.department}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="p-6 space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={filterGrade}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {gradeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filterDepartment}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {departmentOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-purple-700">
                        {selectedUsers.length} student{selectedUsers.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {bulkActions.map((action) => (
                        <button
                          key={action.value}
                          onClick={() => handleBulkAction(action.value)}
                          className="flex items-center gap-2 px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Students Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === students.length && students.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                              <span className="ml-2 text-gray-500">Loading students...</span>
                            </div>
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <GraduationCap className="w-6 h-6 text-gray-400" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">No students found</h3>
                              <p className="text-xs text-gray-500 mb-4">
                                {searchTerm 
                                  ? 'Try adjusting your search criteria'
                                  : 'No students have been added yet'
                                }
                              </p>
                              {!searchTerm && (
                                <button
                                  onClick={handleAddStudent}
                                  className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                  Add Student
                                </button>
                              )}
                            </div>
                            </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedUsers.some(u => u._id === student._id)}
                                onChange={(e) => handleUserSelect(student, e.target.checked)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-purple-600">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.rollNumber || student._id.slice(-6)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Grade {student.grade || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.department || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                student.status === 'active' ? 'bg-green-100 text-green-800' :
                                student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MailIcon className="w-3 h-3" />
                                {student.email}
                              </div>
                              {student.phone && (
                                <div className="flex items-center gap-1 mt-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  {student.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewStudent(student)}
                                  className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditStudent(student)}
                                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit Student"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {student.status === 'active' ? (
                                  <button
                                    onClick={() => handleToggleStudentStatus(student, 'suspend')}
                                    className="p-1 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded transition-colors"
                                    title="Suspend Student"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStudentStatus(student, 'activate')}
                                    className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                    title="Activate Student"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteStudent(student)}
                                  className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} students
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.current - 1)}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-lg">
                      {pagination.current}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current + 1)}
                      disabled={pagination.current === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Academic Tab - Simplified */}
          {activeTab === 'academic' && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Academic Overview</h3>
              
              {/* Simple Academic Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Average Grade</p>
                      <p className="text-2xl font-semibold text-gray-900">A-</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-2xl font-semibold text-gray-900">94%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Subjects</p>
                      <p className="text-2xl font-semibold text-gray-900">6</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Performance - Data from backend */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h4>
                {gradeDistribution.length > 0 || departmentDistribution.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Performance data will be displayed here once students complete exams and assessments.
                    </p>
                    <div className="text-center py-4 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No performance data available yet</p>
                      <p className="text-xs text-gray-400 mt-1">Subject performance will appear after exam results are recorded</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No subject performance data</p>
                    <p className="text-xs text-gray-400 mt-1">Subject performance will appear after students complete exams</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="text-center py-12 text-gray-500">
                Activity feed coming soon...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserForm && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowUserForm(false);
            setSelectedUser(null);
          }}
          onSave={handleUserFormSave}
        />
      )}

      {showBulkUpload && (
        <BulkStudentUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false);
            fetchStudents();
            fetchStudentStats();
          }}
        />
      )}

      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showDeleteConfirmation && userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {showBulkConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Bulk Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {bulkAction} {selectedUsers.length} student{selectedUsers.length !== 1 ? 's' : ''}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkActionConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;
