import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';

const TeacherAssignment = ({ department, onSubmit, onClose }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: '',
    role: 'head'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await teacherAPI.getAll();
      console.log('Teachers response in TeacherAssignment:', response);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user makes selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.teacherId) {
      newErrors.teacherId = 'Please select a teacher';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
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
      console.error('Error assigning teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Assign Teacher to Department
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

          {/* Department Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{department.name}</h4>
            <div className="text-sm text-gray-600">
              <p>Code: {department.code}</p>
              <p>Type: {department.institutionType}</p>
              {department.isClass && (
                <p>Class: {department.standard} {department.section}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Teacher Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Teacher *
              </label>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.teacherId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a teacher...</option>
                {Array.isArray(teachers) && teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.fullName} - {teacher.emailAddress}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <p className="text-red-500 text-xs mt-1">{errors.teacherId}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="head">Head of Department</option>
                <option value="coordinator">Coordinator</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            {/* Role Description */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              {formData.role === 'head' ? (
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Head of Department</h5>
                  <p className="text-blue-800">
                    The head will have administrative authority over this department, 
                    including managing teachers, students, and academic activities.
                  </p>
                </div>
              ) : (
                <div>
                  <h5 className="font-medium text-green-900 mb-1">Coordinator</h5>
                  <p className="text-green-800">
                    The coordinator will assist in organizing department activities 
                    and supporting the head of department.
                  </p>
                </div>
              )}
            </div>

            {/* Current Assignments */}
            {(department.headOfDepartment || department.coordinator) && (
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">Current Assignments</h5>
                {department.headOfDepartment && (
                  <p className="text-yellow-800">
                    <strong>Head:</strong> {department.headOfDepartment.fullName}
                  </p>
                )}
                {department.coordinator && (
                  <p className="text-yellow-800">
                    <strong>Coordinator:</strong> {department.coordinator.fullName}
                  </p>
                )}
                <p className="text-yellow-800 mt-1 text-xs">
                  Assigning a new teacher will replace the current assignment.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                {loading ? 'Assigning...' : 'Assign Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignment;
