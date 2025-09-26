import React, { useState, useEffect } from 'react';
import { teacherAPI, subjectAPI } from '../../services/api';

const SubjectForm = ({ subject, departments, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    subjectType: 'core',
    category: '',
    credits: 1,
    hoursPerWeek: 1,
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
    },
    settings: {
      allowMultipleTeachers: true,
      requireApproval: false,
      isActive: true,
      allowStudentEnrollment: true
    }
  });

  const [teachers, setTeachers] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        departmentId: subject.departmentId?._id || '',
        subjectType: subject.subjectType || 'core',
        category: subject.category || '',
        credits: subject.credits || 1,
        hoursPerWeek: subject.hoursPerWeek || 1,
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
        },
        settings: {
          allowMultipleTeachers: subject.settings?.allowMultipleTeachers ?? true,
          requireApproval: subject.settings?.requireApproval ?? false,
          isActive: subject.settings?.isActive ?? true,
          allowStudentEnrollment: subject.settings?.allowStudentEnrollment ?? true
        }
      });
    }
    fetchTeachers();
    fetchAvailableSubjects();
  }, [subject]);

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAll();
      console.log('Teachers response in SubjectForm:', response);
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
        // Filter out current subject if editing
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
    } else if (name.startsWith('settings.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [fieldName]: type === 'checkbox' ? checked : value
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters and numbers';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.credits < 0 || formData.credits > 10) {
      newErrors.credits = 'Credits must be between 0 and 10';
    }

    if (formData.hoursPerWeek < 0 || formData.hoursPerWeek > 40) {
      newErrors.hoursPerWeek = 'Hours per week must be between 0 and 40';
    }

    // Validate assessment marks
    const totalMarks = (formData.assessment.hasTheory ? formData.assessment.theoryMarks : 0) +
                      (formData.assessment.hasPractical ? formData.assessment.practicalMarks : 0) +
                      (formData.assessment.hasProject ? formData.assessment.projectMarks : 0);

    if (totalMarks !== formData.assessment.totalMarks) {
      newErrors.assessment = 'Total marks must equal sum of individual components';
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

  const updateTotalMarks = () => {
    const total = (formData.assessment.hasTheory ? formData.assessment.theoryMarks : 0) +
                 (formData.assessment.hasPractical ? formData.assessment.practicalMarks : 0) +
                 (formData.assessment.hasProject ? formData.assessment.projectMarks : 0);
    
    setFormData(prev => ({
      ...prev,
      assessment: {
        ...prev.assessment,
        totalMarks: total
      }
    }));
  };

  useEffect(() => {
    updateTotalMarks();
  }, [formData.assessment.hasTheory, formData.assessment.hasPractical, formData.assessment.hasProject, 
      formData.assessment.theoryMarks, formData.assessment.practicalMarks, formData.assessment.projectMarks]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {subject ? 'Edit Subject' : 'Create New Subject'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter subject name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., MATH101, CS201"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subject description"
              />
            </div>

            {/* Department and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.departmentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  <option value="science">Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="language">Language</option>
                  <option value="social">Social</option>
                  <option value="arts">Arts</option>
                  <option value="commerce">Commerce</option>
                  <option value="technology">Technology</option>
                  <option value="physical">Physical</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>

            {/* Subject Type and Academic Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Type
                </label>
                <select
                  name="subjectType"
                  value={formData.subjectType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="practical">Practical</option>
                  <option value="theory">Theory</option>
                  <option value="project">Project</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits *
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.credits ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.credits && <p className="text-red-500 text-xs mt-1">{errors.credits}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours/Week *
                </label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  min="0"
                  max="40"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hoursPerWeek && <p className="text-red-500 text-xs mt-1">{errors.hoursPerWeek}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semester">Semester</option>
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisites
              </label>
              <select
                name="prerequisites"
                multiple
                value={formData.prerequisites}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size="4"
              >
                {availableSubjects.map(subj => (
                  <option key={subj._id} value={subj._id}>
                    {subj.name} ({subj.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple subjects</p>
            </div>

            {/* Coordinator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Coordinator
              </label>
              <select
                name="coordinator"
                value={formData.coordinator}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Coordinator</option>
                {Array.isArray(teachers) && teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.fullName} ({teacher.emailAddress})
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Assessment Configuration</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="assessment.hasTheory"
                    checked={formData.assessment.hasTheory}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Theory</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="assessment.hasPractical"
                    checked={formData.assessment.hasPractical}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Practical</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="assessment.hasProject"
                    checked={formData.assessment.hasProject}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Project</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="assessment.hasInternship"
                    checked={formData.assessment.hasInternship}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Internship</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
              </div>

              {errors.assessment && (
                <p className="text-red-500 text-xs mt-1">{errors.assessment}</p>
              )}
            </div>

            {/* Settings */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="settings.allowMultipleTeachers"
                    checked={formData.settings.allowMultipleTeachers}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Allow Multiple Teachers
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="settings.isActive"
                    checked={formData.settings.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active Subject
                  </label>
                </div>

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
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (subject ? 'Update Subject' : 'Create Subject')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubjectForm;
