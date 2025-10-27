import React, { useState, useEffect } from 'react';
import realtimeSocketService from '../../services/realtimeSocketService';
import { clearAuthToken, getAuthToken, isTokenValid, getTokenInfo } from '../../utils/tokenHelper';

const MonitoringTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [examId, setExamId] = useState('68ff09fb8d48caf1f44e26fd');
  const [tokenInfo, setTokenInfo] = useState(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = () => {
    const token = getAuthToken();
    if (!token) {
      addLog('❌ No auth token found');
      return;
    }

    // Check token validity first
    const tokenData = getTokenInfo(token);
    setTokenInfo(tokenData);
    
    if (!isTokenValid(token)) {
      addLog('❌ Token is invalid or expired');
      addLog(`🔐 Token expires: ${tokenData?.expiresAt || 'Unknown'}`);
      addLog('💡 Please log out and log back in to get a fresh token');
      return;
    }

    addLog('🔌 Attempting to connect to monitoring server...');
    addLog(`🔐 Using token for user: ${tokenData?.userType || 'Unknown'} (${tokenData?.userId || 'Unknown'})`);
    
    const socket = realtimeSocketService.connect(token);
    
    // Check connection status
    const checkConnection = () => {
      if (realtimeSocketService.isSocketConnected()) {
        setIsConnected(true);
        addLog('✅ Connected to monitoring server');
      } else {
        addLog('❌ Not connected to monitoring server');
      }
    };

    setTimeout(checkConnection, 1000);
  };

  const testJoinMonitoring = () => {
    if (!realtimeSocketService.isSocketConnected()) {
      addLog('❌ Socket not connected');
      return;
    }

    addLog('👁️ Attempting to join monitoring...');
    realtimeSocketService.joinMonitoring(examId);
  };

  const testRequestActiveSessions = () => {
    if (!realtimeSocketService.isSocketConnected()) {
      addLog('❌ Socket not connected');
      return;
    }

    addLog('📊 Requesting active sessions...');
    realtimeSocketService.requestActiveSessions(examId);
  };

  const testStudentEvent = async () => {
    try {
      addLog('🎓 Sending test student event...');
      const response = await fetch('http://localhost:5004/api/student-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'student_joined',
          data: {
            examId: examId,
            sessionId: 'test-session-' + Date.now(),
            student: {
              name: 'Test Student',
              email: 'test@example.com'
            },
            status: 'active',
            progress: {
              currentQuestion: 1,
              totalQuestions: 10,
              answeredQuestions: 0
            },
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        addLog('✅ Test student event sent successfully');
      } else {
        addLog('❌ Failed to send test student event');
      }
    } catch (error) {
      addLog(`❌ Error sending test student event: ${error.message}`);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    realtimeSocketService.disconnect();
    realtimeSocketService.resetAuthError();
    addLog('🚪 Logged out - please refresh the page and log in again');
    setIsConnected(false);
    setTokenInfo(null);
    // Optionally redirect to login page
    // window.location.href = '/login';
  };

  const checkTokenStatus = () => {
    const token = getAuthToken();
    if (!token) {
      addLog('❌ No auth token found');
      setTokenInfo(null);
      return;
    }
    
    const tokenData = getTokenInfo(token);
    setTokenInfo(tokenData);
    
    if (tokenData) {
      addLog(`🔐 Token Status: ${tokenData.valid ? 'Valid' : 'Invalid'}`);
      addLog(`👤 User: ${tokenData.userType} (${tokenData.userId})`);
      addLog(`⏰ Expires: ${tokenData.expiresAt}`);
      addLog(`⏱️ Time Left: ${tokenData.timeLeft} minutes`);
    } else {
      addLog('❌ Token is malformed or corrupted');
    }
  };

  const debugTokenWithServer = async () => {
    const token = getAuthToken();
    if (!token) {
      addLog('❌ No auth token found');
      return;
    }

    try {
      addLog('🔍 Sending token to monitoring server for debugging...');
      const response = await fetch('http://localhost:5004/api/debug-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (data.success) {
        addLog('✅ Server successfully decoded token');
        addLog(`👤 User found: ${data.userFound ? 'Yes' : 'No'}`);
        if (data.user) {
          addLog(`👤 User details: ${data.user.userType} (${data.user.email})`);
        }
        addLog(`🔍 Decoded payload: ${JSON.stringify(data.decoded)}`);
      } else {
        addLog(`❌ Server failed to decode token: ${data.error}`);
        addLog(`💡 Your token was signed with the old JWT secret`);
        addLog(`💡 Solution: Click "Logout & Clear Token" and log in again`);
      }
    } catch (error) {
      addLog(`❌ Error debugging token: ${error.message}`);
    }
  };


  const refreshConnection = () => {
    const token = getAuthToken();
    if (!token) {
      addLog('❌ No auth token found');
      return;
    }
    
    addLog('🔄 Refreshing socket connection...');
    realtimeSocketService.disconnect();
    realtimeSocketService.resetAuthError(); // Reset auth error flag
    
    // Check token validity before attempting connection
    const tokenData = getTokenInfo(token);
    setTokenInfo(tokenData);
    
    if (!isTokenValid(token)) {
      addLog('❌ Token is invalid or expired - cannot refresh connection');
      addLog(`🔐 Token expires: ${tokenData?.expiresAt || 'Unknown'}`);
      return;
    }
    
    setTimeout(() => {
      const socket = realtimeSocketService.connect(token);
      if (socket) {
        socket.on('connect', () => {
          addLog('🔌 Socket reconnected');
          setIsConnected(true);
        });
        socket.on('connect_error', (error) => {
          addLog(`❌ Reconnection failed: ${error.message}`);
          if (error.message?.includes('Authentication error')) {
            addLog('🔐 Token is still invalid - please log out and log back in');
            setIsConnected(false);
          }
        });
      } else {
        addLog('❌ Failed to create socket connection');
      }
    }, 1000);
  };

  useEffect(() => {
    // Set up socket event listeners
    realtimeSocketService.onMonitoringJoined((data) => {
      addLog(`👁️ Monitoring joined: ${JSON.stringify(data)}`);
    });

    realtimeSocketService.onStudentJoined((data) => {
      addLog(`👤 Student joined: ${JSON.stringify(data)}`);
    });

    realtimeSocketService.onActiveSessionsResponse((data) => {
      addLog(`📊 Active sessions response: ${JSON.stringify(data)}`);
    });

    realtimeSocketService.onError((error) => {
      addLog(`❌ Socket error: ${error}`);
    });

    // Don't automatically connect on component mount to prevent repeated auth errors
    // Let user manually test connection instead
    addLog('ℹ️ Ready to test connection - click "Test Connection" button');
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Monitoring Test</h1>
      
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            tokenInfo?.valid ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {tokenInfo ? (tokenInfo.valid ? `Token Valid (${tokenInfo.timeLeft}m left)` : 'Token Invalid') : 'No Token'}
          </div>
          <input
            type="text"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            placeholder="Exam ID"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        {tokenInfo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium mb-1">Token Information:</div>
            <div>User Type: {tokenInfo.userType || 'Unknown'}</div>
            <div>User ID: {tokenInfo.userId || 'Unknown'}</div>
            <div>Expires: {tokenInfo.expiresAt || 'Unknown'}</div>
            <div>Time Left: {tokenInfo.timeLeft} minutes</div>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={checkTokenStatus}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Check Token Status
          </button>
          <button
            onClick={debugTokenWithServer}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Debug Token with Server
          </button>
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Test Connection
          </button>
          <button
            onClick={refreshConnection}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Refresh Connection
          </button>
          <button
            onClick={testJoinMonitoring}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            disabled={!isConnected}
          >
            Join Monitoring
          </button>
          <button
            onClick={testRequestActiveSessions}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            disabled={!isConnected}
          >
            Request Active Sessions
          </button>
          <button
            onClick={testStudentEvent}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Send Test Student Event
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout & Clear Token
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Logs:</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonitoringTest;
