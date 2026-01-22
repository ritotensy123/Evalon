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
  Briefcase,
  Clock as ClockIcon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Users as UsersIcon2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementAPI } from '../../services/api';
import { teacherService } from '../../services/teacherAPI';
import UserForm from '../../components/userManagement/UserForm';
import BulkTeacherUpload from '../../components/userManagement/BulkTeacherUpload';
import UserDetailsModal from '../../components/userManagement/UserDetailsModal';
import DeleteConfirmationModal from '../../components/userManagement/DeleteConfirmationModal';
import '../../styles/userManagement.css';

const TeacherManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  
  // Data states
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    suspended: 0,
    bySubject: {},
    byDepartment: {},
    byExperience: {},
    newThisMonth: 0,
    emailVerified: 0,
    phoneVerified: 0
  });
  const [subjectDistribution, setSubjectDistribution] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [experienceDistribution, setExperienceDistribution] = useState([]);
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
  const fetchTeacherStats = async () => {
    if (!user || !user.token) {
      console.log('No user or token available');
      return;
    }
    try {
      console.log('📊 Fetching teacher stats...');
      const response = await teacherService.getTeacherStats();
      console.log('📊 Teacher stats response:', response);
      if (response.stats) {
        setStats(response.stats);
        console.log('📊 Teacher stats updated:', response.stats);
      } else {
        console.log('📊 No stats in response:', response);
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      // Don't set error state for stats, just log it
    }
  };

  const fetchTeachers = async () => {
    if (!user || !user.token) {
      console.log('No user or token available for fetching teachers');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        search: searchTerm,
        subject: filterSubject !== 'all' ? filterSubject : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        department: filterDepartment !== 'all' ? filterDepartment : undefined,
        experience: filterExperience !== 'all' ? filterExperience : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
      };

      const response = await teacherService.getTeachers(params);
      setTeachers(response.teachers || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      }));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching subject distribution...');
      const response = await teacherService.getTeacherStats();
      console.log('📊 Subject distribution response:', response);
      setSubjectDistribution(response.subjectDistribution || []);
      console.log('📊 Subject distribution updated:', response.subjectDistribution);
    } catch (error) {
      console.error('Error fetching subject distribution:', error);
    }
  };

  const fetchDepartmentDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching department distribution...');
      const response = await teacherService.getTeacherStats();
      console.log('📊 Department distribution response:', response);
      setDepartmentDistribution(response.departmentDistribution || []);
      console.log('📊 Department distribution updated:', response.departmentDistribution);
    } catch (error) {
      console.error('Error fetching department distribution:', error);
    }
  };

  const fetchExperienceDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching experience distribution...');
      const response = await teacherService.getTeacherStats();
      console.log('📊 Experience distribution response:', response);
      setExperienceDistribution(response.experienceDistribution || []);
      console.log('📊 Experience distribution updated:', response.experienceDistribution);
    } catch (error) {
      console.error('Error fetching experience distribution:', error);
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
      fetchTeacherStats();
      fetchSubjectDistribution();
      fetchDepartmentDistribution();
      fetchExperienceDistribution();
      fetchRecentActivity();
    }
  }, [user, organizationId]);

  useEffect(() => {
    if (user && user.token) {
      fetchTeachers();
    }
  }, [user, organizationId, pagination.current, searchTerm, filterSubject, filterStatus, filterDepartment, filterExperience, filterRole]);

  // Refresh data when switching to overview tab
  useEffect(() => {
    if (user && user.token && activeTab === 'overview') {
      console.log('🔄 Refreshing teacher overview data...');
      refreshData();
    }
  }, [activeTab, user, organizationId]);

  // Refresh function
  const refreshData = async () => {
    setError(null);
    console.log('🔄 Refreshing teacher data...');
    await Promise.all([
      fetchTeachers(),
      fetchTeacherStats(),
      fetchSubjectDistribution(),
      fetchDepartmentDistribution(),
      fetchExperienceDistribution(),
      fetchRecentActivity()
    ]);
    console.log('✅ Teacher data refreshed');
  };

  // Event handlers
  const handleAddTeacher = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedUser(teacher);
    setShowUserForm(true);
  };

  const handleViewTeacher = (teacher) => {
    setSelectedUser(teacher);
    setShowUserDetails(true);
  };

  const handleDeleteTeacher = (teacher) => {
    setUserToDelete(teacher);
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
        ? await userManagementAPI.updateUser(selectedUser._id, { ...userData, userType: 'teacher' })
        : await userManagementAPI.createUser({ ...userData, userType: 'teacher' });
      
      if (response.success) {
        setShowUserForm(false);
        setSelectedUser(null);
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const response = await userManagementAPI.deleteUser(userToDelete._id);
      if (response.success) {
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleBulkActionConfirm = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    try {
      let response;
      if (bulkAction === 'activate' || bulkAction === 'suspend') {
        response = await teacherService.bulkUpdateStatus(selectedUsers.map(u => u._id), bulkAction);
      } else if (bulkAction === 'export') {
        response = await teacherService.exportTeachers({ teacherIds: selectedUsers.map(u => u._id) });
        // Handle file download
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'teachers_export.csv';
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
        fetchTeachers();
        fetchTeacherStats();
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
      case 'subject':
        setFilterSubject(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
      case 'department':
        setFilterDepartment(value);
        break;
      case 'experience':
        setFilterExperience(value);
        break;
      case 'role':
        setFilterRole(value);
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

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedUsers(teachers);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleToggleTeacherStatus = async (teacher, action) => {
    try {
      const response = await teacherService.toggleTeacherStatus(teacher._id, action);
      if (response.success !== false) {
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error toggling teacher status:', error);
    }
  };

  const handleAssignRole = async (teacherId, roleData) => {
    try {
      const response = await teacherService.assignRole(teacherId, roleData);
      if (response.success !== false) {
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  // Tab configuration - simplified
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers', icon: <Users className="w-4 h-4" />, count: stats.total },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
  ];

  // Subject options
  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Biology', label: 'Biology' },
    { value: 'English', label: 'English' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Physical Education', label: 'Physical Education' },
    { value: 'Art', label: 'Art' },
    { value: 'Music', label: 'Music' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Business Studies', label: 'Business Studies' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Sociology', label: 'Sociology' },
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

  const experienceOptions = [
    { value: 'all', label: 'All Experience' },
    { value: 'beginner', label: 'Beginner (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (3-5 years)' },
    { value: 'experienced', label: 'Experienced (6-10 years)' },
    { value: 'senior', label: 'Senior (10+ years)' },
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'assistant', label: 'Assistant Teacher' },
  ];

  const bulkActions = [
    { value: 'activate', label: 'Activate Selected', icon: <UserCheck className="w-4 h-4" /> },
    { value: 'suspend', label: 'Suspend Selected', icon: <UserX className="w-4 h-4" /> },
    { value: 'assign_role', label: 'Assign Role', icon: <Shield className="w-4 h-4" /> },
    { value: 'delete', label: 'Delete Selected', icon: <Trash2 className="w-4 h-4" /> },
    { value: 'export', label: 'Export Selected', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div>
          <h1 className="user-management-title">Teacher Management</h1>
          <p className="user-management-subtitle">Manage and monitor all teachers in your organization</p>
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
            onClick={handleAddTeacher}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
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
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Teachers</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">By Subject</h4>
                    <div className="space-y-2">
                      {subjectDistribution.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.subject}</span>
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
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">By Experience</h4>
                    <div className="space-y-2">
                      {experienceDistribution.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.experience}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="p-6 space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={filterSubject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {subjectOptions.map(option => (
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
                  
                  <select
                    value={filterExperience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {experienceOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filterRole}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {roleOptions.map(option => (
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
                        {selectedUsers.length} teacher{selectedUsers.length !== 1 ? 's' : ''} selected
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

              {/* Teachers Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === teachers.length && teachers.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
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
                          <td colSpan="8" className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                              <span className="ml-2 text-gray-500">Loading teachers...</span>
                            </div>
                          </td>
                        </tr>
                      ) : teachers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                            No teachers found
                          </td>
                        </tr>
                      ) : (
                        teachers.map((teacher) => (
                          <tr key={teacher._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedUsers.some(u => u._id === teacher._id)}
                                onChange={(e) => handleUserSelect(teacher, e.target.checked)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-purple-600">
                                      {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {teacher.firstName} {teacher.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {teacher.teacherRole || 'Teacher'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {(teacher.subjects || []).slice(0, 2).map((subject, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {subject}
                                  </span>
                                ))}
                                {(teacher.subjects || []).length > 2 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{(teacher.subjects || []).length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {teacher.department || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {teacher.experienceLevel || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                teacher.teacherRole === 'hod' ? 'bg-red-100 text-red-800' :
                                teacher.teacherRole === 'supervisor' ? 'bg-purple-100 text-purple-800' :
                                teacher.teacherRole === 'coordinator' ? 'bg-blue-100 text-blue-800' :
                                teacher.teacherRole === 'assistant' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {teacher.teacherRole === 'hod' ? 'HOD' :
                                 teacher.teacherRole === 'supervisor' ? 'Supervisor' :
                                 teacher.teacherRole === 'coordinator' ? 'Coordinator' :
                                 teacher.teacherRole === 'assistant' ? 'Assistant' :
                                 'Teacher'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                                teacher.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                teacher.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {teacher.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MailIcon className="w-3 h-3" />
                                {teacher.email}
                              </div>
                              {teacher.phone && (
                                <div className="flex items-center gap-1 mt-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  {teacher.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewTeacher(teacher)}
                                  className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditTeacher(teacher)}
                                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit Teacher"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(teacher);
                                    setShowRoleAssignment(true);
                                  }}
                                  className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                                  title="Assign Role"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                {teacher.status === 'active' ? (
                                  <button
                                    onClick={() => handleToggleTeacherStatus(teacher, 'suspend')}
                                    className="p-1 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded transition-colors"
                                    title="Suspend Teacher"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleTeacherStatus(teacher, 'activate')}
                                    className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                    title="Activate Teacher"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTeacher(teacher)}
                                  className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Teacher"
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
                    Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} teachers
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

          {/* Subjects Tab - Data from backend */}
          {activeTab === 'subjects' && (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Subject Assignments</h3>
              
              {/* Subject Distribution from backend */}
              {subjectDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectDistribution.map((item, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{item.subject}</h4>
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Teachers</span>
                          <span className="text-sm font-medium text-gray-900">{item.count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No subject assignments yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Subject assignments will appear here once teachers are assigned to subjects.
                  </p>
                  <p className="text-xs text-gray-400">
                    Assign subjects to teachers in the Teachers tab
                  </p>
                </div>
              )}

              {/* Teacher-Subject Table - Real data */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Teacher Assignments</h4>
                {teachers.length > 0 ? (
                  <div className="space-y-3">
                    {teachers.slice(0, 10).map((teacher) => (
                      <div key={teacher._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-purple-600">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{teacher.teacherRole || 'Teacher'}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {teacher.subjects && teacher.subjects.length > 0 
                            ? teacher.subjects.join(', ') 
                            : 'Not assigned'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No teachers found</p>
                    <p className="text-xs text-gray-400 mt-1">Add teachers to see their subject assignments</p>
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
        <BulkTeacherUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false);
            fetchTeachers();
            fetchTeacherStats();
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
              Are you sure you want to {bulkAction} {selectedUsers.length} teacher{selectedUsers.length !== 1 ? 's' : ''}?
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

      {/* Role Assignment Modal */}
      {showRoleAssignment && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher: {selectedUser.firstName} {selectedUser.lastName}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  defaultValue={selectedUser.teacherRole || 'teacher'}
                >
                  <option value="teacher">Teacher</option>
                  <option value="hod">Head of Department</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="assistant">Assistant Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Assignment
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  defaultValue={selectedUser.department || ''}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleAssignment(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const roleSelect = document.querySelector('select[defaultValue]');
                  const departmentSelect = document.querySelector('select:not([defaultValue])');
                  
                  if (roleSelect && selectedUser) {
                    const roleData = {
                      teacherRole: roleSelect.value,
                      department: departmentSelect.value
                    };
                    
                    await handleAssignRole(selectedUser._id, roleData);
                    setShowRoleAssignment(false);
                    setSelectedUser(null);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
