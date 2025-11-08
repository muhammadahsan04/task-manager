import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import api from '../../config/api'
import { BarChart2, PieChart, TrendingUp } from 'lucide-react'
import { fetchTeams } from '../../store/slices/teamsSlice'

const number = (n) => new Intl.NumberFormat().format(n || 0)

const Reports = ({ selectedTeam }) => {
	const dispatch = useDispatch()
	const teams = useSelector((s) => s.teams.teams)
	const [teamId, setTeamId] = useState(selectedTeam || '')
	const [from, setFrom] = useState('')
	const [to, setTo] = useState('')
	const [data, setData] = useState(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	useEffect(() => {
		// Fetch teams from Redux (will use cache if available)
		dispatch(fetchTeams())
	}, [dispatch])

	useEffect(() => {
		// Set teamId when teams are loaded or selectedTeam changes
		if (!teamId && selectedTeam) setTeamId(selectedTeam)
		if (!teamId && !selectedTeam && teams.length > 0) setTeamId(teams[0].id)
	}, [selectedTeam, teams, teamId])

	useEffect(() => {
		const fetchSummary = async () => {
			if (!teamId) return
			try {
				setLoading(true)
				setError(null)
				const params = new URLSearchParams()
				params.set('teamId', teamId)
				
				// Add date filtering with proper validation
				if (from && from.trim()) {
					params.set('from', from)
				}
				if (to && to.trim()) {
					params.set('to', to)
				}
				
				// If only one date is provided, set the other to create a proper range
				if (from && !to) {
					// If only from date is provided, set to date to today
					const today = new Date().toISOString().split('T')[0]
					params.set('to', today)
				} else if (!from && to) {
					// If only to date is provided, set from date to 30 days before
					const fromDate = new Date(to)
					fromDate.setDate(fromDate.getDate() - 30)
					params.set('from', fromDate.toISOString().split('T')[0])
				}
				
				console.log('Fetching reports with params:', Object.fromEntries(params))
				const res = await api.get(`/reports/summary?${params}`)
				setData(res.data)
			} catch (e) {
				console.error('Error fetching reports:', e)
				setError('Failed to load reports')
			} finally {
				setLoading(false)
			}
		}
		fetchSummary()
	}, [teamId, from, to])

	const statusMap = useMemo(() => {
		const m = { pending: 0, in_progress: 0, completed: 0 }
		const list = Array.isArray(data?.byStatus) ? data.byStatus : []
		list.forEach((s) => {
			const key = typeof s.status === 'string' ? s.status : String(s.status || '')
			const val = Number(s.count)
			if (key) m[key] = Number.isFinite(val) ? val : 0
		})
		return m
	}, [data])

	// Filter data by date range on frontend as well
	const filteredData = useMemo(() => {
		if (!data) return null
		
		const filterByDate = (items, dateField = 'day') => {
			if (!Array.isArray(items)) return items
			
			return items.filter(item => {
				if (!from && !to) return true
				
				const itemDate = item[dateField]
				if (!itemDate) return true
				
				if (from && itemDate < from) return false
				if (to && itemDate > to) return false
				
				return true
			})
		}
		
		return {
			...data,
			createdByDay: filterByDate(data.createdByDay),
			completedByDay: filterByDate(data.completedByDay),
			assigneeCounts: filterByDate(data.assigneeCounts, 'date') || data.assigneeCounts
		}
	}, [data, from, to])

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-theme-primary flex items-center"><TrendingUp className="h-5 w-5 mr-2"/>Reports & Analytics</h1>
				<div className="flex items-center gap-2">
					<select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input-field">
						<option value="" disabled>Select team</option>
						{teams.map((t) => (
							<option key={t.id} value={t.id}>{t.name}</option>
						))}
					</select>
					<div className="flex items-center gap-2">
						<label className="text-sm text-theme-secondary">From:</label>
						<input 
							type="date" 
							value={from} 
							onChange={(e) => setFrom(e.target.value)} 
							className="input-field"
							max={to || new Date().toISOString().split('T')[0]}
						/>
					</div>
					<div className="flex items-center gap-2">
						<label className="text-sm text-theme-secondary">To:</label>
						<input 
							type="date" 
							value={to} 
							onChange={(e) => setTo(e.target.value)} 
							className="input-field"
							min={from}
							max={new Date().toISOString().split('T')[0]}
						/>
					</div>
					<button 
						onClick={() => {
							setFrom('')
							setTo('')
						}}
						className="px-3 py-1 text-sm bg-theme-secondary hover:bg-theme-tertiary rounded border border-theme-primary text-theme-primary"
					>
						Clear
					</button>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-16">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
				</div>
			) : error ? (
				<div className="text-red-600">{error}</div>
			) : filteredData ? (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="bg-theme-primary rounded-lg border border-theme-primary p-4">
						<h2 className="text-sm font-semibold text-theme-primary mb-3 flex items-center"><PieChart className="h-4 w-4 mr-2"/>Status Breakdown</h2>
						<ul className="space-y-2 text-sm">
							<li className="flex justify-between"><span>Pending</span><span className="font-medium">{number(statusMap.pending)}</span></li>
							<li className="flex justify-between"><span>In Progress</span><span className="font-medium">{number(statusMap.in_progress)}</span></li>
							<li className="flex justify-between"><span>Completed</span><span className="font-medium">{number(statusMap.completed)}</span></li>
						</ul>
					</div>

					<div className="bg-theme-primary rounded-lg border border-theme-primary p-4 lg:col-span-2">
						<h2 className="text-sm font-semibold text-theme-primary mb-3 flex items-center"><BarChart2 className="h-4 w-4 mr-2"/>Tasks Created vs Completed</h2>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-theme-secondary">
										<th className="py-1 pr-4">Day</th>
										<th className="py-1 pr-4">Created</th>
										<th className="py-1">Completed</th>
									</tr>
								</thead>
								<tbody>
									{Array.from(new Set([...(filteredData.createdByDay||[]).map(d=>d.day), ...(filteredData.completedByDay||[]).map(d=>d.day)])).sort().map((day) => {
										const c = (filteredData.createdByDay||[]).find(d=>d.day===day)?.count || 0
										const d = (filteredData.completedByDay||[]).find(d=>d.day===day)?.count || 0
										return (
											<tr key={day} className="border-t border-theme-primary">
												<td className="py-1 pr-4 text-theme-primary">{day}</td>
												<td className="py-1 pr-4">{number(c)}</td>
												<td className="py-1">{number(d)}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>

					<div className="bg-theme-primary rounded-lg border border-theme-primary p-4 lg:col-span-3">
						<h2 className="text-sm font-semibold text-theme-primary mb-3">Top Assignees</h2>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-theme-secondary">
										<th className="py-1 pr-4">Assignee</th>
										<th className="py-1">Tasks</th>
									</tr>
								</thead>
								<tbody>
									{(filteredData.assigneeCounts||[]).map((row) => (
										<tr key={row.assignee_name} className="border-t border-theme-primary">
											<td className="py-1 pr-4 text-theme-primary">{row.assignee_name}</td>
											<td className="py-1">{number(row.count)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			) : (
				<div className="text-theme-secondary">Select a team to view reports.</div>
			)}
		</div>
	)
}

export default Reports



