import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Save,
  X,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const RoleAssignment = () => {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Organization Admin',
      key: 'organization_admin',
      description: 'Full system access with all permissions',
      permissions: ['user_management', 'system_settings', 'data_export', 'invite_users'],
      userCount: 2,
    },
    {
      id: 2,
      name: 'Sub Administrator',
      key: 'sub_admin',
      description: 'Limited administrative access',
      permissions: ['user_management', 'invite_users'],
      userCount: 5,
    },
    {
      id: 3,
      name: 'Teacher',
      key: 'teacher',
      description: 'Teaching and student management capabilities',
      permissions: ['view_students', 'manage_exams', 'grade_assignments'],
      userCount: 25,
    },
    {
      id: 4,
      name: 'Student',
      key: 'student',
      description: 'Basic student access',
      permissions: ['take_exams', 'view_grades', 'view_profile'],
      userCount: 120,
    },
  ]);

  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const allPermissions = [
    'user_management',
    'system_settings',
    'data_export',
    'invite_users',
    'view_students',
    'manage_exams',
    'grade_assignments',
    'take_exams',
    'view_grades',
    'view_profile',
    'manage_departments',
    'manage_subjects',
    'view_analytics',
  ];

  const permissionLabels = {
    user_management: 'User Management',
    system_settings: 'System Settings',
    data_export: 'Data Export',
    invite_users: 'Invite Users',
    view_students: 'View Students',
    manage_exams: 'Manage Exams',
    grade_assignments: 'Grade Assignments',
    take_exams: 'Take Exams',
    view_grades: 'View Grades',
    view_profile: 'View Profile',
    manage_departments: 'Manage Departments',
    manage_subjects: 'Manage Subjects',
    view_analytics: 'View Analytics',
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsEditing(false);
  };

  const handlePermissionToggle = (permission) => {
    if (!selectedRole) return;

    const updatedRole = {
      ...selectedRole,
      permissions: selectedRole.permissions.includes(permission)
        ? selectedRole.permissions.filter(p => p !== permission)
        : [...selectedRole.permissions, permission]
    };

    setSelectedRole(updatedRole);
    
    // Update the role in the roles array
    setRoles(roles.map(role => 
      role.id === updatedRole.id ? updatedRole : role
    ));
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving role:', selectedRole);
      
      // Here you would make an API call to save the role permissions
      // await userManagementAPI.updateRolePermissions(selectedRole.id, selectedRole.permissions);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleKey) => {
    switch (roleKey) {
      case 'organization_admin':
        return 'bg-red-100 text-red-800';
      case 'sub_admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Configure roles and permissions for your organization</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Available Roles</h3>
            </div>
            <div className="p-4 space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole?.id === role.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(role.key)}`}>
                      {role.userCount} users
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {permissionLabels[permission] || permission}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedRole.name}</h3>
                    <p className="text-sm text-gray-600">{selectedRole.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    {isEditing && (
                      <button
                        onClick={handleSaveRole}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-4">Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPermissions.map((permission) => (
                    <label
                      key={permission}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRole.permissions.includes(permission)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${isEditing ? '' : 'pointer-events-none opacity-75'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRole.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        disabled={!isEditing}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {permissionLabels[permission] || permission}
                        </span>
                        <p className="text-xs text-gray-500">
                          {getPermissionDescription(permission)}
                        </p>
                      </div>
                      {selectedRole.permissions.includes(permission) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="text-center">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
                <p className="text-gray-600">
                  Choose a role from the list to view and edit its permissions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getPermissionDescription = (permission) => {
  const descriptions = {
    user_management: 'Create, edit, and manage user accounts',
    system_settings: 'Access and modify system configuration',
    data_export: 'Export data and generate reports',
    invite_users: 'Send invitations to new users',
    view_students: 'View student information and profiles',
    manage_exams: 'Create, edit, and manage examinations',
    grade_assignments: 'Grade student assignments and exams',
    take_exams: 'Participate in examinations',
    view_grades: 'View personal grades and results',
    view_profile: 'View and edit personal profile',
    manage_departments: 'Create and manage departments',
    manage_subjects: 'Create and manage subjects',
    view_analytics: 'Access analytics and reporting tools',
  };
  
  return descriptions[permission] || 'No description available';
};

export default RoleAssignment;