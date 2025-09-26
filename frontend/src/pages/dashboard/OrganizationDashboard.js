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
import UserManagement from './UserManagement';
import ExamManagement from './ExamManagement';
import QuestionBankManagement from './QuestionBankManagement';
import QuestionBank from './QuestionBank';
import DepartmentManagement from './DepartmentManagement';
import SubjectManagement from './SubjectManagement';
import '../../styles/dashboard/organization.css';

const OrganizationDashboard = () => {
  const { user, dashboardData, logout } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('12 Months');

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

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
  const examPerformanceData = [
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
    { name: 'Science', value: 87, color: '#06b6d4' },
    { name: 'English', value: 78, color: '#10b981' },
    { name: 'History', value: 65, color: '#f59e0b' },
  ];

  const recentExams = [
    { id: 1, type: 'Mathematics Quiz', score: '92/100', date: 'Jan 17', subject: 'Grade 10A', status: 'completed', students: 28 },
    { id: 2, type: 'Science Test', score: '87/100', date: 'Jan 16', subject: 'Grade 9B', status: 'pending', students: 32 },
    { id: 3, type: 'English Essay', score: '89/100', date: 'Jan 15', subject: 'Grade 11C', status: 'completed', students: 25 },
    { id: 4, type: 'History Exam', score: '78/100', date: 'Jan 14', subject: 'Grade 12A', status: 'graded', students: 30 },
  ];

  const topStudents = [
    { name: 'Alex Johnson', class: 'Grade 10A', grade: 'A+', performance: 95, avatar: 'AJ' },
    { name: 'Emma Davis', class: 'Grade 9B', grade: 'A', performance: 88, avatar: 'ED' },
    { name: 'Michael Chen', class: 'Grade 11C', grade: 'B+', performance: 82, avatar: 'MC' },
    { name: 'Sarah Wilson', class: 'Grade 12A', grade: 'A-', performance: 90, avatar: 'SW' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Meeting', date: 'Jan 20', time: '2:00 PM', type: 'meeting' },
    { id: 2, title: 'Science Fair', date: 'Jan 25', time: '9:00 AM', type: 'event' },
    { id: 3, title: 'Mid-term Exams', date: 'Jan 30', time: '8:00 AM', type: 'exam' },
  ];

  // Navigation modules
  const coreModules = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: true },
    { id: 'user-management', label: 'User Management', icon: <Users className="w-5 h-5" />, count: '1,295' },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, count: '1,250' },
    { id: 'teachers', label: 'Teachers', icon: <User className="w-5 h-5" />, count: '45' },
    { id: 'departments', label: 'Departments', icon: <GraduationCap className="w-5 h-5" />, count: '8' },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-5 h-5" />, count: '24' },
  ];

  const academicModules = [
    { id: 'exams', label: 'Exams', icon: <ClipboardList className="w-5 h-5" />, count: '24' },
    { id: 'questionbank', label: 'Question Bank', icon: <MessageSquare className="w-5 h-5" />, badge: 'NEW' },
    { id: 'assessments', label: 'Assessments', icon: <BookOpen className="w-5 h-5" />, count: '8' },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, count: '15' },
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
              <p className="text-xs text-gray-500">Learning Platform</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="p-4 pb-3">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Plus className="w-4 h-4" />
            Create New Exam
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 overflow-y-auto max-h-[calc(100vh-200px)]">
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
            
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.profile?.firstName?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 bg-gray-50">
          {activeModule === 'user-management' ? (
            <UserManagement />
          ) : activeModule === 'departments' ? (
            <DepartmentManagement />
          ) : activeModule === 'subjects' ? (
            <SubjectManagement />
          ) : activeModule === 'exams' ? (
            <ExamManagement />
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
              { title: "Today's Exams", value: '24', change: '+12%', trend: 'up', icon: <ClipboardList className="w-5 h-5" />, color: 'purple' },
              { title: 'Total Students', value: '1,250', change: '+8%', trend: 'up', icon: <Users className="w-5 h-5" />, color: 'green' },
              { title: 'Active Teachers', value: '45', change: '+23%', trend: 'up', icon: <User className="w-5 h-5" />, color: 'yellow' },
              { title: 'Avg. Score', value: '87%', change: '+3%', trend: 'up', icon: <BarChart3 className="w-5 h-5" />, color: 'blue' },
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
            {/* Recent Exams */}
            <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Recent Exams</h2>
                <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">See All Exams →</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Latest exam submissions and grading status.</p>
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <StatusDot status={exam.status} />
                    <div className="flex-1 ml-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{exam.type}</h3>
                      <p className="text-xs text-gray-600">{exam.subject} • {exam.students} students</p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{exam.score}</p>
                      <p className="text-xs text-gray-600">{exam.date}</p>
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

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Important dates and events.</p>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
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
          )}
        </main>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
