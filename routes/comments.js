const express = require('express');
const db = require('../config/database');
const { isAuthenticated, isTeamMember } = require('../middleware/auth');

const router = express.Router();

// Helper function to create notification
async function createNotification(userId, type, title, message, relatedTaskId, triggeredBy) {
  try {
    await db('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      related_task_id: relatedTaskId,
      triggered_by: triggeredBy
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper function to log activity
async function logActivity(taskId, userId, actionType, fieldChanged, oldValue, newValue, description) {
  try {
    await db('task_activity').insert({
      task_id: taskId,
      user_id: userId,
      action_type: actionType,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
      description
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Get comments for a task
router.get('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get task to verify access
    const task = await db('tasks').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user has access to this task's team
    const hasAccess = await db('team_members')
      .where({ team_id: task.team_id, user_id: req.user.id })
      .first();
    
    const isCreator = await db('teams')
      .where({ id: task.team_id, created_by: req.user.id })
      .first();
    
    if (!hasAccess && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get comments
    const comments = await db('task_comments')
      .join('users', 'task_comments.user_id', 'users.id')
      .where('task_comments.task_id', taskId)
      .select(
        'task_comments.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('task_comments.created_at', 'asc');
    
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create comment
router.post('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    // Get task to verify access
    const task = await db('tasks')
      .where('id', taskId)
      .first();
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user has access
    const hasAccess = await db('team_members')
      .where({ team_id: task.team_id, user_id: userId })
      .first();
    
    const isCreator = await db('teams')
      .where({ id: task.team_id, created_by: userId })
      .first();
    
    if (!hasAccess && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create comment
    const [newComment] = await db('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        comment: comment.trim()
      })
      .returning('*');
    
    // Get user info
    const user = await db('users')
      .where('id', userId)
      .select('name', 'email')
      .first();
    
    // Log activity
    await logActivity(
      taskId,
      userId,
      'commented',
      null,
      null,
      null,
      `${user.name} commented on the task`
    );
    
    // Create notification for task assignee (if not the commenter)
    if (task.assigned_to && task.assigned_to !== userId) {
      await createNotification(
        task.assigned_to,
        'comment_added',
        'New Comment',
        `${user.name} commented on "${task.title}"`,
        taskId,
        userId
      );
      // Send email if user prefers instant comment emails
      try {
        const prefs = await db('user_email_preferences').where({ user_id: task.assigned_to }).first();
        if (!prefs || prefs.instant_comment) {
          const assignee = await db('users').where({ id: task.assigned_to }).first();
          const { sendEmail } = require('../config/mailer');
          await sendEmail({
            to: assignee.email,
            subject: `New comment on: ${task.title}`,
            text: `${user.name} ne aap ke task par comment kiya: ${comment.trim()}`,
            html: `<p><strong>${user.name}</strong> ne aap ke task par comment kiya:</p><blockquote>${comment.trim()}</blockquote>`
          });
        }
      } catch (mailErr) {
        console.warn('Comment email failed:', mailErr.message);
      }
    }
    
    // Create notification for task creator (if not the commenter or assignee)
    if (task.created_by !== userId && task.created_by !== task.assigned_to) {
      await createNotification(
        task.created_by,
        'comment_added',
        'New Comment',
        `${user.name} commented on "${task.title}"`,
        taskId,
        userId
      );
      // Send email to creator if prefers
      try {
        const prefs = await db('user_email_preferences').where({ user_id: task.created_by }).first();
        if (!prefs || prefs.instant_comment) {
          const creator = await db('users').where({ id: task.created_by }).first();
          const { sendEmail } = require('../config/mailer');
          await sendEmail({
            to: creator.email,
            subject: `New comment on: ${task.title}`,
            text: `${user.name} ne aap ke task par comment kiya: ${comment.trim()}`,
            html: `<p><strong>${user.name}</strong> ne aap ke task par comment kiya:</p><blockquote>${comment.trim()}</blockquote>`
          });
        }
      } catch (mailErr) {
        console.warn('Comment email (creator) failed:', mailErr.message);
      }
    }
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...newComment,
        user_name: user.name,
        user_email: user.email
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update comment
router.put('/:commentId', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    // Verify comment belongs to user
    const existingComment = await db('task_comments')
      .where({ id: commentId, user_id: userId })
      .first();
    
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found or access denied' });
    }
    
    // Update comment
    const [updatedComment] = await db('task_comments')
      .where('id', commentId)
      .update({
        comment: comment.trim(),
        is_edited: true,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete comment
router.delete('/:commentId', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    // Verify comment belongs to user
    const deleted = await db('task_comments')
      .where({ id: commentId, user_id: userId })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Comment not found or access denied' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get activity for a task
router.get('/task/:taskId/activity', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get task to verify access
    const task = await db('tasks').where('id', taskId).first();
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify access
    const hasAccess = await db('team_members')
      .where({ team_id: task.team_id, user_id: req.user.id })
      .first();
    
    const isCreator = await db('teams')
      .where({ id: task.team_id, created_by: req.user.id })
      .first();
    
    if (!hasAccess && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get activity
    const activity = await db('task_activity')
      .join('users', 'task_activity.user_id', 'users.id')
      .where('task_activity.task_id', taskId)
      .select(
        'task_activity.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('task_activity.created_at', 'desc');
    
    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
