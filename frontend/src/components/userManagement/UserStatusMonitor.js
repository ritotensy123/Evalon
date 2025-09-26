import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const UserStatusMonitor = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingUsers: 0,
    onlineNow: 0,
    lastLogin: null,
    activityTrend: 'up',
    loginTrend: 'up',
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      setStats({
        totalUsers: 150,
        activeUsers: 120,
        inactiveUsers: 20,
        pendingUsers: 10,
        onlineNow: 45,
        lastLogin: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        activityTrend: 'up',
        loginTrend: 'up',
      });

      setRecentActivity([
        {
          id: 1,
          user: 'John Doe',
          action: 'Logged in',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          status: 'success',
        },
        {
          id: 2,
          user: 'Jane Smith',
          action: 'Password changed',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          status: 'success',
        },
        {
          id: 3,
          user: 'Bob Johnson',
          action: 'Failed login attempt',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'warning',
        },
        {
          id: 4,
          user: 'Alice Brown',
          action: 'Account deactivated',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          status: 'error',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading status data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-1">
              {stats.activityTrend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">+5%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
          <p className="text-sm font-medium text-gray-600">Total Users</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center gap-1">
              {stats.loginTrend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">+12%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.activeUsers}</h3>
          <p className="text-sm font-medium text-gray-600">Active Users</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.onlineNow}</h3>
          <p className="text-sm font-medium text-gray-600">Online Now</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.pendingUsers}</h3>
          <p className="text-sm font-medium text-gray-600">Pending</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button 
            onClick={fetchStatusData}
            className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user} {activity.action}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-900">User Authentication</span>
            </div>
            <span className="text-xs text-green-700">Operational</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-900">Email Service</span>
            </div>
            <span className="text-xs text-green-700">Operational</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-900">File Upload</span>
            </div>
            <span className="text-xs text-yellow-700">Degraded</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-900">Database</span>
            </div>
            <span className="text-xs text-green-700">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatusMonitor;