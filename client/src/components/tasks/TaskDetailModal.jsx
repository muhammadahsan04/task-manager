// import { useState, useEffect } from 'react';
// import { X, Calendar, User, Flag, Clock, MessageSquare, Activity, Edit, Trash2, Send, Tag, CheckSquare, Plus, Users } from 'lucide-react';
// import AddTimeEntryModal from '../time/AddTimeEntryModal'
// import api from '../../config/api';
// import { useSelector } from 'react-redux';

// const TaskDetailModal = ({ isOpen, taskId, onClose, onTaskUpdated, onTaskDeleted }) => {
//   const user = useSelector((s) => s.auth.user);
//   const [activeTab, setActiveTab] = useState('details');
//   const [task, setTask] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [activity, setActivity] = useState([]);
//   const [attachments, setAttachments] = useState([]);
//   const [timeEntries, setTimeEntries] = useState([]);
//   const [isTimerRunning, setIsTimerRunning] = useState(false);
//   const [timerStartedAt, setTimerStartedAt] = useState(null);
//   const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const [newComment, setNewComment] = useState('');
//   const [newCommentFile, setNewCommentFile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [submittingComment, setSubmittingComment] = useState(false);
//   const [editingCommentId, setEditingCommentId] = useState(null);
//   const [editCommentText, setEditCommentText] = useState('');
//   // Labels state
//   const [teamLabels, setTeamLabels] = useState([]);
//   const [selectedLabelIds, setSelectedLabelIds] = useState([]);
//   const [subtasks, setSubtasks] = useState([]);
//   const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
//   const [editingSubtaskId, setEditingSubtaskId] = useState(null);
//   const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

//   useEffect(() => {
//     if (isOpen && taskId) {
//       fetchTaskDetails();
//       fetchAttachments();
//       if (activeTab === 'comments') {
//         fetchComments();
//       } else if (activeTab === 'activity') {
//         fetchActivity();
//       }
//     }
//   }, [isOpen, taskId, activeTab]);

//   const fetchTaskDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get(`/tasks/${taskId}`);
//       setTask(response.data.task);
//       const taskLabelIds = (response.data.task?.labels || []).filter(Boolean).map(l => l.id);
//       setSelectedLabelIds(taskLabelIds);
//     } catch (error) {
//       console.error('Error fetching task:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTeamLabels = async () => {
//     try {
//       if (!task?.team_id) return;
//       const res = await api.get(`/labels/team/${task.team_id}`);
//       setTeamLabels(res.data.labels || []);
//     } catch (e) {
//       console.error('Failed to load labels', e);
//     }
//   };

//   const fetchComments = async () => {
//     try {
//       const response = await api.get(`/comments/task/${taskId}`);
//       setComments(response.data.comments);
//     } catch (error) {
//       console.error('Error fetching comments:', error);
//     }
//   };

//   const fetchActivity = async () => {
//     try {
//       const response = await api.get(`/comments/task/${taskId}/activity`);
//       setActivity(response.data.activity);
//     } catch (error) {
//       console.error('Error fetching activity:', error);
//     }
//   };

//   const fetchSubtasks = async () => {
//     try {
//       const res = await api.get(`/subtasks/task/${taskId}`)
//       setSubtasks(Array.isArray(res.data?.subtasks) ? res.data.subtasks : [])
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Failed to load subtasks', e)
//     }
//   }

//   const addSubtask = async (e) => {
//     e?.preventDefault?.()
//     if (!newSubtaskTitle.trim()) return
//     try {
//       const res = await api.post(`/subtasks/task/${taskId}`, { title: newSubtaskTitle.trim() })
//       setSubtasks((prev) => [...prev, res.data.subtask])
//       setNewSubtaskTitle('')
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Add subtask failed', e)
//       alert('Failed to add subtask')
//     }
//   }

//   const toggleSubtask = async (id) => {
//     try {
//       const res = await api.patch(`/subtasks/${id}/toggle`)
//       setSubtasks((prev) => prev.map((s) => (s.id === id ? res.data.subtask : s)))
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Toggle subtask failed', e)
//       alert('Failed to update subtask')
//     }
//   }

//   const deleteSubtask = async (id) => {
//     if (!window.confirm('Delete this subtask?')) return
//     try {
//       await api.delete(`/subtasks/${id}`)
//       setSubtasks((prev) => prev.filter((s) => s.id !== id))
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Delete subtask failed', e)
//       alert('Failed to delete subtask')
//     }
//   }

//   const beginEditSubtask = (s) => {
//     setEditingSubtaskId(s.id)
//     setEditingSubtaskTitle(s.title)
//   }

//   const cancelEditSubtask = () => {
//     setEditingSubtaskId(null)
//     setEditingSubtaskTitle('')
//   }

//   const saveEditSubtask = async (e) => {
//     e?.preventDefault?.()
//     if (!editingSubtaskId) return
//     const title = editingSubtaskTitle.trim()
//     if (!title) return
//     try {
//       const res = await api.put(`/subtasks/${editingSubtaskId}`, { title })
//       setSubtasks((prev) => prev.map((s) => (s.id === editingSubtaskId ? res.data.subtask : s)))
//       setEditingSubtaskId(null)
//       setEditingSubtaskTitle('')
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Edit subtask failed', e)
//       alert('Failed to update subtask')
//     }
//   }

//   const completedCount = subtasks.filter((s) => s.is_completed).length
//   const totalSubtasks = subtasks.length

//   const fetchTimeEntries = async () => {
//     try {
//       const res = await api.get(`/time-entries/task/${taskId}`)
//       setTimeEntries(Array.isArray(res.data?.entries) ? res.data.entries : [])
//       // If API returns an active timer
//       if (res.data?.active?.started_at) {
//         setIsTimerRunning(true)
//         setTimerStartedAt(res.data.active.started_at)
//       } else {
//         setIsTimerRunning(false)
//         setTimerStartedAt(null)
//       }
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Failed to load time entries', e)
//     }
//   }

//   const startTimer = async () => {
//     try {
//       await api.post(`/time-entries/start`, { task_id: taskId })
//       setIsTimerRunning(true)
//       setTimerStartedAt(new Date().toISOString())
//       fetchTimeEntries()
//       fetchActivity()
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Start timer failed', e)
//       alert('Failed to start timer')
//     }
//   }

//   const stopTimer = async () => {
//     try {
//       await api.post(`/time-entries/stop`, { task_id: taskId })
//       setIsTimerRunning(false)
//       setTimerStartedAt(null)
//       fetchTimeEntries()
//       fetchActivity()
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error('Stop timer failed', e)
//       alert('Failed to stop timer')
//     }
//   }

//   useEffect(() => {
//     if (task?.team_id) {
//       fetchTeamLabels();
//     }
//   }, [task?.team_id]);

//   const toggleLabel = (labelId) => {
//     setSelectedLabelIds((prev) =>
//       prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
//     );
//   };

//   const saveLabels = async () => {
//     try {
//       const currentIds = (task?.labels || []).filter(Boolean).map(l => l.id);
//       const toAdd = selectedLabelIds.filter(id => !currentIds.includes(id));
//       const toRemove = currentIds.filter(id => !selectedLabelIds.includes(id));

//       if (toAdd.length > 0) {
//         await api.post(`/labels/tasks/${taskId}/assign`, { labelIds: toAdd });
//       }
//       for (const id of toRemove) {
//         // eslint-disable-next-line no-await-in-loop
//         await api.delete(`/labels/tasks/${taskId}/${id}`);
//       }

//       // Refresh task details to reflect new labels
//       const refreshed = await api.get(`/tasks/${taskId}`);
//       setTask(refreshed.data.task);
//       if (onTaskUpdated) onTaskUpdated(refreshed.data.task);
//       await fetchActivity();
//     } catch (e) {
//       console.error('Saving labels failed', e);
//       alert('Failed to update labels');
//     }
//   };

//   const fetchAttachments = async () => {
//     try {
//       const response = await api.get(`/attachments/task/${taskId}`);
//       setAttachments(response.data.attachments || []);
//     } catch (error) {
//       console.error('Error fetching attachments:', error);
//     }
//   };

//   const uploadSingleFile = async (file) => {
//     if (!file) return;
//     const formData = new FormData();
//     formData.append('file', file);
//     const response = await api.post(`/attachments/task/${taskId}`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     setAttachments((prev) => [response.data.attachment, ...prev]);
//   };

//   const handleUploadAttachment = async (e) => {
//     const files = Array.from(e.target.files || []);
//     if (files.length === 0) return;
//     try {
//       setUploading(true);
//       for (const file of files) {
//         // eslint-disable-next-line no-await-in-loop
//         await uploadSingleFile(file);
//       }
//     } catch (error) {
//       console.error('Error uploading attachment:', error);
//       alert('Failed to upload attachment (max 10MB each).');
//     } finally {
//       setUploading(false);
//       e.target.value = '';
//     }
//   };

//   const handleDeleteAttachment = async (attachmentId) => {
//     if (!window.confirm('Delete this attachment?')) return;
//     try {
//       await api.delete(`/attachments/${attachmentId}`);
//       setAttachments(attachments.filter(a => a.id !== attachmentId));
//     } catch (error) {
//       console.error('Error deleting attachment:', error);
//       alert('Failed to delete attachment');
//     }
//   };

//   const handleStatusChange = async (newStatus) => {
//     try {
//       await api.put(`/tasks/${taskId}`, { status: newStatus });
//       const updatedTask = { ...task, status: newStatus };
//       setTask(updatedTask);
//       if (onTaskUpdated) onTaskUpdated(updatedTask);
//       fetchActivity(); // Refresh activity
//     } catch (error) {
//       console.error('Error updating status:', error);
//     }
//   };

//   const handleSubmitComment = async (e) => {
//     e.preventDefault();
//     if (!newComment.trim()) return;

//     try {
//       setSubmittingComment(true);
//       const response = await api.post(`/comments/task/${taskId}`, {
//         comment: newComment.trim()
//       });
//       const created = response.data.comment;
//       // If there is an attachment selected for this comment, upload and refetch comments
//       if (newCommentFile) {
//         const formData = new FormData();
//         formData.append('file', newCommentFile);
//         formData.append('comment_id', created.id);
//         await api.post(`/attachments/task/${taskId}`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//         setNewCommentFile(null);
//         await fetchComments();
//         await fetchAttachments();
//       } else {
//         setComments([...comments, created]);
//       }
//       setNewComment('');
//       fetchActivity(); // Refresh activity to show new comment action
//     } catch (error) {
//       console.error('Error submitting comment:', error);
//       alert('Failed to post comment');
//     } finally {
//       setSubmittingComment(false);
//     }
//   };

//   const handleEditComment = async (commentId) => {
//     if (!editCommentText.trim()) return;

//     try {
//       const response = await api.put(`/comments/${commentId}`, {
//         comment: editCommentText.trim()
//       });
//       setComments(comments.map(c =>
//         c.id === commentId ? { ...c, comment: editCommentText.trim(), is_edited: true } : c
//       ));
//       setEditingCommentId(null);
//       setEditCommentText('');
//     } catch (error) {
//       console.error('Error updating comment:', error);
//       alert('Failed to update comment');
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     if (!window.confirm('Are you sure you want to delete this comment?')) return;

//     try {
//       await api.delete(`/comments/${commentId}`);
//       setComments(comments.filter(c => c.id !== commentId));
//     } catch (error) {
//       console.error('Error deleting comment:', error);
//       alert('Failed to delete comment');
//     }
//   };

//   const handleDeleteTask = async () => {
//     if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

//     try {
//       await api.delete(`/tasks/${taskId}`);
//       if (onTaskDeleted) onTaskDeleted(taskId);
//       onClose();
//     } catch (error) {
//       console.error('Error deleting task:', error);
//       alert('Failed to delete task');
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'completed':
//         return 'task-status-completed';
//       case 'in_progress':
//         return 'task-status-in-progress';
//       default:
//         return 'task-status-pending';
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case 'high':
//         return 'priority-high';
//       case 'medium':
//         return 'priority-medium';
//       default:
//         return 'priority-low';
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'No due date';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getTimeAgo = (date) => {
//     const seconds = Math.floor((new Date() - new Date(date)) / 1000);

//     if (seconds < 60) return 'just now';
//     if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
//     if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
//     return new Date(date).toLocaleDateString();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
//       <div className="relative mx-auto border w-full max-w-4xl shadow-xl rounded-lg bg-theme-primary transform transition-all">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
//           </div>
//         ) : (
//           <>
//             {/* Header */}
//             <div className="border-b border-theme-primary px-6 py-4 flex items-start justify-between">
//               <div className="flex-1">
//                 <h2 className="text-2xl font-semibold text-theme-primary mb-2">
//                   {task?.title}
//                 </h2>
//                 <div className="flex items-center space-x-3">
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task?.status)}`}>
//                     {task?.status?.replace('_', ' ')}
//                   </span>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task?.priority)}`}>
//                     {task?.priority}
//                   </span>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-theme-tertiary hover:text-theme-secondary transition-colors"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>

//             {/* Tabs */}
//             <div className="border-b border-theme-primary px-6">
//               <nav className="-mb-px flex space-x-8">
//                 <button
//                   onClick={() => setActiveTab('details')}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
//                       ? 'border-accent-primary text-accent-primary'
//                       : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
//                     }`}
//                 >
//                   <Edit className="h-4 w-4 inline mr-2" />
//                   Details
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveTab('comments');
//                     fetchComments();
//                   }}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'comments'
//                       ? 'border-accent-primary text-accent-primary'
//                       : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
//                     }`}
//                 >
//                   <MessageSquare className="h-4 w-4 inline mr-2" />
//                   Comments ({comments.length})
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveTab('activity');
//                     fetchActivity();
//                   }}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity'
//                       ? 'border-accent-primary text-accent-primary'
//                       : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
//                     }`}
//                 >
//                   <Activity className="h-4 w-4 inline mr-2" />
//                   Activity
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveTab('subtasks');
//                     fetchSubtasks();
//                   }}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'subtasks'
//                       ? 'border-accent-primary text-accent-primary'
//                       : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
//                     }`}
//                 >
//                   <CheckSquare className="h-4 w-4 inline mr-2" />
//                   Subtasks
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveTab('time');
//                     fetchTimeEntries();
//                   }}
//                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'time'
//                       ? 'border-accent-primary text-accent-primary'
//                       : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
//                     }`}
//                 >
//                   <Clock className="h-4 w-4 inline mr-2" />
//                   Time
//                 </button>
//               </nav>
//             </div>

//             {/* Content */}
//             <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
//               {/* Details Tab */}
//               {activeTab === 'details' && (
//                 <div className="space-y-6">
//                   {/* Description */}
//                   <div>
//                     <h3 className="text-sm font-medium text-theme-primary mb-2">Description</h3>
//                     <p className="text-theme-primary whitespace-pre-wrap">
//                       {task?.description || 'No description provided'}
//                     </p>
//                   </div>

//                   {/* Task Info Grid */}
//                   <div className="grid grid-cols-2 gap-6">
//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
//                         <User className="h-4 w-4 mr-2" />
//                         Assigned To
//                       </h3>
//                       <p className="text-theme-primary">{task?.assignee_name || 'Unassigned'}</p>
//                     </div>

//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
//                         <Calendar className="h-4 w-4 mr-2" />
//                         Due Date
//                       </h3>
//                       <p className="text-theme-primary">{formatDate(task?.due_date)}</p>
//                     </div>

//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
//                         <User className="h-4 w-4 mr-2" />
//                         Created By
//                       </h3>
//                       <p className="text-theme-primary">{task?.creator_name}</p>
//                     </div>

//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
//                         <Clock className="h-4 w-4 mr-2" />
//                         Created At
//                       </h3>
//                       <p className="text-theme-primary">{formatDate(task?.created_at)}</p>
//                     </div>
//                   </div>

//                   {/* Status Actions */}
//                   <div>
//                     <h3 className="text-sm font-medium text-theme-primary mb-3">Change Status</h3>
//                     <div className="flex space-x-2">
//                       {task?.status !== 'pending' && (
//                         <button
//                           onClick={() => handleStatusChange('pending')}
//                       className="px-4 py-2 text-sm task-status-pending hover:opacity-90 transition-colors"
//                         >
//                           Pending
//                         </button>
//                       )}
//                       {task?.status !== 'in_progress' && (
//                         <button
//                           onClick={() => handleStatusChange('in_progress')}
//                       className="px-4 py-2 text-sm task-status-in-progress hover:opacity-90 transition-colors"
//                         >
//                           In Progress
//                         </button>
//                       )}
//                       {task?.status !== 'completed' && (
//                         <button
//                           onClick={() => handleStatusChange('completed')}
//                       className="px-4 py-2 text-sm task-status-completed hover:opacity-90 transition-colors"
//                         >
//                           Complete
//                         </button>
//                       )}
//                     </div>
//                   </div>

//                   {/* Delete Task */}
//                   <div className="pt-4 border-t border-theme-primary">
//                     <button
//                       onClick={handleDeleteTask}
//                       className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
//                     >
//                       <Trash2 className="h-4 w-4 mr-2" />
//                       Delete Task
//                     </button>
//                   </div>

//                   {/* Attachments */}
//                   <div className="pt-6 border-t border-theme-primary">
//                     <h3 className="text-sm font-medium text-theme-primary mb-3">Attachments</h3>
//                     <div className="flex items-center gap-3 mb-4">
//                       <label className="inline-flex items-center px-3 py-2 text-sm bg-theme-secondary text-theme-primary rounded cursor-pointer hover:bg-theme-tertiary">
//                         <input
//                           type="file"
//                           className="hidden"
//                           onChange={handleUploadAttachment}
//                           multiple
//                           accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain"
//                         />
//                         {uploading ? (
//                           <>
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary mr-2"></div>
//                             Uploading...
//                           </>
//                         ) : (
//                           'Upload File'
//                         )}
//                       </label>
//                       <p className="text-xs text-theme-tertiary">Max 10MB. Images, PDF, Docs, Sheets, TXT, ZIP.</p>
//                     </div>
//                     {/* Drag and Drop area */}
//                     <div
//                       className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center text-sm text-theme-secondary ${isDragging ? 'border-accent-primary bg-theme-secondary' : 'border-theme-primary'} hover:border-theme-secondary`}
//                       onDragEnter={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setIsDragging(true);
//                       }}
//                       onDragOver={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                       }}
//                       onDragLeave={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setIsDragging(false);
//                       }}
//                       onDrop={async (e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setIsDragging(false);
//                         const files = Array.from(e.dataTransfer?.files || []);
//                         if (files.length === 0) return;
//                         try {
//                           setUploading(true);
//                           for (const file of files) {
//                             // eslint-disable-next-line no-await-in-loop
//                             await uploadSingleFile(file);
//                           }
//                         } catch (error) {
//                           console.error('Error uploading attachment:', error);
//                           alert('Failed to upload attachment (max 10MB each).');
//                         } finally {
//                           setUploading(false);
//                         }
//                       }}
//                     >
//                       {isDragging ? 'Release to upload files' : 'Drag and drop files here to upload'}
//                     </div>
//                     {attachments.length === 0 ? (
//                       <p className="text-sm text-theme-tertiary">No attachments yet</p>
//                     ) : (
//                       <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden">
//                         {attachments.map((att) => (
//                           <li key={att.id} className="flex items-center justify-between px-4 py-3">
//                             <div className="min-w-0">
//                               <p className="text-sm font-medium text-theme-primary truncate">{att.file_name}</p>
//                               <p className="text-xs text-theme-tertiary">by {att.uploader_name} · {getTimeAgo(att.created_at)}</p>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <a
//                                 href={att.file_url}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary"
//                               >
//                                 View
//                               </a>
//                               <button
//                                 onClick={() => handleDeleteAttachment(att.id)}
//                                 className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
//                               >
//                                 Delete
//                               </button>
//                             </div>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>

//                   {/* Labels */}
//                   <div className="pt-4 border-t border-theme-primary">
//                     <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
//                       <Tag className="h-4 w-4 mr-2" />
//                       Labels
//                     </h3>
//                     {teamLabels.length === 0 ? (
//                       <p className="text-sm text-theme-tertiary">No labels yet. Create labels from the Tasks page.</p>
//                     ) : (
//                       <div className="space-y-2">
//                         <div className="flex flex-wrap gap-2">
//                           {teamLabels.map((l) => (
//                             <label key={l.id} className="inline-flex items-center px-2 py-1 border rounded-full text-xs cursor-pointer" style={{ borderColor: l.color, color: l.color }}>
//                               <input
//                                 type="checkbox"
//                                 className="mr-2"
//                                 checked={selectedLabelIds.includes(l.id)}
//                                 onChange={() => toggleLabel(l.id)}
//                               />
//                               {l.name}
//                             </label>
//                           ))}
//                         </div>
//                         <div>
//                           <button
//                             onClick={saveLabels}
//                             className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
//                           >
//                             Save Labels
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Comments Tab */}
//               {activeTab === 'comments' && (
//                 <div className="space-y-6">
//                   {/* Comment Form */}
//                   <form onSubmit={handleSubmitComment} className="bg-theme-secondary rounded-lg p-4">
//                     <textarea
//                       value={newComment}
//                       onChange={(e) => setNewComment(e.target.value)}
//                       placeholder="Write a comment..."
//                       rows={3}
//                       className="w-full px-3 py-2 border border-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none bg-theme-primary text-theme-primary placeholder-theme-tertiary"
//                       disabled={submittingComment}
//                     />
//                     <div className="mt-2 flex items-center justify-between">
//                       <label className="inline-flex items-center px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded cursor-pointer hover:bg-theme-tertiary">
//                         <input
//                           type="file"
//                           className="hidden"
//                           onChange={(e) => setNewCommentFile(e.target.files?.[0] || null)}
//                           accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain"
//                         />
//                         {newCommentFile ? `Attached: ${newCommentFile.name}` : 'Attach file'}
//                       </label>
//                       {newCommentFile && (
//                         <button
//                           type="button"
//                           className="text-xs text-theme-tertiary hover:text-theme-primary"
//                           onClick={() => setNewCommentFile(null)}
//                         >
//                           Remove
//                         </button>
//                       )}
//                     </div>
//                     <div className="mt-3 flex justify-end">
//                       <button
//                         type="submit"
//                         disabled={!newComment.trim() || submittingComment}
//                         className="btn-primary flex items-center disabled:opacity-50"
//                       >
//                         {submittingComment ? (
//                           <>
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                             Posting...
//                           </>
//                         ) : (
//                           <>
//                             <Send className="h-4 w-4 mr-2" />
//                             Post Comment
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   </form>

//                   {/* Comments List */}
//                   <div className="space-y-4">
//                     {comments.length === 0 ? (
//                       <div className="text-center py-8">
//                         <MessageSquare className="h-12 w-12 text-theme-tertiary mx-auto mb-3" />
//                         <p className="text-theme-tertiary">No comments yet. Be the first to comment!</p>
//                       </div>
//                     ) : (
//                       comments.map((comment) => (
//                         <div key={comment.id} className="bg-theme-primary border border-theme-primary rounded-lg p-4">
//                           <div className="flex items-start justify-between mb-2">
//                             <div className="flex items-center space-x-2">
//                             <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
//                                 <User className="h-4 w-4 text-accent-primary" />
//                               </div>
//                               <div>
//                                 <p className="text-sm font-medium text-theme-primary">{comment.user_name}</p>
//                                 <p className="text-xs text-theme-tertiary">
//                                   {getTimeAgo(comment.created_at)}
//                                   {comment.is_edited && ' (edited)'}
//                                 </p>
//                               </div>
//                             </div>

//                             {comment.user_id === user?.id && (
//                               <div className="flex space-x-2">
//                                 <button
//                                   onClick={() => {
//                                     setEditingCommentId(comment.id);
//                                     setEditCommentText(comment.comment);
//                                   }}
//                                   className="text-theme-tertiary hover:text-accent-primary"
//                                 >
//                                   <Edit className="h-4 w-4" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleDeleteComment(comment.id)}
//                                   className="text-theme-tertiary hover:text-red-600"
//                                 >
//                                   <Trash2 className="h-4 w-4" />
//                                 </button>
//                               </div>
//                             )}
//                           </div>

//                           {editingCommentId === comment.id ? (
//                             <div className="mt-2">
//                               <textarea
//                                 value={editCommentText}
//                                 onChange={(e) => setEditCommentText(e.target.value)}
//                                 rows={3}
//                                 className="w-full px-3 py-2 border border-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-theme-primary text-theme-primary"
//                               />
//                               <div className="mt-2 flex space-x-2">
//                                 <button
//                                   onClick={() => handleEditComment(comment.id)}
//                                   className="px-3 py-1 text-sm btn-primary"
//                                 >
//                                   Save
//                                 </button>
//                                 <button
//                                   onClick={() => {
//                                     setEditingCommentId(null);
//                                     setEditCommentText('');
//                                   }}
//                                   className="px-3 py-1 text-sm bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary"
//                                 >
//                                   Cancel
//                                 </button>
//                               </div>
//                             </div>
//                           ) : (
//                             <p className="text-theme-primary whitespace-pre-wrap">{comment.comment}</p>
//                           )}

//                           {/* Comment attachments */}
//                           {attachments.some(a => a.comment_id === comment.id) && (
//                             <div className="mt-3 space-y-2">
//                               {attachments.filter(a => a.comment_id === comment.id).map(a => (
//                                 <div key={a.id} className="flex items-center justify-between text-sm">
//                                   <a
//                                     href={a.file_url}
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     className="text-accent-primary hover:text-primary-700 truncate"
//                                   >
//                                     {a.file_name}
//                                   </a>
//                                   {a.uploaded_by === user?.id && (
//                                     <button
//                                       onClick={() => handleDeleteAttachment(a.id)}
//                                       className="text-red-600 hover:text-red-700"
//                                     >
//                                       Delete
//                                     </button>
//                                   )}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Activity Tab */}
//               {activeTab === 'activity' && (
//                 <div className="space-y-4">
//                   {activity.length === 0 ? (
//                     <div className="text-center py-8">
//                       <Activity className="h-12 w-12 text-theme-tertiary mx-auto mb-3" />
//                       <p className="text-theme-tertiary">No activity yet</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       {activity.map((item) => (
//                           <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-theme-primary last:border-0">
//                           <div className="flex-shrink-0 mt-1">
//                               <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
//                               <Activity className="h-4 w-4 text-theme-secondary" />
//                             </div>
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm text-theme-primary">
//                               <span className="font-medium">{item.user_name}</span>{' '}
//                               <span className="text-theme-secondary">{item.description}</span>
//                             </p>
//                             {item.field_changed && (
//                               <p className="text-xs text-theme-tertiary mt-1">
//                                 {item.field_changed}: {item.old_value} → {item.new_value}
//                               </p>
//                             )}
//                             <p className="text-xs text-theme-tertiary mt-1">
//                               {getTimeAgo(item.created_at)}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Subtasks Tab */}
//               {activeTab === 'subtasks' && (
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary">Checklist</h3>
//                       <p className="text-xs text-theme-tertiary">Small tasks within the main task</p>
//                     </div>
//                     {totalSubtasks > 0 && (
//                       <div className="text-xs text-theme-secondary">
//                         {completedCount}/{totalSubtasks} completed
//                       </div>
//                     )}
//                   </div>

//                   {/* Progress bar */}
//                   <div className="w-full h-2 bg-theme-secondary rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-accent-primary"
//                       style={{ width: `${totalSubtasks ? Math.round((completedCount / totalSubtasks) * 100) : 0}%` }}
//                     />
//                   </div>

//                   {/* Add subtask */}
//                   <form onSubmit={addSubtask} className="flex items-center gap-2">
//                     <input
//                       type="text"
//                       value={newSubtaskTitle}
//                       onChange={(e) => setNewSubtaskTitle(e.target.value)}
//                       placeholder="Add a subtask..."
//                       className="input-field flex-1"
//                     />
//                     <button type="submit" disabled={!newSubtaskTitle.trim()} className="btn-primary inline-flex items-center">
//                       <Plus className="h-4 w-4 mr-1" /> Add
//                     </button>
//                   </form>

//                   {/* List */}
//                   {totalSubtasks === 0 ? (
//                     <p className="text-sm text-theme-tertiary">No subtasks yet</p>
//                   ) : (
//                     <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden">
//                       {subtasks.map((s) => (
//                         <li key={s.id} className="flex items-center justify-between px-4 py-3">
//                           <div className="flex items-center gap-2 min-w-0">
//                             <input
//                               type="checkbox"
//                               checked={!!s.is_completed}
//                               onChange={() => toggleSubtask(s.id)}
//                             />
//                             {editingSubtaskId === s.id ? (
//                               <form onSubmit={saveEditSubtask} className="flex items-center gap-2 min-w-0">
//                                 <input
//                                   type="text"
//                                   value={editingSubtaskTitle}
//                                   onChange={(e) => setEditingSubtaskTitle(e.target.value)}
//                                   className="input-field w-64"
//                                   autoFocus
//                                 />
//                                 <button type="submit" className="btn-primary px-2 py-1 text-xs">Save</button>
//                                 <button type="button" onClick={cancelEditSubtask} className="px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary">Cancel</button>
//                               </form>
//                             ) : (
//                               <button onClick={() => beginEditSubtask(s)} className={`text-left truncate ${s.is_completed ? 'line-through text-theme-tertiary' : 'text-theme-primary'}`} title="Edit subtask">
//                                 <span className="text-sm">{s.title}</span>
//                               </button>
//                             )}
//                           </div>
//                           <button onClick={() => deleteSubtask(s.id)} className="text-theme-tertiary hover:text-red-600">
//                             <Trash2 className="h-4 w-4" />
//                           </button>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               )}

//               {/* Time Tab */}
//               {activeTab === 'time' && (
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h3 className="text-sm font-medium text-theme-primary">Time Tracking</h3>
//                       <p className="text-xs text-theme-tertiary">Track time spent on this task</p>
//             </div>
//                     <div className="flex items-center gap-2">
//                       {isTimerRunning ? (
//                         <button onClick={stopTimer} className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100">Stop</button>
//                       ) : (
//                         <button onClick={startTimer} className="btn-primary">Start</button>
//                       )}
//                       <button onClick={() => setIsAddTimeModalOpen(true)} className="px-3 py-2 text-sm bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary">Add Entry</button>
//                     </div>
//                   </div>

//                   {isTimerRunning && (
//                     <div className="text-sm text-theme-secondary">
//                       Timer since: {new Date(timerStartedAt).toLocaleTimeString()}
//                     </div>
//                   )}

//                   <div>
//                     <h4 className="text-sm font-medium text-theme-primary mb-2">Entries</h4>
//                     {timeEntries.length === 0 ? (
//                       <p className="text-sm text-theme-tertiary">No time entries yet</p>
//                     ) : (
//                       <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden">
//                         {timeEntries.map((te) => (
//                           <li key={te.id} className="px-4 py-3 text-sm flex items-center justify-between">
//                             <div className="min-w-0">
//                               <div className="text-theme-primary">
//                                 {new Date(te.start_time).toLocaleString()} → {new Date(te.end_time).toLocaleString()}
//                               </div>
//                               {te.description && (
//                                 <div className="text-theme-secondary truncate">{te.description}</div>
//                               )}
//                             </div>
//                             <div className="text-theme-tertiary ml-4 whitespace-nowrap">{Math.round(((new Date(te.end_time) - new Date(te.start_time)) / 60000))} min</div>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           <AddTimeEntryModal
//             isOpen={isAddTimeModalOpen}
//             onClose={() => setIsAddTimeModalOpen(false)}
//             taskId={taskId}
//             onCreated={() => fetchTimeEntries()}
//           />
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TaskDetailModal;


import { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Flag, Clock, MessageSquare, Activity, Edit, Trash2, Send, Tag, CheckSquare, Plus, Users } from 'lucide-react';
import AddTimeEntryModal from '../time/AddTimeEntryModal'
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import api from '../../config/api';
import { useDispatch, useSelector } from 'react-redux';
import { refreshTeams } from '../../store/slices/teamsSlice';

const TaskDetailModal = ({ isOpen, taskId, onClose, onTaskUpdated, onTaskDeleted }) => {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('details');
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentFile, setNewCommentFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  // Labels state
  const [teamLabels, setTeamLabels] = useState([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'subtask', 'attachment', 'comment', 'task'
    itemId: null,
    itemName: null,
    onConfirm: null
  });
  
  // Track which tabs have been loaded to prevent redundant API calls
  const loadedTabsRef = useRef(new Set());
  // AbortController refs to cancel in-flight requests
  const abortControllersRef = useRef({});

  // Fetch task + attachments once when modal opens or task changes
  useEffect(() => {
    if (isOpen && taskId) {
      // Reset active tab to 'details' when modal opens
      setActiveTab('details');
      fetchTaskDetails();
      fetchAttachments();
      // Reset loaded tabs when task changes
      loadedTabsRef.current = new Set();
      // Cancel any in-flight requests
      Object.values(abortControllersRef.current).forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current = {};
    }
  }, [isOpen, taskId]);

  // Fetch tab-specific data when activeTab changes (only if not already loaded)
  useEffect(() => {
    if (!isOpen || !taskId) return;
    
    // Cancel any pending request for this tab
    if (abortControllersRef.current[activeTab]) {
      abortControllersRef.current[activeTab].abort();
    }
    
    // Only fetch if this tab hasn't been loaded yet
    if (loadedTabsRef.current.has(activeTab)) {
      return;
    }
    
    const abortController = new AbortController();
    abortControllersRef.current[activeTab] = abortController;
    
    // Mark tab as loaded after successful fetch
    const markAsLoaded = () => {
      loadedTabsRef.current.add(activeTab);
      delete abortControllersRef.current[activeTab];
    };
    
    if (activeTab === 'comments') {
      fetchComments(abortController.signal, markAsLoaded);
    } else if (activeTab === 'activity') {
      fetchActivity(abortController.signal, markAsLoaded);
    } else if (activeTab === 'subtasks') {
      fetchSubtasks(abortController.signal, markAsLoaded);
    } else if (activeTab === 'time') {
      fetchTimeEntries(abortController.signal, markAsLoaded);
    }
    
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [activeTab, isOpen, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data.task);
      const taskLabelIds = (response.data.task?.labels || []).filter(Boolean).map(l => l.id);
      setSelectedLabelIds(taskLabelIds);
      // Fetch team labels if task has a team_id
      if (response.data.task?.team_id) {
        fetchTeamLabels(response.data.task.team_id);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLabels = async (teamId) => {
    try {
      if (!teamId) return;
      const res = await api.get(`/labels/team/${teamId}`);
      setTeamLabels(res.data.labels || []);
    } catch (e) {
      console.error('Failed to load labels', e);
    }
  };

  const toggleLabel = (labelId) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };


  const fetchComments = async (signal = null, onSuccess = null) => {
    try {
      const config = signal ? { signal } : {};
      const response = await api.get(`/comments/task/${taskId}`, config);
      setComments(response.data.comments);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error fetching comments:', error);
      }
    }
  };

  const fetchActivity = async (signal = null, onSuccess = null) => {
    try {
      const config = signal ? { signal } : {};
      const response = await api.get(`/comments/task/${taskId}/activity`, config);
      setActivity(response.data.activity);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error fetching activity:', error);
      }
    }
  };

  const fetchSubtasks = async (signal = null, onSuccess = null) => {
    try {
      const config = signal ? { signal } : {};
      const res = await api.get(`/subtasks/task/${taskId}`, config)
      setSubtasks(Array.isArray(res.data?.subtasks) ? res.data.subtasks : [])
      if (onSuccess) onSuccess();
    } catch (e) {
      // Don't log error if request was aborted
      if (e.name !== 'AbortError' && e.name !== 'CanceledError') {
        // eslint-disable-next-line no-console
        console.error('Failed to load subtasks', e)
      }
    }
  }

  const addSubtask = async (e) => {
    e?.preventDefault?.()
    if (!newSubtaskTitle.trim()) return
    try {
      const res = await api.post(`/subtasks/task/${taskId}`, { title: newSubtaskTitle.trim() })
      setSubtasks((prev) => [...prev, res.data.subtask])
      setNewSubtaskTitle('')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Add subtask failed', e)
      alert('Failed to add subtask')
    }
  }

  const toggleSubtask = async (id) => {
    try {
      const res = await api.patch(`/subtasks/${id}/toggle`)
      setSubtasks((prev) => prev.map((s) => (s.id === id ? res.data.subtask : s)))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Toggle subtask failed', e)
      alert('Failed to update subtask')
    }
  }

  const deleteSubtask = async (id) => {
    const subtask = subtasks.find(s => s.id === id);
    setDeleteModal({
      isOpen: true,
      type: 'subtask',
      itemId: id,
      itemName: subtask?.title || 'this subtask',
      onConfirm: async () => {
        try {
          await api.delete(`/subtasks/${id}`)
          setSubtasks((prev) => prev.filter((s) => s.id !== id))
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Delete subtask failed', e)
          alert('Failed to delete subtask')
        }
      }
    });
  }

  const beginEditSubtask = (s) => {
    setEditingSubtaskId(s.id)
    setEditingSubtaskTitle(s.title)
  }

  const cancelEditSubtask = () => {
    setEditingSubtaskId(null)
    setEditingSubtaskTitle('')
  }

  const saveEditSubtask = async (e) => {
    e?.preventDefault?.()
    if (!editingSubtaskId) return
    const title = editingSubtaskTitle.trim()
    if (!title) return
    try {
      const res = await api.put(`/subtasks/${editingSubtaskId}`, { title })
      setSubtasks((prev) => prev.map((s) => (s.id === editingSubtaskId ? res.data.subtask : s)))
      setEditingSubtaskId(null)
      setEditingSubtaskTitle('')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Edit subtask failed', e)
      alert('Failed to update subtask')
    }
  }

  const completedCount = subtasks.filter((s) => s.is_completed).length
  const totalSubtasks = subtasks.length

  const fetchTimeEntries = async (signal = null, onSuccess = null) => {
    try {
      const config = signal ? { signal } : {};
      const res = await api.get(`/time-entries/task/${taskId}`, config)
      setTimeEntries(Array.isArray(res.data?.entries) ? res.data.entries : [])
      // If API returns an active timer
      if (res.data?.active?.started_at) {
        setIsTimerRunning(true)
        setTimerStartedAt(res.data.active.started_at)
      } else {
        setIsTimerRunning(false)
        setTimerStartedAt(null)
      }
      if (onSuccess) onSuccess();
    } catch (e) {
      // Don't log error if request was aborted
      if (e.name !== 'AbortError' && e.name !== 'CanceledError') {
        // eslint-disable-next-line no-console
        console.error('Failed to load time entries', e)
      }
    }
  }

  const startTimer = async () => {
    try {
      await api.post(`/time-entries/start`, { task_id: taskId })
      setIsTimerRunning(true)
      setTimerStartedAt(new Date().toISOString())
      fetchTimeEntries()
      fetchActivity()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Start timer failed', e)
      alert('Failed to start timer')
    }
  }

  const stopTimer = async () => {
    try {
      await api.post(`/time-entries/stop`, { task_id: taskId })
      setIsTimerRunning(false)
      setTimerStartedAt(null)
      fetchTimeEntries()
      fetchActivity()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Stop timer failed', e)
      alert('Failed to stop timer')
    }
  }

  const saveLabels = async () => {
    try {
      const currentIds = (task?.labels || []).filter(Boolean).map(l => l.id);
      const toAdd = selectedLabelIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedLabelIds.includes(id));

      if (toAdd.length > 0) {
        await api.post(`/labels/tasks/${taskId}/assign`, { labelIds: toAdd });
      }
      for (const id of toRemove) {
        // eslint-disable-next-line no-await-in-loop
        await api.delete(`/labels/tasks/${taskId}/${id}`);
      }

      // Refresh task details to reflect new labels
      const refreshed = await api.get(`/tasks/${taskId}`);
      setTask(refreshed.data.task);
      if (onTaskUpdated) onTaskUpdated(refreshed.data.task);
      await fetchActivity();
    } catch (e) {
      console.error('Saving labels failed', e);
      alert('Failed to update labels');
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await api.get(`/attachments/task/${taskId}`);
      setAttachments(response.data.attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const uploadSingleFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/attachments/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setAttachments((prev) => [response.data.attachment, ...prev]);
  };

  const handleUploadAttachment = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        await uploadSingleFile(file);
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert('Failed to upload attachment (max 10MB each).');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    setDeleteModal({
      isOpen: true,
      type: 'attachment',
      itemId: attachmentId,
      itemName: attachment?.file_name || 'this attachment',
      onConfirm: async () => {
        try {
          await api.delete(`/attachments/${attachmentId}`);
          setAttachments(attachments.filter(a => a.id !== attachmentId));
        } catch (error) {
          console.error('Error deleting attachment:', error);
          alert('Failed to delete attachment');
        }
      }
    });
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      const updatedTask = { ...task, status: newStatus };
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
      // Refresh teams cache since task status change might affect team data
      dispatch(refreshTeams());
      fetchActivity(); // Refresh activity
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await api.post(`/comments/task/${taskId}`, {
        comment: newComment.trim()
      });
      const created = response.data.comment;
      // If there is an attachment selected for this comment, upload and refetch comments
      if (newCommentFile) {
        const formData = new FormData();
        formData.append('file', newCommentFile);
        formData.append('comment_id', created.id);
        await api.post(`/attachments/task/${taskId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNewCommentFile(null);
        await fetchComments();
        await fetchAttachments();
      } else {
        setComments([...comments, created]);
      }
      setNewComment('');
      fetchActivity(); // Refresh activity to show new comment action
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/comments/${commentId}`, {
        comment: editCommentText.trim()
      });
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, comment: editCommentText.trim(), is_edited: true } : c
      ));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeleteModal({
      isOpen: true,
      type: 'comment',
      itemId: commentId,
      itemName: 'this comment',
      onConfirm: async () => {
        try {
          await api.delete(`/comments/${commentId}`);
          setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
          console.error('Error deleting comment:', error);
          alert('Failed to delete comment');
        }
      }
    });
  };

  const handleDeleteTask = async () => {
    setDeleteModal({
      isOpen: true,
      type: 'task',
      itemId: taskId,
      itemName: task?.title || 'this task',
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${taskId}`);
          // Refresh teams cache since task deletion might affect team data
          dispatch(refreshTeams());
          if (onTaskDeleted) onTaskDeleted(taskId);
          onClose();
        } catch (error) {
          console.error('Error deleting task:', error);
          alert('Failed to delete task');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'task-status-completed';
      case 'in_progress':
        return 'task-status-in-progress';
      default:
        return 'task-status-pending';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
      <div className="relative mx-auto border w-full max-w-4xl shadow-xl rounded-lg bg-theme-primary transform transition-all">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-theme-primary px-6 py-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-theme-primary mb-2">
                  {task?.title}
                </h2>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task?.status)}`}>
                    {task?.status?.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task?.priority)}`}>
                    {task?.priority}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-theme-tertiary hover:text-theme-secondary transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-theme-primary px-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
                    }`}
                >
                  <Edit className="h-4 w-4 inline mr-2" />
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'comments'
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
                    }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity'
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
                    }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('subtasks')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'subtasks'
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
                    }`}
                >
                  <CheckSquare className="h-4 w-4 inline mr-2" />
                  Subtasks
                </button>
                <button
                  onClick={() => setActiveTab('time')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'time'
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-theme-tertiary hover:text-theme-primary hover:border-gray-300'
                    }`}
                >
                  <Clock className="h-4 w-4 inline mr-2" />
                  Time
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-theme-primary mb-2">Description</h3>
                    <p className="text-theme-primary whitespace-pre-wrap">
                      {task?.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Task Info Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Team
                      </h3>
                      <p className="text-theme-primary">{task?.team_name || 'No team'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Assigned To
                      </h3>
                      <p className="text-theme-primary">{task?.assignee_name || 'Unassigned'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due Date
                      </h3>
                      <p className="text-theme-primary">{formatDate(task?.due_date)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Created By
                      </h3>
                      <p className="text-theme-primary">{task?.creator_name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Created At
                      </h3>
                      <p className="text-theme-primary">{formatDate(task?.created_at)}</p>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-theme-primary mb-3">Change Status</h3>
                    <div className="flex space-x-2">
                      {task?.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange('pending')}
                      className="px-4 py-2 text-sm task-status-pending hover:opacity-90 transition-colors"
                        >
                          Pending
                        </button>
                      )}
                      {task?.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange('in_progress')}
                      className="px-4 py-2 text-sm task-status-in-progress hover:opacity-90 transition-colors"
                        >
                          In Progress
                        </button>
                      )}
                      {task?.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange('completed')}
                      className="px-4 py-2 text-sm task-status-completed hover:opacity-90 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete Task */}
                  <div className="pt-4 border-t border-theme-primary">
                    <button
                      onClick={handleDeleteTask}
                      className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </button>
                  </div>

                  {/* Attachments */}
                  <div className="pt-6 border-t border-theme-primary">
                    <h3 className="text-sm font-medium text-theme-primary mb-3">Attachments</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <label className="inline-flex items-center px-3 py-2 text-sm bg-theme-secondary text-theme-primary rounded cursor-pointer hover:bg-theme-tertiary">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleUploadAttachment}
                          multiple
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain"
                        />
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          'Upload File'
                        )}
                      </label>
                      <p className="text-xs text-theme-tertiary">Max 10MB. Images, PDF, Docs, Sheets, TXT, ZIP.</p>
                    </div>
                    {/* Drag and Drop area */}
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center text-sm text-theme-secondary ${isDragging ? 'border-accent-primary bg-theme-secondary' : 'border-theme-primary'} hover:border-theme-secondary`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const files = Array.from(e.dataTransfer?.files || []);
                        if (files.length === 0) return;
                        try {
                          setUploading(true);
                          for (const file of files) {
                            // eslint-disable-next-line no-await-in-loop
                            await uploadSingleFile(file);
                          }
                        } catch (error) {
                          console.error('Error uploading attachment:', error);
                          alert('Failed to upload attachment (max 10MB each).');
                        } finally {
                          setUploading(false);
                        }
                      }}
                    >
                      {isDragging ? 'Release to upload files' : 'Drag and drop files here to upload'}
                    </div>
                    {attachments.length === 0 ? (
                      <p className="text-sm text-theme-tertiary mt-2">No attachments yet</p>
                    ) : (
                      <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden mt-2">
                        {attachments.map((att) => (
                          <li key={att.id} className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-theme-primary truncate">{att.file_name}</p>
                              <p className="text-xs text-theme-tertiary">by {att.uploader_name} · {getTimeAgo(att.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary"
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="pt-4 border-t border-theme-primary">
                    <h3 className="text-sm font-medium text-theme-primary mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Labels
                    </h3>
                    {teamLabels.length === 0 ? (
                      <p className="text-sm text-theme-tertiary">No labels yet. Create labels from the Tasks page.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {teamLabels.map((l) => (
                            <label key={l.id} className="inline-flex items-center px-2 py-1 border rounded-full text-xs cursor-pointer" style={{ borderColor: l.color, color: l.color }}>
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={selectedLabelIds.includes(l.id)}
                                onChange={() => toggleLabel(l.id)}
                              />
                              {l.name}
                            </label>
                          ))}
                        </div>
                        <div>
                          <button
                            onClick={saveLabels}
                            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Save Labels
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="bg-theme-secondary rounded-lg p-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none bg-theme-primary text-theme-primary placeholder-theme-tertiary"
                      disabled={submittingComment}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <label className="inline-flex items-center px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded cursor-pointer hover:bg-theme-tertiary">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setNewCommentFile(e.target.files?.[0] || null)}
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,text/plain"
                        />
                        {newCommentFile ? `Attached: ${newCommentFile.name}` : 'Attach file'}
                      </label>
                      {newCommentFile && (
                        <button
                          type="button"
                          className="text-xs text-theme-tertiary hover:text-theme-primary"
                          onClick={() => setNewCommentFile(null)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="btn-primary flex items-center disabled:opacity-50"
                      >
                        {submittingComment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-theme-tertiary mx-auto mb-3" />
                        <p className="text-theme-tertiary">No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-theme-primary border border-theme-primary rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
                                <User className="h-4 w-4 text-accent-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-theme-primary">{comment.user_name}</p>
                                <p className="text-xs text-theme-tertiary">
                                  {getTimeAgo(comment.created_at)}
                                  {comment.is_edited && ' (edited)'}
                                </p>
                              </div>
                            </div>

                            {comment.user_id === user?.id && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.comment);
                                  }}
                                  className="text-theme-tertiary hover:text-accent-primary"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-theme-tertiary hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="mt-2">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-theme-primary text-theme-primary"
                              />
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  className="px-3 py-1 text-sm btn-primary"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditCommentText('');
                                  }}
                                  className="px-3 py-1 text-sm bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-theme-primary whitespace-pre-wrap">{comment.comment}</p>
                          )}

                          {/* Comment attachments */}
                          {attachments.some(a => a.comment_id === comment.id) && (
                            <div className="mt-3 space-y-2">
                              {attachments.filter(a => a.comment_id === comment.id).map(a => (
                                <div key={a.id} className="flex items-center justify-between text-sm">
                                  <a
                                    href={a.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-primary hover:text-primary-700 truncate"
                                  >
                                    {a.file_name}
                                  </a>
                                  {a.uploaded_by === user?.id && (
                                    <button
                                      onClick={() => handleDeleteAttachment(a.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {activity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-theme-tertiary mx-auto mb-3" />
                      <p className="text-theme-tertiary">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activity.map((item) => (
                          <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-theme-primary last:border-0">
                          <div className="flex-shrink-0 mt-1">
                              <div className="h-8 w-8 rounded-full bg-theme-secondary flex items-center justify-center">
                              <Activity className="h-4 w-4 text-theme-secondary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-theme-primary">
                              <span className="font-medium">{item.user_name}</span>{' '}
                              <span className="text-theme-secondary">{item.description}</span>
                            </p>
                            {item.field_changed && (
                              <p className="text-xs text-theme-tertiary mt-1">
                                {item.field_changed}: {item.old_value} → {item.new_value}
                              </p>
                            )}
                            <p className="text-xs text-theme-tertiary mt-1">
                              {getTimeAgo(item.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtasks Tab */}
              {activeTab === 'subtasks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-theme-primary">Checklist</h3>
                      <p className="text-xs text-theme-tertiary">Small tasks within the main task</p>
                    </div>
                    {totalSubtasks > 0 && (
                      <div className="text-xs text-theme-secondary">
                        {completedCount}/{totalSubtasks} completed
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-theme-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-primary"
                      style={{ width: `${totalSubtasks ? Math.round((completedCount / totalSubtasks) * 100) : 0}%` }}
                    />
                  </div>

                  {/* Add subtask */}
                  <form onSubmit={addSubtask} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a subtask..."
                      className="input-field flex-1"
                    />
                    <button type="submit" disabled={!newSubtaskTitle.trim()} className="btn-primary inline-flex items-center">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </button>
                  </form>

                  {/* List */}
                  {totalSubtasks === 0 ? (
                    <p className="text-sm text-theme-tertiary">No subtasks yet</p>
                  ) : (
                    <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden">
                      {subtasks.map((s) => (
                        <li key={s.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={!!s.is_completed}
                              onChange={() => toggleSubtask(s.id)}
                            />
                            {editingSubtaskId === s.id ? (
                              <form onSubmit={saveEditSubtask} className="flex items-center gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={editingSubtaskTitle}
                                  onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                  className="input-field w-64"
                                  autoFocus
                                />
                                <button type="submit" className="btn-primary px-2 py-1 text-xs">Save</button>
                                <button type="button" onClick={cancelEditSubtask} className="px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary">Cancel</button>
                              </form>
                            ) : (
                              <button onClick={() => beginEditSubtask(s)} className={`text-left truncate ${s.is_completed ? 'line-through text-theme-tertiary' : 'text-theme-primary'}`} title="Edit subtask">
                                <span className="text-sm">{s.title}</span>
                              </button>
                            )}
                          </div>
                          <button onClick={() => deleteSubtask(s.id)} className="text-theme-tertiary hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Time Tab */}
              {activeTab === 'time' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-theme-primary">Time Tracking</h3>
                      <p className="text-xs text-theme-tertiary">Track time spent on this task</p>
            </div>
                    <div className="flex items-center gap-2">
                      {isTimerRunning ? (
                        <button onClick={stopTimer} className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100">Stop</button>
                      ) : (
                        <button onClick={startTimer} className="btn-primary">Start</button>
                      )}
                      <button onClick={() => setIsAddTimeModalOpen(true)} className="px-3 py-2 text-sm bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary">Add Entry</button>
                    </div>
                  </div>

                  {isTimerRunning && (
                    <div className="text-sm text-theme-secondary">
                      Timer since: {new Date(timerStartedAt).toLocaleTimeString()}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-theme-primary mb-2">Entries</h4>
                    {timeEntries.length === 0 ? (
                      <p className="text-sm text-theme-tertiary">No time entries yet</p>
                    ) : (
                      <ul className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden">
                        {timeEntries.map((te) => (
                          <li key={te.id} className="px-4 py-3 text-sm flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-theme-primary">
                                {new Date(te.start_time).toLocaleString()} → {new Date(te.end_time).toLocaleString()}
                              </div>
                              {te.description && (
                                <div className="text-theme-secondary truncate">{te.description}</div>
                              )}
                            </div>
                            <div className="text-theme-tertiary ml-4 whitespace-nowrap">{Math.round(((new Date(te.end_time) - new Date(te.start_time)) / 60000))} min</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          <AddTimeEntryModal
            isOpen={isAddTimeModalOpen}
            onClose={() => setIsAddTimeModalOpen(false)}
            taskId={taskId}
            onCreated={() => fetchTimeEntries()}
          />
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, type: null, itemId: null, itemName: null, onConfirm: null })}
            onConfirm={deleteModal.onConfirm || (() => {})}
            title={
              deleteModal.type === 'task' ? 'Delete Task' :
              deleteModal.type === 'subtask' ? 'Delete Subtask' :
              deleteModal.type === 'attachment' ? 'Delete Attachment' :
              deleteModal.type === 'comment' ? 'Delete Comment' :
              'Confirm Delete'
            }
            message={
              deleteModal.type === 'task' ? `Are you sure you want to delete "${deleteModal.itemName}"? This action cannot be undone.` :
              deleteModal.type === 'subtask' ? `Are you sure you want to delete "${deleteModal.itemName}"?` :
              deleteModal.type === 'attachment' ? `Are you sure you want to delete "${deleteModal.itemName}"?` :
              deleteModal.type === 'comment' ? 'Are you sure you want to delete this comment?' :
              `Are you sure you want to delete ${deleteModal.itemName || 'this item'}?`
            }
            itemName={deleteModal.itemName}
          />
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
