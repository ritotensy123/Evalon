import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Calendar as CalendarIcon,
  Edit,
  XCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { examAPI, userManagementAPI, departmentAPI, subjectAPI } from '../../services/api';
import UserManagement from './UserManagement';
import StudentManagement from './StudentManagement';
import TeacherManagement from './TeacherManagement';
import ExamManagement from './ExamManagement';
import QuestionBankManagement from './QuestionBankManagement';
import QuestionBank from './QuestionBank';
import DepartmentManagement from './DepartmentManagement';
import SubjectManagement from './SubjectManagement';
import ScheduleManagement from './ScheduleManagement';
import '../../styles/dashboard/organization.css';

// Module-level flag to prevent duplicate API calls across component remounts (React StrictMode)
// Using a Map to track per-organization fetching state
const fetchingState = new Map();
const FETCH_COOLDOWN_MS = 5000; // 5 second cooldown between fetches

const OrganizationDashboard = ({ onNavigateToDepartmentDetail, onNavigateToProfile }) => {
  const { user, dashboardData, logout, organizationData } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('12 Months');
  const [allExams, setAllExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Edit exam state
  const [showEditExam, setShowEditExam] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    subject: '',
    class: '',
    department: '',
    examType: 'mcq',
    totalQuestions: 0,
    marksPerQuestion: 0,
    totalMarks: 0,
    scheduledDate: '',
    startTime: '',
    duration: 0
  });

  useEffect(() => {
    const organizationId = user?.organizationId || user?.organization?._id;
    if (!organizationId) return;
    
    // If we already have data, don't fetch again
    if (allExams.length > 0 || userStats.total > 0 || departmentStats.total > 0) {
      setIsLoaded(true);
      return;
    }
    
    // Get or create fetching state for this organization
    const orgState = fetchingState.get(organizationId) || { isFetching: false, lastFetchTime: 0 };
    const now = Date.now();
    
    // Prevent duplicate calls using per-organization state and cooldown
    if (orgState.isFetching || (now - orgState.lastFetchTime < FETCH_COOLDOWN_MS)) {
      return;
    }
    
    // Mark as fetching IMMEDIATELY and SYNCHRONOUSLY to prevent race conditions
    orgState.isFetching = true;
    orgState.lastFetchTime = now;
    fetchingState.set(organizationId, orgState);
    
    setTimeout(() => setIsLoaded(true), 500);
    
    // Fetch data
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchAllExams(),
          fetchDashboardData()
        ]);
      } catch (error) {
        // Errors are handled in individual functions
      } finally {
        // Reset flag after completion with delay to handle StrictMode
        setTimeout(() => {
          const currentState = fetchingState.get(organizationId);
          if (currentState) {
            currentState.isFetching = false;
            fetchingState.set(organizationId, currentState);
          }
        }, 2000);
      }
    };
    
    fetchData();
  }, [user?.organizationId, user?.organization?._id]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.relative')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const fetchDashboardData = async () => {
    const organizationId = user?.organizationId || user?.organization?._id;
    if (!organizationId) return;
    
    // Additional guard inside function to prevent duplicate calls
    const orgState = fetchingState.get(organizationId);
    if (orgState?.isFetching && Date.now() - orgState.lastFetchTime < 100) {
      return;
    }
    
    try {
      const organizationId = user?.organizationId || user?.organization?._id;
      if (!organizationId) return;

      // Fetch all stats in parallel
      const [userStatsResponse, departmentStatsResponse, subjectStatsResponse] = await Promise.allSettled([
        userManagementAPI.getUserStats(organizationId),
        departmentAPI.getStats(),
        subjectAPI.getStats()
      ]);

      // Process user stats
      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value.success) {
        const stats = userStatsResponse.value.data;
        setUserStats({
          total: stats.total || 0,
          active: stats.active || 0
        });
        setDashboardStats(prev => ({
          ...prev,
          totalStudents: stats.students || 0,
          activeTeachers: stats.teachers || 0
        }));
      }

      // Process department stats
      if (departmentStatsResponse.status === 'fulfilled' && departmentStatsResponse.value.success) {
        const stats = departmentStatsResponse.value.data;
        setDepartmentStats({
          total: stats.total || stats.totalDepartments || 0
        });
      }

      // Process subject stats
      if (subjectStatsResponse.status === 'fulfilled' && subjectStatsResponse.value.success) {
        const stats = subjectStatsResponse.value.data;
        setSubjectStats({
          total: stats.total || stats.totalSubjects || 0
        });
      }

      // Calculate today's exams
      const todayExams = allExams.filter(exam => {
        if (!exam.scheduledDate) return false;
        const examDate = new Date(exam.scheduledDate);
        const today = new Date();
        return examDate.toDateString() === today.toDateString();
      }).length;

      setDashboardStats(prev => ({
        ...prev,
        todayExams
      }));

      // Initialize empty arrays for performance data (will be populated when exam results are available)
      setExamPerformanceData([]);
      setSubjectPerformanceData([]);
      setTopStudents([]);
      setUpcomingEvents([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAllExams = async () => {
    const organizationId = user?.organizationId || user?.organization?._id;
    if (!organizationId) return;
    
    // Additional guard inside function to prevent duplicate calls
    const orgState = fetchingState.get(organizationId);
    if (orgState?.isFetching && Date.now() - orgState.lastFetchTime < 100) {
      return;
    }
    
    try {
      setExamsLoading(true);
      // Use getExamsByTeacher which now supports org admin view
      const response = await examAPI.getExamsByTeacher({ status: 'scheduled' });
      if (response.success) {
        setAllExams(response.data.exams || []);
      }
    } catch (error) {
      // Only log non-rate-limit errors
      if (error.response?.status !== 429) {
        console.error('Error fetching exams:', error);
      }
    } finally {
      setExamsLoading(false);
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setEditFormData({
      title: exam.title || '',
      subject: exam.subject || '',
      class: exam.class || '',
      department: exam.department || '',
      examType: exam.examType || 'mcq',
      totalQuestions: exam.totalQuestions || 0,
      marksPerQuestion: exam.marksPerQuestion || 0,
      totalMarks: exam.totalMarks || 0,
      scheduledDate: exam.scheduledDate ? exam.scheduledDate.split('T')[0] : '',
      startTime: exam.startTime || '',
      duration: exam.duration || 0
    });
    setShowEditExam(true);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await examAPI.updateExam(editingExam.id, editFormData);
      if (response.success) {
        setShowEditExam(false);
        setEditingExam(null);
        fetchAllExams();
      }
    } catch (error) {
      console.error('Error updating exam:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
    }
  };


  // Data states - all fetched from backend
  const [dashboardStats, setDashboardStats] = useState({
    todayExams: 0,
    totalStudents: 0,
    activeTeachers: 0,
    avgScore: 0
  });
  const [examPerformanceData, setExamPerformanceData] = useState([]);
  const [subjectPerformanceData, setSubjectPerformanceData] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0 });
  const [departmentStats, setDepartmentStats] = useState({ total: 0 });
  const [subjectStats, setSubjectStats] = useState({ total: 0 });

  // Navigation modules - counts fetched from backend
  const coreModules = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: true },
    { id: 'user-management', label: 'User Management', icon: <Users className="w-5 h-5" />, count: userStats.total > 0 ? userStats.total.toString() : null },
    { id: 'departments', label: 'Departments', icon: <GraduationCap className="w-5 h-5" />, count: departmentStats.total > 0 ? departmentStats.total.toString() : null },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-5 h-5" />, count: subjectStats.total > 0 ? subjectStats.total.toString() : null },
  ];

  const academicModules = [
    { id: 'exams', label: 'Exams', icon: <ClipboardList className="w-5 h-5" />, count: allExams.length > 0 ? allExams.length.toString() : null },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" />, count: null },
    { id: 'questionbank', label: 'Question Bank', icon: <MessageSquare className="w-5 h-5" />, badge: null },
    { id: 'assessments', label: 'Assessments', icon: <BookOpen className="w-5 h-5" />, count: null },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, count: null },
  ];

  const analyticsModules = [
    { id: 'reports', label: 'Reports', icon: <FileBarChart className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-5 h-5" /> },
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
      <div className="flex justify-center items-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-full">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-white flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Evalon</h1>
              <p className="text-xs text-gray-500">Learning Platform</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="p-4 pb-3 flex-shrink-0">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Plus className="w-4 h-4" />
            Create New Exam
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 overflow-y-auto min-h-0">
          {/* Core Management */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Core Management</h3>
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Academic</h3>
            {academicModules.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className="flex items-center justify-between py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 hover:bg-gray-50 hover:translate-x-1"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.count && (
                  <div className="rounded-lg px-2 py-1 text-xs font-semibold min-w-6 text-center bg-gray-100 text-gray-600">
                    {item.count}
                  </div>
                )}
                {item.badge && (
                  <div className="rounded-lg px-2 py-1 text-xs font-bold min-w-6 text-center bg-yellow-100 text-yellow-700">
                    {item.badge}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Analytics */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Analytics</h3>
            {analyticsModules.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className="flex items-center py-2.5 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 hover:bg-gray-50 hover:translate-x-1"
              >
                <div className="mr-3 text-gray-500">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-100 flex-shrink-0">
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
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="hidden lg:block text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            <button className="md:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center bg-gray-50 rounded-lg px-3 py-2 min-w-72 border border-gray-200 transition-all duration-200 focus-within:border-purple-500 focus-within:bg-white focus-within:shadow-sm">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Search students, exams, teachers...</span>
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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</div>
              <Bell className="w-4 h-4 text-gray-500" />
            </div>
            
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center overflow-hidden"
              >
                {(() => {
                  // CRITICAL: Read logo ONLY from organizationData context - single source of truth
                  console.log('🔍 [LOGO DEBUG] Dashboard header - organizationData keys:', organizationData ? Object.keys(organizationData) : 'NULL');
                  const hasLogo = organizationData?.logo && organizationData.logo.startsWith('data:image/');
                  console.log('🔍 [LOGO DEBUG] Dashboard header - organizationData:', organizationData ? 'EXISTS' : 'NULL');
                  console.log('🔍 [LOGO DEBUG] Dashboard header - logo:', hasLogo ? 'EXISTS' : 'MISSING', organizationData?.logo?.substring(0, 50) || 'N/A');
                  return hasLogo ? (
                    <img 
                      src={organizationData.logo} 
                      alt="Organization Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('🔍 [LOGO DEBUG] Image failed to load');
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {organizationData?.name?.charAt(0)?.toUpperCase() || user?.profile?.firstName?.charAt(0) || 'A'}
                    </span>
                  );
                })()}
              </div>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onNavigateToProfile) {
                        onNavigateToProfile();
                      } else {
                        window.location.href = '/profile';
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 bg-gray-50">
          {activeModule === 'user-management' ? (
            <UserManagement />
          ) : activeModule === 'students' ? (
            <StudentManagement />
          ) : activeModule === 'teachers' ? (
            <TeacherManagement />
          ) : activeModule === 'departments' ? (
            <DepartmentManagement onNavigateToDepartmentDetail={onNavigateToDepartmentDetail} />
          ) : activeModule === 'subjects' ? (
            <SubjectManagement />
          ) : activeModule === 'exams' ? (
            <ExamManagement />
          ) : activeModule === 'schedule' ? (
            <ScheduleManagement />
          ) : activeModule === 'questionbank' ? (
            <QuestionBankManagement />
          ) : (
            <>
              {/* Welcome Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      Welcome back, {user?.profile?.firstName || 'Admin'}!
                    </h1>
                    <p className="text-gray-600">Here's what's happening with your school today</p>
                  </div>
                </div>
              </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Today's Exams", value: dashboardStats.todayExams, change: null, trend: null, icon: <ClipboardList className="w-5 h-5" />, color: 'purple' },
              { title: 'Total Students', value: dashboardStats.totalStudents, change: null, trend: null, icon: <Users className="w-5 h-5" />, color: 'green' },
              { title: 'Active Teachers', value: dashboardStats.activeTeachers, change: null, trend: null, icon: <User className="w-5 h-5" />, color: 'yellow' },
              { title: 'Avg. Score', value: dashboardStats.avgScore > 0 ? `${dashboardStats.avgScore}%` : 'N/A', change: null, trend: null, icon: <BarChart3 className="w-5 h-5" />, color: 'blue' },
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
                  {card.change && (
                    <div className={`flex items-center ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-xs font-semibold">{card.change}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Exam Performance Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Exam Performance Trend</h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {['6 Months', '30 Days', '7 Days', '12 Months'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                          selectedPeriod === period
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                    <FileText className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
              {examPerformanceData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={examPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value) => [`${value}%`, 'Average Score']}
                        labelFormatter={(label) => `${label} 2024`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        fill="url(#colorGradient)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No performance data available</p>
                    <p className="text-xs text-gray-400 mt-1">Data will appear after exams are completed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subject Performance */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Subject Performance</h2>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">This Semester</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </div>
              </div>
              {subjectPerformanceData.length > 0 ? (
                <div className="space-y-3">
                  {subjectPerformanceData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No subject performance data</p>
                  <p className="text-xs text-gray-400 mt-1">Data will appear after exams are completed</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Exams */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Upcoming Exams</h2>
                <span 
                  onClick={() => setActiveModule('exams')} 
                  className="text-sm text-purple-600 font-medium cursor-pointer hover:underline"
                >
                  See All Exams →
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Scheduled examinations in your organization.</p>
              <div className="space-y-3">
                {examsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Loading exams...</p>
                  </div>
                ) : allExams.length > 0 ? (
                  allExams.slice(0, 5).map((exam) => (
                    <div key={exam._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        exam.status === 'scheduled' ? 'bg-blue-500' :
                        exam.status === 'active' ? 'bg-green-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{exam.title}</h3>
                        <p className="text-xs text-gray-600">{exam.subject} • {exam.class}</p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-600">{exam.startTime}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditExam(exam)}
                          className="p-1 rounded-md hover:bg-blue-100 transition-colors"
                          title="Edit exam"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No upcoming exams scheduled
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              {/* Top Students */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Top Students</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Highest performing students this month.</p>
                {topStudents.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {topStudents.map((student, index) => (
                        <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="w-7 h-7 rounded-md bg-purple-500 text-white text-xs font-bold flex items-center justify-center mr-3">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-xs text-gray-600">{student.class || student.grade || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 mb-1">{student.grade || 'N/A'}</p>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-gray-600">{student.performance || 0}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span 
                      onClick={() => setActiveModule('students')} 
                      className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block"
                    >
                      SEE ALL STUDENTS →
                    </span>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No student performance data</p>
                    <p className="text-xs text-gray-400 mt-1">Data will appear after students complete exams</p>
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Important dates and events.</p>
                {upcomingEvents.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {upcomingEvents.map((event, index) => (
                        <div key={event.id || index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-3 ${
                            event.type === 'exam' ? 'bg-red-100 text-red-600' :
                            event.type === 'event' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {event.type === 'exam' ? <ClipboardList className="w-4 h-4" /> :
                             event.type === 'event' ? <CalendarIcon className="w-4 h-4" /> :
                             <Calendar className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-xs text-gray-600">{event.date} {event.time ? `at ${event.time}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span 
                      onClick={() => setActiveModule('schedule')} 
                      className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block"
                    >
                      VIEW CALENDAR →
                    </span>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No upcoming events</p>
                    <p className="text-xs text-gray-400 mt-1">Events will appear here when scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* Edit Exam Modal */}
      {showEditExam && editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Exam</h2>
                  <p className="text-sm text-gray-600 mt-1">Update the exam details</p>
                </div>
                <button
                  onClick={() => setShowEditExam(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateExam} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Mid-term Exam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class/Group *</label>
                  <input
                    type="text"
                    value={editFormData.class}
                    onChange={(e) => setEditFormData({...editFormData, class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={editFormData.examType}
                    onChange={(e) => setEditFormData({...editFormData, examType: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="mcq">Multiple Choice Questions (MCQ)</option>
                    <option value="subjective">Subjective Questions</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                    <input
                      type="number"
                      value={editFormData.totalQuestions}
                      onChange={(e) => setEditFormData({...editFormData, totalQuestions: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks per Question</label>
                    <input
                      type="number"
                      value={editFormData.marksPerQuestion}
                      onChange={(e) => setEditFormData({...editFormData, marksPerQuestion: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                    <input
                      type="number"
                      value={editFormData.totalMarks}
                      onChange={(e) => setEditFormData({...editFormData, totalMarks: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date *</label>
                    <input
                      type="date"
                      value={editFormData.scheduledDate}
                      onChange={(e) => setEditFormData({...editFormData, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({...editFormData, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditExam(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    Update Exam
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDashboard;
