import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { X, CheckSquare, FileText, User, Calendar, Flag } from 'lucide-react';
import { refreshTeams } from '../../store/slices/teamsSlice';

const EditTaskModal = ({ isOpen, taskId, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const loadTeamMembers = useCallback(async (tid) => {
    try {
      const res = await api.get(`/teams/${tid}`);
      setTeamMembers(res.data.team.members || []);
    } catch (e) {
      console.error('Load members error', e);
    }
  }, []);

  const loadTask = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      const t = res.data.task;
      setTeamId(t.team_id);
      setFormData({
        title: t.title || '',
        description: t.description || '',
        status: t.status || 'pending',
        priority: t.priority || 'medium',
        assigned_to: t.assigned_to || '',
        due_date: t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : '',
      });
      await loadTeamMembers(t.team_id);
    } catch (e) {
      console.error('Load task error', e);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, loadTeamMembers]);

  // Load task data when modal opens
  useEffect(() => {
    if (isOpen && taskId) {
      loadTask();
    }
  }, [isOpen, taskId, loadTask]);

  // Clear form and team members when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTeamMembers([]);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
      });
      setTeamId(null);
    }
  }, [isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (formData.due_date) {
      const due = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) newErrors.due_date = 'Due date cannot be in the past';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const response = await api.put(`/tasks/${taskId}`, {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      });
      // Refresh teams cache since task update might affect team data
      dispatch(refreshTeams());
      onClose({ updated: true, task: response.data.task });
    } catch (e) {
      console.error('Update task error', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-theme-md rounded-lg bg-theme-primary border-theme-primary transform transition-all duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center mr-3">
              <CheckSquare className="h-5 w-5 text-accent-primary" />
            </div>
            <h3 className="text-lg font-medium text-theme-primary">Edit Task</h3>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} className="text-theme-tertiary hover:text-theme-secondary disabled:opacity-50">
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
            <div className="py-8 text-center">
            	<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary mx-auto"></div>
            </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-theme-primary mb-1">Task Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter task title"
                disabled={isSubmitting}
              />
              {errors.title && (<p className="mt-1 text-sm text-red-600">{errors.title}</p>)}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-theme-primary mb-1">Description</label>
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
                  className="input-field pl-10 resize-none"
                  placeholder="Enter task description (optional)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-theme-primary mb-1">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className="input-field" disabled={isSubmitting}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-theme-primary mb-1">Priority</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Flag className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="input-field pl-10" disabled={isSubmitting}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-theme-primary mb-1">Assign To</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <User className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <select id="assigned_to" name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange} className="input-field pl-10" disabled={isSubmitting}>
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-theme-primary mb-1">Due Date</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Calendar className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.due_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.due_date && (<p className="mt-1 text-sm text-red-600">{errors.due_date}</p>)}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-theme-primary bg-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTaskModal;


