import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Users,
  UserCheck,
  Loader2,
  Edit3,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementAPI } from '../../services/api';

const BulkTeacherUpload = ({ onClose }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [department, setDepartment] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [currentStep, setCurrentStep] = useState('upload'); // upload, review, confirm
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [creationProgress, setCreationProgress] = useState(0);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [failedTeachers, setFailedTeachers] = useState([]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
    } else {
      setErrors(['Please select a valid CSV file']);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setErrors(['CSV file must contain at least a header row and one data row.']);
          return;
        }
        
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const requiredHeaders = ['firstName', 'lastName', 'email', 'phone'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
          setErrors([`CSV file is missing required columns: ${missingHeaders.join(', ')}`]);
          return;
        }
        
        const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
      const errors = [];
      
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || '';
          });
          
          // Enhanced validation
      if (!row.firstName?.trim()) errors.push('First name is required');
      if (!row.lastName?.trim()) errors.push('Last name is required');
      if (!row.email?.trim()) errors.push('Email is required');
      if (!row.phone?.trim()) errors.push('Phone is required');
      
      // Email format validation
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email format');
      }
      
          // Phone format validation (basic)
      if (row.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(row.phone.replace(/\s/g, ''))) {
        errors.push('Invalid phone format');
      }
      
      return {
            id: index + 1,
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            email: row.email || '',
            phone: row.phone || '',
            department: department,
            isValid: errors.length === 0,
            errors: errors
      };
    });
    
        setTeachers(data);
        setCurrentStep('review');
        setErrors([]);
      } catch (error) {
        console.error('CSV parsing error:', error);
        setErrors(['Failed to parse CSV file. Please check the format and try again.']);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Parse the CSV file
      parseCSV(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setErrors(['Failed to process file. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'firstName,lastName,email,phone',
      'John,Smith,john.smith@example.com,+1234567890',
      'Jane,Doe,jane.doe@example.com,+1234567891'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teacher_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
  };

  const handleSaveTeacher = (updatedTeacher) => {
    setTeachers(teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (teacherId) => {
    setTeachers(teachers.filter(t => t.id !== teacherId));
  };

  const handleSelectTeacher = (teacherId) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map(t => t.id));
    }
  };

  const handleBulkEdit = () => {
    if (selectedTeachers.length === 0) return;
    setShowBulkEdit(true);
  };

  const handleBulkEditSave = (updates) => {
    setTeachers(teachers.map(teacher => 
      selectedTeachers.includes(teacher.id) 
        ? { ...teacher, ...updates }
        : teacher
    ));
    setSelectedTeachers([]);
    setShowBulkEdit(false);
  };

  const handleConfirmCreation = async () => {
    if (!user?.organizationId) {
      setErrors(['Organization ID not found. Please log in again.']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    setCreationProgress(0);
    
    try {
      // Prepare teacher data for API
      const validTeachers = teachers.filter(t => t.isValid);
      const teacherData = validTeachers.map(teacher => ({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        userType: 'teacher',
        department: department,
        sendEmailNotification: true
      }));

      console.log('Creating teachers with data:', teacherData);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCreationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call the bulk create API
      const response = await userManagementAPI.bulkCreateUsers(teacherData, user.organizationId);
      
      clearInterval(progressInterval);
      setCreationProgress(100);
      
      if (response.success) {
        const results = response.data.results || [];
        setUploadResults(results);
        
        // Track failed teachers for retry
        const failed = results.filter(result => !result.success);
        setFailedTeachers(failed);
        
        setSuccess(`Successfully created ${response.data.successCount || validTeachers.length} teachers!`);
        setCurrentStep('confirm');
      } else {
        setErrors([response.message || 'Failed to create teachers. Please try again.']);
      }
    } catch (error) {
      console.error('Error creating teachers:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create teachers. Please try again.';
      setErrors([errorMessage]);
    } finally {
      setIsProcessing(false);
      setCreationProgress(0);
    }
  };

  const downloadResults = () => {
    if (uploadResults.length === 0) return;
    
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Status', 'Message', 'Temporary Password'],
      ...uploadResults.map(result => [
        result.email,
        result.firstName || '',
        result.lastName || '',
        result.success ? 'Success' : 'Failed',
        result.message || '',
        result.tempPassword || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher_creation_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validTeachers = teachers.filter(t => t.isValid);
  const invalidTeachers = teachers.filter(t => !t.isValid);

        return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Upload Teachers</h2>
              <p className="text-sm text-gray-600">Upload a CSV file to create multiple teachers</p>
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
          {currentStep === 'upload' && (
            <>
              {/* Department Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="english">English</option>
                  <option value="history">History</option>
                  <option value="economics">Economics</option>
                  <option value="other">Other</option>
                </select>
                {department && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        All teachers will be assigned to: <span className="capitalize">{department.replace('-', ' ')}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Upload Instructions</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Download the CSV template below</li>
                  <li>• Fill in teacher details (firstName, lastName, email, phone)</li>
                  <li>• All teachers will be assigned to the selected department</li>
                  <li>• Upload the completed CSV file</li>
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
            </>
          )}

          {currentStep === 'review' && (
            <>
              {/* Review Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">CSV Processed Successfully</h3>
                    <p className="text-sm text-blue-800">
                      Found {teachers.length} teachers. Review details before creating accounts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedTeachers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedTeachers.length} teacher{selectedTeachers.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkEdit}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Bulk Edit
                      </button>
                      <button
                        onClick={() => setSelectedTeachers([])}
                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Teachers Table */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedTeachers.length === teachers.length && teachers.length > 0}
                            onChange={handleSelectAllTeachers}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTeachers.includes(teacher.id)}
                              onChange={() => handleSelectTeacher(teacher.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{teacher.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{teacher.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            {teacher.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3" />
                                Valid
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3" />
                                  Invalid
                                </span>
                                {teacher.errors && teacher.errors.length > 0 && (
                                  <div className="text-xs text-red-600">
                                    {teacher.errors.slice(0, 2).join(', ')}
                                    {teacher.errors.length > 2 && ` +${teacher.errors.length - 2} more`}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditTeacher(teacher)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{validTeachers.length}</div>
                      <div className="text-sm text-gray-600">Valid Teachers</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{invalidTeachers.length}</div>
                      <div className="text-sm text-gray-600">Invalid Teachers</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{teachers.length}</div>
                      <div className="text-sm text-gray-600">Total Teachers</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 'confirm' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Teachers Created Successfully!</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {validTeachers.length} teachers have been created and assigned to the <span className="font-semibold text-gray-900 capitalize">{department.replace('-', ' ')}</span> department.
              </p>
              
              {/* Upload Results Summary */}
              {uploadResults.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                  <h4 className="font-semibold text-blue-900 mb-4">Creation Summary</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{result.email}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.success ? 'Created' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg mx-auto mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Email Notifications Sent</h4>
                </div>
                <p className="text-sm text-green-800">
                  All successfully created teachers have received email notifications with their login credentials and setup instructions.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                {uploadResults.length > 0 && (
                  <button
              onClick={downloadResults}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Results CSV
                  </button>
                )}
                
                {failedTeachers.length > 0 && (
                  <button
                    onClick={() => {
                      // Go back to review step with failed teachers highlighted
                      setCurrentStep('review');
                      // You could add logic here to highlight failed teachers
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Retry Failed ({failedTeachers.length})
                  </button>
                )}
              </div>
            </div>
          )}

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

          {/* Success Message */}
        {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Success!</h4>
                  <p className="text-sm text-green-800 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">File Ready</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    {file.name} is ready for upload. Click "Process File" to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {currentStep === 'review' && (
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {currentStep === 'upload' && (
                <button
                  onClick={handleUpload}
                  disabled={!file || !department || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Process File
                    </>
                  )}
                </button>
              )}
              {currentStep === 'review' && (
                <div className="space-y-3">
                  {isProcessing && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${creationProgress}%` }}
                      ></div>
                    </div>
                  )}
                  <button
                    onClick={handleConfirmCreation}
                    disabled={validTeachers.length === 0 || isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating... {creationProgress}%
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Create {validTeachers.length} Teachers
                      </>
                    )}
                  </button>
                </div>
              )}
              {currentStep === 'confirm' && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Edit Teachers</h3>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Update {selectedTeachers.length} selected teachers. Leave fields empty to keep existing values.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkEditSave({ department: e.target.value });
                    }
                  }}
                >
                  <option value="">Keep existing</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="english">English</option>
                  <option value="history">History</option>
                  <option value="economics">Economics</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Teacher</h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editingTeacher.firstName}
                  onChange={(e) => setEditingTeacher({...editingTeacher, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editingTeacher.lastName}
                  onChange={(e) => setEditingTeacher({...editingTeacher, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingTeacher(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updatedTeacher = {
                    ...editingTeacher,
                    isValid: !!(editingTeacher.firstName && editingTeacher.lastName && editingTeacher.email && editingTeacher.phone)
                  };
                  handleSaveTeacher(updatedTeacher);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkTeacherUpload;