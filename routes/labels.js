const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isTeamMember } = require('../middleware/auth');

const router = express.Router();

// List labels for a team
router.get('/team/:teamId', isAuthenticated, isTeamMember, async (req, res) => {
  try {
    const { teamId } = req.params;
    const labels = await db('labels').where({ team_id: teamId }).orderBy('name', 'asc');
    res.json({ labels });
  } catch (error) {
    console.error('List labels error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create label
router.post('/team/:teamId', isAuthenticated, isTeamMember, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, color = '#64748b' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });

    const [label] = await db('labels')
      .insert({ team_id: teamId, name: name.trim(), color, created_by: req.user.id })
      .returning('*');
    res.status(201).json({ label });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Label name must be unique per team' });
    }
    console.error('Create label error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update label
router.put('/:labelId', isAuthenticated, async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;
    const existing = await db('labels').where('id', labelId).first();
    if (!existing) return res.status(404).json({ message: 'Label not found' });

    // Only team creator or member can update; reuse membership check
    const isMember = await db('team_members').where({ team_id: existing.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: existing.team_id, created_by: req.user.id }).first();
    if (!isMember && !isCreator) return res.status(403).json({ message: 'Access denied' });

    const [updated] = await db('labels')
      .where('id', labelId)
      .update({
        name: name ? name.trim() : existing.name,
        color: color || existing.color,
        updated_at: db.fn.now(),
      })
      .returning('*');
    res.json({ label: updated });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete label
router.delete('/:labelId', isAuthenticated, async (req, res) => {
  try {
    const { labelId } = req.params;
    const existing = await db('labels').where('id', labelId).first();
    if (!existing) return res.status(404).json({ message: 'Label not found' });

    const isMember = await db('team_members').where({ team_id: existing.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: existing.team_id, created_by: req.user.id }).first();
    if (!isMember && !isCreator) return res.status(403).json({ message: 'Access denied' });

    await db('task_labels').where({ label_id: labelId }).del();
    await db('labels').where('id', labelId).del();
    res.json({ message: 'Label deleted' });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Attach labels to task
router.post('/tasks/:taskId/assign', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { labelIds } = req.body; // array
    if (!Array.isArray(labelIds)) return res.status(400).json({ message: 'labelIds must be an array' });

    const task = await db('tasks').where('id', taskId).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isMember = await db('team_members').where({ team_id: task.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: task.team_id, created_by: req.user.id }).first();
    if (!isMember && !isCreator) return res.status(403).json({ message: 'Access denied' });

    // Ensure labels belong to same team
    const labels = await db('labels').whereIn('id', labelIds).andWhere('team_id', task.team_id);
    const validIds = labels.map(l => l.id);
    const inserts = validIds.map((id) => ({ task_id: taskId, label_id: id }));
    if (inserts.length === 0) return res.json({ message: 'No valid labels to assign' });

    await db('task_labels')
      .insert(inserts)
      .onConflict(['task_id', 'label_id']).ignore();

    res.json({ message: 'Labels assigned' });
  } catch (error) {
    console.error('Assign labels error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Detach a label from task
router.delete('/tasks/:taskId/labels/:labelId', isAuthenticated, async (req, res) => {
  try {
    const { taskId, labelId } = req.params;
    const task = await db('tasks').where('id', taskId).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isMember = await db('team_members').where({ team_id: task.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: task.team_id, created_by: req.user.id }).first();
    if (!isMember && !isCreator) return res.status(403).json({ message: 'Access denied' });

    await db('task_labels').where({ task_id: taskId, label_id: labelId }).del();
    res.json({ message: 'Label removed from task' });
  } catch (error) {
    console.error('Detach label error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


