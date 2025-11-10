import { useState, useEffect, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../config/api';
import {
  Plus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  MessageSquare
} from 'lucide-react';
import InviteMemberModal from './InviteMemberModal';
import TeamMembersModal from './TeamMembersModal';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import { fetchTeams, refreshTeams, removeTeam } from '../../store/slices/teamsSlice';

const TeamsList = memo(({ onCreateTeam, onEditTeam, onViewTeam, refreshTrigger }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const teams = useSelector((s) => s.teams.teams);
  const loading = useSelector((s) => s.teams.loading);
  const error = useSelector((s) => s.teams.error);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [inviteModalTeamId, setInviteModalTeamId] = useState(null);
  const [manageMembersTeam, setManageMembersTeam] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    teamId: null,
    teamName: null,
    onConfirm: null
  });

  // Fetch teams on mount - will use cache if available
  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  // Force refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      dispatch(refreshTeams());
    }
  }, [refreshTrigger, dispatch]);

  const handleDeleteTeam = async (teamId, teamName) => {
    setDeleteModal({
      isOpen: true,
      teamId,
      teamName,
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${teamId}`);
          dispatch(removeTeam(teamId));
          // Also refresh to ensure cache is fully updated
          dispatch(refreshTeams());
          setActionMenuOpen(null);
        } catch (error) {
          console.error('Error deleting team:', error);
          alert('Failed to delete team');
        }
      }
    });
  };

  const openInviteModal = useCallback((teamId) => {
    setInviteModalTeamId(teamId);
  }, []);

  const closeInviteModal = useCallback(() => {
    setInviteModalTeamId(null);
  }, []);

  const handleRemoveMember = async (teamId, userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this team?`)) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      dispatch(refreshTeams()); // Refresh teams data
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'creator':
        return 'bg-theme-secondary text-theme-primary';
      case 'admin':
        return 'bg-theme-secondary text-theme-primary';
      default:
        return 'bg-theme-secondary text-theme-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={() => dispatch(fetchTeams(true))} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Teams</h1>
          <p className="text-theme-secondary">Manage your teams and collaborate with others</p>
        </div>
        <button
          onClick={onCreateTeam}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-theme-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">No teams yet</h3>
          <p className="text-theme-tertiary mb-6">Get started by creating your first team</p>
          <button
            onClick={onCreateTeam}
            className="btn-primary flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-theme-primary mb-1">
                      {team.name}
                    </h3>
                    <p className="text-sm text-theme-secondary line-clamp-2">
                      {team.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === team.id ? null : team.id)}
                      className="p-1 text-theme-tertiary hover:text-theme-secondary rounded-full hover:bg-theme-secondary"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {actionMenuOpen === team.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-theme-primary rounded-md shadow-lg py-1 z-10 border border-theme-primary">
                        <button
                          onClick={() => {
                            onViewTeam(team.id);
                            setActionMenuOpen(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/chat/${team.id}`;
                            setActionMenuOpen(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Team Chat
                        </button>
                        {(team.role === 'creator' || team.role === 'admin') && (
                          <>
                            <button
                              onClick={() => {
                                setManageMembersTeam(team);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Members
                            </button>
                            <button
                              onClick={() => {
                                openInviteModal(team.id);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </button>
                          </>
                        )}

                        {team.role === 'creator' && (
                          <>
                            <button
                              onClick={() => {
                                onEditTeam(team.id);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-theme-primary hover:bg-theme-secondary"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Team
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
                      {team.role}
                    </span>
                    {team.joined_at && (
                      <span className="text-xs text-theme-tertiary">
                        Joined {new Date(team.joined_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewTeam(team.id)}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-accent-primary border border-accent-primary rounded hover:bg-accent-primary hover:text-white transition-colors text-gray-400 hover:bg-gray-800"
                    >
                      View Tasks
                    </button>
                    <button
                      onClick={() => window.location.href = `/chat/${team.id}`}
                      className="flex-1 px-3 py-1.5 text-sm font-medium bg-accent-primary text-white rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InviteMemberModal
        isOpen={Boolean(inviteModalTeamId)}
        teamId={inviteModalTeamId}
        onClose={closeInviteModal}
      />

      <TeamMembersModal
        isOpen={Boolean(manageMembersTeam)}
        teamId={manageMembersTeam?.id}
        currentUserTeamRole={manageMembersTeam?.role}
        onClose={() => setManageMembersTeam(null)}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, teamId: null, teamName: null, onConfirm: null })}
        onConfirm={deleteModal.onConfirm || (() => {})}
        title="Delete Team"
        message={`Are you sure you want to delete "${deleteModal.teamName}"? This action cannot be undone.`}
        itemName={deleteModal.teamName}
      />
    </div>
  );
});

export default TeamsList;
