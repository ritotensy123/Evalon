import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  FileText,
  ChevronDown,
  Users,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  BarChart3,
  BookOpen,
  User,
  MessageSquare,
  FileBarChart,
  Plus,
  Calendar,
  Star,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Calendar as CalendarIcon,
  Book,
  FileText as Assignment,
  Users as Class,
  Calendar as Schedule,
  Star as Grade,
  HelpCircle as Quiz,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Target,
  Award,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { clearAuthData } from '../../utils/clearAuth';
import { examAPI } from '../../services/api';
import ScheduleManagement from './ScheduleManagement';
import StudentExamInterface from '../../components/exam/StudentExamInterface';
import '../../styles/dashboard/organization.css';

const StudentDashboard = () => {
  const { user, dashboardData, logout, isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('12 Months');
  const [scheduledExams, setScheduledExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Student exam interface state
  const [currentExam, setCurrentExam] = useState(null);
  const [showExamInterface, setShowExamInterface] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 500);
    
    // Only fetch data if user is authenticated
    if (user && isAuthenticated) {
      fetchScheduledExams();
      fetchCompletedExams();
    }
  }, [user, isAuthenticated]);

  // Auto-refresh exam data to get updated status (reduced frequency)
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    
    const refreshInterval = setInterval(() => {
      fetchScheduledExams();
    }, 60000); // Refresh every 60 seconds instead of 30

    return () => clearInterval(refreshInterval);
  }, [user, isAuthenticated]);

  const fetchScheduledExams = async () => {
    // Prevent duplicate requests
    if (examsLoading) return;
    
    try {
      setExamsLoading(true);
      // Fetch both scheduled and active exams
      const [scheduledResponse, activeResponse] = await Promise.all([
        examAPI.getExamsByStudent({ status: 'scheduled' }),
        examAPI.getExamsByStudent({ status: 'active' })
      ]);
      
      const scheduledExams = scheduledResponse.success ? (scheduledResponse.data.exams || []) : [];
      const activeExams = activeResponse.success ? (activeResponse.data.exams || []) : [];
      
      // Combine scheduled and active exams
      setScheduledExams([...scheduledExams, ...activeExams]);
    } catch (error) {
      console.error('Error fetching scheduled exams:', error);
      // Don't show error to user for background refresh failures
      if (error.response?.status === 401) {
        console.log('Authentication error - user may need to re-login');
      }
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchCompletedExams = async () => {
    // Prevent duplicate requests
    if (historyLoading) return;
    
    try {
      setHistoryLoading(true);
      const response = await examAPI.getExamsByStudent({ status: 'completed' });
      if (response.success) {
        setCompletedExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching completed exams:', error);
      // Don't show error to user for background refresh failures
      if (error.response?.status === 401) {
        console.log('Authentication error - user may need to re-login');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper function to check if student can enter exam (5 minutes before start time)
  const canEnterExam = (exam) => {
    console.log('🎓 Student canEnterExam called:', {
      examId: exam.id,
      examTitle: exam.title,
      scheduledDate: exam.scheduledDate,
      startTime: exam.startTime,
      scheduledDateType: typeof exam.scheduledDate,
      startTimeType: typeof exam.startTime
    });
    
    
    if (!exam.scheduledDate || !exam.startTime) return false;
    
    try {
      // Create a more robust date parsing function
      let scheduledDateTime;
      
      // Handle different date formats
      if (exam.scheduledDate instanceof Date) {
        // If it's a Date object, use it directly and set the time
        scheduledDateTime = new Date(exam.scheduledDate);
        const [hours, minutes] = exam.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (typeof exam.scheduledDate === 'string') {
        // If it's a string, parse it properly
        let datePart;
        if (exam.scheduledDate.includes('T')) {
          // It's an ISO string like "2025-10-26T00:00:00.000Z"
          datePart = exam.scheduledDate.split('T')[0];
        } else {
          // It's already just a date like "2025-10-26"
          datePart = exam.scheduledDate;
        }
        
        // Create the scheduled date time - ensure it's treated as local time
        scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
      } else {
        console.error('❌ Invalid scheduledDate format:', exam.scheduledDate);
        return false;
      }
      
      // Check if the date is valid
      if (isNaN(scheduledDateTime.getTime())) {
        console.error('❌ Invalid date created for exam entry check:', {
          scheduledDate: exam.scheduledDate,
          startTime: exam.startTime,
          scheduledDateTime: scheduledDateTime
        });
        return false;
      }
      
      console.log('✅ Student date parsing successful:', {
        originalScheduledDate: exam.scheduledDate,
        originalStartTime: exam.startTime,
        parsedDateTime: scheduledDateTime.toISOString()
      });
      
      const now = new Date();
      const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
      const examEndTime = new Date(scheduledDateTime.getTime() + exam.duration * 60 * 1000);
      
      const canEnter = now >= fiveMinutesBefore && now < examEndTime;
      
      console.log('🎓 Student exam entry check:', {
        examId: exam.id,
        examTitle: exam.title,
        now: now.toISOString(),
        nowLocal: now.toLocaleString(),
        scheduledDateTime: scheduledDateTime.toISOString(),
        scheduledDateTimeLocal: scheduledDateTime.toLocaleString(),
        fiveMinutesBefore: fiveMinutesBefore.toISOString(),
        fiveMinutesBeforeLocal: fiveMinutesBefore.toLocaleString(),
        examEndTime: examEndTime.toISOString(),
        examEndTimeLocal: examEndTime.toLocaleString(),
        canEnter: canEnter,
        // Detailed analysis
        timeToFiveMinutesBefore: Math.round((fiveMinutesBefore.getTime() - now.getTime()) / (1000 * 60)) + ' minutes',
        timeToExamEnd: Math.round((examEndTime.getTime() - now.getTime()) / (1000 * 60)) + ' minutes',
        reason1: now >= fiveMinutesBefore ? 'PASS: Current time >= 5 minutes before' : 'FAIL: Current time < 5 minutes before',
        reason2: now < examEndTime ? 'PASS: Current time < exam end time' : 'FAIL: Current time >= exam end time'
      });
      
      // Can enter exam 5 minutes before scheduled time and before exam ends
      return canEnter;
    } catch (error) {
      console.error('Error checking exam entry time:', error);
      return false;
    }
  };

  // Helper function to get time until exam can be entered
  const getTimeUntilEnterable = (exam) => {
    if (!exam.scheduledDate || !exam.startTime) return null;
    
    try {
      const scheduledDateStr = exam.scheduledDate;
      let datePart;
      
      if (scheduledDateStr.includes('T')) {
        datePart = scheduledDateStr.split('T')[0];
      } else {
        datePart = scheduledDateStr;
      }
      
      const combinedDateTime = `${datePart}T${exam.startTime}`;
      const scheduledDateTime = new Date(combinedDateTime);
      
      if (isNaN(scheduledDateTime.getTime())) {
        return null;
      }
      
      const now = new Date();
      const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
      const timeDiff = fiveMinutesBefore.getTime() - now.getTime();
      
      if (timeDiff <= 0) return null;
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating time until enterable:', error);
      return null;
    }
  };

  // Handle entering exam
  const handleEnterExam = (exam) => {
    setCurrentExam(exam);
    setShowExamInterface(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
    }
  };

  const handleClearAuth = () => {
    clearAuthData();
    window.location.reload();
  };

  // Sample data
  const performanceData = [
    { month: 'Feb', value: 78 },
    { month: 'Mar', value: 82 },
    { month: 'Apr', value: 85 },
    { month: 'May', value: 88 },
    { month: 'Jun', value: 91 },
    { month: 'Jul', value: 89 },
    { month: 'Aug', value: 92 },
    { month: 'Sep', value: 94 },
    { month: 'Oct', value: 96 },
    { month: 'Nov', value: 93 },
    { month: 'Dec', value: 95 },
    { month: 'Jan', value: 97 },
  ];

  const subjectPerformanceData = [
    { name: 'Mathematics', value: 92, color: '#8b5cf6' },
    { name: 'Physics', value: 87, color: '#06b6d4' },
    { name: 'Chemistry', value: 78, color: '#10b981' },
    { name: 'English', value: 65, color: '#f59e0b' },
  ];

  const recentAssignments = [
    { id: 1, type: 'Math Quiz', score: '92/100', date: 'Jan 17', subject: 'Mathematics', status: 'completed', grade: 'A' },
    { id: 2, type: 'Physics Test', score: '87/100', date: 'Jan 16', subject: 'Physics', status: 'pending', grade: 'B+' },
    { id: 3, type: 'Chemistry Lab', score: '89/100', date: 'Jan 15', subject: 'Chemistry', status: 'completed', grade: 'A-' },
    { id: 4, type: 'English Essay', score: '78/100', date: 'Jan 14', subject: 'English', status: 'graded', grade: 'B' },
  ];

  // Format scheduled exams as upcoming events
  const upcomingEvents = scheduledExams.slice(0, 3).map((exam, index) => ({
    id: exam._id || `exam-${index}`,
    title: exam.title,
    date: new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: exam.startTime || 'TBD',
    type: 'exam'
  }));

  const achievements = [
    { id: 1, title: 'Perfect Score', description: 'Math Quiz - 100%', icon: <Trophy className="w-4 h-4" />, color: 'yellow' },
    { id: 2, title: 'Consistent Performer', description: '5 assignments in a row', icon: <Target className="w-4 h-4" />, color: 'green' },
    { id: 3, title: 'Top Student', description: 'Physics - This Month', icon: <Award className="w-4 h-4" />, color: 'blue' },
  ];

  // Navigation modules for students - Simplified and focused
  const coreModules = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: activeModule === 'dashboard' },
    { id: 'exams', label: 'My Exams', icon: <ClipboardList className="w-5 h-5" />, count: scheduledExams.length.toString(), active: activeModule === 'exams' },
    { id: 'exam-history', label: 'Exam History', icon: <FileBarChart className="w-5 h-5" />, count: completedExams.length.toString(), active: activeModule === 'exam-history' },
    { id: 'assignments', label: 'Assignments', icon: <Assignment className="w-5 h-5" />, count: '8', active: activeModule === 'assignments' },
    { id: 'grades', label: 'Grades', icon: <Grade className="w-5 h-5" />, count: '24', active: activeModule === 'grades' },
  ];

  const academicModules = [
    { id: 'schedule', label: 'Schedule', icon: <Schedule className="w-5 h-5" />, active: activeModule === 'schedule' },
    { id: 'classes', label: 'Classes', icon: <Class className="w-5 h-5" />, active: activeModule === 'classes' },
    { id: 'resources', label: 'Resources', icon: <Book className="w-5 h-5" />, active: activeModule === 'resources' },
  ];

  const StatusDot = ({ status }) => {
    const statusClasses = {
      completed: 'w-2 h-2 rounded-full bg-green-500',
      pending: 'w-2 h-2 rounded-full bg-yellow-500',
      graded: 'w-2 h-2 rounded-full bg-blue-500',
      canceled: 'w-2 h-2 rounded-full bg-red-500',
    };
    return <div className={statusClasses[status] || statusClasses.completed} />;
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Evalon</h1>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="p-4 pb-3">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Plus className="w-4 h-4" />
            Submit Assignment
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Core Management */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Learning</h3>
            {coreModules.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center justify-between py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                  item.active ? 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-600' : 'hover:bg-gray-50 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center">
                  <div className={`mr-3 ${item.active ? 'text-purple-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.count && (
                  <div className={`rounded-lg px-2 py-1 text-xs font-semibold min-w-6 text-center ${
                    item.active ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Academic */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">More</h3>
            {academicModules.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className="flex items-center py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 hover:bg-gray-50 hover:translate-x-1"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50">
              <Settings className="w-5 h-5 text-gray-500 mr-3" />
              <span className="text-sm font-medium">Settings</span>
            </div>
            <div onClick={handleLogout} className="flex items-center py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50">
              <LogOut className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-sm font-medium text-red-500">Logout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button className="hidden lg:block text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            <button className="md:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center bg-gray-50 rounded-lg px-3 py-2 min-w-72 border border-gray-200 transition-all duration-200 focus-within:border-purple-500 focus-within:bg-white focus-within:shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Search assignments, grades, classes...</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 hover:-translate-y-0.5 flex items-center justify-center">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</div>
              <Bell className="w-4 h-4 text-gray-500" />
            </div>
            
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.profile?.firstName?.charAt(0) || 'S'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 bg-gray-50">
          {activeModule === 'dashboard' ? (
            <>
        {/* Welcome Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      Welcome back, {user?.profile?.firstName || 'Student'}!
                    </h1>
                    <p className="text-gray-600">Keep up the great work in your studies</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleClearAuth} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Clear Auth (Dev)
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                      <Plus className="w-4 h-4" />
                      Quick Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { title: "Active Courses", value: '6', change: '+1', trend: 'up', icon: <Book className="w-5 h-5" />, color: 'purple' },
                  { title: 'Assignments', value: '8', change: '+2', trend: 'up', icon: <Assignment className="w-5 h-5" />, color: 'green' },
                  { title: 'Quizzes Taken', value: '12', change: '+3', trend: 'up', icon: <Quiz className="w-5 h-5" />, color: 'yellow' },
                  { title: 'Overall Grade', value: 'A-', change: '+5%', trend: 'up', icon: <Grade className="w-5 h-5" />, color: 'blue' },
                ].map((card, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        card.color === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                        card.color === 'green' ? 'bg-green-50 border-green-200 text-green-600' :
                        card.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        {card.icon}
                      </div>
                      <div className={`flex items-center ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {card.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-xs font-semibold">{card.change}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  </div>
                ))}
              </div>

              {/* Upcoming Exams Section */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Exams</h2>
                  <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">View All →</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Your scheduled examinations.</p>
                <div className="space-y-3">
                  {examsLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : scheduledExams.length > 0 ? (
                    scheduledExams.slice(0, 5).map((exam) => (
                      <div key={exam._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                        <div className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center mr-3">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="flex-1 ml-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{exam.title}</h3>
                          <p className="text-xs text-gray-600">{exam.subject} • {exam.class}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs text-gray-600">{exam.startTime}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No upcoming exams scheduled
                    </div>
                  )}
                </div>
              </div>

              {/* Exam History Section */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Exam History</h2>
                  <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">View All →</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Your completed examinations and results.</p>
                <div className="space-y-3">
                  {historyLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : completedExams.length > 0 ? (
                    completedExams.slice(0, 5).map((exam) => (
                      <div key={exam._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                        <div className="w-7 h-7 rounded-md bg-green-100 text-green-600 flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 ml-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{exam.title}</h3>
                          <p className="text-xs text-gray-600">{exam.subject} • {exam.class}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {exam.score !== undefined ? `${exam.score}/${exam.totalMarks}` : 'Pending'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {exam.completedAt ? new Date(exam.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Completed'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No completed exams yet
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Two sections stacked */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Recent Assignments */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900">Recent Assignments</h2>
                    <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">See All Assignments →</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Your latest assignment submissions and grades.</p>
                  <div className="space-y-3">
                    {recentAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                        <StatusDot status={assignment.status} />
                        <div className="flex-1 ml-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{assignment.type}</h3>
                          <p className="text-xs text-gray-600">{assignment.subject} • {assignment.grade}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{assignment.score}</p>
                          <p className="text-xs text-gray-600">{assignment.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>

                  {/* Upcoming Exams */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Exams</h2>
                      <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">View All →</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Your scheduled examinations.</p>
                    <div className="space-y-3">
                      {examsLoading ? (
                        <div className="text-center py-4">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                        </div>
                      ) : scheduledExams.length > 0 ? (
                        scheduledExams.slice(0, 5).map((exam) => (
                          <div key={exam._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                            <div className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center mr-3">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <div className="flex-1 ml-3">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">{exam.title}</h3>
                              <p className="text-xs text-gray-600">{exam.subject} • {exam.class}</p>
                            </div>
                            <div className="text-right mr-3">
                              <p className="text-sm font-semibold text-gray-900 mb-1">{new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                              <p className="text-xs text-gray-600">{exam.startTime}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                                <Eye className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No upcoming exams scheduled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  {/* Achievements */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-gray-900">Recent Achievements</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Your latest accomplishments and badges.</p>
                    <div className="space-y-3">
                      {achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-3 ${
                            achievement.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                            achievement.color === 'green' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{achievement.title}</h3>
                            <p className="text-xs text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block">VIEW ALL ACHIEVEMENTS →</span>
                  </div>

                  {/* Upcoming Events */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Your scheduled classes and important dates.</p>
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-3 ${
                            event.type === 'exam' ? 'bg-red-100 text-red-600' :
                            event.type === 'lab' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {event.type === 'exam' ? <ClipboardList className="w-4 h-4" /> :
                             event.type === 'lab' ? <Book className="w-4 h-4" /> :
                             <Class className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-xs text-gray-600">{event.date} at {event.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block">VIEW CALENDAR →</span>
                  </div>
                </div>
              </div>
            </>
          ) : activeModule === 'exams' ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
                  <p className="text-gray-600">View and manage your scheduled examinations</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Export Schedule
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                    <Calendar className="w-4 h-4" />
                    View Calendar
                  </button>
                </div>
              </div>

              {/* Exam List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Scheduled Exams</h2>
                    <span className="text-sm text-gray-500">{scheduledExams.length} exams</span>
                  </div>
                  
                  {examsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Loading exams...</p>
                    </div>
                  ) : scheduledExams.length > 0 ? (
                    <div className="space-y-4">
                      {scheduledExams.map((exam) => (
                        <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  exam.status === 'active' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {exam.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-3">{exam.subject} • {exam.class}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>{new Date(exam.scheduledDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>{exam.startTime || 'TBD'}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  <span>{exam.duration} minutes</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Users className="w-4 h-4 mr-2" />
                                  <span>{exam.totalQuestions} questions</span>
                                </div>
                              </div>

                              {exam.questionBankId && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center">
                                    <BookOpen className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-800">Question Bank: {exam.questionBankId.name}</span>
                                  </div>
                                  <p className="text-xs text-green-700 mt-1">
                                    {exam.questionBankId.totalQuestions} questions • {exam.questionBankId.totalMarks} marks
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              {canEnterExam(exam) ? (
                                <button 
                                  onClick={() => handleEnterExam(exam)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                                >
                                  Enter Exam
                                </button>
                              ) : (
                                <div className="text-center">
                                  <button 
                                    disabled
                                    className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                  >
                                    {getTimeUntilEnterable(exam) ? `Available in ${getTimeUntilEnterable(exam)}` : 'Exam Not Available'}
                                  </button>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {getTimeUntilEnterable(exam) ? 'Button will appear 5 minutes before exam' : 'Exam has ended or not yet scheduled'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Scheduled</h3>
                      <p className="text-gray-600">You don't have any upcoming exams at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeModule === 'exam-history' ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
                  <p className="text-gray-600">View your completed examinations and results</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Export Results
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Exam History List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Completed Exams</h2>
                    <span className="text-sm text-gray-500">{completedExams.length} exams</span>
                  </div>
                  
                  {historyLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Loading exam history...</p>
                    </div>
                  ) : completedExams.length > 0 ? (
                    <div className="space-y-4">
                      {completedExams.map((exam) => (
                        <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                                {exam.score !== undefined && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    exam.score >= exam.totalMarks * 0.8 ? 'bg-green-100 text-green-800' :
                                    exam.score >= exam.totalMarks * 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {Math.round((exam.score / exam.totalMarks) * 100)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">{exam.subject} • {exam.class}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>{new Date(exam.scheduledDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>{exam.startTime || 'TBD'}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  <span>{exam.duration} minutes</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Users className="w-4 h-4 mr-2" />
                                  <span>{exam.totalQuestions} questions</span>
                                </div>
                              </div>

                              {/* Results Section */}
                              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-gray-800">Results</span>
                                  </div>
                                  <div className="text-right">
                                    {exam.score !== undefined ? (
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {exam.score}/{exam.totalMarks} marks
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Completed on {exam.completedAt ? new Date(exam.completedAt).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                          }) : 'N/A'}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">Results pending</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                                View Results
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileBarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exam History</h3>
                      <p className="text-gray-600">You haven't completed any exams yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeModule === 'assignments' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
                  <p className="text-gray-600">View and submit your assignments</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="text-center py-12">
                  <Assignment className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignments Module</h3>
                  <p className="text-gray-600">This feature is coming soon!</p>
                </div>
              </div>
            </div>
          ) : activeModule === 'grades' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
                  <p className="text-gray-600">View your academic performance and grades</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="text-center py-12">
                  <Grade className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Grades Module</h3>
                  <p className="text-gray-600">This feature is coming soon!</p>
                </div>
              </div>
            </div>
          ) : activeModule === 'schedule' ? (
            <ScheduleManagement onNavigateToModule={(module) => setActiveModule(module)} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} Module</h2>
                <p className="text-gray-600">This module is coming soon!</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Student Exam Interface */}
      {showExamInterface && currentExam && (
        <StudentExamInterface
          exam={currentExam}
          user={user}
          onClose={() => {
            setShowExamInterface(false);
            setCurrentExam(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
