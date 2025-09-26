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

const BulkStudentUpload = ({ onClose }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [department, setDepartment] = useState('');
  const [students, setStudents] = useState([]);
  const [currentStep, setCurrentStep] = useState('upload'); // upload, review, confirm
  const [editingStudent, setEditingStudent] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [creationProgress, setCreationProgress] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [failedStudents, setFailedStudents] = useState([]);

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
          setErrors(['CSV file must contain at least a header row and one data row']);
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['firstname', 'lastname', 'email', 'phone'];
        
        // Validate headers
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
          setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
          return;
        }

        // Parse data rows
        const parsedStudents = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length !== headers.length) continue;

          const student = {
            id: i,
            firstName: values[headers.indexOf('firstname')] || '',
            lastName: values[headers.indexOf('lastname')] || '',
            email: values[headers.indexOf('email')] || '',
            phone: values[headers.indexOf('phone')] || '',
            department: department,
            isValid: true,
            errors: []
          };

          // Validate required fields
          if (!student.firstName) student.errors.push('First name is required');
          if (!student.lastName) student.errors.push('Last name is required');
          if (!student.email) student.errors.push('Email is required');
          if (!student.phone) student.errors.push('Phone is required');

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (student.email && !emailRegex.test(student.email)) {
            student.errors.push('Invalid email format');
          }

          // Validate phone format (basic)
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (student.phone && !phoneRegex.test(student.phone.replace(/[\s\-\(\)]/g, ''))) {
            student.errors.push('Invalid phone format');
          }

          if (student.errors.length > 0) {
            student.isValid = false;
          }

          parsedStudents.push(student);
        }

        setStudents(parsedStudents);
        setCurrentStep('review');
      } catch (error) {
        setErrors(['Error parsing CSV file: ' + error.message]);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (!file) {
      setErrors(['Please select a CSV file']);
      return;
    }
    if (!department) {
      setErrors(['Please select a department']);
      return;
    }
    
    setIsProcessing(true);
    setErrors([]);
    
    // Simulate processing delay
    setTimeout(() => {
      parseCSV(file);
      setIsProcessing(false);
    }, 1000);
  };

  const downloadTemplate = () => {
    const csvContent = 'firstName,lastName,email,phone\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
  };

  const handleSaveStudent = (updatedStudent) => {
    setStudents(prev => prev.map(s => 
      s.id === updatedStudent.id ? { ...updatedStudent, isValid: updatedStudent.errors.length === 0 } : s
    ));
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleBulkEdit = () => {
    if (selectedStudents.length === 0) return;
    setShowBulkEdit(true);
  };

  const handleBulkEditSave = (newDepartment) => {
    setStudents(prev => prev.map(s => 
      selectedStudents.includes(s.id) ? { ...s, department: newDepartment } : s
    ));
    setSelectedStudents([]);
    setShowBulkEdit(false);
  };

  const handleConfirmCreation = async () => {
    if (!user?.organizationId) {
      setErrors(['Organization ID not found']);
      return;
    }

    const validStudents = students.filter(s => s.isValid);
    if (validStudents.length === 0) {
      setErrors(['No valid students to create']);
      return;
    }

    setIsProcessing(true);
    setCreationProgress(0);

    try {
      const studentData = validStudents.map(student => ({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        department: student.department,
        userType: 'student'
      }));

      const response = await userManagementAPI.bulkCreateUsers(
        studentData,
        user.organizationId
      );

      if (response.success) {
        setUploadResults(response.results || []);
        setSuccess(`Successfully created ${response.successCount} students`);
        setCurrentStep('confirm');
      } else {
        setErrors([response.message || 'Failed to create students']);
      }
    } catch (error) {
      console.error('Error creating students:', error);
      setErrors([error.message || 'Failed to create students']);
    } finally {
      setIsProcessing(false);
      setCreationProgress(100);
    }
  };

  const downloadResults = () => {
    if (!uploadResults.length) return;

    const csvContent = [
      'Email,Status,Message,Temporary Password',
      ...uploadResults.map(result => 
        `${result.email},${result.success ? 'Success' : 'Failed'},${result.message || ''},${result.temporaryPassword || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_creation_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validStudents = students.filter(s => s.isValid);
  const invalidStudents = students.filter(s => !s.isValid);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Student Upload</h2>
              <p className="text-sm text-gray-600">Import students via CSV file</p>
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
          {currentStep === 'upload' && (
            <>
              {/* Instructions */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Instructions</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">CSV Format Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Include columns: firstName, lastName, email, phone</li>
                        <li>All students will be assigned to the selected department</li>
                        <li>Email addresses must be unique and valid</li>
                        <li>Phone numbers should be in international format</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                </select>
                {department && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ All students will be assigned to: {department}
                  </p>
                )}
              </div>

              {/* Template Download */}
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="mb-4">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-red-600 text-sm mb-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!file || !department || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Process File'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {currentStep === 'review' && (
            <>
              {/* Review Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Review Students</h3>
                    <p className="text-sm text-gray-600">Review and edit student details before creation</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep('upload')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    ← Back to Upload
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Valid Students</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">{validStudents.length}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Invalid Students</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">{invalidStudents.length}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Total Students</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{students.length}</p>
                </div>
              </div>

              {/* Bulk Actions */}
              {students.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={handleBulkEdit}
                    disabled={selectedStudents.length === 0}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-blue-200"
                  >
                    Bulk Edit Department
                  </button>
                  <button
                    onClick={() => setSelectedStudents([])}
                    className="text-sm text-gray-600 hover:text-gray-700 underline"
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* Students Table */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onChange={handleSelectAllStudents}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className={!student.isValid ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.isValid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Invalid
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Errors */}
              {invalidStudents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <div className="space-y-2">
                    {invalidStudents.map((student) => (
                      <div key={student.id} className="text-sm text-red-600">
                        <strong>{student.firstName} {student.lastName}:</strong> {student.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleConfirmCreation}
                  disabled={validStudents.length === 0 || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Creating Students...' : `Create ${validStudents.length} Students`}
                </button>
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Upload
                </button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Creating students...</span>
                    <span>{creationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${creationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 'confirm' && (
            <>
              {/* Success Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Students Created Successfully!</h3>
                <p className="text-gray-600">
                  {uploadResults.filter(r => r.success).length} students have been created and will receive login credentials via email.
                </p>
              </div>

              {/* Results Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Creation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Processed:</span>
                    <span className="ml-2 font-medium">{uploadResults.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Successful:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {uploadResults.filter(r => r.success).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {uploadResults.filter(r => !r.success).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Results */}
              {uploadResults.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={downloadResults}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors border border-blue-200"
                  >
                    <Download className="w-4 h-4" />
                    Download Results CSV
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Student Modal */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
                <button
                  onClick={() => setEditingStudent(null)}
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
                    value={editingStudent.firstName}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      firstName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingStudent.lastName}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      lastName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      email: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={editingStudent.department}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      department: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </select>
                </div>

                {/* Validation errors */}
                {editingStudent.errors && editingStudent.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {editingStudent.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Re-validate the student
                      const updatedStudent = { ...editingStudent };
                      const errors = [];
                      
                      // Validate required fields
                      if (!updatedStudent.firstName) errors.push('First name is required');
                      if (!updatedStudent.lastName) errors.push('Last name is required');
                      if (!updatedStudent.email) errors.push('Email is required');
                      if (!updatedStudent.phone) errors.push('Phone is required');
                      
                      // Validate email format
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (updatedStudent.email && !emailRegex.test(updatedStudent.email)) {
                        errors.push('Invalid email format');
                      }
                      
                      // Validate phone format (basic)
                      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                      if (updatedStudent.phone && !phoneRegex.test(updatedStudent.phone.replace(/[\s\-\(\)]/g, ''))) {
                        errors.push('Invalid phone format');
                      }
                      
                      updatedStudent.errors = errors;
                      updatedStudent.isValid = errors.length === 0;
                      
                      handleSaveStudent(updatedStudent);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkStudentUpload;
