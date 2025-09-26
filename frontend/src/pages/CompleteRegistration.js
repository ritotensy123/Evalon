import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
  User,
} from 'lucide-react';
import { userManagementAPI } from '../services/api';

const CompleteRegistration = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    organizationCode: '',
  });
  
  const [registrationData, setRegistrationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Get details, 2: Complete registration

  useEffect(() => {
    if (token) {
      fetchRegistrationDetails();
    }
  }, [token]);

  const fetchRegistrationDetails = async () => {
    try {
      setLoading(true);
      const response = await userManagementAPI.getRegistrationDetails(token);
      
      if (response.success) {
        setRegistrationData(response.data);
        setStep(2);
      } else {
        setErrors({ general: 'Invalid or expired registration link' });
      }
    } catch (error) {
      console.error('Failed to fetch registration details:', error);
      setErrors({ general: 'Failed to load registration details. The link may be invalid or expired.' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.organizationCode) {
      newErrors.organizationCode = 'Organization code is required';
    } else if (formData.organizationCode.toUpperCase() !== registrationData?.organizationCode) {
      newErrors.organizationCode = 'Invalid organization code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await userManagementAPI.completeRegistration(token, {
        password: formData.password,
        organizationCode: formData.organizationCode,
      });

      if (response.success) {
        // Store the auth token
        localStorage.setItem('authToken', response.data.token);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setErrors({ general: response.message || 'Failed to complete registration' });
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      setErrors({ 
        general: error.message || 'Failed to complete registration. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, text: 'Weak', color: 'text-red-500' };
    if (score <= 3) return { score, text: 'Fair', color: 'text-yellow-500' };
    if (score <= 4) return { score, text: 'Good', color: 'text-blue-500' };
    return { score, text: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Registration Details</h2>
          <p className="text-gray-600">Please wait while we verify your registration link...</p>
        </div>
      </div>
    );
  }

  if (errors.general) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Error</h2>
            <p className="text-gray-600 mb-6">{errors.general}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Complete Your Registration</h2>
          <p className="mt-2 text-gray-600">
            Set up your password to access your account
          </p>
        </div>

        {registrationData && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* User Info */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Account Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{registrationData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{registrationData.organizationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 capitalize">
                    {registrationData.userType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Code *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.organizationCode}
                    onChange={(e) => handleInputChange('organizationCode', e.target.value.toUpperCase())}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.organizationCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter organization code"
                    maxLength={10}
                  />
                </div>
                {errors.organizationCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.organizationCode}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter the organization code provided in your invitation email
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Password strength:</span>
                      <span className={passwordStrength.color}>{passwordStrength.text}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-xs">Passwords match</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Security Notice</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Your password will be securely encrypted. Make sure to use a strong, unique password 
                    that you haven't used elsewhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteRegistration;