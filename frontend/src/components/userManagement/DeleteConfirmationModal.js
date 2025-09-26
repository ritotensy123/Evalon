import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  userEmail 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to permanently delete this user?
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Warning</p>
                <ul className="text-sm text-red-700 mt-1 space-y-1">
                  <li>• User account will be permanently deleted</li>
                  <li>• All associated data will be removed</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
