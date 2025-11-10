const express = require('express');
const db = require('../config/database');
const { taskValidation, validate } = require('../middleware/validation');
const { isAuthenticated, isTeamMember } = require('../middleware/auth');

const router = express.Router();

// Get due soon tasks for current user (reminders)
router.get('/reminders', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Tasks due in next 3 days or overdue and not completed
    const tasks = await db('tasks')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.assigned_to', userId)
      .whereNot('tasks.status', 'completed')
      .whereNotNull('tasks.due_date')
      .andWhere('tasks.due_date', '<=', db.raw("now() + interval '3 days'"))
      .select(
        'tasks.id',
        'tasks.title',
        'tasks.status',
        'tasks.priority',
        'tasks.due_date',
        'teams.name as team_name'
      )
      .orderBy('tasks.due_date', 'asc')
      .limit(20);

    res.json({ reminders: tasks });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all tasks for a team
router.get('/team/:teamId', isAuthenticated, isTeamMember, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status, assigned_to, priority } = req.query;
    
    let query = db('tasks')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.team_id', teamId)
      .select(
        'tasks.*',
        db.raw('assignee.name as assignee_name'),
        db.raw('assignee.email as assignee_email'),
        db.raw('creator.name as creator_name'),
        db.raw('teams.name as team_name')
      )
      .orderBy('tasks.created_at', 'desc');
    
    // Apply filters
    if (status) {
      query = query.where('tasks.status', status);
    }
    if (assigned_to) {
      query = query.where('tasks.assigned_to', assigned_to);
    }
    if (priority) {
      query = query.where('tasks.priority', priority);
    }
    
    const tasks = await query;
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tasks assigned to current user
router.get('/my-tasks', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority } = req.query;
    
    let query = db('tasks')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .where('tasks.assigned_to', userId)
      .select(
        'tasks.*',
        'teams.name as team_name',
        db.raw('creator.name as creator_name')
      )
      .orderBy('tasks.created_at', 'desc');
    
    // Apply filters
    if (status) {
      query = query.where('tasks.status', status);
    }
    if (priority) {
      query = query.where('tasks.priority', priority);
    }
    
    const tasks = await query;
    
    res.json({ tasks });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new task
router.post('/team/:teamId', isAuthenticated, isTeamMember, validate(taskValidation.create), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { title, description, priority, assigned_to, due_date } = req.body;
    const createdBy = req.user.id;
    
    // If assigned_to is provided, verify user is team member
    if (assigned_to) {
      const isMember = await db('team_members')
        .where({ team_id: teamId, user_id: assigned_to })
        .first();
      
      if (!isMember) {
        const isCreator = await db('teams')
          .where({ id: teamId, created_by: assigned_to })
          .first();
        
        if (!isCreator) {
          return res.status(400).json({ message: 'Assigned user must be a team member' });
        }
      }
    }
    
    const [newTask] = await db('tasks')
      .insert({
        title,
        description,
        priority: priority || 'medium',
        team_id: teamId,
        assigned_to,
        created_by: createdBy,
        due_date: due_date ? new Date(due_date) : null
      })
      .returning('*');
    
    // Get task with assignee and creator info
    const taskWithDetails = await db('tasks')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .where('tasks.id', newTask.id)
      .select(
        'tasks.*',
        db.raw('assignee.name as assignee_name'),
        db.raw('assignee.email as assignee_email'),
        db.raw('creator.name as creator_name')
      )
      .first();
    
    // If assigned_to exists, notify and email
    if (assigned_to) {
      try {
        const prefs = await db('user_email_preferences').where({ user_id: assigned_to }).first();
        if (!prefs || prefs.instant_task_assigned) {
          const assignee = await db('users').where({ id: assigned_to }).first();
          const creator = await db('users').where({ id: createdBy }).first();
          const { sendTemplatedEmail } = require('../config/mailer');
          const { taskAssignedTemplate } = require('../config/emailTemplates');
          const openUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/tasks/${newTask.id}`;
          const template = taskAssignedTemplate({ creatorName: creator.name, title, openUrl });
          await sendTemplatedEmail({
            to: assignee.email,
            subject: `Task assigned: ${title}`,
            template
          });
        }
      } catch (mailErr) {
        console.warn('Task assign email failed:', mailErr.message);
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: taskWithDetails
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single task
router.get('/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await db('tasks')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .where('tasks.id', taskId)
      .select(
        'tasks.*',
        'teams.name as team_name',
        db.raw('assignee.name as assignee_name'),
        db.raw('assignee.email as assignee_email'),
        db.raw('creator.name as creator_name')
      )
      .first();
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task
    const hasAccess = await db('team_members')
      .where({ team_id: task.team_id, user_id: req.user.id })
      .first();
    
    const isCreator = await db('teams')
      .where({ id: task.team_id, created_by: req.user.id })
      .first();
    
    if (!hasAccess && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update task
router.put('/:taskId', isAuthenticated, validate(taskValidation.update), async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    // Get task details
    const task = await db('tasks').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to update this task
    const hasAccess = await db('team_members')
      .where({ team_id: task.team_id, user_id: req.user.id })
      .first();
    
    const isCreator = await db('teams')
      .where({ id: task.team_id, created_by: req.user.id })
      .first();
    
    if (!hasAccess && !isCreator && task.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If assigned_to is being updated, verify user is team member
    if (updates.assigned_to) {
      const isMember = await db('team_members')
        .where({ team_id: task.team_id, user_id: updates.assigned_to })
        .first();
      
      if (!isMember) {
        const isTeamCreator = await db('teams')
          .where({ id: task.team_id, created_by: updates.assigned_to })
          .first();
        
        if (!isTeamCreator) {
          return res.status(400).json({ message: 'Assigned user must be a team member' });
        }
      }
    }
    
    const [updatedTask] = await db('tasks')
      .where('id', taskId)
      .update({
        ...updates,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete task
router.delete('/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get task details
    const task = await db('tasks').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can delete this task (creator or team admin)
    const isTaskCreator = task.created_by === req.user.id;
    const isTeamCreator = await db('teams')
      .where({ id: task.team_id, created_by: req.user.id })
      .first();
    
    const isTeamAdmin = await db('team_members')
      .where({ team_id: task.team_id, user_id: req.user.id, role: 'admin' })
      .first();
    
    if (!isTaskCreator && !isTeamCreator && !isTeamAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await db('tasks').where('id', taskId).del();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;





