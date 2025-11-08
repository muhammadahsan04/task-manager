const express = require('express')
const db = require('../config/database')
const { isAuthenticated } = require('../middleware/auth')

const router = express.Router()

async function assertTaskAccess(taskId, userId) {
  const task = await db('tasks').where({ id: taskId }).first()
  if (!task) return { ok: false, status: 404, message: 'Task not found' }
  const isMember = await db('team_members').where({ team_id: task.team_id, user_id: userId }).first()
  const isCreator = await db('teams').where({ id: task.team_id, created_by: userId }).first()
  if (!isMember && !isCreator && task.created_by !== userId) {
    return { ok: false, status: 403, message: 'Access denied' }
  }
  return { ok: true, task }
}

// GET /api/time-entries/task/:taskId
router.get('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user.id
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const entries = await db('time_entries')
      .where({ task_id: taskId })
      .orderBy('start_time', 'desc')

    const active = await db('time_entries')
      .where({ task_id: taskId, user_id: userId })
      .whereNull('end_time')
      .first()

    res.json({ entries, active })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('GET time entries error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/time-entries/start
router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id
    const { task_id: taskId } = req.body
    if (!taskId) return res.status(400).json({ message: 'task_id is required' })
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const existing = await db('time_entries')
      .where({ task_id: taskId, user_id: userId })
      .whereNull('end_time')
      .first()
    if (existing) return res.status(400).json({ message: 'Timer is already running' })

    const [row] = await db('time_entries')
      .insert({ task_id: taskId, user_id: userId, start_time: db.fn.now() })
      .returning('*')
    res.status(201).json({ message: 'Timer started', entry: row })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Start timer error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/time-entries/stop
router.post('/stop', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id
    const { task_id: taskId } = req.body
    if (!taskId) return res.status(400).json({ message: 'task_id is required' })
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const running = await db('time_entries')
      .where({ task_id: taskId, user_id: userId })
      .whereNull('end_time')
      .first()
    if (!running) return res.status(400).json({ message: 'No running timer' })

    const end = new Date()
    const start = new Date(running.start_time)
    const duration = Math.max(1, Math.round((end - start) / 60000))

    const [updated] = await db('time_entries')
      .where({ id: running.id })
      .update({ end_time: end, duration_minutes: duration })
      .returning('*')
    res.json({ message: 'Timer stopped', entry: updated })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Stop timer error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/time-entries (manual entry)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id
    const { task_id: taskId, start_time, end_time, description } = req.body
    if (!taskId || !start_time || !end_time) {
      return res.status(400).json({ message: 'task_id, start_time, end_time are required' })
    }
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const start = new Date(start_time)
    const end = new Date(end_time)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: 'Invalid time range' })
    }
    const duration = Math.max(1, Math.round((end - start) / 60000))

    const [row] = await db('time_entries')
      .insert({ task_id: taskId, user_id: userId, start_time: start, end_time: end, duration_minutes: duration, description: description || null })
      .returning('*')
    res.status(201).json({ message: 'Time entry added', entry: row })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Create time entry error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router


