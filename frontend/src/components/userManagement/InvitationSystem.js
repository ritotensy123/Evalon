import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Plus,
  Trash2,
  User,
  Shield,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { userManagementAPI } from '../../services/api';

const InvitationSystem = ({ onClose, onSend, organizationId }) => {
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'sub_admin', label: 'Sub Administrator', description: 'Limited admin access' },
    { value: 'teacher', label: 'Teacher', description: 'Teaching and student management' },
    { value: 'student', label: 'Student', description: 'Student access only' },
  ];

  const departments = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
    'Administration',
    'Support',
  ];

  const addInvitation = () => {
    if (!email.trim()) return;

    const newInvitation = {
      id: Date.now(),
      email: email.trim(),
      role,
      department,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    };

    setInvitations(prev => [...prev, newInvitation]);
    setEmail('');
    setDepartment('');
  };

  const removeInvitation = (id) => {
    setInvitations(prev => prev.filter(inv => inv.id !== id));
  };

  const handleSendInvitations = async () => {
    if (invitations.length === 0) return;

    setIsLoading(true);
    
    try {
      // Send invitations via API
      const response = await userManagementAPI.bulkSendInvitations(organizationId, invitations);
      
      console.log('Invitations sent successfully:', response);
      
      onSend(invitations);
      onClose(); // Close the modal after successful send
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(`Failed to send invitations: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInvitationLink = (invitation) => {
    const link = `${window.location.origin}/invite/${invitation.id}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderEmailPreview = () => {
    const sampleInvitation = {
      email: 'john.doe@example.com',
      role,
      department,
      customMessage,
      expiryDays,
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Email Preview</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">To: {sampleInvitation.email}</p>
            <p className="text-sm text-gray-600 mb-2">Subject: Invitation to join Evalon Learning Platform</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-900 mb-3">
              Hello,
            </p>
            <p className="text-sm text-gray-900 mb-3">
              You have been invited to join our learning platform as a{' '}
              <span className="font-medium">{roles.find(r => r.value === sampleInvitation.role)?.label}</span>
              {sampleInvitation.department && (
                <span> in the {sampleInvitation.department} department</span>
              )}.
            </p>
            
            {sampleInvitation.customMessage && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Personal Message:</p>
                <p className="text-sm text-gray-900 italic">"{sampleInvitation.customMessage}"</p>
              </div>
            )}
            
            <p className="text-sm text-gray-900 mb-3">
              Click the link below to accept your invitation and set up your account:
            </p>
            
            <div className="bg-blue-100 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 font-mono">
                https://evalon.com/invite/abc123xyz
              </p>
            </div>
            
            <p className="text-sm text-gray-900 mb-3">
              This invitation will expire in {sampleInvitation.expiryDays} days.
            </p>
            
            <p className="text-sm text-gray-900">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Invitations</h2>
              <p className="text-sm text-gray-600">Invite users to join your organization</p>
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
          {/* Invitation Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Invitation Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {roles.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roles.find(r => r.value === role)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invitation Expiry (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add a personal message to the invitation..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Email Preview
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              
              {showPreview && renderEmailPreview()}
            </div>
          </div>

          {/* Add Invitations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Add Recipients
            </h3>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInvitation()}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={addInvitation}
                disabled={!email.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Invitations List */}
          {invitations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invitations ({invitations.length})
                </h3>
                <button
                  onClick={() => setInvitations([])}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {invitation.email}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                              {invitation.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">
                              {invitation.department || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(invitation.status)}
                              <span className="text-sm text-gray-900 capitalize">
                                {invitation.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyInvitationLink(invitation)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                title="Copy Link"
                              >
                                <Copy className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={() => removeInvitation(invitation.id)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              onClick={handleSendInvitations}
              disabled={isLoading || invitations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Sending...' : `Send ${invitations.length} Invitations`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationSystem;
