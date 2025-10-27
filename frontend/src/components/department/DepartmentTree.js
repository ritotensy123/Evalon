import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Building,
  GraduationCap,
  Users,
  BookOpen,
  Folder,
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  BarChart3,
  TreePine
} from 'lucide-react';
import { 
  getDisplayName, 
  getDepartmentTypeDisplayName, 
  getDepartmentTypeColors,
  getDepartmentIcon,
  getHierarchyDescription,
  isClass,
  isSubDepartment,
  isSection,
  getClassInfo
} from '../../utils/departmentUtils';

const DepartmentTree = ({ 
  departments, 
  onView, 
  onRefresh
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getDepartmentIconComponent = (departmentType, institutionType) => {
    const iconName = getDepartmentIcon(departmentType);
    switch (iconName) {
      case 'Building':
        return <Building className="w-4 h-4" />;
      case 'TreePine':
        return <TreePine className="w-4 h-4" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const getDepartmentColor = (departmentType) => {
    const colors = getDepartmentTypeColors(departmentType);
    return `${colors.bg} ${colors.text}`;
  };

  // Using centralized getDisplayName from utils

  const renderTreeNode = (node, level = 0) => {
    if (!node || !node._id) return null;
    
    const isExpanded = expandedNodes.has(node._id);
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const indentLevel = level * 32;
    const isSelected = selectedNode === node._id;

    return (
      <div key={node._id} className="select-none">
        <div 
          className={`flex items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-all relative ${
            isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
          }`}
          style={{ paddingLeft: `${indentLevel + 16}px` }}
          onClick={() => setSelectedNode(node._id)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center mr-3">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node._id);
                }}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6"></div>
            )}
          </div>

          {/* Department Icon */}
          <div className={`mr-3 w-8 h-8 rounded-lg flex items-center justify-center ${getDepartmentColor(node.departmentType)}`}>
            {getDepartmentIconComponent(node.departmentType, node.institutionType)}
          </div>

          {/* Department Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                {getDisplayName(node)}
              </h3>
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {node.code}
              </span>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded capitalize">
                {getDepartmentTypeDisplayName(node.departmentType)}
              </span>
            </div>
            <div className="mt-1 flex items-center text-xs text-gray-500 gap-2">
              {node.classLevel && (
                <span>{node.classLevel}</span>
              )}
              {node.standard && (
                <span>• Standard: {node.standard}</span>
              )}
              {node.section && (
                <span>• Section: {node.section}</span>
              )}
              {!node.classLevel && !node.standard && !node.section && node.description && (
                <span className="truncate">{node.description}</span>
              )}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(node);
              }}
              className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-lg transition-all"
              title="View Department Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children && Array.isArray(node.children) && node.children.map((child, index) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!departments || departments.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Building className="mx-auto h-16 w-16" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Departments Found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Get started by creating your first department. You can create departments, sub-departments, classes, and sections based on your institution type.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Department Hierarchy</h2>
          <p className="text-sm text-gray-500">Manage your organization's department structure</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpandedNodes(new Set())}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={() => {
              const getAllIds = (nodes) => {
                let ids = [];
                nodes.forEach(node => {
                  ids.push(node._id);
                  if (node.children && node.children.length > 0) {
                    ids = ids.concat(getAllIds(node.children));
                  }
                });
                return ids;
              };
              const allIds = getAllIds(departments);
              setExpandedNodes(new Set(allIds));
            }}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Department Tree */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {Array.isArray(departments) && departments.map((node, index) => renderTreeNode(node))}
      </div>

      {/* Enhanced Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Department Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              <Building className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-gray-600">Department</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
              <Folder className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-gray-600">Sub-Department</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded-lg flex items-center justify-center mr-2">
              <GraduationCap className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-600">Class</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
              <Users className="w-3 h-3 text-orange-600" />
            </div>
            <span className="text-gray-600">Section</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentTree;
