import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../../config/api'
import { refreshTeams } from '../../store/slices/teamsSlice'

const roleLabel = (r) => r === 'admin' ? 'Admin' : r === 'member' ? 'Member' : r

const TeamMembersModal = ({ isOpen, teamId, currentUserTeamRole, onClose }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [teamCreatorId, setTeamCreatorId] = useState(null)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const canManage = currentUserTeamRole === 'creator' || currentUserTeamRole === 'admin'

  const fetchTeam = useCallback(async () => {
    if (!teamId) return
    try {
      setLoading(true)
      const res = await api.get(`/teams/${teamId}`)
      const t = res.data?.team
      setTeamCreatorId(t?.creator?.id || null)
      setMembers(Array.isArray(t?.members) ? t.members : [])
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load team members', e)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    if (isOpen) fetchTeam()
  }, [isOpen, fetchTeam])

  const changeRole = async (userId, role) => {
    try {
      setUpdatingUserId(userId)
      await api.post(`/teams/${teamId}/members/${userId}/role`, { role })
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m))
      // Refresh teams cache since member role change might affect team data
      dispatch(refreshTeams())
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Change role failed', e)
      alert(e?.response?.data?.message || 'Failed to change role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-16">
      <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-theme-md rounded-lg bg-theme-primary border-theme-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-theme-primary">Manage Team Members</h3>
          <button onClick={onClose} className="text-theme-tertiary hover:text-theme-secondary">✕</button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary mx-auto" />
          </div>
        ) : (
          <div className="border border-theme-primary rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 text-xs text-theme-tertiary border-b border-theme-primary px-3 py-2">
              <div className="col-span-5">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-3">Role</div>
            </div>
            <ul className="divide-y divide-theme-primary">
              {members.map((m) => {
                const isCreator = teamCreatorId && m.id === teamCreatorId
                const isAdmin = m.role === 'admin'
                const canPromoteToAdmin = canManage && !isCreator && m.role !== 'admin'
                const canDemoteToMember = canManage && !isCreator && m.role === 'admin' && currentUserTeamRole === 'creator'
                return (
                  <li key={m.id} className="grid grid-cols-12 items-center px-3 py-2">
                    <div className="col-span-5 truncate text-theme-primary">{m.name}</div>
                    <div className="col-span-4 truncate text-theme-secondary">{m.email}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="text-theme-primary text-xs px-2 py-1 rounded-full bg-theme-secondary">{isCreator ? 'Creator' : roleLabel(m.role)}</span>
                      {canPromoteToAdmin && (
                        <button
                          className="text-xs px-2 py-1 bg-theme-secondary text-theme-primary rounded hover:bg-theme-tertiary disabled:opacity-50"
                          disabled={updatingUserId === m.id}
                          onClick={() => changeRole(m.id, 'admin')}
                          title="Promote to Admin"
                        >Promote</button>
                      )}
                      {canDemoteToMember && (
                        <button
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
                          disabled={updatingUserId === m.id}
                          onClick={() => changeRole(m.id, 'member')}
                          title="Demote to Member"
                        >Demote</button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamMembersModal



















































