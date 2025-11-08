import { useEffect, useState, useCallback } from 'react';
import api from '../../config/api';
import { X, UserPlus, Mail } from 'lucide-react';

const InviteMemberModal = ({ isOpen, teamId, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchInvites = useCallback(async () => {
    try {
      setLoadingInvites(true);
      const res = await api.get(`/teams/${teamId}/invitations`);
      setPendingInvites(res.data.invitations || []);
    } catch (e) {
      console.error('Failed to load invitations', e);
    } finally {
      setLoadingInvites(false);
    }
  }, [teamId]);


  useEffect(() => {
    if (isOpen && teamId && pendingInvites.length === 0) {
      fetchInvites();
    }
  }, [isOpen, teamId, fetchInvites, pendingInvites.length]);


  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/teams/${teamId}/invitations`, { email });
      setEmail('');
      await fetchInvites();
    } catch (e) {
      console.error('Invite error', e);
      setError(e.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    try {
      await api.post(`/teams/${teamId}/invitations/${invitationId}/revoke`);
      await fetchInvites();
    } catch (e) {
      console.error('Revoke invite error', e);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-16">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-xl rounded-lg bg-theme-primary transform transition-all duration-200 ease-out">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center mr-3">
              <UserPlus className="h-5 w-5 text-accent-primary" />
            </div>
            <h3 className="text-lg font-medium text-theme-primary">Invite Team Member</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-theme-tertiary hover:text-theme-secondary disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-theme-primary mb-1">
              Member Email
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Mail className="h-4 w-4 text-theme-tertiary" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field pl-10 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="name@example.com"
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-theme-primary bg-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-theme-primary">Pending Invites</h4>
            <button
              onClick={fetchInvites}
              className="text-xs text-accent-primary hover:text-accent-primary"
              disabled={loadingInvites}
            >
              {loadingInvites ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {pendingInvites.length === 0 ? (
            <p className="text-sm text-theme-tertiary">No pending invitations</p>
          ) : (
            <ul className="divide-y divide-theme-primary border border-theme-primary rounded-md">
              {pendingInvites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm text-theme-primary">{inv.email}</p>
                    <p className="text-xs text-theme-tertiary">Status: {inv.status}</p>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default InviteMemberModal;



