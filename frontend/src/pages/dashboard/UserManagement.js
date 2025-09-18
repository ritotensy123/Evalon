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
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementAPI } from '../../services/api';
import UserForm from '../../components/userManagement/UserForm';
import BulkUpload from '../../components/userManagement/BulkUpload';
import InvitationSystem from '../../components/userManagement/InvitationSystem';
import UserStatusMonitor from '../../components/userManagement/UserStatusMonitor';
import RoleAssignment from '../../components/userManagement/RoleAssignment';
import '../../styles/userManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
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
      const response = await userManagementAPI.getUserStats(organizationId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      setError('Failed to load user statistics');
    }
  };

  const fetchRoleDistribution = async () => {
    if (!organizationId) return;
    try {
      const response = await userManagementAPI.getRoleDistribution(organizationId);
      if (response.success) {
        setRoleDistribution(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch role distribution:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!organizationId) return;
    try {
      const response = await userManagementAPI.getRecentActivity(organizationId, 5);
      if (response.success) {
        setRecentActivity(response.data);
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

  const handleUserAction = (action, userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    
    switch (action) {
      case 'edit':
        setShowUserForm(true);
        break;
      case 'view':
        // Handle view user details
        break;
      case 'delete':
        // Handle delete user
        break;
      default:
        break;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Add User</h4>
              <p className="text-sm text-gray-600">Create individual user</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Bulk Upload</h4>
              <p className="text-sm text-gray-600">Import users via CSV</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowInvitations(true)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Send Invites</h4>
              <p className="text-sm text-gray-600">Email invitations</p>
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
              <button className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
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
                          <button
                            onClick={() => handleUserAction('delete', user._id)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No users found
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
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invitations</h3>
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No invitations sent yet</p>
                <p className="text-sm">Click "Send Invitations" to invite users to your organization</p>
              </div>
            </div>
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
          onSave={(userData) => {
            // Handle save user
            setShowUserForm(false);
            setSelectedUser(null);
          }}
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

      {showInvitations && (
        <InvitationSystem
          onClose={() => setShowInvitations(false)}
          onSend={(invitations) => {
            // Handle send invitations
            setShowInvitations(false);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
