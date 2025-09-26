import React from 'react';
import {
  X,
  Upload,
  Users,
  GraduationCap,
  UserCheck,
} from 'lucide-react';

const BulkUploadSelection = ({ onClose, onSelectType }) => {
  const handleTypeSelection = (userType) => {
    onSelectType(userType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Upload Users</h2>
              <p className="text-sm text-gray-600">Choose the type of users to upload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Selection Options */}
          <div className="space-y-4">
            <button
              onClick={() => handleTypeSelection('student')}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Upload Students</h3>
                <p className="text-sm text-gray-600">Import multiple students via CSV file</p>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600">
                <Users className="w-5 h-5" />
              </div>
            </button>

            <button
              onClick={() => handleTypeSelection('teacher')}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Upload Teachers</h3>
                <p className="text-sm text-gray-600">Import multiple teachers via CSV file</p>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600">
                <Users className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose the user type you want to upload</li>
              <li>• Download the appropriate CSV template</li>
              <li>• Fill in the user details following the template</li>
              <li>• Upload the completed CSV file</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadSelection;
