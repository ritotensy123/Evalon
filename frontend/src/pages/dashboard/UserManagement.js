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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementAPI } from '../../services/api';
import UserForm from '../../components/userManagement/UserForm';
import BulkUpload from '../../components/userManagement/BulkUpload';
import BulkTeacherUpload from '../../components/userManagement/BulkTeacherUpload';
import BulkStudentUpload from '../../components/userManagement/BulkStudentUpload';
import BulkUploadSelection from '../../components/userManagement/BulkUploadSelection';
import InvitationSystem from '../../components/userManagement/InvitationSystem';
import InvitationsList from '../../components/userManagement/InvitationsList';
import UserStatusMonitor from '../../components/userManagement/UserStatusMonitor';
import RoleAssignment from '../../components/userManagement/RoleAssignment';
import UserDetailsModal from '../../components/userManagement/UserDetailsModal';
import DeleteConfirmationModal from '../../components/userManagement/DeleteConfirmationModal';
import '../../styles/userManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkTeacherUpload, setShowBulkTeacherUpload] = useState(false);
  const [showBulkStudentUpload, setShowBulkStudentUpload] = useState(false);
  const [showBulkUploadSelection, setShowBulkUploadSelection] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
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
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    suspended: 0,
    teachers: 0,
    students: 0,
    admins: 0,
    emailVerified: 0,
    phoneVerified: 0
  });
  const [roleDistribution, setRoleDistribution] = useState([]);
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
  const fetchUserStats = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching user stats for organization:', organizationId);
      const response = await userManagementAPI.getUserStats(organizationId);
      console.log('📊 User stats response:', response);
      if (response.success) {
        setStats(response.data);
        console.log('📊 Stats updated:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      setError('Failed to load user statistics');
    }
  };

  const fetchRoleDistribution = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching role distribution for organization:', organizationId);
      const response = await userManagementAPI.getRoleDistribution(organizationId);
      console.log('📊 Role distribution response:', response);
      if (response.success) {
        setRoleDistribution(response.data);
        console.log('📊 Role distribution updated:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch role distribution:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!organizationId) return;
    try {
      console.log('📊 Fetching recent activity for organization:', organizationId);
      const response = await userManagementAPI.getRecentActivity(organizationId, 5);
      console.log('📊 Recent activity response:', response);
      if (response.success) {
        setRecentActivity(response.data);
        console.log('📊 Recent activity updated:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const fetchUsers = async (page = 1, limit = 10) => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        role: filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };
      
      const response = await userManagementAPI.getAllUsers(organizationId, params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setError(null);
    await Promise.all([
      fetchUserStats(),
      fetchRoleDistribution(),
      fetchRecentActivity(),
      fetchUsers(pagination.current, pagination.limit)
    ]);
  };

  // Load data on component mount and when organization changes
  useEffect(() => {
    if (organizationId) {
      refreshData();
    }
  }, [organizationId]);

  // Fetch users when filters change
  useEffect(() => {
    if (organizationId && activeTab === 'users') {
      fetchUsers(1, pagination.limit);
    }
  }, [filterRole, filterStatus, searchTerm, activeTab, organizationId]);

  // Refresh overview data when switching to overview tab
  useEffect(() => {
    if (organizationId && activeTab === 'overview') {
      console.log('🔄 Refreshing overview data...');
      refreshData();
    }
  }, [activeTab, organizationId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'users', label: 'All Users', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'roles', label: 'Role Management', icon: <Shield className="w-4 h-4" /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Status Monitor', icon: <Clock className="w-4 h-4" /> },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'organization_admin':
        return 'bg-red-100 text-red-800';
      case 'sub_admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to format text (convert underscores to proper case)
  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleUserAction = async (action, userId) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user);
    
    switch (action) {
      case 'edit':
        setShowUserForm(true);
        break;
      case 'view':
        setShowUserDetails(true);
        break;
      case 'delete':
        await handleDeleteUser(userId, user);
        break;
      default:
        break;
    }
  };

  const handleDeleteUser = (userId, user) => {
    setUserToDelete({ userId, user });
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const { userId, user } = userToDelete;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email;

    try {
      const response = await userManagementAPI.deleteUser(userId);
      
      if (response.success) {
        // Refresh the users list with current filters
        await fetchUsers(pagination.current, pagination.limit);
        // Refresh stats
        await fetchUserStats();
        
        // Close modal and reset state
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
      } else {
        const errorMsg = response.message || 'Failed to delete user';
        console.error('Delete user failed:', response);
        alert(`Failed to delete user: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      // Check multiple possible locations for status code
      const statusCode = error.response?.status || error.status || error.statusCode;
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      
      // If user not found (404), refresh the list as they may have already been deleted
      if (statusCode === 404) {
        // Refresh the users list to remove stale data
        await fetchUsers(pagination.current, pagination.limit);
        await fetchUserStats();
        alert(`User not found. The user may have already been deleted. The list has been refreshed.`);
      } else {
        alert(`Failed to delete user${statusCode ? ` (${statusCode})` : ''}: ${errorMessage}`);
      }
      
      // Close modal and reset state
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirmation(false);
    setUserToDelete(null);
  };

  // Bulk selection functions
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) return;
    setBulkAction(action);
    setShowBulkConfirmation(true);
  };

  const confirmBulkAction = async () => {
    if (selectedUsers.length === 0) return;

    try {
      let response;
      const userIds = selectedUsers;
      
      if (bulkAction === 'delete') {
        response = await userManagementAPI.bulkDeleteUsers(userIds);
      } else if (bulkAction === 'suspend') {
        response = await userManagementAPI.bulkToggleUserStatus(userIds, 'suspend');
      } else if (bulkAction === 'activate') {
        response = await userManagementAPI.bulkToggleUserStatus(userIds, 'activate');
      }

      if (response && response.success) {
        // Clear selection
        setSelectedUsers([]);
        setShowBulkActions(false);
        
        // Refresh data
        await fetchUsers(pagination.current, pagination.limit);
        await fetchUserStats();
      } else {
        alert(`Failed to ${bulkAction} users: ${response?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error performing bulk ${bulkAction}:`, error);
      alert(`Failed to ${bulkAction} users: ${error.message || 'Unknown error'}`);
    } finally {
      setShowBulkConfirmation(false);
      setBulkAction('');
    }
  };

  const cancelBulkAction = () => {
    setShowBulkConfirmation(false);
    setBulkAction('');
  };

  const handleBulkUploadTypeSelection = (userType) => {
    if (userType === 'student') {
      setShowBulkStudentUpload(true);
    } else if (userType === 'teacher') {
      setShowBulkTeacherUpload(true);
    }
  };

  const handleToggleUserStatus = async (userId, action) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email;
    
    const actionText = action === 'suspend' ? 'suspend' : 'activate';
    const confirmMessage = `Are you sure you want to ${actionText} ${userName}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await userManagementAPI.toggleUserStatus(userId, action);
        
        if (response.success) {
          // Refresh the users list with current filters
          await fetchUsers(pagination.current, pagination.limit);
          // Refresh stats
          await fetchUserStats();
          
          alert(`User ${userName} has been ${actionText}ed successfully.`);
        } else {
          alert(`Failed to ${actionText} user: ${response.message}`);
        }
      } catch (error) {
        console.error(`Error ${actionText}ing user:`, error);
        alert(`Failed to ${actionText} user: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleUpdateUser = async (userData) => {
    if (!selectedUser) return;
    
    try {
      const response = await userManagementAPI.updateUser(selectedUser._id, userData);
      
      if (response.success) {
        // Refresh the users list
        await fetchUsers(pagination.current, pagination.limit);
        
        alert('User updated successfully!');
        setShowUserForm(false);
        setSelectedUser(null);
      } else {
        alert(`Failed to update user: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.message || 'Unknown error'}`);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600">Loading overview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Users', value: stats.total, icon: <Users className="w-5 h-5" />, color: 'blue' },
            { title: 'Active Users', value: stats.active, icon: <UserCheck className="w-5 h-5" />, color: 'green' },
            { title: 'Pending Invites', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
            { title: 'Inactive Users', value: stats.inactive, icon: <UserX className="w-5 h-5" />, color: 'red' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'green' ? 'bg-green-50 text-green-600' :
                  stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Role Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Role Distribution</h3>
            <div className="space-y-3">
              {roleDistribution.length > 0 ? (
                roleDistribution.map((item, index) => {
                  const roleColors = {
                    teacher: 'bg-blue-500',
                    student: 'bg-green-500',
                    organization_admin: 'bg-purple-500',
                    sub_admin: 'bg-indigo-500'
                  };
                  const roleLabels = {
                    teacher: 'Teachers',
                    student: 'Students',
                    organization_admin: 'Organization Administrators',
                    sub_admin: 'Sub Administrators'
                  };
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {roleLabels[item._id] || formatText(item._id)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${roleColors[item._id] || 'bg-gray-500'}`}
                            style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No role data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((user, index) => (
                  <div key={index} className="flex items-center gap-3 py-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === 'active' ? 'bg-green-500' :
                      user.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email} ({formatText(user.userType)})
                      </p>
                      <p className="text-xs text-gray-600">
                        Last activity: {formatDate(user.lastActivity)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-2 px-5 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 min-w-0 max-w-80"
          >
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">Add User</h4>
              <p className="text-xs text-gray-600">Create individual user</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowBulkUploadSelection(true)}
            className="flex items-center gap-2 px-5 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 min-w-0 max-w-80"
          >
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">Bulk Upload</h4>
              <p className="text-xs text-gray-600">Import users via CSV</p>
            </div>
          </button>
          
          
          <button 
            onClick={() => setShowInvitations(true)}
            className="flex items-center gap-2 px-5 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 min-w-0 max-w-80"
          >
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">Send Invites</h4>
              <p className="text-xs text-gray-600">Email invitations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

  const renderUsersList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="organization_admin">Organization Admin</option>
                <option value="sub_admin">Sub Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {filterStatus !== 'all' && (
                <span>
                  Showing only {filterStatus} users. 
                  <button 
                    onClick={() => setFilterStatus('all')}
                    className="ml-1 text-purple-600 hover:text-purple-700 underline"
                  >
                    Show all users
                  </button>
                </span>
              )}
              {filterStatus === 'all' && (
                <span>Showing all users (active, pending, and inactive)</span>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-purple-700">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-purple-600 hover:text-purple-700 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors border border-green-200"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-md hover:bg-orange-200 transition-colors border border-orange-200"
                >
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors border border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                            {getUserInitials(user.firstName, user.lastName, user.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                            </p>
                            <p className="text-xs text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.userType)}`}>
                          {formatText(user.userType)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900">{user.department || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900">{user.phone || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          <span className="text-sm text-gray-900 capitalize">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(user.lastLogin)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUserAction('view', user._id)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleUserAction('edit', user._id)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                          {/* Only show suspend/activate for non-admin users */}
                          {user.userType !== 'organization_admin' && (
                            <>
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleToggleUserStatus(user._id, 'suspend')}
                                  className="p-1 rounded-md hover:bg-yellow-100 transition-colors"
                                  title="Suspend User"
                                >
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleUserStatus(user._id, 'activate')}
                                  className="p-1 rounded-md hover:bg-green-100 transition-colors"
                                  title="Activate User"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </button>
                              )}
                              <div className="w-px h-4 bg-gray-300 mx-1"></div>
                              <button
                                onClick={() => handleUserAction('delete', user._id)}
                                className="p-1 rounded-md hover:bg-red-100 transition-colors"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-gray-400" />
                        <p className="text-sm">No users found</p>
                        {filterStatus !== 'all' && (
                          <p className="text-xs text-gray-400">
                            Try changing the status filter to see more users
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.current - 1, pagination.limit)}
                  disabled={pagination.current <= 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(pagination.current + 1, pagination.limit)}
                  disabled={pagination.current >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsersList();
      case 'roles':
        return <RoleAssignment />;
      case 'invitations':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invitation Management</h2>
                <p className="text-gray-600">Manage user invitations and email invites</p>
              </div>
              <button 
                onClick={() => setShowInvitations(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Invitations
              </button>
            </div>
            
            <InvitationsList organizationId={organizationId} />
          </div>
        );
      case 'monitoring':
        return <UserStatusMonitor />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
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
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {renderContent()}
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
          onSave={async (userData) => {
            try {
              if (selectedUser) {
                // Update existing user
                await handleUpdateUser(userData);
              } else {
                // Create new user
                console.log('Creating user with data:', userData);
                
                // Add organizationId to the user data
                const userDataWithOrg = {
                  ...userData,
                  organizationId: organizationId
                };
                
                const response = await userManagementAPI.createUser(userDataWithOrg);
                console.log('User created successfully:', response);
                
                // Force refresh all data
                console.log('🔄 Refreshing user data after creation...');
                setLoading(true); // Show loading state
                await Promise.all([
                  fetchUsers(1, 10), // Reset to first page
                  fetchUserStats(),
                  fetchRoleDistribution(),
                  fetchRecentActivity()
                ]);
                setLoading(false); // Hide loading state
                console.log('✅ User data refreshed');
                
                // Force re-render of overview if we're on overview tab
                if (activeTab === 'overview') {
                  console.log('🔄 Forcing overview refresh...');
                  // Trigger a state update to force re-render
                  setStats(prevStats => ({ ...prevStats }));
                }
                
                // Show success message
                alert(`User created successfully! ${response.data?.generatedPassword ? `Generated password: ${response.data.generatedPassword}` : ''}`);
                
                setShowUserForm(false);
                setSelectedUser(null);
              }
            } catch (error) {
              console.error('Error saving user:', error);
              
              // Enhanced error handling with better messages
              let errorMessage = 'Failed to save user: ';
              
              if (error.response?.data?.message) {
                errorMessage += error.response.data.message;
                
                // Add suggestion if available
                if (error.response.data.data?.suggestion) {
                  errorMessage += `\n\nSuggestion: ${error.response.data.data.suggestion}`;
                }
                
                // Add existing user type info if available
                if (error.response.data.data?.existingUserType) {
                  errorMessage += `\n\nExisting account type: ${error.response.data.data.existingUserType}`;
                }
              } else {
                errorMessage += error.message || 'Unknown error';
              }
              
              alert(errorMessage);
            }
          }}
        />
      )}

      {showBulkUploadSelection && (
        <BulkUploadSelection
          onClose={() => setShowBulkUploadSelection(false)}
          onSelectType={handleBulkUploadTypeSelection}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onUpload={(data) => {
            // Handle bulk upload
            setShowBulkUpload(false);
          }}
        />
      )}

      {showBulkTeacherUpload && (
        <BulkTeacherUpload
          onClose={() => setShowBulkTeacherUpload(false)}
        />
      )}

      {showBulkStudentUpload && (
        <BulkStudentUpload
          onClose={() => setShowBulkStudentUpload(false)}
        />
      )}

      {showInvitations && (
        <InvitationSystem
          organizationId={organizationId}
          onClose={() => setShowInvitations(false)}
          onSend={(invitations) => {
            // Handle send invitations
            setShowInvitations(false);
            // Refresh data after sending invitations
            refreshData();
          }}
        />
      )}

      {showUserDetails && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onEdit={(userId) => {
            setShowUserDetails(false);
            setShowUserForm(true);
          }}
          onDelete={async (userId) => {
            const user = users.find(u => u._id === userId);
            handleDeleteUser(userId, user);
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onToggleStatus={async (userId, action) => {
            await handleToggleUserStatus(userId, action);
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && userToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={cancelDeleteUser}
          onConfirm={confirmDeleteUser}
          userName={userToDelete.user.firstName && userToDelete.user.lastName 
            ? `${userToDelete.user.firstName} ${userToDelete.user.lastName}` 
            : userToDelete.user.email}
          userEmail={userToDelete.user.email}
        />
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Bulk {bulkAction === 'delete' ? 'Delete' : bulkAction === 'suspend' ? 'Suspend' : 'Activate'}
                </h3>
                <p className="text-sm text-gray-600">
                  This action will affect {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                {bulkAction === 'delete' && (
                  <>Are you sure you want to permanently delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.</>
                )}
                {bulkAction === 'suspend' && (
                  <>Are you sure you want to suspend {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}? They will not be able to access the system.</>
                )}
                {bulkAction === 'activate' && (
                  <>Are you sure you want to activate {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}? They will regain access to the system.</>
                )}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelBulkAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
                <button
                  onClick={confirmBulkAction}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${
                    bulkAction === 'delete' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' 
                      : bulkAction === 'suspend'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                  }`}
                >
                  {bulkAction === 'delete' ? 'Delete' : bulkAction === 'suspend' ? 'Suspend' : 'Activate'} {selectedUsers.length} User{selectedUsers.length > 1 ? 's' : ''}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
