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
import { userManagementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserStatusMonitor = () => {
  const { organizationData } = useAuth();
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchStatusData();
    // Set up auto-refresh every 10 seconds for more real-time updates
    const interval = setInterval(fetchStatusData, 10000);
    return () => clearInterval(interval);
  }, [organizationData]);

  const fetchStatusData = async (isManualRefresh = false) => {
    if (!organizationData?._id) return;
    
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Fetch user statistics
      const statsResponse = await userManagementAPI.getUserStats(organizationData._id);
      const statsData = statsResponse.data;
      
      // Fetch online users
      const onlineResponse = await userManagementAPI.getOnlineUsers(organizationData._id);
      const onlineUsers = onlineResponse.data?.users || [];
      
      // Fetch recent activity
      const activityResponse = await userManagementAPI.getRecentActivity(organizationData._id);
      const recentActivityData = activityResponse.data?.activities || [];
      
      setStats({
        totalUsers: statsData.total || 0,
        activeUsers: statsData.active || 0,
        inactiveUsers: statsData.inactive || 0,
        pendingUsers: statsData.pending || 0,
        onlineNow: onlineUsers.length,
        lastLogin: recentActivityData.length > 0 ? new Date(recentActivityData[0].timestamp) : null,
        activityTrend: 'up', // Could be calculated based on historical data
        loginTrend: 'up', // Could be calculated based on historical data
      });

      // Format recent activity data
      const formattedActivity = recentActivityData.map((activity, index) => ({
        id: activity._id || index,
        user: activity.userName || activity.user || 'Unknown User',
        action: activity.action || 'Activity',
        timestamp: new Date(activity.timestamp || activity.createdAt),
        status: activity.status || 'success',
      }));

      setRecentActivity(formattedActivity);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch status data:', error);
      // Set fallback data on error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingUsers: 0,
        onlineNow: 0,
        lastLogin: null,
        activityTrend: 'up',
        loginTrend: 'up',
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.onlineNow > 0 ? 'Live' : 'Offline'}
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatTime(lastUpdated)}
              </p>
            )}
          </div>
          <button 
            onClick={() => fetchStatusData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
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