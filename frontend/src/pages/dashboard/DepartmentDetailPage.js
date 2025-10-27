import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building,
  Users,
  BookOpen,
  GraduationCap,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  BarChart3,
  TreePine,
  RefreshCw,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { departmentAPI, subjectAPI } from '../../services/api';
import DepartmentForm from '../../components/department/DepartmentForm';
import TeacherAssignment from '../../components/department/TeacherAssignment';
import DepartmentUserManagement from '../../components/department/DepartmentUserManagement';
import { 
  getDisplayName, 
  getDepartmentTypeDisplayName, 
  getDepartmentTypeColors,
  getDepartmentIcon,
  getHierarchyDescription,
  isClass,
  isSubDepartment,
  isSection,
  getClassInfo,
  DEPARTMENT_TYPES
} from '../../utils/departmentUtils';

const DepartmentDetailPage = ({ departmentId, onBack }) => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showTeacherAssignment, setShowTeacherAssignment] = useState(false);
  const [formType, setFormType] = useState(null); // 'sub-department' or 'class'
  const [subDepartments, setSubDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Dynamic tabs based on department type
  const getDepartmentTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: <Building className="w-4 h-4" /> }
    ];

    // If it's a main department or sub-department, show sub-departments tab
    if (department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT || 
        department?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT) {
      baseTabs.push({
        id: 'sub-departments',
        label: department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT ? 'Sub-Departments & Classes' : 'Classes',
        icon: <TreePine className="w-4 h-4" />
      });
    }

    // All types can have users (students/teachers)
    baseTabs.push({ id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> });
    
    // All types can have subjects
    baseTabs.push({ id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> });
    
    // Settings for all
    baseTabs.push({ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> });

    return baseTabs;
  };

  const tabs = department ? getDepartmentTabs() : [];

  useEffect(() => {
    console.log('DepartmentDetailPage: departmentId =', departmentId);
    if (departmentId) {
      fetchDepartmentDetails();
    } else {
      console.log('DepartmentDetailPage: No departmentId provided');
      setError('No department ID provided');
      setLoading(false);
    }
  }, [departmentId]);

  // Fetch subjects after department is loaded
  useEffect(() => {
    if (department) {
      fetchSubjects();
    }
  }, [department]);

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      
      // Fetch subjects for current department
      const currentDeptResponse = await subjectAPI.getAll({ departmentId });
      let allSubjects = currentDeptResponse.success ? currentDeptResponse.data || [] : [];
      
      // Mark current department subjects as "direct"
      allSubjects = allSubjects.map(subject => ({
        ...subject,
        mappingType: 'direct'
      }));
      
      // If this is a class or sub-department, also fetch subjects from parent department(s)
      if (department) {
        const parentIds = [];
        
        // Get immediate parent
        if (department.parentDepartment) {
          const parentId = typeof department.parentDepartment === 'object' 
            ? department.parentDepartment._id 
            : department.parentDepartment;
          parentIds.push(parentId);
          
          // If parent exists, try to get grandparent (for classes under sub-departments)
          try {
            const parentResponse = await departmentAPI.getById(parentId);
            if (parentResponse.success && parentResponse.data.parentDepartment) {
              const grandParentId = typeof parentResponse.data.parentDepartment === 'object'
                ? parentResponse.data.parentDepartment._id
                : parentResponse.data.parentDepartment;
              parentIds.push(grandParentId);
            }
          } catch (err) {
            console.error('Error fetching grandparent:', err);
          }
        }
        
        // Fetch subjects from all parent departments
        for (const parentId of parentIds) {
          try {
            const parentSubjectsResponse = await subjectAPI.getAll({ departmentId: parentId });
            if (parentSubjectsResponse.success) {
              const parentSubjects = (parentSubjectsResponse.data || []).map(subject => ({
                ...subject,
                mappingType: 'inherited',
                inheritedFrom: parentId
              }));
              
              // Add parent subjects if not already in the list (avoid duplicates)
              parentSubjects.forEach(parentSubject => {
                const exists = allSubjects.find(s => s._id === parentSubject._id);
                if (!exists) {
                  allSubjects.push(parentSubject);
                }
              });
            }
          } catch (err) {
            console.error('Error fetching parent subjects:', err);
          }
        }
      }
      
      setSubjects(allSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchDepartmentDetails = async () => {
    try {
      console.log('DepartmentDetailPage: Fetching department details for ID:', departmentId);
      setLoading(true);
      const response = await departmentAPI.getById(departmentId);
      console.log('DepartmentDetailPage: API response:', response);
      if (response.success) {
        setDepartment(response.data);
        setSubDepartments(response.data.children || []);
        setTeachers(response.data.teachers || []);
        setStudents(response.data.students || []);
        setStats(response.data.stats || {});
        console.log('DepartmentDetailPage: Department data set:', response.data);
      } else {
        console.log('DepartmentDetailPage: API returned error:', response.message);
        setError('Failed to fetch department details');
      }
    } catch (err) {
      console.error('DepartmentDetailPage: Error fetching department details:', err);
      setError('Failed to fetch department details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = () => {
    setShowForm(true);
  };

  const handleDeleteDepartment = async () => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const response = await departmentAPI.delete(departmentId);
        if (response.success) {
          handleBack();
        } else {
          setError('Failed to delete department');
        }
      } catch (err) {
        console.error('Error deleting department:', err);
        setError('Failed to delete department');
      }
    }
  };

  const handleAssignTeacher = () => {
    setShowTeacherAssignment(true);
  };

  const handleCreateSubDepartment = () => {
    setFormType('sub-department');
    setShowForm(true);
  };

  const handleSubDepartmentSubmit = async (subDepartmentData) => {
    try {
      console.log('handleSubDepartmentSubmit: Received data:', subDepartmentData);
      console.log('handleSubDepartmentSubmit: Current departmentId:', departmentId);
      
      // Set the parent department to current department
      const subDepartmentDataWithParent = {
        ...subDepartmentData,
        parentDepartment: departmentId
      };
      
      console.log('handleSubDepartmentSubmit: Sending data:', subDepartmentDataWithParent);
      
      const response = await departmentAPI.create(subDepartmentDataWithParent);
      console.log('handleSubDepartmentSubmit: Response:', response);
      
      if (response.success) {
        // Refresh department details to show the new sub-department
        await fetchDepartmentDetails();
        setShowForm(false);
        setFormError(null);
      } else {
        console.error('handleSubDepartmentSubmit: Error response:', response);
        
        // Check if it's a duplicate code error
        const errorMessage = response.message || 'Failed to create sub-department';
        if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
          setFormError(`⚠️ Code "${subDepartmentData.code}" is already in use. Please try: ${subDepartmentData.code}1, ${subDepartmentData.code}2, or ${subDepartmentData.code}-SUB`);
        } else {
          setFormError(errorMessage);
        }
        // Don't close the form, let user fix the issue
      }
    } catch (err) {
      console.error('Error creating sub-department:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create sub-department';
      if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        setFormError(`⚠️ Code "${subDepartmentData.code}" is already in use. Please try: ${subDepartmentData.code}1, ${subDepartmentData.code}2, or ${subDepartmentData.code}-SUB`);
      } else {
        setFormError(errorMessage);
      }
      // Don't close the form, let user fix the issue
    }
  };

  const handleCreateClass = () => {
    setFormType('class');
    setShowClassForm(true);
  };

  const handleClassSubmit = async (classData) => {
    try {
      // Set the parent department to current department
      const classDataWithParent = {
        ...classData,
        parentDepartment: departmentId,
        departmentType: DEPARTMENT_TYPES.CLASS,
        isClass: true
      };
      
      const response = await departmentAPI.create(classDataWithParent);
      if (response.success) {
        // Refresh department details to show the new class
        await fetchDepartmentDetails();
        setShowClassForm(false);
        setFormError(null);
      } else {
        // Check if it's a duplicate code error
        const errorMessage = response.message || 'Failed to create class';
        if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
          setFormError(`⚠️ Code "${classData.code}" is already in use. Please try: ${classData.code}1, ${classData.code}2, or ${classData.code}-CLS`);
        } else {
          setFormError(errorMessage);
        }
        // Don't close the form, let user fix the issue
      }
    } catch (err) {
      console.error('Error creating class:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create class';
      if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        setFormError(`⚠️ Code "${classData.code}" is already in use. Please try: ${classData.code}1, ${classData.code}2, or ${classData.code}-CLS`);
      } else {
        setFormError(errorMessage);
      }
      // Don't close the form, let user fix the issue
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback to URL navigation
      window.location.href = '/dashboard/departments';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading department details...</p>
          <p className="text-sm text-gray-500 mt-2">Department ID: {departmentId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Department ID: {departmentId}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Department not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{department.name}</h1>
                <p className="text-sm text-gray-500">{department.code} • {department.departmentType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEditDepartment}
                className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteDepartment}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
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
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Banner */}
      {formError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-sm text-red-800">{formError}</p>
              </div>
              <button
                onClick={() => setFormError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Department Information - Clean */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT ? 'bg-blue-50' :
                      department?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT ? 'bg-purple-50' :
                      'bg-green-50'
                    }`}>
                      {department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT ? <Building className="w-5 h-5 text-blue-600" /> :
                       department?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT ? <TreePine className="w-5 h-5 text-purple-600" /> :
                       <GraduationCap className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT ? 'Department Details' :
                         department?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT ? 'Sub-Department Details' :
                         'Class Details'}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">{department?.departmentType}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Department Name</label>
                      <p className="text-sm text-gray-900">{department.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Department Code</label>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        {department.code}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {department.departmentType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Institution Type</label>
                      <p className="text-sm text-gray-900 capitalize">{department.institutionType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Academic Type</label>
                      <p className="text-sm text-gray-900 capitalize">{department.academicType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Level</label>
                      <p className="text-sm text-gray-900">{department.level || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {department.classLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Class Level</label>
                        <p className="text-sm text-gray-900 capitalize">{department.classLevel}</p>
                      </div>
                    )}
                    {department.standard && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Standard</label>
                        <p className="text-sm text-gray-900">{department.standard}</p>
                      </div>
                    )}
                    {department.section && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Section</label>
                        <p className="text-sm text-gray-900">{department.section}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {department.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{department.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Leadership & Management */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Leadership & Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {department.headOfDepartment && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Head of Department</p>
                        <p className="text-sm text-gray-600">{department.headOfDepartment.fullName}</p>
                        <p className="text-xs text-gray-500">{department.headOfDepartment.emailAddress}</p>
                      </div>
                    </div>
                  )}
                  
                  {department.coordinator && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Coordinator</p>
                        <p className="text-sm text-gray-600">{department.coordinator.fullName}</p>
                        <p className="text-xs text-gray-500">{department.coordinator.emailAddress}</p>
                      </div>
                    </div>
                  )}
                  
                  {department.parentDepartment && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TreePine className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Parent Department</p>
                        <p className="text-sm text-gray-600">{department.parentDepartment.name}</p>
                        <p className="text-xs text-gray-500">{department.parentDepartment.code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New teacher assigned</p>
                      <p className="text-xs text-gray-500">Dr. Sarah Johnson joined the department</p>
                    </div>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Student enrollment</p>
                      <p className="text-xs text-gray-500">15 new students enrolled this week</p>
                    </div>
                    <span className="text-xs text-gray-400">1 day ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New subject added</p>
                      <p className="text-xs text-gray-500">Advanced Mathematics course created</p>
                    </div>
                    <span className="text-xs text-gray-400">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sub-departments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT 
                    ? 'Sub-Departments & Classes' 
                    : 'Classes'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT 
                    ? 'Manage sub-departments and classes under this department'
                    : 'Manage classes under this sub-department'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Class creation available for both departments and sub-departments */}
                <button
                  onClick={handleCreateClass}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Class
                </button>
                
                {/* Sub-department creation only for main departments */}
                {department?.departmentType === DEPARTMENT_TYPES.DEPARTMENT && (
                  <button
                    onClick={handleCreateSubDepartment}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-Department
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                {subDepartments.length > 0 ? (
                  <div className="space-y-3">
                    {subDepartments.map((subDept) => (
                      <div key={subDept._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">{subDept.name}</h4>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {subDept.code}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {subDept.departmentType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{subDept.description || 'No description available'}</p>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              <span>Level: {subDept.level || 'N/A'}</span>
                              <span>•</span>
                              <span>Status: Active</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              window.location.href = `/dashboard/departments/${subDept._id}`;
                            }}
                            className="flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          <button className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Building className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">No Sub-Departments Yet</h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                      Create sub-departments and classes to organize your department structure.
                    </p>
                    <button
                      onClick={handleCreateSubDepartment}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Sub-Department
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <DepartmentUserManagement
            departmentId={departmentId}
            departmentName={department.name}
            userTypeFilter="all"
          />
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Subjects & Courses</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''} mapped to this department
                </p>
              </div>
            </div>
            
            {/* Subject List */}
            {subjectsLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">No Subjects Mapped</h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                      No subjects have been mapped to this department yet. Create subjects and assign them to this department from the Subject Management section.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                  {/* Group subjects by mapping type */}
                  {subjects.filter(s => s.mappingType === 'direct').length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Direct Subjects</h4>
                      <div className="space-y-2">
                        {subjects.filter(s => s.mappingType === 'direct').map((subject) => (
                          <div key={subject._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                subject.subjectType === 'core' ? 'bg-blue-50' :
                                subject.subjectType === 'elective' ? 'bg-green-50' :
                                subject.subjectType === 'practical' ? 'bg-purple-50' :
                                'bg-gray-50'
                              }`}>
                                <BookOpen className={`w-4 h-4 ${
                                  subject.subjectType === 'core' ? 'text-blue-600' :
                                  subject.subjectType === 'elective' ? 'text-green-600' :
                                  subject.subjectType === 'practical' ? 'text-purple-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                                <p className="text-xs text-gray-500">
                                  {subject.code} • {subject.subjectType} • {subject.credits} Credits
                                  {subject.category && ` • ${subject.category}`}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${
                              subject.status === 'active' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {subject.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Inherited subjects */}
                  {subjects.filter(s => s.mappingType === 'inherited').length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Inherited Subjects</h4>
                        <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          From Parent Department
                        </span>
                      </div>
                      <div className="space-y-2">
                        {subjects.filter(s => s.mappingType === 'inherited').map((subject) => (
                          <div key={subject._id} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                subject.subjectType === 'core' ? 'bg-blue-50' :
                                subject.subjectType === 'elective' ? 'bg-green-50' :
                                subject.subjectType === 'practical' ? 'bg-purple-50' :
                                'bg-gray-50'
                              }`}>
                                <BookOpen className={`w-4 h-4 ${
                                  subject.subjectType === 'core' ? 'text-blue-600' :
                                  subject.subjectType === 'elective' ? 'text-green-600' :
                                  subject.subjectType === 'practical' ? 'text-purple-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                                <p className="text-xs text-gray-500">
                                  {subject.code} • {subject.subjectType} • {subject.credits} Credits
                                  {subject.category && ` • ${subject.category}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200">
                                Inherited
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                subject.status === 'active' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}>
                                {subject.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Student Enrollment</h4>
                      <p className="text-sm text-gray-500">Allow students to enroll in this department</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Approval</h4>
                      <p className="text-sm text-gray-500">Require approval for student enrollment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-assign Teachers</h4>
                      <p className="text-sm text-gray-500">Automatically assign teachers to new students</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Academic Settings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                      <option>2024-2025</option>
                      <option>2023-2024</option>
                      <option>2022-2023</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester System</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                      <option>Semester System</option>
                      <option>Trimester System</option>
                      <option>Quarter System</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grading System</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                      <option>Percentage</option>
                      <option>GPA (4.0)</option>
                      <option>Letter Grade</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Send email notifications for department updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">Send SMS notifications for urgent updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                      <p className="text-sm text-gray-500">Send weekly department activity reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Danger Zone */}
            <div className="bg-white rounded-lg border border-red-200">
              <div className="p-6">
                <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-red-900">Archive Department</h4>
                      <p className="text-sm text-red-700">Archive this department and all its data</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                      Archive
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-red-900">Delete Department</h4>
                      <p className="text-sm text-red-700">Permanently delete this department and all its data</p>
                    </div>
                    <button 
                      onClick={handleDeleteDepartment}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <DepartmentForm
          department={null}
          departments={[]}
          parentDepartment={department}
          onSubmit={handleSubDepartmentSubmit}
          onClose={() => {
            setShowForm(false);
            setFormType(null);
          }}
          isSubDepartmentForm={formType === 'sub-department'}
        />
      )}

      {showTeacherAssignment && (
        <TeacherAssignment
          department={department}
          onSubmit={async (teacherData) => {
            // Handle teacher assignment
            setShowTeacherAssignment(false);
            await fetchDepartmentDetails();
          }}
          onClose={() => setShowTeacherAssignment(false)}
        />
      )}

      {showClassForm && (
        <DepartmentForm
          department={null}
          departments={[]}
          parentDepartment={department}
          onSubmit={handleClassSubmit}
          onClose={() => {
            setShowClassForm(false);
            setFormType(null);
          }}
          isClassForm={true}
        />
      )}
    </div>
  );
};

export default DepartmentDetailPage;
