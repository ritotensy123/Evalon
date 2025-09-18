import React, { useState } from 'react';
import {
  Shield,
  Users,
  Settings,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
} from 'lucide-react';

const RoleAssignment = () => {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      userCount: 2,
      color: 'red',
      permissions: {
        userManagement: { read: true, write: true, delete: true },
        organizationSettings: { read: true, write: true, delete: true },
        studentManagement: { read: true, write: true, delete: true },
        teacherManagement: { read: true, write: true, delete: true },
        examManagement: { read: true, write: true, delete: true },
        reports: { read: true, write: true, delete: true },
        systemSettings: { read: true, write: true, delete: true },
      }
    },
    {
      id: 'sub_admin',
      name: 'Sub Administrator',
      description: 'Limited administrative access',
      userCount: 5,
      color: 'purple',
      permissions: {
        userManagement: { read: true, write: true, delete: false },
        organizationSettings: { read: true, write: false, delete: false },
        studentManagement: { read: true, write: true, delete: true },
        teacherManagement: { read: true, write: true, delete: false },
        examManagement: { read: true, write: true, delete: true },
        reports: { read: true, write: false, delete: false },
        systemSettings: { read: false, write: false, delete: false },
      }
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description: 'Teaching and student management access',
      userCount: 45,
      color: 'blue',
      permissions: {
        userManagement: { read: false, write: false, delete: false },
        organizationSettings: { read: false, write: false, delete: false },
        studentManagement: { read: true, write: true, delete: false },
        teacherManagement: { read: false, write: false, delete: false },
        examManagement: { read: true, write: true, delete: false },
        reports: { read: true, write: false, delete: false },
        systemSettings: { read: false, write: false, delete: false },
      }
    },
    {
      id: 'student',
      name: 'Student',
      description: 'Student access with limited permissions',
      userCount: 1250,
      color: 'green',
      permissions: {
        userManagement: { read: false, write: false, delete: false },
        organizationSettings: { read: false, write: false, delete: false },
        studentManagement: { read: false, write: false, delete: false },
        teacherManagement: { read: false, write: false, delete: false },
        examManagement: { read: true, write: false, delete: false },
        reports: { read: false, write: false, delete: false },
        systemSettings: { read: false, write: false, delete: false },
      }
    }
  ];

  const permissionCategories = [
    {
      id: 'userManagement',
      name: 'User Management',
      description: 'Manage users, roles, and permissions'
    },
    {
      id: 'organizationSettings',
      name: 'Organization Settings',
      description: 'Configure organization details and settings'
    },
    {
      id: 'studentManagement',
      name: 'Student Management',
      description: 'Manage student records and information'
    },
    {
      id: 'teacherManagement',
      name: 'Teacher Management',
      description: 'Manage teacher records and information'
    },
    {
      id: 'examManagement',
      name: 'Exam Management',
      description: 'Create and manage exams and assessments'
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      description: 'Access reports and analytics data'
    },
    {
      id: 'systemSettings',
      name: 'System Settings',
      description: 'Configure system-wide settings'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getPermissionIcon = (hasPermission) => {
    return hasPermission ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-gray-400" />
    );
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowPermissionModal(true);
  };

  const handleSavePermissions = (updatedPermissions) => {
    // Handle saving permissions
    console.log('Saving permissions:', updatedPermissions);
    setShowPermissionModal(false);
    setEditingRole(null);
  };

  const renderRoleCard = (role) => (
    <div
      key={role.id}
      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
        selectedRole === role.id
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedRole(role.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(role.color)}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{role.name}</h3>
            <p className="text-sm text-gray-600">{role.userCount} users</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditRole(role);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-3">{role.description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Permissions</span>
          <span className="text-gray-700">
            {Object.values(role.permissions).filter(p => p.read || p.write || p.delete).length} / {Object.keys(role.permissions).length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.values(role.permissions).filter(p => p.read || p.write || p.delete).length / Object.keys(role.permissions).length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );

  const renderPermissionModal = () => {
    if (!editingRole) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(editingRole.color)}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit {editingRole.name} Permissions</h2>
                <p className="text-sm text-gray-600">Configure role permissions and access levels</p>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {permissionCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {['read', 'write', 'delete'].map((action) => (
                    <div key={action} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${category.id}-${action}`}
                        checked={editingRole.permissions[category.id]?.[action] || false}
                        onChange={(e) => {
                          const updatedRole = {
                            ...editingRole,
                            permissions: {
                              ...editingRole.permissions,
                              [category.id]: {
                                ...editingRole.permissions[category.id],
                                [action]: e.target.checked
                              }
                            }
                          };
                          setEditingRole(updatedRole);
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <label
                        htmlFor={`${category.id}-${action}`}
                        className="text-sm font-medium text-gray-700 capitalize cursor-pointer"
                      >
                        {action}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSavePermissions(editingRole.permissions)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Configure user roles and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Roles</h3>
          <div className="space-y-3">
            {roles.map(renderRoleCard)}
          </div>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRoleData && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(selectedRoleData.color)}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedRoleData.name}</h3>
                    <p className="text-gray-600">{selectedRoleData.userCount} users assigned</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">{selectedRoleData.description}</p>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Permission Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissionCategories.map((category) => {
                      const permissions = selectedRoleData.permissions[category.id];
                      const hasAnyPermission = permissions.read || permissions.write || permissions.delete;
                      
                      return (
                        <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {getPermissionIcon(hasAnyPermission)}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <p className="text-xs text-gray-600">
                              {permissions.read && 'Read '}
                              {permissions.write && 'Write '}
                              {permissions.delete && 'Delete'}
                              {!hasAnyPermission && 'No access'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Users with this role */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Users with this Role</h4>
                  <span className="text-sm text-gray-600">{selectedRoleData.userCount} users</span>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', email: 'john.doe@school.edu', status: 'active' },
                    { name: 'Jane Smith', email: 'jane.smith@school.edu', status: 'active' },
                    { name: 'Mike Johnson', email: 'mike.johnson@school.edu', status: 'pending' },
                  ].slice(0, selectedRoleData.userCount > 3 ? 3 : selectedRoleData.userCount).map((user, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-sm text-gray-600 capitalize">{user.status}</span>
                      </div>
                    </div>
                  ))}
                  
                  {selectedRoleData.userCount > 3 && (
                    <p className="text-sm text-gray-600 text-center py-2">
                      ... and {selectedRoleData.userCount - 3} more users
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderPermissionModal()}
    </div>
  );
};

export default RoleAssignment;
