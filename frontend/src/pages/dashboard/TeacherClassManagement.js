import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { teacherClassAPI, departmentAPI, subjectAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeacherClassManagement = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    className: '',
    classCode: '',
    description: '',
    departmentId: '',
    subjectId: '',
    academicYear: '',
    semester: ''
  });
  
  // Available data
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchClasses();
    fetchDepartments();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await teacherClassAPI.getAll();
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchSubjects = async (departmentId) => {
    if (!departmentId) {
      setSubjects([]);
      return;
    }
    try {
      const response = await subjectAPI.getAll({ departmentId });
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAvailableStudents = async (departmentId) => {
    try {
      // Pass departmentId or null to get all students from teacher's departments
      const response = await teacherClassAPI.getAvailableStudents(departmentId || 'all');
      if (response.success) {
        setAvailableStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'departmentId') {
      fetchSubjects(value);
      // Don't fetch students here - fetch when modal opens
      setFormData(prev => ({ ...prev, subjectId: '' }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleCreateClass = async (e) => {
    if (e) e.preventDefault();
    
    // Simple validation - just check if students are selected
    if (selectedStudents.length === 0) {
      setErrors({ submit: 'Please select at least one student' });
      return;
    }

    try {
      setLoading(true);
      
      // Create a simple class name based on the number of students
      const timestamp = new Date().toISOString().split('T')[0];
      const classData = {
        className: `Class - ${timestamp}`,
        classCode: `CLASS-${Date.now()}`,
        description: '',
        departmentId: departments.length > 0 ? departments[0]._id : null,
        subjectId: null,
        academicYear: '',
        semester: '',
        studentIds: selectedStudents
      };
      
      const response = await teacherClassAPI.create(classData);
      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          className: '',
          classCode: '',
          description: '',
          departmentId: '',
          subjectId: '',
          academicYear: '',
          semester: ''
        });
        setSelectedStudents([]);
        setErrors({});
        fetchClasses();
      }
    } catch (error) {
      console.error('Error creating class:', error);
      setErrors({ submit: error.message || 'Failed to create class' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      const response = await teacherClassAPI.delete(classId);
      if (response.success) {
        fetchClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleOpenStudentModal = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStudents(classItem.students.map(s => s.studentId._id || s.studentId));
    setShowStudentModal(true);
    // Fetch available students from teacher's departments
    fetchAvailableStudents('all');
  };

  const handleAddStudents = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const response = await teacherClassAPI.addStudents(selectedClass._id, selectedStudents);
      if (response.success) {
        setShowStudentModal(false);
        setSelectedClass(null);
        setSelectedStudents([]);
        fetchClasses();
      }
    } catch (error) {
      console.error('Error adding students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-1">Create and manage your classes with student assignments</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            // Fetch available students from teacher's departments
            fetchAvailableStudents('all');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {/* Classes Grid */}
      {loading && classes.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Yet</h3>
          <p className="text-gray-600 mb-4">Create your first class to start teaching</p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              // Fetch available students from teacher's departments
              fetchAvailableStudents('all');
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <div key={classItem._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.className}</h3>
                    <p className="text-sm text-gray-500 mt-1">{classItem.classCode}</p>
                  </div>
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{classItem.stats?.totalStudents || classItem.students?.length || 0} Students</span>
                  </div>
                  {classItem.departmentId && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{classItem.departmentId.name || 'No department'}</span>
                    </div>
                  )}
                  {classItem.subjectName && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{classItem.subjectName}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenStudentModal(classItem)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Manage Students
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem._id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Students for New Class</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Student Selection - Simple List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students ({selectedStudents.length} selected)
                </label>
                {availableStudents.length === 0 ? (
                  <div className="border border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Loading students from your assigned departments...</p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {availableStudents.map(student => (
                      <div
                        key={student._id}
                        onClick={() => toggleStudentSelection(student._id)}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedStudents.includes(student._id) ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            {student.departmentName && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {student.departmentName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        {selectedStudents.includes(student._id) ? (
                          <CheckCircle className="w-6 h-6 text-purple-500" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateClass}
                  disabled={loading || selectedStudents.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : `Create Class (${selectedStudents.length} students)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {showStudentModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Manage Students - {selectedClass.className}</h2>
              <button onClick={() => setShowStudentModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Select students from your assigned departments:</p>
            </div>

            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto mb-4">
              {availableStudents.map(student => (
                <div
                  key={student._id}
                  onClick={() => toggleStudentSelection(student._id)}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedStudents.includes(student._id) ? 'bg-purple-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.departmentName && (
                      <p className="text-xs text-purple-600 mt-1">
                        📚 {student.departmentName}
                      </p>
                    )}
                  </div>
                  {selectedStudents.includes(student._id) && (
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStudentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudents}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : `Add ${selectedStudents.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassManagement;
