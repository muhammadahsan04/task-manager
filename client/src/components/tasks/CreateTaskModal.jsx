import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';
import { 
  X, 
  CheckSquare, 
  FileText, 
  User, 
  Calendar,
  Flag
} from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, onSubmit, teamId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  const fetchTeamMembers = useCallback(async (currentTeamId) => {
    try {
      const response = await api.get(`/teams/${currentTeamId}`);
      setTeamMembers(response.data.team.members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, []);

  // Fetch team members when modal opens or teamId changes
  useEffect(() => {
    if (isOpen && teamId) {
      setTeamMembers([]); // Clear old members first
      fetchTeamMembers(teamId);
    }
  }, [isOpen, teamId, fetchTeamMembers]);

  // Clear team members when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTeamMembers([]);
    }
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Task title must be at least 2 characters long';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
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
      const taskData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      };
      
      await onSubmit(taskData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
      });
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
              <CheckSquare className="h-5 w-5 text-accent-primary" />
            </div>
            <h3 className="text-lg font-medium text-theme-primary">Create New Task</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-theme-tertiary hover:text-theme-secondary disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-theme-primary mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter task title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
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
                placeholder="Enter task description (optional)"
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
                {formData.description.length}/1000
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-theme-primary mb-1">
                Priority
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Flag className="h-4 w-4 text-theme-tertiary" />
                </div>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input-field pl-10"
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-theme-primary mb-1">
                Assign To
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <User className="h-4 w-4 text-theme-tertiary" />
                </div>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="input-field pl-10"
                  disabled={isSubmitting}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-theme-primary mb-1">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Calendar className="h-4 w-4 text-theme-tertiary" />
              </div>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`input-field pl-10 ${errors.due_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
            )}
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
