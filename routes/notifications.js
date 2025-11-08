const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const notifications = await db('notifications')
      .leftJoin('users as triggered_user', 'notifications.triggered_by', 'triggered_user.id')
      .where('notifications.user_id', userId)
      .select(
        'notifications.*',
        'triggered_user.name as triggered_by_name',
        'triggered_user.email as triggered_by_email'
      )
      .orderBy('notifications.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    // Get unread count
    const unreadCount = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('* as count')
      .first();
    
    res.json({
      notifications,
      unreadCount: parseInt(unreadCount.count)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', isAuthenticated, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Verify notification belongs to user
    const notification = await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .first();
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await db('notifications')
      .where('id', notificationId)
      .update({ is_read: true });
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:notificationId', isAuthenticated, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const deleted = await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear all read notifications
router.delete('/clear-read', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db('notifications')
      .where({ user_id: userId, is_read: true })
      .del();
    
    res.json({ message: 'Read notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
