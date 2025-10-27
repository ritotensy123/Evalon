import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  UserPlus,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  UserCheck,
  UserX
} from 'lucide-react';
import { userManagementAPI } from '../../services/api';
import { teacherService } from '../../services/teacherAPI';
import { studentService } from '../../services/studentAPI';
import { useAuth } from '../../contexts/AuthContext';

const DepartmentUserManagement = ({ departmentId, departmentName, userTypeFilter = "all" }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(userTypeFilter === 'teacher' ? 'teachers' : 'students');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  
  // Teacher assignment states
  const [showTeacherSelection, setShowTeacherSelection] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeachersForAssignment, setSelectedTeachersForAssignment] = useState([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [fetchingRef, setFetchingRef] = useState({ current: false });
  
  // Student assignment states
  const [showStudentSelection, setShowStudentSelection] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // Get organization ID from user context
  const organizationId = user?.organizationId || user?.organization?._id;

  const tabs = userTypeFilter === 'all' ? [
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" />, count: students.length },
    { id: 'teachers', label: 'Teachers', icon: <Users className="w-4 h-4" />, count: teachers.length }
  ] : userTypeFilter === 'teacher' ? [
    { id: 'teachers', label: 'Teachers', icon: <Users className="w-4 h-4" />, count: teachers.length }
  ] : [
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" />, count: students.length }
  ];

  useEffect(() => {
    fetchUsers();
  }, [departmentId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      if (userTypeFilter === 'all') {
        // Fetch both students and teachers
        const [studentsResponse, teachersResponse] = await Promise.all([
          userManagementAPI.getUsers({ organizationId, departmentId, userType: 'student' }),
          userManagementAPI.getUsers({ organizationId, departmentId, userType: 'teacher' })
        ]);

        if (studentsResponse.success) {
          setStudents(studentsResponse.data.users || []);
        }
        if (teachersResponse.success) {
          setTeachers(teachersResponse.data.users || []);
        }
      } else if (userTypeFilter === 'teacher') {
        // Fetch only teachers
        const teachersResponse = await userManagementAPI.getUsers({ organizationId, departmentId, userType: 'teacher' });
        if (teachersResponse.success) {
          setTeachers(teachersResponse.data.users || []);
        }
      } else {
        // Fetch only students
        const studentsResponse = await userManagementAPI.getUsers({ organizationId, departmentId, userType: 'student' });
        if (studentsResponse.success) {
          setStudents(studentsResponse.data.users || []);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleImportUsers = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departmentId', departmentId);

      const response = await userManagementAPI.importUsers(formData);
      if (response.success) {
        await fetchUsers();
        setShowImportModal(false);
        setImportFile(null);
      } else {
        setError(response.message || 'Failed to import users');
      }
    } catch (err) {
      console.error('Error importing users:', err);
      setError('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await userManagementAPI.exportUsers({ departmentId });
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${departmentName}_users.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting users:', err);
      setError('Failed to export users');
    }
  };

  const handleRemoveUser = async (userId, userType) => {
    try {
      setLoading(true);
      
      // For teachers, remove from department assignment
      if (userType === 'teachers') {
        const response = await teacherService.removeFromDepartment(userId, departmentId);
        if (response.success) {
          setError(null);
          // Refresh the teachers list
          fetchingRef.current = false;
          await fetchUsers();
        } else {
          setError(response.message || 'Failed to remove teacher from department');
        }
      } else {
        // For students, use the new student service API
        const response = await studentService.removeFromDepartment(userId, departmentId);
        if (response.success) {
          setError(null);
          // Refresh the students list
          fetchingRef.current = false;
          await fetchUsers();
        } else {
          setError(response.message || 'Failed to remove student from department');
        }
      }
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      const response = await userManagementAPI.bulkAction({
        departmentId,
        userIds: selectedUsers,
        action
      });

      if (response.success) {
        await fetchUsers();
        setSelectedUsers([]);
      } else {
        setError(response.message || 'Failed to perform bulk action');
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError('Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  // Teacher assignment functions
  const fetchAvailableTeachers = async () => {
    try {
      // Pass organizationId to filter teachers from current organization only
      const response = await teacherService.getTeachers({ organizationId });
      console.log('🔍 Teacher API response:', response);
      if (response.success && response.data && response.data.teachers) {
        // Show ALL teachers from the organization (don't filter by department)
        // Teachers already in this department will be shown as checked
        console.log('📝 Available teachers:', response.data.teachers);
        console.log('📝 First teacher fields:', response.data.teachers[0] ? Object.keys(response.data.teachers[0]) : 'No teachers');
        setAvailableTeachers(response.data.teachers);
      } else {
        console.log('❌ Invalid response structure:', response);
        setAvailableTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      setError('Failed to fetch available teachers');
    }
  };

  const handleOpenTeacherSelection = () => {
    setShowTeacherSelection(true);
    setSelectedTeachersForAssignment([]);
    setTeacherSearchTerm('');
    fetchAvailableTeachers();
  };

  const handleAssignSelectedTeachers = async () => {
    try {
      console.log('🎯 Starting teacher assignment...', selectedTeachersForAssignment.length);
      setLoading(true);
      setError(null);
      
      const promises = selectedTeachersForAssignment.map(teacher => {
        console.log('📝 Assigning teacher:', teacher._id);
        return teacherService.assignToDepartment(teacher._id, departmentId);
      });
      
      const results = await Promise.all(promises);
      console.log('✅ Assignment results:', results);
      
      // Check if any assignment failed
      const failed = results.some(result => !result.success);
      if (failed) {
        throw new Error('Some teachers failed to assign');
      }
      
      // Close modal first
      setShowTeacherSelection(false);
      setSelectedTeachersForAssignment([]);
      setTeacherSearchTerm('');
      
      // Reset fetching flag and refresh data
      fetchingRef.current = false;
      console.log('🔄 Refreshing user data...');
      await fetchUsers();
      console.log('✅ Refresh complete');
    } catch (error) {
      console.error('Error assigning teachers:', error);
      setError(error.message || 'Failed to assign teachers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available students for assignment
  const fetchAvailableStudents = async () => {
    try {
      console.log('🔍 Checking authentication token...');
      const token = localStorage.getItem('authToken');
      console.log('🔍 Token exists:', !!token);
      console.log('🔍 Organization ID:', organizationId);
      
      // Pass organizationId to filter students from current organization only
      const response = await studentService.getStudents({ organizationId });
      console.log('🔍 Student API response:', response);
      
      // Check different possible response structures
      let students = [];
      if (response.students) {
        students = response.students;
      } else if (response.data && response.data.students) {
        students = response.data.students;
      } else if (Array.isArray(response)) {
        students = response;
      } else if (response.data && Array.isArray(response.data)) {
        students = response.data;
      }
      
      if (students.length > 0) {
        // Show ALL students from the organization (don't filter by department)
        // Students already in this department will be shown as checked
        console.log('📝 Available students:', students);
        console.log('📝 First student fields:', students[0] ? Object.keys(students[0]) : 'No students');
        setAvailableStudents(students);
      } else {
        console.log('❌ No students found in response:', response);
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError('Failed to fetch available students');
    }
  };

  // Handle opening student selection modal
  const handleAddStudents = () => {
    console.log('🎯 handleAddStudents called');
    setShowStudentSelection(true);
    fetchAvailableStudents();
  };

  // Handle assigning selected students
  const handleAssignSelectedStudents = async () => {
    try {
      console.log('🎯 Starting student assignment...', selectedStudentsForAssignment.length);
      setLoading(true);
      setError(null);
      
      const promises = selectedStudentsForAssignment.map(student => {
        console.log('📝 Assigning student:', student._id);
        return studentService.assignToDepartment(student._id, departmentId);
      });
      
      const results = await Promise.all(promises);
      console.log('✅ Assignment results:', results);
      
      // Check if any assignment failed
      const failed = results.some(result => !result.success);
      if (failed) {
        throw new Error('Some students failed to assign');
      }
      
      // Close modal first
      setShowStudentSelection(false);
      setSelectedStudentsForAssignment([]);
      setStudentSearchTerm('');
      
      // Reset fetching flag and refresh data
      fetchingRef.current = false;
      console.log('🔄 Refreshing user data...');
      await fetchUsers();
      console.log('✅ Refresh complete');
    } catch (error) {
      console.error('Error assigning students:', error);
      setError('Failed to assign students to department');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = activeTab === 'students' 
    ? students.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : teachers.filter(user => {
        const fullName = user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '');
        const email = user.emailAddress || user.email || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase());
      });

  const currentUsers = activeTab === 'students' ? students : teachers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage students and teachers for {departmentName}</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'teachers' && (
            <button
              onClick={handleOpenTeacherSelection}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Teacher
            </button>
          )}
          {activeTab === 'students' && (
            <button
              type="button"
              onClick={(e) => {
                console.log('🎯 Add Student button clicked');
                e.preventDefault();
                e.stopPropagation();
                handleAddStudents();
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </button>
          )}
          <button
            onClick={handleExportUsers}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('remove')}
                    className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              <button
                onClick={fetchUsers}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {activeTab === 'students' ? (
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Users className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown Name')}
                      </h4>
                      <p className="text-sm text-gray-500">{user.emailAddress || user.email || 'No email'}</p>
                      {activeTab === 'students' && user.studentCode && (
                        <p className="text-xs text-gray-400">Code: {user.studentCode}</p>
                      )}
                      {activeTab === 'students' && user.department && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">Assigned to:</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.department.toString() === departmentId 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.department.toString() === departmentId ? 'This Department' : 'Parent Department'}
                          </span>
                        </div>
                      )}
                      {activeTab === 'teachers' && user.department && Array.isArray(user.department) && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">Assigned to:</span>
                          {user.department.map((deptId, index) => (
                            <span key={index} className={`text-xs px-2 py-1 rounded-full ${
                              deptId.toString() === departmentId 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {deptId.toString() === departmentId ? 'This Department' : 'Parent Department'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (user.isActive || user.status === 'active')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(user.isActive || user.status === 'active') ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {/* View user details */}}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user._id, activeTab)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove from Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'students' ? (
                  <GraduationCap className="w-8 h-8 text-gray-400" />
                ) : (
                  <Users className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? `No ${activeTab} match your search criteria.`
                  : `No ${activeTab} have been added to this department yet.`
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Import {activeTab === 'students' ? 'Students' : 'Teachers'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Import {activeTab === 'students' ? 'Students' : 'Teachers'}
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  {importFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {importFile.name}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        CSV Format Requirements
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• First row should contain headers</li>
                        <li>• Required columns: Name, Email</li>
                        <li>• Optional columns: Phone, Student Code (for students)</li>
                        <li>• Maximum file size: 10MB</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => importFile && handleImportUsers(importFile)}
                  disabled={!importFile || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Selection Modal */}
      {showTeacherSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Teachers to Assign
                </h3>
                <button
                  onClick={() => setShowTeacherSelection(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Teacher List */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {availableTeachers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No teachers available
                  </div>
                ) : (
                  availableTeachers
                    .filter(teacher => {
                      const name = teacher.firstName && teacher.lastName 
                        ? `${teacher.firstName} ${teacher.lastName}` 
                        : teacher.fullName || 'Unknown';
                      const email = teacher.email || teacher.emailAddress || '';
                      return name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                             email.toLowerCase().includes(teacherSearchTerm.toLowerCase());
                    })
                    .map((teacher) => {
                      console.log('🎯 Rendering teacher:', teacher);
                      // Check if teacher is already in this department by comparing with current teachers list
                      const isInDepartment = teachers.some(t => t._id === teacher._id);
                      
                      return (
                    <div
                      key={teacher._id}
                      className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTeachersForAssignment.some(t => t._id === teacher._id)}
                          disabled={isInDepartment}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeachersForAssignment([...selectedTeachersForAssignment, teacher]);
                            } else {
                              setSelectedTeachersForAssignment(
                                selectedTeachersForAssignment.filter(t => t._id !== teacher._id)
                              );
                            }
                          }}
                          className={`w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${isInDepartment ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.fullName || 'Unknown Name'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {teacher.email || teacher.emailAddress || 'No email'}
                          </p>
                          {teacher.departments && Array.isArray(teacher.departments) && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">Currently assigned to:</span>
                              {teacher.departments.map((deptId, index) => (
                                <span key={index} className={`text-xs px-2 py-1 rounded-full ${
                                  deptId.toString() === departmentId 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {deptId.toString() === departmentId ? 'This Department' : 'Parent Department'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isInDepartment && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Already in Department
                        </span>
                      )}
                    </div>
                      );
                    })
                )}
              </div>

              {/* Selected Count */}
              {selectedTeachersForAssignment.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    {selectedTeachersForAssignment.length} teacher{selectedTeachersForAssignment.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTeacherSelection(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignSelectedTeachers();
                  }}
                  disabled={selectedTeachersForAssignment.length === 0 || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Assigning...' : `Assign ${selectedTeachersForAssignment.length} Teacher${selectedTeachersForAssignment.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Selection Modal */}
      {showStudentSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Students to Assign
                </h3>
                <button
                  onClick={() => setShowStudentSelection(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {availableStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No students available
                  </div>
                ) : (
                  availableStudents
                    .filter(student => {
                      const name = student.firstName && student.lastName 
                        ? `${student.firstName} ${student.lastName}` 
                        : student.fullName || 'Unknown';
                      const email = student.email || student.emailAddress || '';
                      const studentId = student.studentId || '';
                      return name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                             email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                             studentId.toLowerCase().includes(studentSearchTerm.toLowerCase());
                    })
                    .map(student => {
                      const isSelected = selectedStudentsForAssignment.some(s => s._id === student._id);
                      // Check if student is already in this department by comparing with current students list
                      const isInDepartment = students.some(s => s._id === student._id);
                      
                      return (
                        <div key={student._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isInDepartment}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentsForAssignment([...selectedStudentsForAssignment, student]);
                                } else {
                                  setSelectedStudentsForAssignment(selectedStudentsForAssignment.filter(s => s._id !== student._id));
                                }
                              }}
                              className={`w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${isInDepartment ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.fullName || 'Unknown Name'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.email || student.emailAddress || 'No email'}
                              </p>
                              {student.studentId && (
                                <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                              )}
                              {student.department && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-400">Currently in:</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    student.department.toString() === departmentId 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {student.department.toString() === departmentId ? 'This Department' : 'Parent Department'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isInDepartment && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Already in Department
                            </span>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {/* Selected Count */}
              {selectedStudentsForAssignment.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    {selectedStudentsForAssignment.length} student{selectedStudentsForAssignment.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStudentSelection(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignSelectedStudents();
                  }}
                  disabled={selectedStudentsForAssignment.length === 0 || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Assigning...' : `Assign ${selectedStudentsForAssignment.length} Student${selectedStudentsForAssignment.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentUserManagement;
