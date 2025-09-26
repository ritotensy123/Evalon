import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';

const UserDetailsModal = ({ user, onClose, onEdit, onDelete, onToggleStatus }) => {
  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
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

  const getUserInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 text-white text-lg font-bold rounded-lg flex items-center justify-center">
              {getUserInitials(user.firstName, user.lastName, user.email)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
              </h2>
              <p className="text-sm text-gray-600">User Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => onEdit(user._id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit User"
            >
              <Edit className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Status Toggle and Delete Buttons - Only for non-admin users */}
            {user.userType !== 'organization_admin' && (
              <>
                {/* Status Toggle Button */}
                {user.status === 'active' ? (
                  <button
                    onClick={() => onToggleStatus && onToggleStatus(user._id, 'suspend')}
                    className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Suspend User"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleStatus && onToggleStatus(user._id, 'activate')}
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                    title="Activate User"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </button>
                )}
                
                {/* Separator */}
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                {/* Delete Button */}
                <button
                  onClick={() => onDelete(user._id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete User Permanently"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                <p className="text-sm text-gray-900">{user.firstName || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                <p className="text-sm text-gray-900">{user.lastName || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                  {user.phoneVerified && (
                    <CheckCircle className="w-4 h-4 text-green-500" title="Phone verified" />
                  )}
                </div>
              </div>
              {user.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-sm text-gray-900">{user.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Role and Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role & Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.userType)}`}>
                  {formatText(user.userType)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.department || 'Not assigned'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(user.status)}
                  <span className="text-sm text-gray-900 capitalize">{user.status}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Verified</label>
                <div className="flex items-center gap-2">
                  {user.isEmailVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-900">
                    {user.isEmailVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Login</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(user.dateOfBirth || user.emergencyContact || user.notes) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.dateOfBirth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                    <p className="text-sm text-gray-900">{formatDate(user.dateOfBirth)}</p>
                  </div>
                )}
                {user.emergencyContact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
                    <p className="text-sm text-gray-900">{user.emergencyContact}</p>
                  </div>
                )}
              </div>
              
              {user.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{user.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Teacher/Student Specific Information */}
          {(user.userType === 'teacher' || user.userType === 'student') && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.userType === 'teacher' ? 'Teacher Information' : 'Student Information'}
              </h3>
              
              {user.userType === 'teacher' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.subjects && user.subjects.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Subjects</label>
                      <div className="flex flex-wrap gap-2">
                        {user.subjects.map((subject, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.qualification && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Qualification</label>
                      <p className="text-sm text-gray-900">{user.qualification}</p>
                    </div>
                  )}
                  {user.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Specialization</label>
                      <p className="text-sm text-gray-900">{user.specialization}</p>
                    </div>
                  )}
                  {user.experienceLevel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Experience Level</label>
                      <p className="text-sm text-gray-900">{formatText(user.experienceLevel)}</p>
                    </div>
                  )}
                  {user.yearsOfExperience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Years of Experience</label>
                      <p className="text-sm text-gray-900">{user.yearsOfExperience}</p>
                    </div>
                  )}
                </div>
              )}

              {user.userType === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.studentCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Student Code</label>
                      <p className="text-sm text-gray-900">{user.studentCode}</p>
                    </div>
                  )}
                  {user.academicYear && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Academic Year</label>
                      <p className="text-sm text-gray-900">{user.academicYear}</p>
                    </div>
                  )}
                  {user.grade && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Grade</label>
                      <p className="text-sm text-gray-900">{user.grade}</p>
                    </div>
                  )}
                  {user.section && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Section</label>
                      <p className="text-sm text-gray-900">{user.section}</p>
                    </div>
                  )}
                  {user.rollNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Roll Number</label>
                      <p className="text-sm text-gray-900">{user.rollNumber}</p>
                    </div>
                  )}
                  {user.parentName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Parent/Guardian Name</label>
                      <p className="text-sm text-gray-900">{user.parentName}</p>
                    </div>
                  )}
                  {user.parentPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Parent/Guardian Phone</label>
                      <p className="text-sm text-gray-900">{user.parentPhone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
