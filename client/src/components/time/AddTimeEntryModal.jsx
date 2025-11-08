import { useEffect, useMemo, useState, useCallback } from 'react'
import api from '../../config/api'

const toISOStringFromLocal = (dateStr, timeStr) => {
	if (!dateStr || !timeStr) return null
	const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
	const d = new Date(dateStr)
	d.setHours(h || 0, m || 0, 0, 0)
	return d.toISOString()
}

const AddTimeEntryModal = ({ isOpen, onClose, taskId, onCreated }) => {
	const [date, setDate] = useState('')
	const [startTime, setStartTime] = useState('')
	const [endTime, setEndTime] = useState('')
	const [description, setDescription] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [errors, setErrors] = useState({})

	useEffect(() => {
		if (isOpen) {
			const today = new Date().toISOString().slice(0, 10)
			setDate(today)
			setStartTime('')
			setEndTime('')
			setDescription('')
			setErrors({})
		}
	}, [isOpen])

	const validate = () => {
		const e = {}
		if (!date) e.date = 'Date is required'
		if (!startTime && !endTime) {
			e.time = 'Provide start and end times'
		} else if (!startTime || !endTime) {
			e.time = 'Both start and end are required'
		}
		setErrors(e)
		return Object.keys(e).length === 0
	}

	const handleSubmit = useCallback(async (ev) => {
		ev.preventDefault()
		if (!validate()) return
		try {
			setSubmitting(true)
			const payload = {
				task_id: taskId,
				start_time: toISOStringFromLocal(date, startTime),
				end_time: toISOStringFromLocal(date, endTime),
				description: description?.trim() || null,
			}
			await api.post('/time-entries', payload)
			onCreated && onCreated()
			onClose && onClose()
		} catch (e) {
			setErrors((prev) => ({ ...prev, submit: e?.response?.data?.message || 'Failed to create time entry' }))
		} finally {
			setSubmitting(false)
		}
	}, [taskId, date, startTime, endTime, description, onCreated, onClose])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
			<div className="relative mx-auto p-6 border w-full max-w-md shadow-theme-md rounded-lg bg-theme-primary border-theme-primary transform transition-all duration-200 ease-out">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-theme-primary">Add Time Entry</h3>
					<button onClick={onClose} disabled={submitting} className="text-theme-tertiary hover:text-theme-secondary disabled:opacity-50">✕</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1">Date</label>
						<input type="date" className="input-field w-full" value={date} onChange={(e) => setDate(e.target.value)} disabled={submitting} />
						{errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-theme-primary mb-1">Start</label>
							<input type="time" className="input-field w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={submitting} />
						</div>
						<div>
							<label className="block text-sm font-medium text-theme-primary mb-1">End</label>
							<input type="time" className="input-field w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={submitting} />
						</div>
					</div>
					{errors.time && <p className="-mt-2 text-sm text-red-600">{errors.time}</p>}
					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1">Description (optional)</label>
						<textarea rows={3} className="input-field w-full resize-none" value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
					</div>
					{errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
					<div className="flex justify-end gap-2 pt-2">
						<button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-theme-primary bg-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors disabled:opacity-50" disabled={submitting}>Cancel</button>
						<button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : 'Save Entry'}</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default AddTimeEntryModal


