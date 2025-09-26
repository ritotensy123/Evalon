import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building,
  GraduationCap,
  Users,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { teacherAPI } from '../../services/api';

const DepartmentForm = ({ department, departments, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentDepartment: '',
    institutionType: 'college',
    isClass: false,
    classLevel: '',
    standard: '',
    section: '',
    departmentType: 'academic',
    specialization: '',
    headOfDepartment: '',
    coordinator: '',
    settings: {
      allowStudentEnrollment: true,
      allowTeacherAssignment: true,
      requireApproval: false,
      maxStudents: '',
      maxTeachers: ''
    }
  });

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        parentDepartment: department.parentDepartment?._id || '',
        institutionType: department.institutionType || 'college',
        isClass: department.isClass || false,
        classLevel: department.classLevel || '',
        standard: department.standard || '',
        section: department.section || '',
        departmentType: department.departmentType || 'academic',
        specialization: department.specialization || '',
        headOfDepartment: department.headOfDepartment?._id || '',
        coordinator: department.coordinator?._id || '',
        settings: {
          allowStudentEnrollment: department.settings?.allowStudentEnrollment ?? true,
          allowTeacherAssignment: department.settings?.allowTeacherAssignment ?? true,
          requireApproval: department.settings?.requireApproval ?? false,
          maxStudents: department.settings?.maxStudents || '',
          maxTeachers: department.settings?.maxTeachers || ''
        }
      });
    }
    fetchTeachers();
  }, [department]);

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAll();
      console.log('Teachers response:', response);
      if (response.success && Array.isArray(response.data)) {
        setTeachers(response.data);
      } else if (Array.isArray(response)) {
        setTeachers(response);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters and numbers';
    }

    if (formData.isClass) {
      if (!formData.classLevel) {
        newErrors.classLevel = 'Class level is required for classes';
      }
      if (!formData.standard) {
        newErrors.standard = 'Standard is required for classes';
      }
    }

    if (formData.institutionType === 'college' && !formData.departmentType) {
      newErrors.departmentType = 'Department type is required for colleges';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(d => 
    !department || d._id !== department._id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {department ? 'Edit Department' : 'Create New Department'}
              </h3>
              <p className="text-sm text-gray-500">
                {department ? 'Update department information' : 'Add a new department to your organization'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h4 className="text-md font-semibold text-gray-900">Basic Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter department name"
                  />
                  {errors.name && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., CS, MATH, ENG"
                  />
                  {errors.code && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.code}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter department description"
              />
              </div>
            </div>

            {/* Institution Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution Type
              </label>
              <select
                name="institutionType"
                value={formData.institutionType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="university">University</option>
                <option value="institute">Institute</option>
              </select>
            </div>

            {/* Parent Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Department
              </label>
              <select
                name="parentDepartment"
                value={formData.parentDepartment}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Parent (Root Level)</option>
                {filteredDepartments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Configuration */}
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="isClass"
                  checked={formData.isClass}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  This is a Class (for Schools)
                </label>
              </div>

              {formData.isClass && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Level *
                    </label>
                    <select
                      name="classLevel"
                      value={formData.classLevel}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.classLevel ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Level</option>
                      <option value="pre-primary">Pre-Primary</option>
                      <option value="primary">Primary</option>
                      <option value="middle">Middle</option>
                      <option value="secondary">Secondary</option>
                      <option value="senior-secondary">Senior Secondary</option>
                    </select>
                    {errors.classLevel && <p className="text-red-500 text-xs mt-1">{errors.classLevel}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard *
                    </label>
                    <input
                      type="text"
                      name="standard"
                      value={formData.standard}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.standard ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 1st, 2nd, 10th"
                    />
                    {errors.standard && <p className="text-red-500 text-xs mt-1">{errors.standard}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., A, B, C"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* College Configuration */}
            {formData.institutionType === 'college' && !formData.isClass && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Type *
                    </label>
                    <select
                      name="departmentType"
                      value={formData.departmentType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.departmentType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="academic">Academic</option>
                      <option value="administrative">Administrative</option>
                      <option value="support">Support</option>
                      <option value="research">Research</option>
                    </select>
                    {errors.departmentType && <p className="text-red-500 text-xs mt-1">{errors.departmentType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Computer Science, Mathematics"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Assignment */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Teacher Assignment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Head of Department
                  </label>
                  <select
                    name="headOfDepartment"
                    value={formData.headOfDepartment}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {Array.isArray(teachers) && teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.fullName} ({teacher.emailAddress})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coordinator
                  </label>
                  <select
                    name="coordinator"
                    value={formData.coordinator}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {Array.isArray(teachers) && teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.fullName} ({teacher.emailAddress})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="settings.allowStudentEnrollment"
                    checked={formData.settings.allowStudentEnrollment}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Allow Student Enrollment
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="settings.allowTeacherAssignment"
                    checked={formData.settings.allowTeacherAssignment}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Allow Teacher Assignment
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="settings.requireApproval"
                    checked={formData.settings.requireApproval}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Require Approval for Changes
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Students
                    </label>
                    <input
                      type="number"
                      name="settings.maxStudents"
                      value={formData.settings.maxStudents}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Teachers
                    </label>
                    <input
                      type="number"
                      name="settings.maxTeachers"
                      value={formData.settings.maxTeachers}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-500 border border-transparent rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {department ? 'Update Department' : 'Create Department'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentForm;
