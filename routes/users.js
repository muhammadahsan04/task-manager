const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Get all users (for team member selection)
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }
    
    const users = await db('users')
      .where(function() {
        this.where('name', 'ilike', `%${q}%`)
            .orWhere('email', 'ilike', `%${q}%`);
      })
      .select('id', 'name', 'email')
      .limit(10);
    
    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await db('users')
      .where('id', userId)
      .select('id', 'name', 'email', 'created_at')
      .first();
    
    // Get user's teams
    const teams = await db('teams')
      .leftJoin('team_members', 'teams.id', 'team_members.team_id')
      .where(function() {
        this.where('teams.created_by', userId)
            .orWhere('team_members.user_id', userId);
      })
      .select(
        'teams.id',
        'teams.name',
        'teams.description',
        db.raw('CASE WHEN teams.created_by = ? THEN \'creator\' ELSE team_members.role END as role', [userId])
      )
      .distinct();
    
    // Get user's tasks
    const tasks = await db('tasks')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.assigned_to', userId)
      .select(
        'tasks.id',
        'tasks.title',
        'tasks.status',
        'tasks.priority',
        'tasks.due_date',
        'teams.name as team_name'
      )
      .orderBy('tasks.created_at', 'desc')
      .limit(10);
    
    res.json({
      user,
      teams,
      recentTasks: tasks
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    
    const [updatedUser] = await db('users')
      .where('id', userId)
      .update({
        name: name.trim(),
        updated_at: db.fn.now()
      })
      .returning(['id', 'name', 'email', 'updated_at']);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/password', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get user's current password
    const user = await db('users')
      .where('id', userId)
      .select('password')
      .first();
    
    // Verify current password
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db('users')
      .where('id', userId)
      .update({
        password: hashedPassword,
        updated_at: db.fn.now()
      });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get task statistics
    const taskStats = await db('tasks')
      .where('assigned_to', userId)
      .select('status')
      .count('* as count')
      .groupBy('status');
    
    // Get team statistics
    const teamStats = await db('teams')
      .leftJoin('team_members', 'teams.id', 'team_members.team_id')
      .where(function() {
        this.where('teams.created_by', userId)
            .orWhere('team_members.user_id', userId);
      })
      .countDistinct('teams.id as total_teams');
    
    // Get tasks created by user
    const createdTasks = await db('tasks')
      .where('created_by', userId)
      .count('* as count')
      .first();
    
    const stats = {
      assignedTasks: taskStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, { pending: 0, in_progress: 0, completed: 0 }),
      totalTeams: parseInt(teamStats[0].total_teams),
      createdTasks: parseInt(createdTasks.count)
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;