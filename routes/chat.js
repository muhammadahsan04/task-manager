const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const { body, validationResult, param } = require('express-validator');

// Get chat messages for a team with pagination
router.get('/teams/:teamId/messages', 
  isAuthenticated,
  param('teamId').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Check if user is a member of the team
      const membership = await db('team_members')
        .where({ team_id: teamId, user_id: req.user.id })
        .first();

      if (!membership) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }

      // Get messages with sender information
      const messages = await db('chat_messages')
        .where({ team_id: teamId })
        .leftJoin('users', 'chat_messages.sender_id', 'users.id')
        .select(
          'chat_messages.id',
          'chat_messages.team_id',
          'chat_messages.sender_id',
          'chat_messages.message',
          'chat_messages.message_type',
          'chat_messages.metadata',
          'chat_messages.is_edited',
          'chat_messages.edited_at',
          'chat_messages.created_at',
          'users.name as sender_name',
          'users.email as sender_email'
        )
        .orderBy('chat_messages.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Get total count
      const [{ count }] = await db('chat_messages')
        .where({ team_id: teamId })
        .count('* as count');

      res.json({
        messages: messages.reverse(), // Reverse to show oldest first
        total: parseInt(count),
        hasMore: parseInt(offset) + messages.length < parseInt(count)
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
  }
);

// Send a new chat message
router.post('/teams/:teamId/messages',
  isAuthenticated,
  param('teamId').isInt(),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('message_type').optional().isIn(['text', 'file', 'system']),
  body('metadata').optional().isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId } = req.params;
      const { message, message_type = 'text', metadata } = req.body;

      // Check if user is a member of the team
      const membership = await db('team_members')
        .where({ team_id: teamId, user_id: req.user.id })
        .first();

      if (!membership) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }

      // Insert message
      const [newMessage] = await db('chat_messages')
        .insert({
          team_id: teamId,
          sender_id: req.user.id,
          message,
          message_type,
          metadata: metadata ? JSON.stringify(metadata) : null
        })
        .returning('*');

      // Get sender info
      const sender = await db('users')
        .where({ id: req.user.id })
        .select('id', 'name', 'email')
        .first();

      const messageWithSender = {
        ...newMessage,
        sender_name: sender.name,
        sender_email: sender.email
      };

      // Emit socket event to team room
      const io = req.app.get('io');
      io.to(`team_${teamId}`).emit('new_message', messageWithSender);

      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message', error: error.message });
    }
  }
);

// Edit a chat message
router.put('/messages/:messageId',
  isAuthenticated,
  param('messageId').isInt(),
  body('message').trim().notEmpty().withMessage('Message is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const { message } = req.body;

      // Check if message exists and user is the sender
      const existingMessage = await db('chat_messages')
        .where({ id: messageId })
        .first();

      if (!existingMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (existingMessage.sender_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only edit your own messages' });
      }

      // Update message
      const [updatedMessage] = await db('chat_messages')
        .where({ id: messageId })
        .update({
          message,
          is_edited: true,
          edited_at: db.fn.now(),
          updated_at: db.fn.now()
        })
        .returning('*');

      // Get sender info
      const sender = await db('users')
        .where({ id: req.user.id })
        .select('id', 'name', 'email')
        .first();

      const messageWithSender = {
        ...updatedMessage,
        sender_name: sender.name,
        sender_email: sender.email
      };

      // Emit socket event
      const io = req.app.get('io');
      io.to(`team_${existingMessage.team_id}`).emit('message_edited', messageWithSender);

      res.json(messageWithSender);
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({ message: 'Error editing message', error: error.message });
    }
  }
);

// Delete a chat message
router.delete('/messages/:messageId',
  isAuthenticated,
  param('messageId').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;

      // Check if message exists and user is the sender
      const existingMessage = await db('chat_messages')
        .where({ id: messageId })
        .first();

      if (!existingMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (existingMessage.sender_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own messages' });
      }

      // Delete message
      await db('chat_messages')
        .where({ id: messageId })
        .del();

      // Emit socket event
      const io = req.app.get('io');
      io.to(`team_${existingMessage.team_id}`).emit('message_deleted', { id: messageId });

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
  }
);

// Get unread message count for a user across all teams
router.get('/unread-count',
  isAuthenticated,
  async (req, res) => {
    try {
      // This is a placeholder - you can implement read receipts later
      // For now, return 0
      res.json({ unreadCount: 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Error fetching unread count', error: error.message });
    }
  }
);

module.exports = router;
