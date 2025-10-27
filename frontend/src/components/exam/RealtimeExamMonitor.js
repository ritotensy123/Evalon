import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mui/material';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import realtimeSocketService from '../../services/realtimeSocketService';
import { useAuth } from '../../contexts/AuthContext';

const RealtimeExamMonitor = ({ examId, examTitle }) => {
  const { userData } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    disconnectedStudents: 0,
    completedStudents: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!userData?.token) return;

    // Connect to real-time service
    const socket = realtimeSocketService.connect(userData.token);
    if (socket) {
      setIsConnected(true);
      startHeartbeat();
    }

    // Set up event listeners
    setupEventListeners();

    // Join monitoring room
    if (examId) {
      joinMonitoring();
    }

    return () => {
      if (examId) {
        realtimeSocketService.leaveMonitoring(examId);
      }
      realtimeSocketService.stopHeartbeat();
      realtimeSocketService.disconnect();
    };
  }, [userData?.token, examId]);

  const setupEventListeners = () => {
    // Connection status
    realtimeSocketService.onMonitoringJoined((data) => {
      console.log('📊 Joined monitoring room:', data);
      setActiveSessions(data.activeSessions || []);
      updateStats(data.activeSessions || []);
      setLastUpdate(new Date());
    });

    // Student joined
    realtimeSocketService.onStudentJoined((data) => {
      console.log('🎓 Student joined:', data);
      setActiveSessions(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(s => s.sessionId === data.sessionId);
        if (existingIndex >= 0) {
          updated[existingIndex] = data;
        } else {
          updated.push(data);
        }
        updateStats(updated);
        setLastUpdate(new Date());
        return updated;
      });
    });

    // Student disconnected
    realtimeSocketService.onStudentDisconnected((data) => {
      console.log('🔌 Student disconnected:', data);
      setActiveSessions(prev => {
        // Remove the disconnected session entirely from the list
        const updated = prev.filter(session => session.sessionId !== data.sessionId);
        updateStats(updated);
        setLastUpdate(new Date());
        return updated;
      });
    });

    // Progress update
    realtimeSocketService.onProgressUpdate((data) => {
      console.log('📈 Progress update:', data);
      setActiveSessions(prev => {
        const updated = prev.map(session => 
          session.sessionId === data.sessionId 
            ? { ...session, progress: data.progress }
            : session
        );
        setLastUpdate(new Date());
        return updated;
      });
    });

    // Time update
    realtimeSocketService.onTimeUpdate((data) => {
      setActiveSessions(prev => {
        const updated = prev.map(session => 
          session.sessionId === data.sessionId 
            ? { ...session, timeRemaining: data.timeRemaining }
            : session
        );
        return updated;
      });
    });

    // Exam ended
    realtimeSocketService.onExamEnded((data) => {
      console.log('🏁 Exam ended:', data);
      setActiveSessions(prev => {
        const updated = prev.filter(session => session.sessionId !== data.sessionId);
        updateStats(updated);
        setLastUpdate(new Date());
        return updated;
      });
    });

    // Error handling
    realtimeSocketService.onMonitoringError((error) => {
      console.error('❌ Monitoring error:', error);
    });
  };

  const joinMonitoring = async () => {
    if (!examId || isJoining) return;
    
    setIsJoining(true);
    try {
      realtimeSocketService.joinMonitoring(examId);
    } catch (error) {
      console.error('Failed to join monitoring:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const startHeartbeat = () => {
    realtimeSocketService.startHeartbeat();
  };

  const updateStats = (sessions) => {
    const totalStudents = sessions.length;
    const activeStudents = sessions.filter(s => s.isConnected && s.status === 'active').length;
    const disconnectedStudents = sessions.filter(s => !s.isConnected || s.status === 'disconnected').length;
    const completedStudents = sessions.filter(s => s.status === 'completed').length;

    setStats({
      totalStudents,
      activeStudents,
      disconnectedStudents,
      completedStudents
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status, isConnected) => {
    if (status === 'completed') return 'text-green-600';
    if (status === 'disconnected' || !isConnected) return 'text-red-600';
    if (status === 'active' && isConnected) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (status, isConnected) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
    if (status === 'disconnected' || !isConnected) return <WifiOff className="w-4 h-4" />;
    if (status === 'active' && isConnected) return <Wifi className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Monitoring Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {lastUpdate && `Last update: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.disconnectedStudents}</div>
                <div className="text-sm text-gray-600">Disconnected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completedStudents}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Exam Sessions
            {isJoining && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active sessions
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(session.status, session.isConnected)}>
                      {getStatusIcon(session.status, session.isConnected)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {session.student?.name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.student?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="font-medium">
                        {session.progress?.answeredQuestions || 0} / {session.progress?.totalQuestions || 0}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Time Left</div>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.timeRemaining)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Status</div>
                      <div className={`font-medium ${getStatusColor(session.status, session.isConnected)}`}>
                        {session.status || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeExamMonitor;
