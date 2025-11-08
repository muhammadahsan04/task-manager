import { useEffect, useMemo, useState, useCallback } from "react"
import { useSelector, useDispatch } from "react-redux"
import api from "../../config/api"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import TaskDetailModal from "../tasks/TaskDetailModal"
import { fetchTeams } from "../../store/slices/teamsSlice"

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 1)
// Use local date to avoid timezone shifting the day
const formatKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const buildCalendarMatrix = (currentMonth) => {
	const start = startOfMonth(currentMonth)
	const end = endOfMonth(currentMonth)
	const startDay = new Date(start)
	startDay.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // Monday-start
	const weeks = []
	let day = startDay
	while (day <= end || weeks.length < 6) {
		const week = []
		for (let i = 0; i < 7; i += 1) {
			week.push(new Date(day))
			day = new Date(day)
			day.setDate(day.getDate() + 1)
		}
		weeks.push(week)
		if (weeks.length >= 6 && day > end) break
	}
	return weeks
}

const CalendarView = ({ selectedTeam }) => {
	const dispatch = useDispatch()
	const teams = useSelector((s) => s.teams.teams)
	const [month, setMonth] = useState(() => startOfMonth(new Date()))
	const [tasksByDate, setTasksByDate] = useState({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [activeTaskId, setActiveTaskId] = useState(null)
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [teamId, setTeamId] = useState(selectedTeam || '')

	const weeks = useMemo(() => buildCalendarMatrix(month), [month])

	const fetchMonthTasks = useCallback(async () => {
		const team = teamId || selectedTeam
		if (!team) return
		try {
			setLoading(true)
			setError(null)
			// Fetch all tasks for team; client-group by due_date for now
			const res = await api.get(`/tasks/team/${team}`)
			const map = {}
			for (const task of res.data.tasks || []) {
				if (!task.due_date) continue
				const key = formatKey(new Date(task.due_date))
				if (!map[key]) map[key] = []
				map[key].push(task)
			}
			setTasksByDate(map)
		} catch (e) {
			setError("Failed to load calendar tasks")
		} finally {
			setLoading(false)
		}
	}, [selectedTeam, teamId])

	useEffect(() => {
		fetchMonthTasks()
	}, [selectedTeam, teamId, month, fetchMonthTasks])

  useEffect(() => {
    // Fetch teams from Redux (will use cache if available)
    dispatch(fetchTeams())
  }, [dispatch])

  useEffect(() => {
    // Set teamId when teams are loaded or selectedTeam changes
    if (!teamId && selectedTeam) setTeamId(selectedTeam)
    if (!teamId && !selectedTeam && teams.length > 0) {
      setTeamId(teams[0].id)
    }
  }, [selectedTeam, teams, teamId])

	const openTask = (taskId) => {
		setActiveTaskId(taskId)
		setIsTaskModalOpen(true)
	}
	const closeTask = () => {
		setIsTaskModalOpen(false)
		setActiveTaskId(null)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-theme-primary flex items-center"><CalendarIcon className="h-5 w-5 mr-2"/>Calendar</h1>
				<div className="flex items-center gap-2">
					<select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input-field">
						<option value="" disabled>Select team</option>
						{teams.map((t) => (
							<option key={t.id} value={t.id}>{t.name}</option>
						))}
					</select>
					<button className="px-2 py-1 rounded border border-theme-primary text-theme-primary bg-theme-secondary hover:bg-theme-tertiary" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-4 w-4"/></button>
					<div className="text-theme-primary font-medium">
						{month.toLocaleString('default', { month: 'long', year: 'numeric' })}
					</div>
					<button className="px-2 py-1 rounded border border-theme-primary text-theme-primary bg-theme-secondary hover:bg-theme-tertiary" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4"/></button>
				</div>
			</div>

			<div className="bg-theme-primary rounded-lg shadow-theme-sm border border-theme-primary">
				<div className="grid grid-cols-7 text-xs text-theme-tertiary border-b border-theme-primary">
					{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
						<div key={d} className="px-3 py-2">{d}</div>
					))}
				</div>
				{loading ? (
					<div className="flex items-center justify-center py-16">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
					</div>
				) : error ? (
					<div className="p-4 text-red-600">{error}</div>
				) : (
					<div className="grid grid-rows-6">
						{weeks.map((week, wi) => (
							<div key={wi} className="grid grid-cols-7 border-b border-theme-primary last:border-b-0">
								{week.map((day, di) => {
									const inMonth = day.getMonth() === month.getMonth()
									const key = formatKey(day)
									const dayTasks = tasksByDate[key] || []
									return (
										<div key={di} className={`min-h-[96px] border-r border-theme-primary last:border-r-0 p-2 ${inMonth ? 'bg-theme-primary' : 'bg-theme-secondary'}`}>
											<div className={`text-xs ${inMonth ? 'text-theme-primary' : 'text-theme-tertiary'}`}>{day.getDate()}</div>
											<div className="mt-1 space-y-1">
												{dayTasks.slice(0, 3).map((t) => (
													<button key={t.id} onClick={() => openTask(t.id)} className="block w-full text-left truncate px-2 py-1 rounded text-xs border border-theme-primary hover:bg-theme-secondary text-theme-primary" title={t.title}>
														{t.title}
													</button>
												))}
												{dayTasks.length > 3 && (
													<div className="text-[10px] text-theme-tertiary">+{dayTasks.length - 3} more</div>
												)}
											</div>
										</div>
									)
								})}
							</div>
						))}
					</div>
				)}
			</div>

			<TaskDetailModal
				isOpen={isTaskModalOpen}
				taskId={activeTaskId}
				onClose={closeTask}
				onTaskUpdated={() => fetchMonthTasks()}
			/>
		</div>
	)
}

export default CalendarView


