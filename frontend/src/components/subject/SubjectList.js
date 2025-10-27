import React from 'react';
import {
  BookOpen,
  Building,
  TreePine,
  GraduationCap,
  Edit,
  Trash2,
  User,
  Clock,
  Award,
  ChevronRight
} from 'lucide-react';

const SubjectList = ({ subjects, departments, onEdit, onDelete, loading }) => {
  const getDepartmentInfo = (departmentId) => {
    if (!departmentId) return { name: 'No Department', type: '', icon: null };
    
    const department = departments.find(d => d._id === departmentId || d._id === departmentId._id);
    if (!department) return { name: 'Unknown Department', type: '', icon: null };
    
    const type = department.departmentType || 'department';
    let icon;
    
    if (type === 'department') {
      icon = <Building className="w-3.5 h-3.5 text-blue-600" />;
    } else if (type === 'sub-department') {
      icon = <TreePine className="w-3.5 h-3.5 text-purple-600" />;
    } else if (type === 'class') {
      icon = <GraduationCap className="w-3.5 h-3.5 text-green-600" />;
    } else {
      icon = <Building className="w-3.5 h-3.5 text-gray-600" />;
    }
    
    return {
      name: department.name,
      code: department.code,
      type: type,
      icon: icon
    };
  };


  const getTypeColor = (type) => {
    const colors = {
      core: 'bg-blue-50 text-blue-700 border-blue-200',
      elective: 'bg-green-50 text-green-700 border-green-200',
      practical: 'bg-purple-50 text-purple-700 border-purple-200',
      theory: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      project: 'bg-orange-50 text-orange-700 border-orange-200',
      internship: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading subjects...</p>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first subject.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Subjects</h2>
          <p className="text-sm text-gray-500">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjects.map((subject) => {
          const deptInfo = getDepartmentInfo(subject.departmentId);
          
          return (
            <div 
              key={subject._id} 
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-purple-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {subject.code}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getTypeColor(subject.subjectType)} capitalize`}>
                        {subject.subjectType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(subject)}
                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit Subject"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(subject._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Department Mapping */}
              <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  {deptInfo.icon}
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{deptInfo.name}</span>
                    {deptInfo.code && (
                      <span className="text-gray-500 ml-1">({deptInfo.code})</span>
                    )}
                  </span>
                  {deptInfo.type && (
                    <span className="text-xs text-gray-500 capitalize">
                      • {deptInfo.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {subject.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {subject.description}
                </p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Credits:</span>
                    <span className="ml-1 font-medium text-gray-900">{subject.credits}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Hours:</span>
                    <span className="ml-1 font-medium text-gray-900">{subject.hoursPerWeek}/week</span>
                  </div>
                </div>
              </div>

              {/* Assessment */}
              {subject.assessment && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Assessment</h4>
                  <div className="flex flex-wrap gap-2">
                    {subject.assessment.hasTheory && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Theory ({subject.assessment.theoryMarks})
                      </span>
                    )}
                    {subject.assessment.hasPractical && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        Practical ({subject.assessment.practicalMarks})
                      </span>
                    )}
                    {subject.assessment.hasProject && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                        Project ({subject.assessment.projectMarks})
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded font-semibold">
                      Total: {subject.assessment.totalMarks}
                    </span>
                  </div>
                </div>
              )}

              {/* Coordinator */}
              {subject.coordinator && (
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Coordinator: <span className="font-medium text-gray-900">{subject.coordinator.fullName}</span></span>
                </div>
              )}

              {/* Prerequisites */}
              {subject.prerequisites && subject.prerequisites.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Prerequisites:</p>
                  <div className="flex flex-wrap gap-1">
                    {subject.prerequisites.map((prereq, index) => (
                      <span key={index} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {prereq.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="capitalize">{subject.category}</span>
                  <span>•</span>
                  <span className="capitalize">{subject.duration}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  subject.status === 'active' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : subject.status === 'inactive'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {subject.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectList;
