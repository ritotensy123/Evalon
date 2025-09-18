import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const BulkUpload = ({ onClose, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const sampleCSV = `firstName,lastName,email,phone,role,department,status
John,Doe,john.doe@school.edu,+1234567890,teacher,Mathematics,active
Jane,Smith,jane.smith@school.edu,+1234567891,student,Grade 10A,active
Mike,Johnson,mike.johnson@school.edu,+1234567892,sub_admin,Administration,pending`;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a valid CSV file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['CSV file must contain at least a header row and one data row']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['firstName', 'lastName', 'email', 'role'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
        return;
      }

      const data = [];
      const newErrors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate row data
        const rowErrors = validateRow(row, i + 1);
        if (rowErrors.length > 0) {
          newErrors.push(...rowErrors);
        }

        data.push({
          ...row,
          id: i,
          isValid: rowErrors.length === 0
        });
      }

      setPreviewData(data);
      setErrors(newErrors);
    };
    
    reader.readAsText(file);
  };

  const validateRow = (row, rowNumber) => {
    const errors = [];
    
    if (!row.firstName?.trim()) {
      errors.push(`Row ${rowNumber}: First name is required`);
    }
    
    if (!row.lastName?.trim()) {
      errors.push(`Row ${rowNumber}: Last name is required`);
    }
    
    if (!row.email?.trim()) {
      errors.push(`Row ${rowNumber}: Email is required`);
    } else if (!/\S+@\S+\.\S+/.test(row.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
    }
    
    if (!row.role?.trim()) {
      errors.push(`Row ${rowNumber}: Role is required`);
    } else if (!['admin', 'sub_admin', 'teacher', 'student'].includes(row.role)) {
      errors.push(`Row ${rowNumber}: Invalid role. Must be one of: admin, sub_admin, teacher, student`);
    }
    
    return errors;
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      setErrors(['No valid data to upload']);
      return;
    }

    const validData = previewData.filter(row => row.isValid);
    if (validData.length === 0) {
      setErrors(['No valid rows to upload']);
      return;
    }

    setIsLoading(true);
    setUploadStatus('processing');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus('success');
      onUpload(validData);
    } catch (error) {
      setUploadStatus('error');
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const removeFile = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (isValid) => {
    return isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk User Upload</h2>
              <p className="text-sm text-gray-600">Upload multiple users via CSV file</p>
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
          {/* Upload Section */}
          {!file && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file with user information. Download the template to see the required format.
                </p>
                
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto mb-4"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Supports CSV files up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* File Preview */}
          {file && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(1)} KB • {previewData.length} rows
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Validation Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Validation Summary</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {previewData.filter(row => row.isValid).length} Valid
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {previewData.filter(row => !row.isValid).length} Invalid
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(previewData.filter(row => row.isValid).length / previewData.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Validation Errors</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Data Preview</h4>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {getStatusIcon(row.isValid)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={getStatusColor(row.isValid)}>
                              {row.firstName} {row.lastName}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={getStatusColor(row.isValid)}>
                              {row.email}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              row.role === 'admin' ? 'bg-red-100 text-red-800' :
                              row.role === 'sub_admin' ? 'bg-purple-100 text-purple-800' :
                              row.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {row.role?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={getStatusColor(row.isValid)}>
                              {row.department || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50">
                      ... and {previewData.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Upload</h3>
              <p className="text-gray-600">Please wait while we process your data...</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600 mb-4">
                {previewData.filter(row => row.isValid).length} users have been successfully uploaded.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Failed</h3>
              <p className="text-gray-600 mb-4">There was an error processing your upload.</p>
              <button
                onClick={() => setUploadStatus('idle')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Actions */}
          {file && uploadStatus === 'idle' && (
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isLoading || previewData.filter(row => row.isValid).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isLoading ? 'Uploading...' : `Upload ${previewData.filter(row => row.isValid).length} Users`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
