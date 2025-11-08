import { useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { refreshTeams } from '../../store/slices/teamsSlice';

const AcceptInvite = () => {
  const dispatch = useDispatch();
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!token || token.trim().length < 10) {
      setError('Please paste a valid invitation token');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post('/teams/invitations/accept', { token: token.trim() });
      // Refresh teams cache since accepting invite adds user to a team
      dispatch(refreshTeams());
      setMessage('Invitation accepted! You have been added to the team.');
      setToken('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
        <h1 className="text-2xl font-bold text-theme-primary mb-2">Accept Team Invitation</h1>
        <p className="text-theme-secondary mb-4">Paste the invitation token you received to join the team.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-theme-primary mb-1">
              Invitation Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`input-field ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Paste token here"
              disabled={isSubmitting}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-1 text-sm text-green-600">{message}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Accepting...' : 'Accept Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;








