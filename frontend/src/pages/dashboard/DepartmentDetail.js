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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { departmentAPI } from '../../services/api';
import DepartmentForm from '../../components/department/DepartmentForm';
import TeacherAssignment from '../../components/department/TeacherAssignment';
import DepartmentUserManagement from '../../components/department/DepartmentUserManagement';

const DepartmentDetail = ({ departmentId, onBack }) => {
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [showTeacherAssignment, setShowTeacherAssignment] = useState(false);
  const [subDepartments, setSubDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building className="w-4 h-4" /> },
    { id: 'sub-departments', label: 'Sub-Departments', icon: <TreePine className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers', icon: <Users className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentDetails();
    }
  }, [departmentId]);

  const fetchDepartmentDetails = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getById(departmentId);
      if (response.success) {
        setDepartment(response.data);
        setSubDepartments(response.data.children || []);
        setTeachers(response.data.teachers || []);
        setStudents(response.data.students || []);
        setStats(response.data.stats || {});
      } else {
        setError('Failed to fetch department details');
      }
    } catch (err) {
      console.error('Error fetching department details:', err);
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
          onBack();
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
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading department details...</p>
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
          <button
            onClick={onBack}
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
            onClick={onBack}
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
                onClick={onBack}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Department Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">Department</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{teachers.length}</h3>
                    <p className="text-sm text-gray-500">Teachers</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{students.length}</h3>
                    <p className="text-sm text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{stats.subjects || 0}</h3>
                    <p className="text-sm text-gray-500">Subjects</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{department.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <p className="text-sm text-gray-900">{department.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <p className="text-sm text-gray-900 capitalize">{department.departmentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </div>
                  {department.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{department.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sub-departments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sub-Departments</h3>
              <button
                onClick={handleCreateSubDepartment}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sub-Department
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                {subDepartments.length > 0 ? (
                  <div className="space-y-4">
                    {subDepartments.map((subDept) => (
                      <div key={subDept._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{subDept.name}</h4>
                            <p className="text-sm text-gray-500">{subDept.code}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {/* Navigate to sub-department */}}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Departments</h3>
                    <p className="text-gray-500 mb-4">Create sub-departments to organize your department structure.</p>
                    <button
                      onClick={handleCreateSubDepartment}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create First Sub-Department
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <DepartmentUserManagement
            departmentId={departmentId}
            departmentName={department.name}
          />
        )}

        {activeTab === 'students' && (
          <DepartmentUserManagement
            departmentId={departmentId}
            departmentName={department.name}
          />
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Subjects</h3>
              <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects</h3>
                  <p className="text-gray-500 mb-4">Add subjects to this department to organize the curriculum.</p>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Add First Subject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Settings</h3>
                <div className="space-y-4">
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <DepartmentForm
          department={department}
          departments={[]}
          parentDepartment={department}
          onSubmit={async (data) => {
            // Handle form submission
            setShowForm(false);
            await fetchDepartmentDetails();
          }}
          onClose={() => setShowForm(false)}
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
    </div>
  );
};

export default DepartmentDetail;
