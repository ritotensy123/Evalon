import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  List,
  Filter,
  RefreshCw,
  Zap,
  Target,
  CheckCircle2,
  XCircle,
  PauseCircle
} from 'lucide-react';
import StudentBubble from './StudentBubble';

const StudentBubbleGrid = ({ 
  activeSessions = [], 
  selectedSession, 
  onSessionSelect,
  exam 
}) => {
  const [viewMode, setViewMode] = useState('bubbles'); // 'bubbles' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'waiting', 'completed'
  const [showFilters, setShowFilters] = useState(false);


  // Filter sessions based on status
  const filteredSessions = activeSessions.filter(session => {
    if (filterStatus === 'all') return true;
    return session.status === filterStatus;
  });

  // Use filtered sessions directly
  const displaySessions = filteredSessions;

  // Group sessions by status for statistics
  const statusCounts = {
    all: activeSessions.length,
    active: activeSessions.filter(s => s.status === 'active').length,
    waiting: activeSessions.filter(s => s.status === 'waiting').length,
    completed: activeSessions.filter(s => s.status === 'completed').length,
    disconnected: activeSessions.filter(s => s.isConnected === false).length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Live Monitoring
              </h3>
              <p className="text-sm text-gray-600">
                {exam?.title} • {activeSessions.length} students
              </p>
            </div>
          </div>
          
          {/* Modern Controls */}
          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('bubbles')}
                className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'bubbles' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { status: 'all', label: 'Total', count: statusCounts.all, icon: Users, color: 'blue' },
            { status: 'active', label: 'Active', count: statusCounts.active, icon: Activity, color: 'green' },
            { status: 'waiting', label: 'Waiting', count: statusCounts.waiting, icon: Clock, color: 'yellow' },
            { status: 'completed', label: 'Completed', count: statusCounts.completed, icon: CheckCircle2, color: 'purple' }
          ].map(({ status, label, count, icon: Icon, color }) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`group p-4 rounded-2xl transition-all duration-200 ${
                filterStatus === status 
                  ? `bg-${color}-100 border-2 border-${color}-300 shadow-lg` 
                  : 'bg-white/60 border border-gray-200 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  filterStatus === status 
                    ? `bg-${color}-500` 
                    : 'bg-gray-400 group-hover:bg-gray-500'
                }`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className={`text-lg font-bold ${
                    filterStatus === status ? `text-${color}-700` : 'text-gray-700'
                  }`}>
                    {count}
                  </div>
                  <div className={`text-xs font-medium ${
                    filterStatus === status ? `text-${color}-600` : 'text-gray-500'
                  }`}>
                    {label}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Quick Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filterStatus === status 
                      ? getStatusColor(status) 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        {displaySessions.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Users className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {filterStatus === 'all' 
                  ? 'Waiting for students to join...'
                  : `No ${filterStatus} students found`
                }
              </h3>
              <p className="text-gray-500 mb-6 text-lg">
                Students will appear here when they join the exam
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-600 rounded-full text-sm font-medium shadow-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                Live monitoring active
              </div>
            </div>
          </div>
        ) : viewMode === 'bubbles' ? (
          /* Centered Bubble Grid View */
          <div className="h-full flex items-center justify-center p-6">
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-10 max-w-7xl">
              {displaySessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-center w-24 h-24">
                  <StudentBubble
                    student={session.student}
                    session={session}
                    isSelected={selectedSession?.sessionId === session.sessionId}
                    onClick={onSessionSelect}
                    showDetails={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Modern List View */
          <div className="h-full overflow-y-auto">
            <div className="space-y-3">
              {displaySessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`group p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    selectedSession?.sessionId === session.sessionId
                      ? 'bg-blue-50 border-blue-300 shadow-lg'
                      : 'bg-white/80 border-gray-200 hover:bg-white hover:shadow-md'
                  }`}
                  onClick={() => onSessionSelect && onSessionSelect(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.status === 'active' ? 'bg-green-500 animate-pulse' :
                        session.status === 'waiting' ? 'bg-yellow-500' :
                        session.status === 'completed' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <span className="font-semibold text-gray-900">
                          {session.student?.name || 'Unknown Student'}
                        </span>
                        <div className="text-sm text-gray-500 capitalize">
                          {session.status} • {session.progress ? `${session.progress.answeredQuestions}/${session.progress.totalQuestions}` : '0/0'} questions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.isConnected ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <span className="text-xs text-gray-400">
                        {session.isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBubbleGrid;
