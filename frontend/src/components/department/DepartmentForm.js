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
  TreePine,
} from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { DEPARTMENT_TYPES, INSTITUTION_TYPES, ACADEMIC_TYPES, CLASS_LEVELS } from '../../utils/departmentUtils';

const DepartmentForm = ({ department, departments, parentDepartment, onSubmit, onClose, isClassForm = false, isSubDepartmentForm = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentDepartment: '',
    institutionType: 'college',
    departmentType: 'department',
    isClass: false,
    classLevel: '',
    standard: '',
    section: '',
    academicType: 'academic',
    specialization: '',
    academicYear: '',
    semester: '',
    batch: '',
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
        departmentType: department.departmentType || 'department',
        isClass: department.isClass || false,
        classLevel: department.classLevel || '',
        standard: department.standard || '',
        section: department.section || '',
        academicType: department.academicType || 'academic',
        specialization: department.specialization || '',
        academicYear: department.academicYear || '',
        semester: department.semester || '',
        batch: department.batch || '',
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
    } else if (parentDepartment) {
      // Pre-fill parent department when creating a child
      setFormData(prev => ({
        ...prev,
        parentDepartment: parentDepartment._id || parentDepartment,
        institutionType: parentDepartment.institutionType || 'college'
      }));
    }
    
    // If this is a class form, pre-configure for class creation
    if (isClassForm) {
      setFormData(prev => ({
        ...prev,
        departmentType: DEPARTMENT_TYPES.CLASS,
        isClass: true,
        parentDepartment: parentDepartment?._id || parentDepartment || '',
        institutionType: parentDepartment?.institutionType || INSTITUTION_TYPES.COLLEGE
      }));
    }
    
    // If this is a sub-department form, pre-configure for sub-department creation
    if (isSubDepartmentForm) {
      setFormData(prev => ({
        ...prev,
        departmentType: DEPARTMENT_TYPES.SUB_DEPARTMENT,
        isClass: false,
        parentDepartment: parentDepartment?._id || parentDepartment || '',
        institutionType: parentDepartment?.institutionType || INSTITUTION_TYPES.COLLEGE
      }));
    }
    fetchTeachers();
  }, [department, parentDepartment, isSubDepartmentForm, isClassForm]);

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

    // Basic required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters and numbers';
    }

    // Department type specific validation
    // Note: Class Level and Standard are now optional for classes

    // College specific validation
    if (formData.institutionType === INSTITUTION_TYPES.COLLEGE && formData.departmentType === DEPARTMENT_TYPES.DEPARTMENT && !formData.academicType) {
      newErrors.academicType = 'Academic type is required for college departments';
    }

    // Section validation - now optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('DepartmentForm: Submitting form with formData:', formData);
    console.log('DepartmentForm: isSubDepartmentForm:', isSubDepartmentForm);
    console.log('DepartmentForm: isClassForm:', isClassForm);

    setLoading(true);
    try {
      // Clean up the form data before sending
      const cleanedData = {
        ...formData,
        // Remove empty strings and convert to null
        parentDepartment: formData.parentDepartment || null,
        headOfDepartment: formData.headOfDepartment || null,
        coordinator: formData.coordinator || null,
        classLevel: formData.classLevel || null,
        standard: formData.standard || null,
        section: formData.section || null,
        specialization: formData.specialization || null,
        academicYear: formData.academicYear || null,
        semester: formData.semester || null,
        batch: formData.batch || null,
        // Set isClass based on departmentType
        isClass: formData.departmentType === DEPARTMENT_TYPES.CLASS
      };
      
      console.log('DepartmentForm: Cleaned data to submit:', cleanedData);
      
      await onSubmit(cleanedData);
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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isClassForm ? 'bg-green-100' : 
              isSubDepartmentForm ? 'bg-purple-100' : 
              'bg-blue-100'
            }`}>
              {isClassForm ? <GraduationCap className="w-5 h-5 text-green-600" /> : 
               isSubDepartmentForm ? <TreePine className="w-5 h-5 text-purple-600" /> :
               <Building className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isClassForm ? 'Create New Class' : isSubDepartmentForm ? 'Create New Sub-Department' : department ? 'Edit Department' : 'Create New Department'}
              </h3>
              <p className="text-sm text-gray-500">
                {isClassForm ? 'Add a new class to this department' : isSubDepartmentForm ? 'Add a new sub-department under this department' : department ? 'Update department information' : 'Add a new department to your organization'}
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
            {/* Basic Information - Clean and Minimal */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-200">
                {isClassForm ? <GraduationCap className="w-5 h-5 text-green-600" /> : 
                 isSubDepartmentForm ? <TreePine className="w-5 h-5 text-purple-600" /> :
                 <Building className="w-5 h-5 text-gray-600" />}
                <h4 className="text-md font-semibold text-gray-900">
                  {isClassForm ? 'Class Information' : 
                   isSubDepartmentForm ? 'Sub-Department Information' : 
                   'Department Information'}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isClassForm ? 'Class Name' : 
                     isSubDepartmentForm ? 'Sub-Department Name' : 
                     'Department Name'} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={
                      isClassForm ? 'e.g., First Year A, Class 5B, Semester 1' : 
                      isSubDepartmentForm ? 'e.g., Artificial Intelligence, Data Science' : 
                      'e.g., Computer Science, Mathematics'
                    }
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
                    {isClassForm ? 'Class Code' : 
                     isSubDepartmentForm ? 'Sub-Department Code' : 
                     'Department Code'} *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={
                      isClassForm ? 'e.g., FY-A, C5B, SEM1' : 
                      isSubDepartmentForm ? 'e.g., CS-AI, CS-DS' : 
                      'e.g., CS, MATH, ENG'
                    }
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
                  <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={
                    isClassForm ? 'Brief description of this class...' : 
                    isSubDepartmentForm ? 'Brief description of this sub-department...' : 
                    'Brief description of this department...'
                  }
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {isClassForm ? 'Add any specific information about this class' : 
                   isSubDepartmentForm ? 'Describe the focus area or specialization' : 
                   'Provide a brief overview of the department'}
                </p>
              </div>
            </div>

            {/* Institution Type - Hide for class/sub-department forms since auto-set */}
            {!isClassForm && !isSubDepartmentForm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution Type
                </label>
                <select
                  name="institutionType"
                  value={formData.institutionType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={INSTITUTION_TYPES.SCHOOL}>School</option>
                  <option value={INSTITUTION_TYPES.COLLEGE}>College</option>
                  <option value={INSTITUTION_TYPES.UNIVERSITY}>University</option>
                  <option value={INSTITUTION_TYPES.INSTITUTE}>Institute</option>
                </select>
              </div>
            )}

            {/* Department Type - Hide for class/sub-department forms since auto-set */}
            {!isClassForm && !isSubDepartmentForm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Type
                </label>
                <select
                  name="departmentType"
                  value={formData.departmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={DEPARTMENT_TYPES.DEPARTMENT}>Department</option>
                  <option value={DEPARTMENT_TYPES.SUB_DEPARTMENT}>Sub-Department</option>
                  <option value={DEPARTMENT_TYPES.CLASS}>Class</option>
                  <option value={DEPARTMENT_TYPES.SECTION}>Section</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  * Only Name and Code are required. All other fields are optional.
                </p>
              </div>
            )}

            {/* Parent Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent {isClassForm ? 'Department/Sub-Department' : 'Department'}
                {isSubDepartmentForm && (
                  <span className="text-xs text-purple-600 font-semibold ml-2">(Auto-set)</span>
                )}
                {isClassForm && (
                  <span className="text-xs text-green-600 font-semibold ml-2">(Auto-set)</span>
                )}
              </label>
              {(isSubDepartmentForm || isClassForm) ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {parentDepartment?.departmentType === DEPARTMENT_TYPES.DEPARTMENT ? 
                      <Building className="w-4 h-4 text-gray-600" /> : 
                      <TreePine className="w-4 h-4 text-gray-600" />}
                    <span className="font-medium text-gray-900">
                      {parentDepartment ? `${parentDepartment.name} (${parentDepartment.code})` : 'No Parent Department'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 ml-6">
                    {isClassForm 
                      ? `Will be created under this ${parentDepartment?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT ? 'sub-department' : 'department'}`
                      : 'Will be created under this department'}
                  </p>
                </div>
              ) : (
                <select
                  name="parentDepartment"
                  value={formData.parentDepartment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Parent (Root Level)</option>
                  {filteredDepartments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Class Configuration - Clean */}
            {formData.departmentType === DEPARTMENT_TYPES.CLASS && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Class Configuration</h4>
                    <p className="text-xs text-gray-500">Configure class-specific details (all fields optional)</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Level
                      <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <select
                      name="classLevel"
                      value={formData.classLevel}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        errors.classLevel ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select Level --</option>
                      <option value={CLASS_LEVELS.PRE_PRIMARY}>🎨 Pre-Primary (Nursery, KG)</option>
                      <option value={CLASS_LEVELS.PRIMARY}>📚 Primary (Class 1-5)</option>
                      <option value={CLASS_LEVELS.MIDDLE}>🎓 Middle (Class 6-8)</option>
                      <option value={CLASS_LEVELS.SECONDARY}>🏫 Secondary (Class 9-10)</option>
                      <option value={CLASS_LEVELS.SENIOR_SECONDARY}>🎯 Senior Secondary (Class 11-12)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Select the educational level for this class
                    </p>
                    {errors.classLevel && <p className="text-red-500 text-xs mt-1">{errors.classLevel}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standard/Grade
                      <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="standard"
                      value={formData.standard}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        errors.standard ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 1st, 5th, 10th, 12th"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Enter the class/grade number
                    </p>
                    {errors.standard && <p className="text-red-500 text-xs mt-1">{errors.standard}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section
                      <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="e.g., A, B, C, D"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Section division within the class
                    </p>
                  </div>
                </div>

                {/* Helpful Examples */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-700">
                      <strong>Examples:</strong>
                      <ul className="mt-1 space-y-0.5 list-disc list-inside text-gray-600">
                        <li>Schools: Name: "Class 5A", Code: "C5A", Level: Primary, Standard: 5th, Section: A</li>
                        <li>Simple: Just Name and Code (e.g., "First Year" / "FY")</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Configuration */}
            {formData.departmentType === 'section' && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Name
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.section ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., A, B, C"
                    />
                    {errors.section && (
                      <p className="text-red-500 text-xs mt-1">{errors.section}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* College Configuration - Hide for class forms */}
            {!isClassForm && formData.institutionType === INSTITUTION_TYPES.COLLEGE && (formData.departmentType === DEPARTMENT_TYPES.DEPARTMENT || formData.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT) && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <Building className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">College/University Configuration</h4>
                    <p className="text-xs text-gray-500">Department-specific settings for higher education</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Type {formData.institutionType === INSTITUTION_TYPES.COLLEGE && formData.departmentType === DEPARTMENT_TYPES.DEPARTMENT && '*'}
                    </label>
                    <select
                      name="academicType"
                      value={formData.academicType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        errors.academicType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value={ACADEMIC_TYPES.ACADEMIC}>🎓 Academic</option>
                      <option value={ACADEMIC_TYPES.ADMINISTRATIVE}>📋 Administrative</option>
                      <option value={ACADEMIC_TYPES.SUPPORT}>🤝 Support</option>
                      <option value={ACADEMIC_TYPES.RESEARCH}>🔬 Research</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Primary function of this department
                    </p>
                    {errors.academicType && <p className="text-red-500 text-xs mt-1">{errors.academicType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                      <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="e.g., AI & Machine Learning, Data Science"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Area of focus or expertise
                    </p>
                  </div>
                </div>

                {/* Academic Year and Semester for College Classes */}
                {formData.departmentType === 'class' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2024-25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Semester</option>
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                        <option value="3rd">3rd Semester</option>
                        <option value="4th">4th Semester</option>
                        <option value="5th">5th Semester</option>
                        <option value="6th">6th Semester</option>
                        <option value="7th">7th Semester</option>
                        <option value="8th">8th Semester</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch
                      </label>
                      <input
                        type="text"
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2024"
                      />
                    </div>
                  </div>
                )}
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

                {/* Coordinator field only for classes */}
                {isClassForm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Coordinator *
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
                    <p className="mt-1 text-xs text-gray-500">
                      Assign a coordinator for this class who will help manage class activities
                    </p>
                  </div>
                )}
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
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isClassForm ? 'Create Class' : isSubDepartmentForm ? 'Create Sub-Department' : department ? 'Update Department' : 'Create Department'}
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
