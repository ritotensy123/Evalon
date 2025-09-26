import React from 'react';

const SubjectList = ({ subjects, departments, onEdit, onDelete, loading }) => {
  const getDepartmentName = (departmentId) => {
    const department = departments.find(d => d._id === departmentId);
    return department ? department.name : 'Unknown Department';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      science: '🔬',
      mathematics: '📐',
      language: '📝',
      social: '🌍',
      arts: '🎨',
      commerce: '💼',
      technology: '💻',
      physical: '🏃',
      other: '📚'
    };
    return icons[category] || '📚';
  };

  const getTypeColor = (type) => {
    const colors = {
      core: 'bg-blue-100 text-blue-800',
      elective: 'bg-green-100 text-green-800',
      practical: 'bg-purple-100 text-purple-800',
      theory: 'bg-yellow-100 text-yellow-800',
      project: 'bg-red-100 text-red-800',
      internship: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading subjects...</p>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first subject.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Subjects ({subjects.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">
                  {getCategoryIcon(subject.category)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subject.code}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(subject)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(subject._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Department */}
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{getDepartmentName(subject.departmentId)}</span>
              </div>

              {/* Subject Type */}
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(subject.subjectType)}`}>
                  {subject.subjectType}
                </span>
              </div>

              {/* Description */}
              {subject.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {subject.description}
                </p>
              )}

              {/* Academic Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Credits:</span>
                  <span className="ml-1 font-medium">{subject.credits}</span>
                </div>
                <div>
                  <span className="text-gray-500">Hours/Week:</span>
                  <span className="ml-1 font-medium">{subject.hoursPerWeek}</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-1 font-medium">{subject.duration}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-1 font-medium capitalize">{subject.category}</span>
                </div>
              </div>

              {/* Assessment Details */}
              {subject.assessment && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {subject.assessment.hasTheory && (
                      <div className="flex justify-between">
                        <span>Theory:</span>
                        <span className="font-medium">{subject.assessment.theoryMarks} marks</span>
                      </div>
                    )}
                    {subject.assessment.hasPractical && (
                      <div className="flex justify-between">
                        <span>Practical:</span>
                        <span className="font-medium">{subject.assessment.practicalMarks} marks</span>
                      </div>
                    )}
                    {subject.assessment.hasProject && (
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-medium">{subject.assessment.projectMarks} marks</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{subject.assessment.totalMarks} marks</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordinator */}
              {subject.coordinator && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Coordinator: {subject.coordinator.fullName}</span>
                </div>
              )}

              {/* Prerequisites */}
              {subject.prerequisites && subject.prerequisites.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Prerequisites:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {subject.prerequisites.map((prereq, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {prereq.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <div className="flex space-x-4">
                  <span>Teachers: {subject.stats?.totalTeachers || 0}</span>
                  <span>Students: {subject.stats?.totalStudents || 0}</span>
                  <span>Classes: {subject.stats?.totalClasses || 0}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  subject.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : subject.status === 'inactive'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subject.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectList;
