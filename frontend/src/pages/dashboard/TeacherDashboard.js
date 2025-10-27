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
import { clearAuthData } from '../../utils/clearAuth';
import { examAPI } from '../../services/api';
import ExamManagement from './ExamManagement';
import TeacherClassManagement from './TeacherClassManagement';
import QuestionBankManagement from './QuestionBankManagement';
import '../../styles/dashboard/organization.css';

const TeacherDashboard = () => {
  const { user, dashboardData, logout } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('12 Months');
  const [assignedExams, setAssignedExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 500);
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      setExamsLoading(true);
      const response = await examAPI.getExamsByTeacher({ status: 'scheduled' });
      if (response.success) {
        setAssignedExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching assigned exams:', error);
    } finally {
      setExamsLoading(false);
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

  const handleClearAuth = () => {
    clearAuthData();
    window.location.reload();
  };

  // Sample data
  const studentPerformanceData = [
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
    { name: 'Biology', value: 65, color: '#f59e0b' },
  ];

  const recentAssignments = [
    { id: 1, type: 'Math Quiz', score: '92/100', date: 'Jan 17', subject: 'Grade 10A', status: 'graded', students: 28 },
    { id: 2, type: 'Physics Test', score: '87/100', date: 'Jan 16', subject: 'Grade 11B', status: 'pending', students: 32 },
    { id: 3, type: 'Chemistry Lab', score: '89/100', date: 'Jan 15', subject: 'Grade 9C', status: 'completed', students: 25 },
    { id: 4, type: 'Biology Exam', score: '78/100', date: 'Jan 14', subject: 'Grade 12A', status: 'graded', students: 30 },
  ];

  const topStudents = [
    { name: 'Alex Johnson', class: 'Grade 10A', grade: 'A+', performance: 95, avatar: 'AJ' },
    { name: 'Emma Davis', class: 'Grade 9B', grade: 'A', performance: 88, avatar: 'ED' },
    { name: 'Michael Chen', class: 'Grade 11C', grade: 'B+', performance: 82, avatar: 'MC' },
    { name: 'Sarah Wilson', class: 'Grade 12A', grade: 'A-', performance: 90, avatar: 'SW' },
  ];

  // Format exams as upcoming classes
  const upcomingClasses = assignedExams.slice(0, 3).map((exam, index) => ({
    id: exam._id || `exam-${index}`,
    title: exam.title,
    date: new Date(exam.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: exam.startTime || 'TBD',
    type: 'exam'
  }));

  // Navigation modules for teachers
  const coreModules = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: true },
    { id: 'classes', label: 'My Classes', icon: <Class className="w-5 h-5" />, count: '6' },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, count: '85' },
    { id: 'assignments', label: 'Assignments', icon: <Assignment className="w-5 h-5" />, count: '12' },
    { id: 'schedule', label: 'Schedule', icon: <Schedule className="w-5 h-5" />, count: '24' },
  ];

  const academicModules = [
    { id: 'exams', label: 'Exams', icon: <ClipboardList className="w-5 h-5" />, count: assignedExams.length.toString() },
    { id: 'questionBank', label: 'Question Bank', icon: <BookOpen className="w-5 h-5" />, count: '10' },
    { id: 'grades', label: 'Grades', icon: <Grade className="w-5 h-5" />, count: '45' },
    { id: 'quizzes', label: 'Quizzes', icon: <Quiz className="w-5 h-5" />, count: '15' },
    { id: 'reports', label: 'Reports', icon: <FileBarChart className="w-5 h-5" />, count: '3' },
  ];

  const analyticsModules = [
    { id: 'performance', label: 'Performance', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Users className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
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
              <p className="text-xs text-gray-500">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="p-4 pb-3">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Core Management */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Teaching</h3>
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
              <span className="text-sm text-gray-500">Search students, assignments, classes...</span>
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
            
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.profile?.firstName?.charAt(0) || 'T'}
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
                      Welcome back, {user?.profile?.firstName || 'Teacher'}!
                    </h1>
                    <p className="text-gray-600">Ready to inspire and educate your students today</p>
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
                  { title: "Today's Classes", value: '6', change: '+2', trend: 'up', icon: <Class className="w-5 h-5" />, color: 'purple' },
                  { title: 'My Students', value: '85', change: '+3', trend: 'up', icon: <Users className="w-5 h-5" />, color: 'green' },
                  { title: 'Assignments', value: '12', change: '+5', trend: 'up', icon: <Assignment className="w-5 h-5" />, color: 'yellow' },
                  { title: 'Avg. Grade', value: '87%', change: '+2%', trend: 'up', icon: <Grade className="w-5 h-5" />, color: 'blue' },
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

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Student Performance Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Student Performance Trend</h2>
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studentPerformanceData}>
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
                  <p className="text-sm text-gray-600 mb-4">Latest assignment submissions and grading status.</p>
                  <div className="space-y-3">
                    {recentAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                        <StatusDot status={assignment.status} />
                        <div className="flex-1 ml-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">{assignment.type}</h3>
                          <p className="text-xs text-gray-600">{assignment.subject} • {assignment.students} students</p>
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
                    <p className="text-sm text-gray-600 mb-4">Your assigned upcoming examinations.</p>
                    <div className="space-y-3">
                      {examsLoading ? (
                        <div className="text-center py-4">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                        </div>
                      ) : assignedExams.length > 0 ? (
                        assignedExams.slice(0, 5).map((exam) => (
                          <div key={exam._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                            <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
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
                          No upcoming exams assigned
                        </div>
                      )}
                    </div>
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
                    <div className="space-y-3">
                      {topStudents.map((student, index) => (
                        <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="w-7 h-7 rounded-md bg-purple-500 text-white text-xs font-bold flex items-center justify-center mr-3">{student.avatar}</div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{student.name}</h3>
                            <p className="text-xs text-gray-600">{student.class}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 mb-1">{student.grade}</p>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-gray-600">{student.performance}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block">SEE ALL STUDENTS →</span>
                  </div>

                  {/* Upcoming Classes */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-gray-900">Upcoming Classes</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Your scheduled classes and events.</p>
                    <div className="space-y-3">
                      {upcomingClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-3 ${
                            classItem.type === 'exam' ? 'bg-red-100 text-red-600' :
                            classItem.type === 'lab' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {classItem.type === 'exam' ? <ClipboardList className="w-4 h-4" /> :
                             classItem.type === 'lab' ? <Book className="w-4 h-4" /> :
                             <Class className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{classItem.title}</h3>
                            <p className="text-xs text-gray-600">{classItem.date} at {classItem.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-medium cursor-pointer hover:underline mt-4 block">VIEW SCHEDULE →</span>
                  </div>
                </div>
              </div>
            </>
          ) : activeModule === 'exams' ? (
            <ExamManagement />
          ) : activeModule === 'classes' ? (
            <TeacherClassManagement />
          ) : activeModule === 'questionBank' ? (
            <QuestionBankManagement />
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
    </div>
  );
};

export default TeacherDashboard;
