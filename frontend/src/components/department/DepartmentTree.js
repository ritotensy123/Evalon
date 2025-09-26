import React, { useState } from 'react';

const DepartmentTree = ({ 
  departments, 
  onEdit, 
  onDelete, 
  onAssignTeacher, 
  onRefresh 
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node._id);
    const hasChildren = node.children && node.children.length > 0;
    const indentLevel = level * 24;

    return (
      <div key={node._id} className="select-none">
        <div 
          className="flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${indentLevel + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center mr-3">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(node._id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ) : (
              <div className="w-6 h-6"></div>
            )}
          </div>

          {/* Department Icon */}
          <div className="mr-3">
            {node.isClass ? (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">C</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">D</span>
              </div>
            )}
          </div>

          {/* Department Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {node.name}
              </h3>
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {node.code}
              </span>
            </div>
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <span className="mr-4">Level: {node.level}</span>
              <span className="mr-4">Type: {node.institutionType}</span>
              {node.isClass && (
                <>
                  <span className="mr-4">Class: {node.standard}</span>
                  {node.section && <span>Section: {node.section}</span>}
                </>
              )}
            </div>
            {node.description && (
              <p className="mt-1 text-xs text-gray-600 truncate">
                {node.description}
              </p>
            )}
          </div>

          {/* Department Stats */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 mr-4">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{node.stats?.totalTeachers || 0}</div>
              <div>Teachers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{node.stats?.totalSubjects || 0}</div>
              <div>Subjects</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{node.stats?.totalStudents || 0}</div>
              <div>Students</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(node)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onAssignTeacher(node)}
              className="text-green-600 hover:text-green-800 text-xs font-medium"
            >
              Assign Teacher
            </button>
            <button
              onClick={() => onDelete(node._id)}
              className="text-red-600 hover:text-red-800 text-xs font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!departments || departments.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments</h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first department or class.
        </p>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Department Hierarchy</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setExpandedNodes(new Set())}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Collapse All
          </button>
          <button
            onClick={() => {
              const allIds = departments.map(d => d._id);
              setExpandedNodes(new Set(allIds));
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Expand All
          </button>
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {departments.map(node => renderTreeNode(node))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-blue-600 text-xs font-semibold">D</span>
          </div>
          <span>Department</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-green-600 text-xs font-semibold">C</span>
          </div>
          <span>Class</span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentTree;
