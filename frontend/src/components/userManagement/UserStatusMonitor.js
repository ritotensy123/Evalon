import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Search,
  Eye,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
} from 'lucide-react';

const UserStatusMonitor = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sample real-time data
  const [userStatuses, setUserStatuses] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@school.edu',
      role: 'teacher',
      status: 'online',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      device: 'Desktop',
      location: 'Office',
      sessionDuration: '2h 15m',
      activity: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@school.edu',
      role: 'student',
      status: 'online',
      lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      device: 'Mobile',
      location: 'Home',
      sessionDuration: '1h 8m',
      activity: 'active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@school.edu',
      role: 'sub_admin',
      status: 'away',
      lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      device: 'Laptop',
      location: 'Office',
      sessionDuration: '4h 2m',
      activity: 'idle'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@school.edu',
      role: 'teacher',
      status: 'offline',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      loginTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      device: 'Desktop',
      location: 'Office',
      sessionDuration: '6h 45m',
      activity: 'offline'
    },
    {
      id: 5,
      name: 'Alex Brown',
      email: 'alex.brown@school.edu',
      role: 'student',
      status: 'online',
      lastActivity: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      loginTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      device: 'Tablet',
      location: 'Library',
      sessionDuration: '30m 12s',
      activity: 'active'
    }
  ]);

  const [systemStats, setSystemStats] = useState({
    totalUsers: 1250,
    onlineUsers: 892,
    awayUsers: 156,
    offlineUsers: 202,
    activeSessions: 1048,
    peakConcurrent: 1205,
    averageSessionTime: '2h 34m',
    systemUptime: '99.9%'
  });

  const [activityLog, setActivityLog] = useState([
    {
      id: 1,
      user: 'John Doe',
      action: 'Logged in',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'login',
      details: 'Desktop - Office'
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'Started exam',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      type: 'activity',
      details: 'Mathematics Quiz - Grade 10A'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'Updated user role',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'admin',
      details: 'Changed Sarah Wilson to Teacher'
    },
    {
      id: 4,
      user: 'Alex Brown',
      action: 'Submitted assignment',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'activity',
      details: 'Science Project - Grade 9B'
    },
    {
      id: 5,
      user: 'Sarah Wilson',
      action: 'Logged out',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'logout',
      details: 'Desktop - Office'
    }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setUserStatuses(prev => prev.map(user => ({
        ...user,
        lastActivity: new Date(Date.now() - Math.random() * 10 * 60 * 1000)
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'away':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'away':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (activity) => {
    switch (activity) {
      case 'active':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'login':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <UserX className="w-4 h-4 text-red-500" />;
      case 'admin':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'activity':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredUsers = userStatuses.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredActivity = activityLog.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Status Monitor</h2>
          <p className="text-gray-600">Real-time user activity and system status</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: systemStats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'blue', trend: '+5%' },
          { title: 'Online Now', value: systemStats.onlineUsers, icon: <CheckCircle className="w-5 h-5" />, color: 'green', trend: '+12%' },
          { title: 'Active Sessions', value: systemStats.activeSessions, icon: <Activity className="w-5 h-5" />, color: 'purple', trend: '+8%' },
          { title: 'System Uptime', value: systemStats.systemUptime, icon: <TrendingUp className="w-5 h-5" />, color: 'green', trend: '99.9%' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                stat.color === 'green' ? 'bg-green-50 text-green-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                {stat.icon}
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-xs font-semibold">{stat.trend}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Status List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Status</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Last Activity</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Device</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Session</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(user.activity)}
                          <span className="text-sm text-gray-900">{formatTimeAgo(user.lastActivity)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{user.device}</p>
                          <p className="text-xs text-gray-600">{user.location}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{user.sessionDuration}</p>
                          <p className="text-xs text-gray-600">Since {user.loginTime.toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
              {filteredActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getActivityTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">System Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">45ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600 font-medium">78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatusMonitor;
