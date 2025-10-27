import React from 'react';
import { User, Clock, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const StudentBubble = ({ 
  student, 
  session, 
  isSelected, 
  onClick, 
  showDetails = true 
}) => {
  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { 
          color: 'bg-green-500', 
          borderColor: 'border-green-500',
          icon: <CheckCircle className="w-3 h-3 text-white" />,
          pulse: true
        };
      case 'waiting':
        return { 
          color: 'bg-yellow-500', 
          borderColor: 'border-yellow-500',
          icon: <Clock className="w-3 h-3 text-white" />,
          pulse: false
        };
      case 'paused':
        return { 
          color: 'bg-orange-500', 
          borderColor: 'border-orange-500',
          icon: <AlertTriangle className="w-3 h-3 text-white" />,
          pulse: false
        };
      case 'completed':
        return { 
          color: 'bg-blue-500', 
          borderColor: 'border-blue-500',
          icon: <CheckCircle className="w-3 h-3 text-white" />,
          pulse: false
        };
      case 'disconnected':
        return { 
          color: 'bg-gray-400', 
          borderColor: 'border-gray-400',
          icon: <WifiOff className="w-3 h-3 text-white" />,
          pulse: false
        };
      default:
        return { 
          color: 'bg-gray-500', 
          borderColor: 'border-gray-500',
          icon: <User className="w-3 h-3 text-white" />,
          pulse: false
        };
    }
  };

  const statusInfo = getStatusInfo(session?.status || 'waiting');
  const isConnected = session?.isConnected !== false;
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Calculate progress percentage
  const progressPercentage = session?.progress ? 
    Math.round((session.progress.answeredQuestions / session.progress.totalQuestions) * 100) : 0;

  return (
    <div 
      className={`relative cursor-pointer transition-all duration-300 flex items-center justify-center ${
        isSelected ? 'scale-110 z-10' : 'hover:scale-105'
      }`}
      onClick={() => onClick && onClick(session)}
    >
      {/* Main Bubble */}
      <div className={`
        relative w-20 h-20 rounded-full border-3 ${statusInfo.borderColor}
        ${statusInfo.color} flex items-center justify-center
        ${statusInfo.pulse ? 'animate-pulse' : ''}
        ${isSelected ? 'ring-4 ring-blue-300 ring-opacity-50 shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        transition-all duration-300 backdrop-blur-sm
      `}>
        {/* Student Initials */}
        <span className="text-white font-bold text-lg">
          {getInitials(student?.name || 'Unknown')}
        </span>
        
        {/* Connection Status Indicator */}
        <div className="absolute -top-1 -right-1">
          {isConnected ? (
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <Wifi className="w-2.5 h-2.5 text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <WifiOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Progress Ring */}
        {session?.progress && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white opacity-30"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-white"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progressPercentage}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Modern Student Details Tooltip */}
      {showDetails && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center min-w-max z-30">
          <div className="bg-white/95 backdrop-blur-sm text-gray-900 text-sm px-4 py-3 rounded-2xl shadow-2xl border border-gray-200/50">
            <div className="font-bold text-base mb-1">{student?.name || 'Unknown Student'}</div>
            <div className="text-xs text-gray-600 mb-2">{student?.email}</div>
            
            {session?.progress && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {session.progress.answeredQuestions}/{session.progress.totalQuestions} questions
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Alert Indicator */}
      {session?.securityFlags && session.securityFlags.length > 0 && (
        <div className="absolute -top-1 -left-1">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <AlertTriangle className="w-2 h-2 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBubble;
