import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import TeamsList from './components/teams/TeamsList';
import AcceptInvite from './components/teams/AcceptInvite';
import CreateTeamModal from './components/teams/CreateTeamModal';
import EditTeamModal from './components/teams/EditTeamModal';
import TasksList from './components/tasks/TasksList';
import CalendarView from './components/calendar/CalendarView';
import Reports from './components/reports/Reports';
import CreateTaskModal from './components/tasks/CreateTaskModal';
import EditTaskModal from './components/tasks/EditTaskModal';
import ProfileSettings from './components/profile/ProfileSettings';
import TeamChat from './components/chat/TeamChat';
import api from './config/api';
import { useCallback , useRef, useEffect } from 'react';
import { checkAuthStatus } from './store/slices/authSlice';
import { 
  openCreateTeamModal,
  closeCreateTeamModal,
  openCreateTaskModal,
  closeCreateTaskModal,
  openEditTaskModal,
  closeEditTaskModal,
  openEditTeamModal,
  closeEditTeamModal,
  setSelectedTeam,
  bumpTeamsRefresh,
  bumpTasksRefresh,
} from './store/slices/uiSlice';
import { refreshTeams } from './store/slices/teamsSlice';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-theme-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-theme-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// Authenticated Layout Component - defined at module scope to prevent unmounting on parent re-renders
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-theme-secondary">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showCreateTeamModal = useSelector((s) => s.ui.showCreateTeamModal);
  const showCreateTaskModal = useSelector((s) => s.ui.showCreateTaskModal);
  const showEditTaskModal = useSelector((s) => s.ui.showEditTaskModal);
  const showEditTeamModal = useSelector((s) => s.ui.showEditTeamModal);
  const selectedTeam = useSelector((s) => s.ui.selectedTeamId);
  const editingTask = useSelector((s) => s.ui.editingTaskId);
  const editingTeam = useSelector((s) => s.ui.editingTeamId);
  const teamsRefreshTrigger = useSelector((s) => s.ui.teamsRefreshToken);
  const tasksRefreshTrigger = useSelector((s) => s.ui.tasksRefreshToken);
  const updateTaskCallbackRef = useRef(null);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);


  // Handle team creation
  const handleCreateTeam = useCallback(async (teamData) => {
    try {
      const response = await api.post('/teams', teamData);
      console.log('Team created:', response.data);
      // Refresh teams in Redux store
      dispatch(refreshTeams());
      // Also bump the refresh trigger for components that might be listening
      dispatch(bumpTeamsRefresh());
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }, [dispatch]);

  // Handle task creation
  const handleCreateTask = useCallback(async (taskData) => {
    try {
      const response = await api.post(`/tasks/team/${selectedTeam}`, taskData);
      console.log('Task created:', response.data);
      dispatch(bumpTasksRefresh());
      // Refresh teams cache since task count/status might affect team data
      dispatch(refreshTeams());
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [dispatch, selectedTeam]);

  // Handle team editing
  const handleEditTeam = useCallback((teamId) => {
    dispatch(openEditTeamModal(teamId));
  }, [dispatch]);

  // Handle task editing
  const handleEditTask = useCallback((taskId) => {
    dispatch(openEditTaskModal(taskId));
  }, [dispatch]);

  // Handle team view
  const handleViewTeam = useCallback((teamId) => {
    dispatch(setSelectedTeam(teamId));
    navigate('/tasks');
  }, [dispatch, navigate]);

  // Handle task updated callback
  const handleTaskUpdated = useCallback((callback) => {
    updateTaskCallbackRef.current = callback;
  }, []);

  // Stable modal handlers
  const handleCloseCreateTeam = useCallback(() => dispatch(closeCreateTeamModal()), [dispatch]);
  const handleCloseCreateTask = useCallback(() => dispatch(closeCreateTaskModal()), [dispatch]);
  const handleCloseEditTask = useCallback((result) => {
    dispatch(closeEditTaskModal());
    // If task was updated, update it in the list without refetching
    if (result?.updated && result?.task && updateTaskCallbackRef.current) {
      updateTaskCallbackRef.current(result.task);
      // Refresh teams cache when task is updated
      dispatch(refreshTeams());
    }
  }, [dispatch]);
  const handleCloseEditTeam = useCallback(() => {
    dispatch(closeEditTeamModal());
    // Refresh teams to ensure UI is updated
    dispatch(refreshTeams());
    dispatch(bumpTeamsRefresh());
  }, [dispatch]);

  // Stable modal open handlers
  const handleOpenCreateTeam = useCallback(() => dispatch(openCreateTeamModal()), [dispatch]);
  const handleOpenCreateTask = useCallback(() => dispatch(openCreateTaskModal()), [dispatch]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TeamsList
                  onCreateTeam={handleOpenCreateTeam}
                  onEditTeam={handleEditTeam}
                  onViewTeam={handleViewTeam}
                  refreshTrigger={teamsRefreshTrigger}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Reports selectedTeam={selectedTeam} />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CalendarView selectedTeam={selectedTeam} />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TasksList
                  onCreateTask={handleOpenCreateTask}
                  onEditTask={handleEditTask}
                  onTaskUpdated={handleTaskUpdated}
                  selectedTeam={selectedTeam}
                  refreshTrigger={tasksRefreshTrigger}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:teamId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TasksList
                  onCreateTask={handleOpenCreateTask}
                  onEditTask={handleEditTask}
                  onTaskUpdated={handleTaskUpdated}
                  selectedTeam={selectedTeam}
                  refreshTrigger={tasksRefreshTrigger}
                />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ProfileSettings />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:teamId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TeamChat />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Public accept invite route (user must be logged in, but we show route for convenience) */}
        <Route
          path="/accept-invite"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AcceptInvite />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-theme-secondary">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-theme-primary mb-4">404</h1>
                <p className="text-theme-secondary mb-8">Page not found</p>
                <a
                  href="/dashboard"
                  className="btn-primary"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>

      {/* Modals - Render at app level to prevent re-mounting of page components */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={handleCloseCreateTeam}
        onSubmit={handleCreateTeam}
      />

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={handleCloseCreateTask}
        onSubmit={handleCreateTask}
        teamId={selectedTeam}
      />

      <EditTaskModal
        isOpen={showEditTaskModal}
        taskId={editingTask}
        onClose={handleCloseEditTask}
      />

      <EditTeamModal
        isOpen={showEditTeamModal}
        teamId={editingTeam}
        onClose={handleCloseEditTeam}
      />
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
