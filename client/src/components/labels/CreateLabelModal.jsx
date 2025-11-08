import { useState, useCallback, useEffect } from "react"
import api from "../../config/api"

const DEFAULT_COLOR = "#64748b"

const CreateLabelModal = ({ isOpen, teamId, onClose, onCreated }) => {
	const [name, setName] = useState("")
	const [color, setColor] = useState(DEFAULT_COLOR)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState(null)

	useEffect(() => {
		if (isOpen) {
			setName("")
			setColor(DEFAULT_COLOR)
			setError(null)
		}
	}, [isOpen])

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault()
		if (!teamId) return
		try {
			setSubmitting(true)
			setError(null)
			const res = await api.post(`/labels/team/${teamId}`, { name: name.trim(), color })
			onCreated && onCreated(res.data.label)
			onClose && onClose()
		} catch (err) {
			const msg = err?.response?.data?.message || "Failed to create label"
			setError(msg)
		} finally {
			setSubmitting(false)
		}
	}, [teamId, name, color, onCreated, onClose])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30" onClick={onClose} />
			<div className="relative w-full max-w-md rounded-lg shadow-theme-md border border-theme-primary p-6 bg-theme-primary">
				<h2 className="text-lg font-semibold text-theme-primary mb-4">Create Label</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1">Name</label>
						<input
							type="text"
							className="input-field w-full"
							placeholder="e.g. Bug, Feature, Design"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							maxLength={40}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-theme-primary mb-1">Color</label>
						<div className="flex items-center gap-3">
							<input
								type="color"
								className="h-10 w-12 p-0 border border-theme-primary rounded bg-theme-primary"
								value={color}
								onChange={(e) => setColor(e.target.value)}
							/>
							<input
								type="text"
								className="input-field flex-1"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								pattern="#?[0-9a-fA-F]{3,6}"
							/>
						</div>
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex justify-end gap-2 pt-2">
						<button type="button" onClick={onClose} className="px-4 py-2 rounded border border-theme-primary text-theme-primary hover:bg-theme-secondary">Cancel</button>
						<button type="submit" disabled={submitting || !name.trim()} className="btn-primary inline-flex items-center justify-center disabled:opacity-60">
							{submitting ? "Creating..." : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default CreateLabelModal



