import { useState, useCallback, useEffect } from 'react';
import { X, Users, FileText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import { updateTeam, refreshTeams } from '../../store/slices/teamsSlice';

const EditTeamModal = ({ isOpen, teamId, onClose }) => {
  const dispatch = useDispatch();
  const teams = useSelector((s) => s.teams.teams);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load team data when modal opens
  useEffect(() => {
    if (isOpen && teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
        });
      } else {
        // If team not in store, fetch it
        setIsLoading(true);
        api.get(`/teams/${teamId}`)
          .then(res => {
            const teamData = res.data.team;
            setFormData({
              name: teamData.name || '',
              description: teamData.description || '',
            });
          })
          .catch(err => {
            console.error('Error loading team:', err);
            setErrors({ general: 'Failed to load team data' });
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, teamId, teams]);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters long';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await dispatch(updateTeam({
        teamId,
        updates: {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }
      })).unwrap();
      
      // Refresh teams to ensure cache is updated
      dispatch(refreshTeams());
      
      // Reset form and close
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
      setErrors({ general: error || 'Failed to update team' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative mx-auto p-6 border border-theme-primary w-full max-w-md shadow-theme-lg rounded-lg bg-theme-primary transform transition-all duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-accent-primary" />
            </div>
            <h3 className="text-lg font-medium text-theme-primary">Edit Team</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="text-theme-tertiary hover:text-theme-secondary disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-theme-primary mb-1">
                Team Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter team name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-theme-primary mb-1">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-theme-tertiary" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={`input-field pl-10 resize-none ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter team description (optional)"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-600">{errors.description}</p>
                ) : (
                  <div></div>
                )}
                <p className="text-xs text-theme-tertiary">
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-theme-primary bg-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Update Team
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTeamModal;

