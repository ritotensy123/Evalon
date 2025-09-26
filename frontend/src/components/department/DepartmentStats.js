import React from 'react';

const DepartmentStats = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Departments',
      value: stats.totalDepartments,
      icon: '🏢',
      color: 'blue',
      description: 'Active departments in your organization'
    },
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: '📚',
      color: 'green',
      description: 'Subjects across all departments'
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: '👨‍🏫',
      color: 'purple',
      description: 'Teachers in your organization'
    },
    {
      title: 'Departments with Heads',
      value: stats.departmentsWithHeads,
      icon: '👑',
      color: 'yellow',
      description: 'Departments with assigned heads'
    },
    {
      title: 'Departments with Coordinators',
      value: stats.departmentsWithCoordinators,
      icon: '📋',
      color: 'indigo',
      description: 'Departments with assigned coordinators'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Department Statistics</h2>
        <p className="text-gray-600">Overview of your organization's department structure</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`rounded-lg border-2 p-6 ${getColorClasses(stat.color)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs mt-2 opacity-75">{stat.description}</p>
              </div>
              <div className="text-4xl opacity-75">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Head Coverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Head of Department Coverage</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.coverage?.heads || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.coverage?.heads || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.departmentsWithHeads} of {stats.totalDepartments} departments have heads assigned
            </p>
          </div>

          {/* Coordinator Coverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Coordinator Coverage</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.coverage?.coordinators || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.coverage?.coordinators || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.departmentsWithCoordinators} of {stats.totalDepartments} departments have coordinators assigned
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Recommendations</h3>
            <div className="mt-2 text-sm text-yellow-700">
              {stats.coverage?.heads < 80 && (
                <p>• Consider assigning heads to more departments for better management</p>
              )}
              {stats.coverage?.coordinators < 80 && (
                <p>• Assign coordinators to departments to improve organization</p>
              )}
              {stats.totalDepartments === 0 && (
                <p>• Create your first department to get started with organizing your institution</p>
              )}
              {stats.coverage?.heads >= 80 && stats.coverage?.coordinators >= 80 && (
                <p>• Great job! Your department structure is well organized</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentStats;
