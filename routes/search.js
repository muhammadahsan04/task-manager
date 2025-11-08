const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=...&type=tasks|teams|users|comments&teamId=...&status=...&priority=...&assignee=...
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { q = '', type, teamId, status, priority, assignee, limit = 10 } = req.query;
    const query = String(q).trim();
    const max = Math.min(parseInt(limit, 10) || 10, 25);
    const userId = req.user.id;

    const results = {};

    // Helper: safely add ILIKE filter
    const ilike = (qb, column) => {
      if (query) qb.whereILike(column, `%${query}%`);
    };

    // Get user's accessible team IDs (teams created by user or teams where user is a member)
    const userTeamIds = await db('teams')
      .leftJoin('team_members', 'teams.id', 'team_members.team_id')
      .where(function() {
        this.where('teams.created_by', userId)
            .orWhere('team_members.user_id', userId);
      })
      .select('teams.id')
      .distinct()
      .then(rows => rows.map(row => row.id));

    // If user has no accessible teams, handle team-related searches separately
    if (userTeamIds.length === 0) {
      // Set empty results for team-related searches
      if (!type || type === 'tasks') {
        results.tasks = [];
      }
      if (!type || type === 'teams') {
        results.teams = [];
      }
      if (!type || type === 'comments') {
        results.comments = [];
      }
      
      // Users search can still work even without teams
      if (!type || type === 'users') {
        const users = await db('users')
          .where((qb) => {
            if (query) {
              qb.whereILike('name', `%${query}%`).orWhereILike('email', `%${query}%`);
            }
          })
          .orderBy('created_at', 'desc')
          .limit(max)
          .select('id', 'name', 'email');
        results.users = users;
      }
      
      // If only searching for users, return early
      if (type === 'users') {
        return res.json({ query, results });
      }
      
      // If searching for team-related content but user has no teams, return empty results
      if (type === 'tasks' || type === 'teams' || type === 'comments') {
        return res.json({ query, results });
      }
      
      // If no type specified (search all), continue to process users (already done above)
      // and return since team-related searches would be empty
      return res.json({ query, results });
    }

    // Tasks - only from teams user has access to
    if (!type || type === 'tasks') {
      let tasksQ = db('tasks')
        .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
        .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
        .leftJoin('teams', 'tasks.team_id', 'teams.id')
        .whereIn('tasks.team_id', userTeamIds) // Filter by accessible teams
        .select(
          'tasks.*',
          db.raw('assignee.name as assignee_name'),
          db.raw('creator.name as creator_name'),
          'teams.name as team_name'
        )
        .orderBy('tasks.created_at', 'desc')
        .limit(max);
      // Additional filters
      if (teamId && userTeamIds.includes(parseInt(teamId))) {
        tasksQ = tasksQ.where('tasks.team_id', teamId);
      }
      if (status) tasksQ = tasksQ.where('tasks.status', status);
      if (priority) tasksQ = tasksQ.where('tasks.priority', priority);
      if (assignee) tasksQ = tasksQ.where('tasks.assigned_to', assignee);
      tasksQ = tasksQ.modify((qb) => {
        if (query) qb.where((w) => {
          ilike(w, 'tasks.title');
          w.orWhereILike('tasks.description', `%${query}%`);
        });
      });
      results.tasks = await tasksQ;
    }

    // Teams - only teams user has access to (created by or member of)
    if (!type || type === 'teams') {
      let teamsQ = db('teams')
        .leftJoin('team_members', 'teams.id', 'team_members.team_id')
        .where(function() {
          this.where('teams.created_by', userId)
              .orWhere('team_members.user_id', userId);
        })
        .select('teams.*')
        .distinct()
        .orderBy('teams.created_at', 'desc')
        .limit(max);
      
      // Apply search query if provided
      if (query) {
        teamsQ = teamsQ.whereILike('teams.name', `%${query}%`);
      }
      
      const teams = await teamsQ;
      results.teams = teams;
    }

    // Users
    if (!type || type === 'users') {
      const users = await db('users')
        .where((qb) => {
          if (query) {
            qb.whereILike('name', `%${query}%`).orWhereILike('email', `%${query}%`);
          }
        })
        .orderBy('created_at', 'desc')
        .limit(max)
        .select('id', 'name', 'email');
      results.users = users;
    }

    // Comments - only from tasks in teams user has access to
    if (!type || type === 'comments') {
      let commentsQ = db('task_comments')
        .join('users', 'task_comments.user_id', 'users.id')
        .join('tasks', 'task_comments.task_id', 'tasks.id')
        .whereIn('tasks.team_id', userTeamIds) // Filter by accessible teams
        .select(
          'task_comments.*',
          'users.name as user_name',
          'users.email as user_email',
          'tasks.title as task_title'
        )
        .orderBy('task_comments.created_at', 'desc')
        .limit(max);
      if (teamId && userTeamIds.includes(parseInt(teamId))) {
        commentsQ = commentsQ.where('tasks.team_id', teamId);
      }
      commentsQ = commentsQ.modify((qb) => {
        if (query) qb.whereILike('task_comments.comment', `%${query}%`);
      });
      results.comments = await commentsQ;
    }

    res.json({ query, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


