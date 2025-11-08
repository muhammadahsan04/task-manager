import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setSelectedTeam } from '../../store/slices/uiSlice'
import api from '../../config/api'

const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState({ tasks: [], teams: [], users: [], comments: [] })
  const debounced = useDebouncedValue(query, 250)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setResults({ tasks: [], teams: [], users: [], comments: [] })
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    const fetch = async () => {
      if (!debounced.trim()) {
        setResults({ tasks: [], teams: [], users: [], comments: [] })
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/search`, { params: { q: debounced, limit: 8 } })
        // Handle both response structures: res.data.results or res.data directly
        const searchResults = res.data?.results || res.data || { tasks: [], teams: [], users: [], comments: [] }
        setResults(searchResults)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Search failed', e)
        setError('Failed to search. Please try again.')
        setResults({ tasks: [], teams: [], users: [], comments: [] })
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) fetch()
  }, [debounced, isOpen])

  const handleOpenTask = async (taskId) => {
    // eslint-disable-next-line no-console
    console.log('handleOpenTask called with taskId:', taskId)
    // Close modal first to ensure it's unmounted
    onClose()
    
    try {
      // Fetch task details to get team_id
      const response = await api.get(`/tasks/${taskId}`)
      const task = response.data.task
      
      // If task has a team_id, set it as selectedTeam in Redux
      if (task?.team_id) {
        dispatch(setSelectedTeam(task.team_id))
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching task details:', error)
      // Continue anyway - the modal will still open
    }
    
    // Store taskId in sessionStorage so TasksList can pick it up after navigation
    sessionStorage.setItem('openTaskId', taskId.toString())
    // Small delay to ensure SearchModal is fully closed before navigation
    setTimeout(() => {
      // Navigate with state
      navigate('/tasks', { state: { openTaskId: taskId } })
      // Dispatch event multiple times with increasing delays to ensure TasksList receives it
      // This handles cases where TasksList might not be mounted immediately
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('Dispatching openTaskDetail event (200ms delay)')
        window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: { taskId } }))
      }, 200)
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('Dispatching openTaskDetail event (500ms delay)')
        window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: { taskId } }))
      }, 500)
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('Dispatching openTaskDetail event (1000ms delay)')
        window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: { taskId } }))
      }, 1000)
    }, 100) // Wait for SearchModal to close
  }

  const Section = ({ title, children }) => (
    <div>
      <div className="px-3 py-2 text-xs font-medium text-theme-tertiary">{title}</div>
      <div className="divide-y divide-theme-primary border border-theme-primary rounded-lg overflow-hidden mb-3">
        {children}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-theme-primary rounded-lg shadow-xl border border-theme-primary">
        <div className="flex items-center px-4 py-3 border-b border-theme-primary">
          <Search className="h-5 w-5 text-theme-tertiary mr-2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, teams, users, comments..."
            className="flex-1 outline-none text-theme-primary placeholder-theme-tertiary"
          />
          <button onClick={onClose} className="text-theme-tertiary hover:text-theme-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-sm text-red-500 py-10">{error}</div>
          ) : !query.trim() ? (
            <div className="text-center text-sm text-theme-tertiary py-10">Type to search…</div>
          ) : (() => {
            const hasResults = 
              (results.tasks && results.tasks.length > 0) ||
              (results.teams && results.teams.length > 0) ||
              (results.users && results.users.length > 0) ||
              (results.comments && results.comments.length > 0)
            
            if (!hasResults) {
              return (
                <div className="text-center text-sm text-theme-tertiary py-10">
                  No results found for "{query}"
                </div>
              )
            }
            
            return (
              <div className="space-y-4">
                {results.tasks && results.tasks.length > 0 && (
                  <Section title="Tasks">
                    {results.tasks.map((t) => (
                      <button key={t.id} onClick={() => handleOpenTask(t.id)} className="w-full text-left px-4 py-3 hover:bg-theme-secondary">
                        <div className="text-sm font-medium text-theme-primary truncate">{t.title}</div>
                        <div className="text-xs text-theme-tertiary truncate">
                          {t.team_name || 'No team'} · {t.status?.replace('_',' ') || 'No status'} · {t.priority || 'No priority'}
                        </div>
                      </button>
                    ))}
                  </Section>
                )}

                {results.teams && results.teams.length > 0 && (
                  <Section title="Teams">
                    {results.teams.map((team) => (
                      <button key={team.id} onClick={() => { navigate('/teams'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-theme-secondary">
                        <div className="text-sm font-medium text-theme-primary truncate">{team.name}</div>
                      </button>
                    ))}
                  </Section>
                )}

                {results.users && results.users.length > 0 && (
                  <Section title="Users">
                    {results.users.map((u) => (
                      <button key={u.id} onClick={() => { navigate('/profile'); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-theme-secondary">
                        <div className="text-sm font-medium text-theme-primary truncate">{u.name}</div>
                        <div className="text-xs text-theme-tertiary truncate">{u.email}</div>
                      </button>
                    ))}
                  </Section>
                )}

                {results.comments && results.comments.length > 0 && (
                  <Section title="Comments">
                    {results.comments.map((c) => (
                      <button key={c.id} onClick={() => handleOpenTask(c.task_id)} className="w-full text-left px-4 py-3 hover:bg-theme-secondary">
                        <div className="text-sm text-theme-primary truncate">{c.comment}</div>
                        <div className="text-xs text-theme-tertiary truncate">{c.user_name} · {c.task_title}</div>
                      </button>
                    ))}
                  </Section>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default SearchModal


