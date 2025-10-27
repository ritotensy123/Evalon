import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  User,
  Calendar,
  Timer,
  Shield,
  Activity,
  Wifi,
  WifiOff,
  Video,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import realtimeSocketService from '../../services/realtimeSocketService';
import { useAuth } from '../../contexts/AuthContext';
import StudentBubbleGrid from '../../components/exam/StudentBubbleGrid';

const ExamMonitoring = ({ exam, onClose }) => {
  const { user } = useAuth();
  
  // State management
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    securityFlags: 0
  });

  // Real-time data will come from socket events - no mock data needed

  // Initialize monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      const token = localStorage.getItem('authToken');
      if (token && exam) {
        console.log('🔧 Initializing monitoring for exam:', exam._id);
        
        // Connect to real-time socket if not already connected
        if (!realtimeSocketService.isSocketConnected()) {
          console.log('🔌 Connecting to real-time monitoring socket...');
          const socket = realtimeSocketService.connect(token);
          
          // Wait for socket to be connected
          const waitForConnection = () => {
            return new Promise((resolve) => {
              if (realtimeSocketService.isSocketConnected()) {
                resolve();
              } else {
                const checkConnection = () => {
                  if (realtimeSocketService.isSocketConnected()) {
                    resolve();
                  } else {
                    setTimeout(checkConnection, 100);
                  }
                };
                checkConnection();
              }
            });
          };
          
          await waitForConnection();
          console.log('✅ Real-time socket connected, setting up monitoring...');
        }
        
        // Set up socket event listeners
        realtimeSocketService.onMonitoringJoined((data) => {
          console.log('👁️ Monitoring joined:', data);
          if (data.activeSessions && Array.isArray(data.activeSessions)) {
            // Simple validation: only show sessions that are actually connected
            const validSessions = data.activeSessions.filter(session => {
              return session.isConnected === true && session.status === 'active';
            });
            
            console.log(`📊 Received ${data.activeSessions.length} sessions, ${validSessions.length} are valid`);
            setActiveSessions(validSessions);
            setIsMonitoring(true);
            setIsSocketConnected(true);
            updateMonitoringStats(validSessions);
          }
        });
        
        realtimeSocketService.onStudentJoined((data) => {
          console.log('👤 Student joined:', data);
          console.log('🎯 New student data structure:', {
            sessionId: data.sessionId,
            student: data.student,
            status: data.status,
            examId: data.examId
          });
          
          setActiveSessions(prev => {
            // Check if student already exists to avoid duplicates
            const exists = prev.some(session => session.sessionId === data.sessionId);
            if (exists) {
              console.log('🔄 Updating existing student session');
              return prev.map(session => 
                session.sessionId === data.sessionId 
                  ? { ...session, ...data, isConnected: true }
                  : session
              );
            }
            console.log('➕ Adding new student session');
            return [...prev, { ...data, isConnected: true }];
          });
          
          // Update stats with the new session
          setActiveSessions(prev => {
            updateMonitoringStats(prev);
            return prev;
          });
        });
        
        realtimeSocketService.onStudentDisconnected((data) => {
          console.log('👤 Student disconnected event received:', data);
          console.log('👤 Current active sessions before removal:', activeSessions.length);
          
          setActiveSessions(prev => {
            // Remove the student bubble completely when they disconnect
            const filtered = prev.filter(session => session.sessionId !== data.sessionId);
            console.log(`🗑️ Removed student bubble for session ${data.sessionId}`);
            console.log('👤 Active sessions after removal:', filtered.length);
            return filtered;
          });
          
          // Clear selected session if it was the one that disconnected
          if (selectedSession && selectedSession.sessionId === data.sessionId) {
            console.log('👤 Clearing selected session as it disconnected');
            setSelectedSession(null);
          }
          
          // Update stats
          setActiveSessions(prev => {
            updateMonitoringStats(prev);
            return prev;
          });
        });

        realtimeSocketService.onStudentLeft((data) => {
          console.log('👤 Student left exam:', data);
          setActiveSessions(prev => {
            // Remove the student bubble completely when they leave
            const filtered = prev.filter(session => session.sessionId !== data.sessionId);
            console.log(`🗑️ Removed student bubble for left session ${data.sessionId}`);
            return filtered;
          });
          
          // Clear selected session if it was the one that left
          if (selectedSession && selectedSession.sessionId === data.sessionId) {
            setSelectedSession(null);
          }
          
          // Update stats
          setActiveSessions(prev => {
            updateMonitoringStats(prev);
            return prev;
          });
        });
        
        // Handle student reconnection
        realtimeSocketService.socket?.on('student_reconnected', (data) => {
          console.log('🔄 Student reconnected:', data);
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { ...session, isConnected: true, status: 'active', ...data }
                : session
            )
          );
          
          // Update stats
          setActiveSessions(prev => {
            updateMonitoringStats(prev);
            return prev;
          });
        });
        
        realtimeSocketService.onExamStartedMonitoring((data) => {
          console.log('🚀 Exam started:', data);
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { ...session, status: 'active', startTime: data.startTime, timeRemaining: data.duration * 60 }
                : session
            )
          );
        });
        
        realtimeSocketService.onExamEnded((data) => {
          console.log('🏁 Exam ended event received:', data);
          console.log('🏁 Current active sessions before removal:', activeSessions.length);
          
          setActiveSessions(prev => {
            // Remove the student bubble completely when exam ends
            const filtered = prev.filter(session => session.sessionId !== data.sessionId);
            console.log(`🗑️ Removed student bubble for completed exam session ${data.sessionId}`);
            console.log('🏁 Active sessions after removal:', filtered.length);
            return filtered;
          });
          
          // Clear selected session if it was the one that ended
          if (selectedSession && selectedSession.sessionId === data.sessionId) {
            console.log('🏁 Clearing selected session as it ended');
            setSelectedSession(null);
          }
          
          // Update stats
          setActiveSessions(prev => {
            updateMonitoringStats(prev);
            return prev;
          });
        });
        
        realtimeSocketService.onProgressUpdate((data) => {
          console.log('📊 Progress update:', data);
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { ...session, progress: data.progress, lastActivity: new Date() }
                : session
            )
          );
        });
        
        realtimeSocketService.onAnswerSubmitted((data) => {
          console.log('📝 Answer submitted:', data);
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { ...session, lastActivity: new Date() }
                : session
            )
          );
        });
        
        realtimeSocketService.onSecurityAlert((data) => {
          console.log('🚨 Security alert:', data);
          setSecurityAlerts(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 alerts
          
          // Update the specific student's security flags
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { 
                    ...session, 
                    securityFlags: [...(session.securityFlags || []), data.flag],
                    lastActivity: new Date()
                  }
                : session
            )
          );
          
          setMonitoringStats(prev => ({
            ...prev,
            securityFlags: prev.securityFlags + 1
          }));
        });
        
        realtimeSocketService.onTimeUpdate((data) => {
          setActiveSessions(prev => 
            prev.map(session => 
              session.sessionId === data.sessionId 
                ? { ...session, timeRemaining: data.timeRemaining }
                : session
            )
          );
        });
        
        realtimeSocketService.onError((error) => {
          console.error('Socket error:', error);
        });

        // WebSocket events are handled by specific listeners below

        realtimeSocketService.onActiveSessionsResponse((data) => {
          console.log('📋 Active sessions response:', data);
          if (data.sessions && Array.isArray(data.sessions)) {
            // Simple validation: only show sessions that are actually connected
            const validSessions = data.sessions.filter(session => {
              return session.isConnected === true && session.status === 'active';
            });
            
            console.log(`📊 Received ${data.sessions.length} sessions, ${validSessions.length} are valid`);
            setActiveSessions(validSessions);
            updateMonitoringStats(validSessions);
          }
        });
        
        // Now that socket is connected, join monitoring room
        console.log('🎯 Joining monitoring room for exam:', exam._id);
        realtimeSocketService.joinMonitoring(exam._id);
        
        // Request current active sessions
        console.log('📋 Requesting active sessions...');
        realtimeSocketService.requestActiveSessions(exam._id);
        
        setIsSocketConnected(true);
        
      }
    };
    
    initializeMonitoring();
    
    // WebSocket-only approach - no periodic polling needed
    // Real-time updates come from WebSocket events only
    
    return () => {
      if (exam) {
        realtimeSocketService.leaveMonitoring(exam._id);
      }
    };
  }, [exam]);

  // Update monitoring statistics
  const updateMonitoringStats = (sessions) => {
    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      securityFlags: securityAlerts.length
    };
    setMonitoringStats(stats);
  };

  // Format time remaining
  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'terminated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Request screen share
  const handleRequestScreenShare = (sessionId) => {
    realtimeSocketService.requestScreenShare(sessionId);
  };

  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Exam Monitoring
                </h1>
                <p className="text-sm text-gray-600">{exam.title} • {exam.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isSocketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isSocketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isSocketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {monitoringStats.activeSessions} Active
                </span>
              </div>
              
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Student Bubbles */}
          <div className="w-1/2 border-r border-gray-200">
          <StudentBubbleGrid
            activeSessions={activeSessions}
            selectedSession={selectedSession}
            onSessionSelect={setSelectedSession}
            exam={exam}
          />
          </div>

          {/* Right Panel - Session Details */}
          <div className="w-1/2 flex flex-col">
            {selectedSession ? (
              <>
                {/* Session Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedSession.student.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedSession.student.email} • Session: {selectedSession.sessionId.slice(-8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRequestScreenShare(selectedSession.sessionId)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Request Screen Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Progress */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Progress
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Current Question</span>
                            <span>{selectedSession.progress?.currentQuestion || 0}/{selectedSession.progress?.totalQuestions || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((selectedSession.progress?.currentQuestion || 0) / (selectedSession.progress?.totalQuestions || 1)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Answered</span>
                            <span>{selectedSession.progress?.answeredQuestions || 0}/{selectedSession.progress?.totalQuestions || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((selectedSession.progress?.answeredQuestions || 0) / (selectedSession.progress?.totalQuestions || 1)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time Remaining:</span>
                          <span className="font-medium">{formatTime(selectedSession.timeRemaining)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Started:</span>
                          <span className="font-medium">
                            {selectedSession.startTime ? new Date(selectedSession.startTime).toLocaleTimeString() : 'Not started'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                            {selectedSession.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Flags */}
                  {selectedSession.securityFlags && selectedSession.securityFlags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security Flags
                      </h4>
                      <div className="space-y-2">
                        {selectedSession.securityFlags.map((flag, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-red-900 capitalize">
                                {flag.type.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(flag.severity)}`}>
                                {flag.severity}
                              </span>
                            </div>
                            <p className="text-sm text-red-700">{flag.details}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {new Date(flag.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a session to monitor</p>
                  <p className="text-sm">Choose a student session from the left panel to view detailed monitoring information</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Alerts Panel */}
        {securityAlerts.length > 0 && (
          <div className="border-t border-gray-200 bg-red-50 p-4">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recent Security Alerts
            </h4>
            <div className="flex gap-2 overflow-x-auto">
              {securityAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="bg-white border border-red-200 rounded-lg p-3 min-w-[200px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-900 text-sm">
                      {alert.student.name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.flag.severity)}`}>
                      {alert.flag.severity}
                    </span>
                  </div>
                  <p className="text-xs text-red-700">{alert.flag.details}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamMonitoring;
