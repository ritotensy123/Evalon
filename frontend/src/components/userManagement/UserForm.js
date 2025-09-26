import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Building,
  Calendar,
  Eye,
  EyeOff,
  Save,
  UserPlus,
} from 'lucide-react';

const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    role: 'student',
    department: '',
    status: 'active',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    // Teacher specific fields
    subjects: [],
    teacherRole: 'teacher',
    affiliationType: 'organization',
    experienceLevel: '',
    currentInstitution: '',
    yearsOfExperience: '',
    // Student specific fields
    gender: '',
    academicYear: '',
    grade: '',
    section: '',
    rollNumber: '',
    studentSubjects: []
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'teacher', label: 'Teacher', description: 'Teaching and student management' },
    { value: 'student', label: 'Student', description: 'Student access only' },
  ];

  const departments = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
    'Administration',
    'Support',
  ];

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Geography',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
    'Economics',
    'Business Studies',
    'Psychology',
    'Sociology'
  ];

  const teacherRoles = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'coordinator', label: 'Coordinator' }
  ];

  const affiliationTypes = [
    { value: 'organization', label: 'Organization' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (3-5 years)' },
    { value: 'experienced', label: 'Experienced (6-10 years)' },
    { value: 'expert', label: 'Expert (10+ years)' }
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const academicYears = [
    '2024-25',
    '2025-26',
    '2026-27',
    '2027-28',
    '2028-29'
  ];

  const grades = [
    '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
    '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade',
    '11th Grade', '12th Grade'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  const statuses = [
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'inactive', label: 'Inactive', color: 'text-red-600' },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || user.firstName || '',
        lastName: user.profile?.lastName || user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || user.phone || '',
        countryCode: user.profile?.countryCode || user.countryCode || '+1',
        role: user.userType || user.role || 'student',
        department: user.profile?.department || user.department || '',
        status: user.isActive ? 'active' : 'inactive',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        notes: user.notes || '',
        // Teacher specific fields
        subjects: user.subjects || [],
        teacherRole: user.teacherRole || 'teacher',
        affiliationType: user.affiliationType || 'organization',
        experienceLevel: user.experienceLevel || '',
        currentInstitution: user.currentInstitution || '',
        yearsOfExperience: user.yearsOfExperience || '',
        // Student specific fields
        gender: user.gender || '',
        academicYear: user.academicYear || '',
        grade: user.grade || '',
        section: user.section || '',
        rollNumber: user.rollNumber || '',
        studentSubjects: user.studentSubjects || []
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    // Teacher specific validations
    if (formData.role === 'teacher') {
      if (!formData.teacherRole) {
        newErrors.teacherRole = 'Teacher role is required';
      }
      if (!formData.affiliationType) {
        newErrors.affiliationType = 'Affiliation type is required';
      }
      if (formData.affiliationType === 'freelance' && !formData.experienceLevel) {
        newErrors.experienceLevel = 'Experience level is required for freelance teachers';
      }
    }

    // Student specific validations - these fields are optional when creating via user management
    // as they will be filled during the first-time login wizard
    if (formData.role === 'student') {
      // Only validate if fields are provided (not required for user management creation)
      if (formData.dateOfBirth && !formData.dateOfBirth.trim()) {
        newErrors.dateOfBirth = 'Date of birth is required if provided';
      }
      if (formData.gender && !formData.gender.trim()) {
        newErrors.gender = 'Gender is required if provided';
      }
      if (formData.academicYear && !formData.academicYear.trim()) {
        newErrors.academicYear = 'Academic year is required if provided';
      }
      if (formData.grade && !formData.grade.trim()) {
        newErrors.grade = 'Grade is required if provided';
      }
      if (formData.section && !formData.section.trim()) {
        newErrors.section = 'Section is required if provided';
      }
      if (formData.rollNumber && !formData.rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required if provided';
      }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        fullPhone: `${formData.countryCode}${formData.phone}`,
        // Convert status back to isActive for backend
        isActive: formData.status === 'active',
      };

      await onSave(userData);
      // Don't close modal here - let the parent handle it after successful save
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              {user ? <User className="w-5 h-5 text-purple-600" /> : <UserPlus className="w-5 h-5 text-purple-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user ? 'Edit User' : 'Add New User'}
              </h2>
              <p className="text-sm text-gray-600">
                {user ? 'Update user information' : 'Create a new user account'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!!user} // Disable email editing for existing users
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } ${user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed for existing users
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="+1">+1 (US)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+86">+86 (CN)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role and Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role & Department
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={!!user} // Disable role editing for existing users
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  } ${user ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {roles.find(r => r.value === formData.role)?.description}
                  {user && ' (Role cannot be changed for existing users)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex gap-4">
                {statuses.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Specific Fields */}
          {formData.role === 'teacher' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Teacher Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher Role *
                  </label>
                  <select
                    value={formData.teacherRole}
                    onChange={(e) => handleInputChange('teacherRole', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.teacherRole ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {teacherRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.teacherRole && (
                    <p className="text-red-500 text-xs mt-1">{errors.teacherRole}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Affiliation Type *
                  </label>
                  <select
                    value={formData.affiliationType}
                    onChange={(e) => handleInputChange('affiliationType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.affiliationType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {affiliationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.affiliationType && (
                    <p className="text-red-500 text-xs mt-1">{errors.affiliationType}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Institution
                  </label>
                  <input
                    type="text"
                    value={formData.currentInstitution}
                    onChange={(e) => handleInputChange('currentInstitution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter current institution"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>

              {formData.affiliationType === 'freelance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level *
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.experienceLevel ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  {errors.experienceLevel && (
                    <p className="text-red-500 text-xs mt-1">{errors.experienceLevel}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects.map((subject) => (
                    <label key={subject} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={(e) => {
                          const newSubjects = e.target.checked
                            ? [...formData.subjects, subject]
                            : formData.subjects.filter(s => s !== subject);
                          handleInputChange('subjects', newSubjects);
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Student Specific Fields */}
          {formData.role === 'student' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Student Setup Process</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      When creating a student user, they will be required to complete their profile information 
                      (date of birth, gender, academic details, etc.) during their first login. You can optionally 
                      fill these fields now, or leave them empty for the student to complete.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.gender ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select gender</option>
                    {genders.map((gender) => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.academicYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.academicYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.grade ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select grade</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  {errors.grade && (
                    <p className="text-red-500 text-xs mt-1">{errors.grade}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.section ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                  {errors.section && (
                    <p className="text-red-500 text-xs mt-1">{errors.section}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                    <span className="text-xs text-gray-500 ml-1">(Optional - will be collected during first login)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.rollNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter roll number"
                  />
                  {errors.rollNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects.map((subject) => (
                    <label key={subject} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.studentSubjects.includes(subject)}
                        onChange={(e) => {
                          const newSubjects = e.target.checked
                            ? [...formData.studentSubjects, subject]
                            : formData.studentSubjects.filter(s => s !== subject);
                          handleInputChange('studentSubjects', newSubjects);
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {!user && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Registration Process</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        When you create a user, they will receive an email with a registration link. 
                        They must complete their registration by setting a password and entering the organization code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Emergency contact name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Additional notes about the user"
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
