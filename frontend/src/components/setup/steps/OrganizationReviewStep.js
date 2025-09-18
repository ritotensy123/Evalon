import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const OrganizationReviewStep = ({ data, onDataChange, onNext, onPrevious, isFirstStep, isLastStep }) => {
  const { organizationData } = useAuth();
  const [departments, setDepartments] = useState(data.departments || []);
  const [newDepartment, setNewDepartment] = useState('');

  useEffect(() => {
    onDataChange({ departments });
  }, [departments, onDataChange]);

  const addDepartment = () => {
    if (newDepartment.trim()) {
      setDepartments([...departments, { name: newDepartment.trim(), id: Date.now() }]);
      setNewDepartment('');
    }
  };

  const removeDepartment = (id) => {
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDepartment();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Organization Setup
        </h2>
        <p className="text-gray-600">
          Add your departments to get started
        </p>
      </div>

      {/* Organization Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">{organizationData?.name}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Code:</span>
            <p className="font-medium">{organizationData?.orgCode}</p>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <p className="font-medium">{organizationData?.email}</p>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Departments
        </h3>
        
        {/* Add Department */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter department name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={addDepartment}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Department List */}
        <div className="space-y-2">
          {departments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No departments added yet</p>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <span className="font-medium">{dept.name}</span>
                <button
                  onClick={() => removeDepartment(dept.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Add common departments like "Computer Science", "Mathematics", etc.</li>
          <li>• You can always add more departments later</li>
          <li>• Skip this step if you want to set up departments later</li>
        </ul>
      </div>
    </div>
  );
};

export default OrganizationReviewStep;