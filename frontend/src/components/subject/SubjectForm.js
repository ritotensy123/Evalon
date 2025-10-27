import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  BookOpen,
  AlertCircle,
  Loader2,
  Building,
  Info,
  GraduationCap,
  Award,
  User
} from 'lucide-react';
import { teacherAPI, subjectAPI } from '../../services/api';

const SubjectForm = ({ subject, departments, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    subjectType: 'core',
    category: '',
    credits: 3,
    hoursPerWeek: 4,
    duration: 'semester',
    applicableGrades: [],
    applicableStandards: [],
    applicableSemesters: [],
    applicableYears: [],
    prerequisites: [],
    coordinator: '',
    assessment: {
      hasTheory: true,
      hasPractical: false,
      hasProject: false,
      hasInternship: false,
      theoryMarks: 100,
      practicalMarks: 0,
      projectMarks: 0,
      totalMarks: 100
    }
  });

  const [teachers, setTeachers] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedParentDept, setSelectedParentDept] = useState('');
  const [childDepartments, setChildDepartments] = useState([]);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        departmentId: subject.departmentId?._id || '',
        subjectType: subject.subjectType || 'core',
        category: subject.category || '',
        credits: subject.credits || 3,
        hoursPerWeek: subject.hoursPerWeek || 4,
        duration: subject.duration || 'semester',
        applicableGrades: subject.applicableGrades || [],
        applicableStandards: subject.applicableStandards || [],
        applicableSemesters: subject.applicableSemesters || [],
        applicableYears: subject.applicableYears || [],
        prerequisites: subject.prerequisites?.map(p => p._id) || [],
        coordinator: subject.coordinator?._id || '',
        assessment: {
          hasTheory: subject.assessment?.hasTheory ?? true,
          hasPractical: subject.assessment?.hasPractical ?? false,
          hasProject: subject.assessment?.hasProject ?? false,
          hasInternship: subject.assessment?.hasInternship ?? false,
          theoryMarks: subject.assessment?.theoryMarks || 100,
          practicalMarks: subject.assessment?.practicalMarks || 0,
          projectMarks: subject.assessment?.projectMarks || 0,
          totalMarks: subject.assessment?.totalMarks || 100
        }
      });
    }
    fetchTeachers();
    fetchAvailableSubjects();
  }, [subject]);

  // Update selected department when departmentId changes
  useEffect(() => {
    if (formData.departmentId && departments) {
      const dept = departments.find(d => d._id === formData.departmentId);
      setSelectedDepartment(dept);
      
      // If this is a child department, find and select its parent
      if (dept && dept.parentDepartment) {
        setSelectedParentDept(dept.parentDepartment);
      }
    } else {
      setSelectedDepartment(null);
    }
  }, [formData.departmentId, departments]);

  // Update child departments when parent is selected
  useEffect(() => {
    if (selectedParentDept && departments) {
      const children = departments.filter(d => {
        // Check if parentDepartment matches (could be string ID or object)
        const parentId = typeof d.parentDepartment === 'object' && d.parentDepartment?._id 
          ? d.parentDepartment._id 
          : d.parentDepartment;
        return parentId === selectedParentDept;
      });
      setChildDepartments(children);
    } else {
      setChildDepartments([]);
    }
  }, [selectedParentDept, departments]);

  const handleParentDeptChange = (parentId) => {
    setSelectedParentDept(parentId);
    // Clear the subject's department selection when parent changes
    setFormData(prev => ({
      ...prev,
      departmentId: parentId // Auto-select parent
    }));
  };

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAll();
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

  const fetchAvailableSubjects = async () => {
    try {
      const response = await subjectAPI.getAll();
      if (response.success) {
        const subjects = subject ? 
          response.data.filter(s => s._id !== subject._id) : 
          response.data;
        setAvailableSubjects(subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('assessment.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        assessment: {
          ...prev.assessment,
          [fieldName]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
        }
      }));
    } else if (name === 'prerequisites') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
      }));
    }
    
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
      newErrors.name = 'Subject name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }

    // Category is now optional
    // if (!formData.category) {
    //   newErrors.category = 'Category is required';
    // }

    if (formData.credits < 0 || formData.credits > 10) {
      newErrors.credits = 'Credits must be between 0 and 10';
    }

    if (formData.hoursPerWeek < 0 || formData.hoursPerWeek > 40) {
      newErrors.hoursPerWeek = 'Hours per week must be between 0 and 40';
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

  // Auto-calculate total marks
  useEffect(() => {
    const total = (formData.assessment.hasTheory ? formData.assessment.theoryMarks : 0) +
                 (formData.assessment.hasPractical ? formData.assessment.practicalMarks : 0) +
                 (formData.assessment.hasProject ? formData.assessment.projectMarks : 0);
    
    if (total !== formData.assessment.totalMarks) {
      setFormData(prev => ({
        ...prev,
        assessment: {
          ...prev.assessment,
          totalMarks: total
        }
      }));
    }
  }, [formData.assessment.hasTheory, formData.assessment.hasPractical, formData.assessment.hasProject, 
      formData.assessment.theoryMarks, formData.assessment.practicalMarks, formData.assessment.projectMarks]);

  // Get only root/parent departments (no parent)
  const parentDepartments = departments.filter(d => {
    // Check if it has no parent (root level)
    const hasNoParent = !d.parentDepartment || 
                        d.parentDepartment === null || 
                        d.parentDepartment === '';
    return hasNoParent;
  });
  
  // Fallback: if no parent departments found, show all departments
  const displayDepartments = parentDepartments.length > 0 ? parentDepartments : departments;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {subject ? 'Edit Subject' : 'Create Subject'}
              </h2>
              <p className="text-sm text-gray-600">
                {subject ? 'Update subject information' : 'Add a new subject to the curriculum'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter subject name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter subject code"
                />
                {errors.code && (
                  <p className="text-red-500 text-xs">{errors.code}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter subject description"
              />
            </div>
          </div>

          {/* Department Mapping - Cascading */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Department Mapping
            </h4>

            <div className="space-y-4">
              {/* Step 1: Parent Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Department *
                </label>
                <select
                  value={selectedParentDept}
                  onChange={(e) => handleParentDeptChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent border-gray-300"
                >
                  <option value="">Select a department</option>
                  {displayDepartments && displayDepartments.length > 0 ? (
                    displayDepartments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))
                  ) : (
                    <option disabled>No departments available</option>
                  )}
                </select>
              </div>

              {/* Step 2: Child Department/Class - Only show if there are children */}
              {selectedParentDept && childDepartments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Sub-Department or Class <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent border-gray-300"
                  >
                    <option value={selectedParentDept}>
                      Use main department only
                    </option>
                    {childDepartments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code}) - {dept.departmentType === 'class' ? 'Class' : 'Sub-Department'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {childDepartments.length} sub-department(s)/class(es) available
                  </p>
                </div>
              )}

              {/* Show selected department info */}
              {formData.departmentId && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected: </span>
                    {departments.find(d => d._id === formData.departmentId)?.name} 
                    <span className="text-gray-500 ml-1">
                      ({departments.find(d => d._id === formData.departmentId)?.code})
                    </span>
                  </p>
                </div>
              )}
            </div>

            {errors.departmentId && (
              <p className="text-red-500 text-xs mt-2">{errors.departmentId}</p>
            )}
          </div>

          {/* Subject Classification */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Subject Classification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  list="category-suggestions"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter category"
                />
                <datalist id="category-suggestions">
                  <option value="Science" />
                  <option value="Mathematics" />
                  <option value="Language" />
                  <option value="Social Studies" />
                  <option value="Arts" />
                  <option value="Commerce" />
                  <option value="Technology" />
                  <option value="Physical Education" />
                  <option value="Engineering" />
                  <option value="Medical" />
                  <option value="Law" />
                  <option value="Business" />
                  <option value="Computer Science" />
                  <option value="Economics" />
                  <option value="History" />
                  <option value="Geography" />
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="subjectType"
                  value={formData.subjectType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="practical">Practical</option>
                  <option value="theory">Theory</option>
                  <option value="project">Project</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.credits ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours/Week
                </label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  min="0"
                  max="40"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.hoursPerWeek ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="semester">Semester</option>
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assessment Configuration */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Assessment Configuration
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="assessment.hasTheory"
                  checked={formData.assessment.hasTheory}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Theory</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="assessment.hasPractical"
                  checked={formData.assessment.hasPractical}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Practical</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="assessment.hasProject"
                  checked={formData.assessment.hasProject}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Project</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="assessment.hasInternship"
                  checked={formData.assessment.hasInternship}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Internship</span>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.assessment.hasTheory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theory Marks
                  </label>
                  <input
                    type="number"
                    name="assessment.theoryMarks"
                    value={formData.assessment.theoryMarks}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.assessment.hasPractical && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Practical Marks
                  </label>
                  <input
                    type="number"
                    name="assessment.practicalMarks"
                    value={formData.assessment.practicalMarks}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.assessment.hasProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Marks
                  </label>
                  <input
                    type="number"
                    name="assessment.projectMarks"
                    value={formData.assessment.projectMarks}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  name="assessment.totalMarks"
                  value={formData.assessment.totalMarks}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Additional Options
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinator
                </label>
                <select
                  name="coordinator"
                  value={formData.coordinator}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select coordinator</option>
                  {Array.isArray(teachers) && teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites
                </label>
                <select
                  name="prerequisites"
                  multiple
                  value={formData.prerequisites}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  size="3"
                >
                  {availableSubjects.map(subj => (
                    <option key={subj._id} value={subj._id}>
                      {subj.name} ({subj.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : (subject ? 'Update Subject' : 'Create Subject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;
