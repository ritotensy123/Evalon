import React, { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Send,
  AlertCircle,
} from 'lucide-react';
import { userManagementAPI } from '../../services/api';

const InvitationsList = ({ organizationId }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvitations = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const response = await userManagementAPI.getInvitations(organizationId);
      if (response.success) {
        setInvitations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [organizationId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'sub_admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const copyInvitationLink = (invitation) => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await userManagementAPI.resendInvitation(invitationId);
      fetchInvitations(); // Refresh the list
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      alert(`Failed to resend invitation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await userManagementAPI.cancelInvitation(invitationId);
        fetchInvitations(); // Refresh the list
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
        alert(`Failed to cancel invitation: ${error.message || 'Unknown error'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading invitations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchInvitations}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invitations ({invitations.length})</h3>
          <p className="text-sm text-gray-600">Manage sent invitations</p>
        </div>
        <button 
          onClick={fetchInvitations}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {invitations.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                          {invitation.metadata?.firstName && invitation.metadata?.lastName && (
                            <p className="text-xs text-gray-600">
                              {invitation.metadata.firstName} {invitation.metadata.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                        {formatText(invitation.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <span className="text-sm text-gray-900 capitalize">{invitation.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(invitation.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(invitation.expiresAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => copyInvitationLink(invitation)}
                              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleResendInvitation(invitation._id)}
                              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                              title="Resend"
                            >
                              <Send className="w-4 h-4 text-gray-400" />
                            </button>
                          </>
                        )}
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleCancelInvitation(invitation._id)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="Cancel"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No invitations sent yet</p>
            <p className="text-sm">Send your first invitation to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationsList;
