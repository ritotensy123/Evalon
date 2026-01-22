import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Save,
  LogOut,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationAPI } from '../../services/api';
import { API_SERVER } from '../../config/apiConfig';

const OrganizationProfile = () => {
  const { user, logout, organizationData, updateOrganizationData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null); // Stores base64 string when new logo is selected
  const [logoPreview, setLogoPreview] = useState(null);

  const [formData, setFormData] = useState({
    displayName: '',
    contactEmail: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });

  const [organizationInfo, setOrganizationInfo] = useState({
    code: '',
    adminEmail: '',
    organizationId: '',
    createdAt: '',
    logo: null
  });

  useEffect(() => {
    if (user?.userType !== 'organization_admin') {
      window.location.href = '/dashboard';
      return;
    }
    console.log('🔍 [LOGO DEBUG] Profile page - organizationData from context:', organizationData?.logo ? 'EXISTS' : 'MISSING', organizationData?.logo?.substring(0, 50) || 'N/A');
    fetchOrganizationData();
  }, [user, organizationData]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const organizationId = user?.organizationId || user?.organization?._id || organizationData?.id;
      
      if (!organizationId) {
        setError('Organization ID not found');
        setLoading(false);
        return;
      }

      // Fetch organization details
      // Using organizationData from context if available, otherwise fetch from API
      if (organizationData) {
        setOrganizationInfo({
          code: organizationData.code || organizationData.orgCode || '',
          adminEmail: user?.email || user?.profile?.email || '',
          organizationId: organizationId,
          createdAt: organizationData.createdAt || organizationData.created_at || '',
          logo: organizationData.logo || organizationData.logoUrl || null
        });

        setFormData({
          displayName: organizationData.name || organizationData.displayName || '',
          contactEmail: organizationData.email || organizationData.contactEmail || '',
          phone: organizationData.phone || organizationData.phoneNumber || '',
          address: {
            street: organizationData.address?.street || organizationData.address?.addressLine1 || '',
            city: organizationData.address?.city || '',
            state: organizationData.address?.state || '',
            country: organizationData.address?.country || '',
            postalCode: organizationData.address?.postalCode || organizationData.address?.zipCode || ''
          }
        });

        // Use base64 logo directly from organizationData (single source of truth)
        console.log('🔍 [LOGO DEBUG] Setting logo preview from organizationData:', organizationData.logo ? 'EXISTS' : 'MISSING', organizationData.logo?.substring(0, 50) || 'N/A');
        if (organizationData.logo) {
          // Check if it's already a base64 string
          if (organizationData.logo.startsWith('data:image/')) {
            setLogoPreview(organizationData.logo);
            console.log('🔍 [LOGO DEBUG] Logo preview set (base64)');
          } else if (organizationData.logo.startsWith('http')) {
            // Legacy: URL-based logo
            setLogoPreview(organizationData.logo);
            console.log('🔍 [LOGO DEBUG] Logo preview set (URL)');
          } else {
            // Legacy: relative path, prepend API base URL
            setLogoPreview(`${API_SERVER}/${organizationData.logo.replace(/^\//, '')}`);
            console.log('🔍 [LOGO DEBUG] Logo preview set (relative path)');
          }
        } else {
          setLogoPreview(null);
          console.log('🔍 [LOGO DEBUG] No logo found, preview set to null');
        }
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setSuccess(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PNG, JPG, or GIF file');
        return;
      }
      
      // Extract base64 string directly
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result; // This is "data:image/...;base64,XXXX"
        
        // Validate base64 string
        if (!base64String || !base64String.startsWith('data:image/')) {
          setError('Invalid image file');
          return;
        }
        
        // Set preview
        setLogoPreview(base64String);
        
        // Store base64 string (not file object)
        setLogoFile(base64String);
        setSuccess(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
      };
      
      // Read file as data URL (base64)
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const organizationId = user?.organizationId || user?.organization?._id || organizationData?.id;
      
      // Update organization data
      const updateData = {
        name: formData.displayName,
        email: formData.contactEmail,
        phone: formData.phone,
        address: formData.address
      };

      // Add base64 logo if changed
      if (logoFile && typeof logoFile === 'string' && logoFile.startsWith('data:image/')) {
        // logoFile is already a base64 string
        updateData.logo = logoFile;
      } else if (organizationInfo.logo) {
        // Keep existing logo if no new one uploaded
        updateData.logo = organizationInfo.logo;
      }

      // Call organization update API
      const response = await organizationAPI.updateOrganization(organizationId, updateData);
      
      console.log('🔍 [LOGO DEBUG] Profile update response:', response);
      console.log('🔍 [LOGO DEBUG] Response data:', response.data);
      console.log('🔍 [LOGO DEBUG] Logo in response:', response.data?.logo ? 'EXISTS' : 'MISSING', response.data?.logo?.substring(0, 50) || 'N/A');
      
      if (response.success) {
        setSuccess(true);
        setIsEditing(false);
        setLogoFile(null);
        
        // Update organizationData in context immediately (no page refresh needed)
        if (response.data) {
          const updatedOrg = response.data;
          console.log('🔍 [LOGO DEBUG] Updated org logo:', updatedOrg.logo ? 'EXISTS' : 'MISSING', updatedOrg.logo?.substring(0, 50) || 'N/A');
          
          // Merge updated organization data - use full object from response
          // DO NOT reconstruct - use the full updatedOrg object as source of truth
          const mergedOrgData = {
            ...organizationData, // Preserve existing fields
            ...updatedOrg // Overwrite with all fields from response (includes logo)
          };
          console.log('🔍 [LOGO DEBUG] Merged org data logo:', mergedOrgData.logo ? 'EXISTS' : 'MISSING');
          console.log('🔍 [LOGO DEBUG] Merged org data keys:', Object.keys(mergedOrgData));
          updateOrganizationData(mergedOrgData);
          
          // Also update logoPreview if logo was updated
          if (updatedOrg.logo) {
            if (updatedOrg.logo.startsWith('data:image/')) {
              setLogoPreview(updatedOrg.logo);
            } else if (updatedOrg.logo.startsWith('http')) {
              setLogoPreview(updatedOrg.logo);
            } else {
              setLogoPreview(`${API_SERVER}/${updatedOrg.logo.replace(/^\//, '')}`);
            }
          }
        }
        
        // Refresh local organization data to sync
        await fetchOrganizationData();
      } else {
        setError(response.message || 'Failed to update organization');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLogoFile(null);
    // Reset preview to original logo
    if (organizationInfo.logo) {
      if (organizationInfo.logo.startsWith('data:image/')) {
        setLogoPreview(organizationInfo.logo);
      } else if (organizationInfo.logo.startsWith('http')) {
        setLogoPreview(organizationInfo.logo);
      } else {
        setLogoPreview(`${API_SERVER}/${organizationInfo.logo.replace(/^\//, '')}`);
      }
    } else {
      setLogoPreview(null);
    }
    fetchOrganizationData();
    setError(null);
    setSuccess(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const getInitials = () => {
    if (formData.displayName) {
      return formData.displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'OA';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Organization Profile</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">Profile updated successfully!</p>
          </div>
        )}

        {/* Profile Header - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Logo/Photo */}
            <div className="relative flex-shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Organization Logo"
                  className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white font-bold text-lg">{getInitials()}</span>
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-purple-700 transition-colors shadow-md">
                  <Upload className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Organization Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">
                {formData.displayName || 'Organization Name'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Code: {organizationInfo.code || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{organizationInfo.adminEmail || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Organization Details</h3>
          
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Organization Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter organization name"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="contact@organization.com"
              />
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

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Street Address"
                />
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="State/Province"
                />
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Postal Code"
                />
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  disabled={!isEditing}
                  className="w-full md:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            System Information (Not Editable)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Organization Code
              </label>
              <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {organizationInfo.code || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Admin Email (Login)
              </label>
              <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 truncate">
                {organizationInfo.adminEmail || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Organization ID
              </label>
              <div className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono truncate">
                {organizationInfo.organizationId || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Created Date
              </label>
              <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {organizationInfo.createdAt 
                  ? new Date(organizationInfo.createdAt).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.displayName || !formData.contactEmail}
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

        {/* Logout Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;

