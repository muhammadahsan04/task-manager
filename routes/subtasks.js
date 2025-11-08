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

// GET /api/subtasks/task/:taskId
router.get('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user.id
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const subs = await db('sub_tasks').where({ parent_task_id: taskId }).orderBy('id', 'asc')
    res.json({ subtasks: subs })
  } catch (e) {
    console.error('Get subtasks error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/subtasks/task/:taskId
router.post('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params
    const { title } = req.body
    const userId = req.user.id
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' })
    const access = await assertTaskAccess(taskId, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const [row] = await db('sub_tasks')
      .insert({ parent_task_id: taskId, title: title.trim(), created_by: userId })
      .returning('*')

    res.status(201).json({ message: 'Subtask created', subtask: row })
  } catch (e) {
    console.error('Create subtask error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /api/subtasks/:id
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body
    const userId = req.user.id
    const sub = await db('sub_tasks').where({ id }).first()
    if (!sub) return res.status(404).json({ message: 'Subtask not found' })
    const access = await assertTaskAccess(sub.parent_task_id, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const [updated] = await db('sub_tasks')
      .where({ id })
      .update({ title: title?.trim() || sub.title, updated_at: db.fn.now() })
      .returning('*')

    res.json({ message: 'Subtask updated', subtask: updated })
  } catch (e) {
    console.error('Update subtask error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /api/subtasks/:id/toggle
router.patch('/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const sub = await db('sub_tasks').where({ id }).first()
    if (!sub) return res.status(404).json({ message: 'Subtask not found' })
    const access = await assertTaskAccess(sub.parent_task_id, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    const [updated] = await db('sub_tasks')
      .where({ id })
      .update({ is_completed: !sub.is_completed, updated_at: db.fn.now() })
      .returning('*')

    res.json({ message: 'Subtask toggled', subtask: updated })
  } catch (e) {
    console.error('Toggle subtask error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /api/subtasks/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const sub = await db('sub_tasks').where({ id }).first()
    if (!sub) return res.status(404).json({ message: 'Subtask not found' })
    const access = await assertTaskAccess(sub.parent_task_id, userId)
    if (!access.ok) return res.status(access.status).json({ message: access.message })

    await db('sub_tasks').where({ id }).del()
    res.json({ message: 'Subtask deleted' })
  } catch (e) {
    console.error('Delete subtask error', e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
