import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../config/api';
import { 
  Users, 
  CheckSquare, 
  Plus,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [stats, setStats] = useState({
    totalTeams: 0,
    assignedTasks: { pending: 0, in_progress: 0, completed: 0 },
    createdTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      try {
        const statsResponse = await api.get('/users/stats');
        setStats(statsResponse.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default stats if API fails
        setStats({
          totalTeams: 0,
          assignedTasks: { pending: 0, in_progress: 0, completed: 0 },
          createdTasks: 0,
        });
      }

      // Fetch recent tasks
      try {
        const tasksResponse = await api.get('/tasks/my-tasks');
        setRecentTasks(tasksResponse.data.tasks.slice(0, 5));
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setRecentTasks([]);
      }

      // Fetch user teams
      try {
        const teamsResponse = await api.get('/teams');
        setTeams(teamsResponse.data.teams.slice(0, 3));
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      }

      // Fetch reminders (due soon / overdue)
      try {
        const remindersResponse = await api.get('/tasks/reminders');
        setReminders(remindersResponse.data.reminders || []);
      } catch (error) {
        console.error('Error fetching reminders:', error);
        setReminders([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusColor = (status) => {
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
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
        <h1 className="text-2xl font-bold text-theme-primary">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-theme-secondary mt-1">
          Here's what's happening with your teams and tasks today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-theme-secondary">Total Teams</p>
              <p className="text-2xl font-semibold text-theme-primary">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-theme-secondary">Completed Tasks</p>
              <p className="text-2xl font-semibold text-theme-primary">{stats.assignedTasks.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-theme-secondary">Pending Tasks</p>
              <p className="text-2xl font-semibold text-theme-primary">{stats.assignedTasks.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-theme-secondary">Tasks Created</p>
              <p className="text-2xl font-semibold text-theme-primary">{stats.createdTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary">
          <div className="px-6 py-4 border-b border-theme-primary">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-theme-primary">Recent Tasks</h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-accent-primary hover:text-accent-primary-hover text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
                <p className="text-theme-secondary">No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-theme-primary">{task.title}</h3>
                      <p className="text-sm text-theme-secondary">{task.team_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Teams */}
        <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary">
          <div className="px-6 py-4 border-b border-theme-primary">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-theme-primary">My Teams</h2>
              <button
                onClick={() => navigate('/teams')}
                className="text-accent-primary hover:text-accent-primary-hover text-sm font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
                <p className="text-theme-secondary mb-4">You're not part of any teams yet</p>
                <button
                  onClick={() => navigate('/teams')}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-theme-primary">{team.name}</h3>
                      <p className="text-sm text-theme-secondary">{team.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-theme-secondary text-accent-primary rounded-full text-xs font-medium">
                        {team.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary">
        <div className="px-6 py-4 border-b border-theme-primary">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-theme-primary">Due Soon & Overdue</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-accent-primary hover:text-accent-primary-hover text-sm font-medium"
            >
              View tasks
            </button>
          </div>
        </div>
        <div className="p-6">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
              <p className="text-theme-secondary">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-theme-primary">{task.title}</h3>
                    <p className="text-sm text-theme-secondary">{task.team_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-theme-secondary">
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary p-6">
        <h2 className="text-lg font-medium text-theme-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/teams')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-theme-secondary rounded-lg hover:border-accent-primary hover:bg-theme-secondary transition-colors"
          >
            <Plus className="h-6 w-6 text-theme-tertiary mr-2" />
            <span className="text-sm font-medium text-theme-primary">Create Team</span>
          </button>
          
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-theme-secondary rounded-lg hover:border-accent-primary hover:bg-theme-secondary transition-colors"
          >
            <CheckSquare className="h-6 w-6 text-theme-tertiary mr-2" />
            <span className="text-sm font-medium text-theme-primary">View Tasks</span>
          </button>
          
          <button
            onClick={() => navigate('/teams')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-theme-secondary rounded-lg hover:border-accent-primary hover:bg-theme-secondary transition-colors"
          >
            <Users className="h-6 w-6 text-theme-tertiary mr-2" />
            <span className="text-sm font-medium text-theme-primary">Manage Teams</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
