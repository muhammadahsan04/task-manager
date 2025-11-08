import { useState, useEffect, memo, useCallback, useRef } from "react"
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import api from "../../config/api"
import { refreshTeams } from '../../store/slices/teamsSlice'
import { Plus, CheckSquare, Search, Calendar, User, Flag, MoreVertical, Edit, Trash2, Tag } from "lucide-react"
import CreateLabelModal from "../labels/CreateLabelModal"
import TaskDetailModal from "./TaskDetailModal"

const TasksList = memo(({ onCreateTask, onEditTask, onTaskUpdated, selectedTeam, refreshTrigger }) => {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const location = useLocation()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assigned_to: "",
    label_id: "",
  })
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const isInitialMount = useRef(true)

  // Debug: Monitor state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('State changed - isTaskModalOpen:', isTaskModalOpen, 'activeTaskId:', activeTaskId)
  }, [isTaskModalOpen, activeTaskId])

  // Function to open task modal
  const openTaskModal = useCallback((taskId) => {
    if (taskId) {
      // eslint-disable-next-line no-console
      console.log('Opening task modal for taskId:', taskId)
      setActiveTaskId(taskId)
      setIsTaskModalOpen(true)
      // eslint-disable-next-line no-console
      console.log('State set - isTaskModalOpen should be true, activeTaskId:', taskId)
    }
  }, [])

  // Listen for global openTaskDetail events from SearchModal
  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.taskId
      if (id) {
        openTaskModal(id)
        // Clear sessionStorage after using it
        sessionStorage.removeItem('openTaskId')
      }
    }
    window.addEventListener('openTaskDetail', handler)
    
    return () => window.removeEventListener('openTaskDetail', handler)
  }, [openTaskModal])

  // Check for taskId from location state or sessionStorage when component mounts or location changes
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      // Check location state first (from React Router navigation)
      const locationTaskId = location.state?.openTaskId
      if (locationTaskId) {
        // eslint-disable-next-line no-console
        console.log('Found taskId in location.state:', locationTaskId)
        openTaskModal(locationTaskId)
        // Clear location state to prevent reopening on re-render
        window.history.replaceState({}, document.title)
        return
      }
      
      // Check sessionStorage for taskId (from search navigation)
      const storedTaskId = sessionStorage.getItem('openTaskId')
      if (storedTaskId) {
        // eslint-disable-next-line no-console
        console.log('Found taskId in sessionStorage:', storedTaskId)
        openTaskModal(parseInt(storedTaskId, 10))
        sessionStorage.removeItem('openTaskId')
      }
    }, 50) // Small delay to ensure component is mounted
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.state]) // Re-check when pathname or state changes

  // Update a single task in the list
  const updateTaskInList = useCallback((updatedTask) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task)))
  }, [])

  // Expose updateTaskInList to parent via callback
  useEffect(() => {
    if (onTaskUpdated) {
      onTaskUpdated(updateTaskInList)
    }
  }, [onTaskUpdated, updateTaskInList])

  const fetchTasks = useCallback(
    async (isFilterChange = false) => {
      if (!selectedTeam) return

      try {
        if (isFilterChange) {
          setFilterLoading(true)
        } else {
          setLoading(true)
        }
        const params = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })

        const response = await api.get(`/tasks/team/${selectedTeam}?${params}`)
        setTasks(response.data.tasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to load tasks")
      } finally {
        setLoading(false)
        setFilterLoading(false)
      }
    },
    [selectedTeam, filters],
  )

  // Initial fetch when team is selected
  useEffect(() => {
    if (selectedTeam) {
      fetchTasks(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam])

  // Fetch when filters change (but not on initial mount)
  useEffect(() => {
    if (!selectedTeam) return

    // Skip fetch on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Fetch with filter indicator whenever any filter changes
    fetchTasks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.assigned_to, filters.label_id])

  // Fetch on refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0 && selectedTeam) {
      fetchTasks(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const handleDeleteTask = useCallback(
    async (taskId, taskTitle) => {
      if (!window.confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
        return
      }

      try {
        await api.delete(`/tasks/${taskId}`)
        setTasks(tasks.filter((task) => task.id !== taskId))
        // Refresh teams cache since task deletion might affect team data
        dispatch(refreshTeams())
        setActionMenuOpen(null)
      } catch (error) {
        console.error("Error deleting task:", error)
        alert("Failed to delete task")
      }
    },
    [tasks, dispatch],
  )

  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      try {
        await api.put(`/tasks/${taskId}`, { status: newStatus })
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
        // Refresh teams cache since task status change might affect team data
        dispatch(refreshTeams())
      } catch (error) {
        console.error("Error updating task status:", error)
        alert("Failed to update task status")
      }
    },
    [tasks, dispatch],
  )

  const openTaskDetails = useCallback((taskId) => {
    setActiveTaskId(taskId)
    setIsTaskModalOpen(true)
  }, [])

  const closeTaskDetails = useCallback(() => {
    setIsTaskModalOpen(false)
    setActiveTaskId(null)
  }, [])

  const handleStatusFilterChange = useCallback((e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value }))
  }, [])

  const handlePriorityFilterChange = useCallback((e) => {
    setFilters((prev) => ({ ...prev, priority: e.target.value }))
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "task-status-completed"
      case "in_progress":
        return "task-status-in-progress"
      default:
        return "task-status-pending"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "priority-high"
      case "medium":
        return "priority-medium"
      default:
        return "priority-low"
    }
  }

  const getPriorityBorderClass = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-400"
      case "medium":
        return "border-l-4 border-orange-300"
      default:
        return "border-l-4 border-gray-300"
    }
  }

  // Labels data for current team
  const [labels, setLabels] = useState([])
  const [isCreateLabelOpen, setIsCreateLabelOpen] = useState(false)
  const refreshLabels = useCallback(async () => {
    try {
      if (!selectedTeam) return
      const res = await api.get(`/labels/team/${selectedTeam}`)
      setLabels(res.data.labels || [])
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load labels', e)
    }
  }, [selectedTeam])
  useEffect(() => {
    refreshLabels()
  }, [selectedTeam, refreshLabels])

  const formatDate = (dateString) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${diffDays} days`
    }
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Task Detail Modal - render even when selectedTeam is null (for search navigation)
  const modalComponent = (
    <>
      {/* eslint-disable-next-line no-console */}
      {console.log('TasksList render - isTaskModalOpen:', isTaskModalOpen, 'activeTaskId:', activeTaskId)}
      {isTaskModalOpen && activeTaskId && (
        // eslint-disable-next-line no-console
        console.log('TaskDetailModal should be visible - isOpen:', isTaskModalOpen, 'taskId:', activeTaskId)
      )}
      <TaskDetailModal
        isOpen={isTaskModalOpen}
        taskId={activeTaskId}
        onClose={closeTaskDetails}
        onTaskUpdated={(updatedTask) => {
          if (typeof updatedTask === "function") {
            setTasks((prev) => updatedTask(prev))
          } else if (updatedTask && updatedTask.id) {
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)))
          }
        }}
        onTaskDeleted={(deletedTaskId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId))
          closeTaskDetails()
        }}
      />
    </>
  )

  if (!selectedTeam) {
    return (
      <>
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">Select a Team</h3>
          <p className="text-theme-secondary">Choose a team to view and manage tasks</p>
        </div>
        {modalComponent}
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={fetchTasks} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary text-pretty">Tasks</h1>
          <p className="text-theme-secondary">Manage and track your team&apos;s tasks</p>
        </div>
        <button
          onClick={onCreateTask}
          className="btn-primary inline-flex items-center justify-center"
          aria-label="Create task"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-theme-tertiary" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
                aria-label="Search tasks"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
            <select
              value={filters.status}
              onChange={handleStatusFilterChange}
              className="input-field w-full md:w-auto"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.priority}
              onChange={handlePriorityFilterChange}
              className="input-field w-full md:w-auto"
              aria-label="Filter by priority"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <select
              value={filters.label_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, label_id: e.target.value }))}
              className="input-field w-full md:w-auto"
              aria-label="Filter by label"
            >
              <option value="">All Labels</option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsCreateLabelOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm border border-theme-primary rounded-md text-theme-primary bg-theme-secondary hover:bg-theme-tertiary"
              aria-label="Create new label"
            >
              <Tag className="h-4 w-4 mr-1" />
              New Label
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            {tasks.length === 0 ? "No tasks yet" : "No tasks match your search"}
          </h3>
          <p className="text-theme-secondary mb-6">
            {tasks.length === 0 ? "Get started by creating your first task" : "Try adjusting your search or filters"}
          </p>
          {tasks.length === 0 && (
            <button onClick={onCreateTask} className="btn-primary flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-5 md:p-6 transition-shadow hover:shadow-theme-md ${getPriorityBorderClass(task.priority)}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Left: main content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openTaskDetails(task.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openTaskDetails(task.id)
                    }
                  }}
                >
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-medium text-theme-primary">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  {(task.labels || []).filter(Boolean).map((lab) => (
                    <span key={lab.id} className="px-2 py-0.5 rounded-full text-xs font-medium border" style={{ borderColor: lab.color, color: lab.color }}>
                      {lab.name}
                    </span>
                  ))}
                  </div>

                  {task.description && <p className="text-sm md:text-base text-theme-secondary mb-3">{task.description}</p>}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-theme-tertiary">
                    {task.assignee_name && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" aria-hidden="true" />
                        <span className="sr-only">Assignee:</span>
                        {task.assignee_name}
                      </div>
                    )}

                    {task.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                        <span className="sr-only">Due date:</span>
                        {formatDate(task.due_date)}
                      </div>
                    )}

                    <div className="flex items-center">
                      <Flag className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span className="sr-only">Created by:</span>
                      Created by {task.creator_name}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center justify-end gap-2 md:ml-4">
                  <button
                    onClick={() => openTaskDetails(task.id)}
                    className="inline-flex px-2 py-1 text-xs bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary transition-colors"
                  >
                    View
                  </button>
                  {/* Status Change Buttons - desktop only */}
                  <div className="hidden md:flex gap-1">
                    {task.status !== "pending" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "pending")}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Pending
                      </button>
                    )}
                    {task.status !== "in_progress" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "in_progress")}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                      >
                        In Progress
                      </button>
                    )}
                    {task.status !== "completed" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "completed")}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === task.id ? null : task.id)}
                      className="p-1 text-theme-tertiary hover:text-theme-secondary rounded-full hover:bg-theme-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary"
                      aria-haspopup="menu"
                      aria-expanded={actionMenuOpen === task.id}
                      aria-label={`Actions for ${task.title}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {actionMenuOpen === task.id && (
                      <div
                        className="absolute right-0 mt-2 w-52 bg-theme-primary rounded-md shadow-theme-lg py-1 z-10 border border-theme-primary"
                        role="menu"
                        aria-label={`Actions for ${task.title}`}
                      >
                        {/* Mobile status actions */}
                        <div className="md:hidden">
                          {task.status !== "pending" && (
                            <button
                              onClick={() => {
                                handleStatusChange(task.id, "pending")
                                setActionMenuOpen(null)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                              role="menuitem"
                            >
                              Pending
                            </button>
                          )}
                          {task.status !== "in_progress" && (
                            <button
                              onClick={() => {
                                handleStatusChange(task.id, "in_progress")
                                setActionMenuOpen(null)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                              role="menuitem"
                            >
                              In Progress
                            </button>
                          )}
                          {task.status !== "completed" && (
                            <button
                              onClick={() => {
                                handleStatusChange(task.id, "completed")
                                setActionMenuOpen(null)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                              role="menuitem"
                            >
                              Complete
                            </button>
                          )}
                          <div className="my-1 border-t border-theme-primary" />
                        </div>

                        <button
                          onClick={() => {
                            onEditTask(task.id)
                            setActionMenuOpen(null)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                          role="menuitem"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          role="menuitem"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalComponent}

      {/* Create Label Modal */}
      <CreateLabelModal
        isOpen={isCreateLabelOpen}
        teamId={selectedTeam}
        onClose={() => setIsCreateLabelOpen(false)}
        onCreated={() => {
          // Ensure labels dropdown refreshes after creating a label
          refreshLabels()
        }}
      />
    </div>
  )
})

export default TasksList