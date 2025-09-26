import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';

const BulkUpload = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
    } else {
      setErrors(['Please select a valid CSV file']);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would process the CSV file and extract user data
      // For now, we'll simulate some data
      const mockUsers = [
        { email: 'user1@example.com', firstName: 'John', lastName: 'Doe', role: 'student' },
        { email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', role: 'teacher' },
      ];
      
      onUpload(mockUsers);
      onClose();
    } catch (error) {
      console.error('Error processing file:', error);
      setErrors(['Failed to process file. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'email,firstName,lastName,role,department,phone',
      'john.doe@example.com,John,Doe,student,Mathematics,+1234567890',
      'jane.smith@example.com,Jane,Smith,teacher,Science,+1234567891'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Upload Users</h2>
              <p className="text-sm text-gray-600">Upload a CSV file to create multiple users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download the CSV template below</li>
              <li>• Fill in user details following the template format</li>
              <li>• Upload the completed CSV file</li>
              <li>• Review and confirm the user data</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-900">CSV Template</h4>
                <p className="text-sm text-gray-600">Download the template to get started</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-xs text-gray-500">
                    or drag and drop your file here
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-800 mt-1 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {file && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">File Ready</h4>
                  <p className="text-sm text-green-800 mt-1">
                    {file.name} is ready for upload. Click "Process File" to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Process File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;