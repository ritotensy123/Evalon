import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
  TreePine,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { departmentAPI } from '../../services/api';
import DepartmentTree from '../../components/department/DepartmentTree';
import DepartmentForm from '../../components/department/DepartmentForm';
import DepartmentStats from '../../components/department/DepartmentStats';
import TeacherAssignment from '../../components/department/TeacherAssignment';

const DepartmentManagement = ({ onNavigateToDepartmentDetail }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [departmentTree, setDepartmentTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tree');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTeacherAssignment, setShowTeacherAssignment] = useState(false);
  const [stats, setStats] = useState(null);

  // Helper function to generate alternative department codes
  const generateAlternativeCodes = (baseCode) => {
    const alternatives = [];
    for (let i = 1; i <= 5; i++) {
      alternatives.push(`${baseCode}${i}`);
    }
    alternatives.push(`${baseCode}_NEW`);
    alternatives.push(`${baseCode}_2024`);
    return alternatives;
  };

  useEffect(() => {
    fetchDepartments();
    fetchDepartmentTree();
    fetchStats();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getAll();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (err) {
      setError('Failed to fetch departments');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentTree = async () => {
    try {
      const response = await departmentAPI.getTree();
      if (response.success) {
        setDepartmentTree(response.data);
      }
    } catch (err) {
      setError('Failed to fetch department tree');
      console.error('Error fetching department tree:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await departmentAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateDepartment = async (departmentData) => {
    try {
      const response = await departmentAPI.create(departmentData);
      if (response.success) {
        // Refresh all data in parallel
        await Promise.all([
          fetchDepartments(),
          fetchDepartmentTree(),
          fetchStats()
        ]);
        setShowForm(false);
        setSelectedDepartment(null);
        setError(''); // Clear any previous errors
      } else {
        console.error('Department creation failed:', response);
        setError(response.message || 'Failed to create department');
      }
    } catch (err) {
      console.error('Error creating department:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle specific error cases
      if (err.response?.data?.message) {
        if (err.response.data.message.includes('already exists')) {
          const alternatives = generateAlternativeCodes(departmentData.code);
          setError(`Department code "${departmentData.code}" already exists. Suggested alternatives: ${alternatives.slice(0, 3).join(', ')}`);
          
          // Keep the form open and suggest the first alternative
          const suggestedCode = alternatives[0];
          setSelectedDepartment({
            ...departmentData,
            code: suggestedCode,
            suggestedCode: true
          });
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Failed to create department. Please try again.');
      }
    }
  };

  const handleUpdateDepartment = async (id, departmentData) => {
    try {
      const response = await departmentAPI.update(id, departmentData);
      if (response.success) {
        // Refresh all data in parallel
        await Promise.all([
          fetchDepartments(),
          fetchDepartmentTree(),
          fetchStats()
        ]);
        setShowForm(false);
        setSelectedDepartment(null);
      } else {
        setError(response.message || 'Failed to update department');
      }
    } catch (err) {
      setError('Failed to update department');
      console.error('Error updating department:', err);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to archive this department?')) {
      try {
        const response = await departmentAPI.delete(id);
        if (response.success) {
          // Refresh all data in parallel
          await Promise.all([
            fetchDepartments(),
            fetchDepartmentTree(),
            fetchStats()
          ]);
        } else {
          setError(response.message || 'Failed to delete department');
        }
      } catch (err) {
        setError('Failed to delete department');
        console.error('Error deleting department:', err);
      }
    }
  };

  const handleAssignTeacher = async (departmentId, teacherData) => {
    try {
      const response = await departmentAPI.assignTeacher(departmentId, teacherData);
      if (response.success) {
        // Refresh all data in parallel
        await Promise.all([
          fetchDepartments(),
          fetchDepartmentTree(),
          fetchStats()
        ]);
        setShowTeacherAssignment(false);
        setSelectedDepartment(null);
      } else {
        setError(response.message || 'Failed to assign teacher');
      }
    } catch (err) {
      setError('Failed to assign teacher');
      console.error('Error assigning teacher:', err);
    }
  };

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleAssignTeacherToDepartment = (department) => {
    setSelectedDepartment(department);
    setShowTeacherAssignment(true);
  };



  const handleViewDepartment = (department) => {
    // Navigate to dedicated department page using the navigation handler
    if (onNavigateToDepartmentDetail) {
      onNavigateToDepartmentDetail(department._id);
    } else {
      // Fallback to URL navigation
      window.location.href = `/dashboard/departments/${department._id}`;
    }
  };

  const tabs = [
    { id: 'tree', label: 'Department Tree', icon: <TreePine className="w-4 h-4" /> },
    { id: 'list', label: 'Department List', icon: <Building className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading departments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage your organization's department structure and hierarchy</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                await Promise.all([
                  fetchDepartments(),
                  fetchDepartmentTree(),
                  fetchStats()
                ]);
              } catch (err) {
                setError('Failed to refresh data');
              } finally {
                setLoading(false);
              }
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
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
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'tree' && (
            <DepartmentTree
              departments={departmentTree}
              onView={handleViewDepartment}
              onRefresh={fetchDepartmentTree}
            />
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
              </div>

              {/* Department List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Head of Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departments.map((department) => (
                        <tr key={department._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <GraduationCap className="w-5 h-5 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {department.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {department.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {department.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {department.departmentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.headOfDepartment?.fullName || (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDepartment(department)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="View Department"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditDepartment(department)}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                title="Edit Department"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAssignTeacherToDepartment(department)}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Assign Teacher"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(department._id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete Department"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <DepartmentStats stats={stats} />
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Form Modal */}
      {showForm && (
        <DepartmentForm
          department={selectedDepartment}
          departments={departments}
          parentDepartment={selectedDepartment}
          onSubmit={selectedDepartment && selectedDepartment._id && !selectedDepartment.parentDepartment ? 
            (data) => handleUpdateDepartment(selectedDepartment._id, data) :
            handleCreateDepartment
          }
          onClose={() => {
            setShowForm(false);
            setSelectedDepartment(null);
            setError(''); // Clear error when closing form
          }}
        />
      )}

      {/* Teacher Assignment Modal */}
      {showTeacherAssignment && selectedDepartment && (
        <TeacherAssignment
          department={selectedDepartment}
          onSubmit={(teacherData) => handleAssignTeacher(selectedDepartment._id, teacherData)}
          onClose={() => {
            setShowTeacherAssignment(false);
            setSelectedDepartment(null);
          }}
        />
      )}

    </div>
  );
};

export default DepartmentManagement;
