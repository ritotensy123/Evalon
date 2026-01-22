import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const TeacherProfile = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSuccess(false);
    setError(null);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return;
      }

      // Update profile
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setSuccess(true);
        setIsEditing(false);
        
        // Refresh user data
        try {
          if (refreshUser) {
            await refreshUser();
          }
        } catch (refreshError) {
          console.error('Error refreshing user:', refreshError);
          // Continue even if refresh fails
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('All password fields are required');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      const response = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (response.success) {
        setSuccess(true);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    // Reset form data
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
      });
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0)?.toUpperCase() || 'T';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Teacher Profile</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Profile updated successfully!</p>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white font-bold text-lg">{getInitials()}</span>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">
                  {formData.firstName && formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`
                    : 'Teacher'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{formData.email || 'N/A'}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{formData.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{formData.email || 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Change Password
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.firstName || !formData.lastName}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;

