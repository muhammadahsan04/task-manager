// const express = require('express');
// const db = require('../config/database');
// const { isAuthenticated } = require('../middleware/auth');

// const router = express.Router();

// // GET /api/reports/summary?teamId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
// router.get('/summary', isAuthenticated, async (req, res) => {
//   try {
//     const { teamId, from, to } = req.query;
//     if (!teamId) return res.status(400).json({ message: 'teamId is required' });

//     let q = db('tasks').where('team_id', teamId);
//     if (from) q = q.andWhere('created_at', '>=', new Date(from));
//     if (to) q = q.andWhere('created_at', '<=', new Date(to + ' 23:59:59'));

//     const base = q.clone();

//     const byStatus = await base.clone()
//       .select('status')
//       .count('* as count')
//       .groupBy('status');

//     const byPriority = await base.clone()
//       .select('priority')
//       .count('* as count')
//       .groupBy('priority');

//     const completedByDay = await base.clone()
//       .where('status', 'completed')
//       .select(db.raw("to_char(date_trunc('day', updated_at), 'YYYY-MM-DD') as day"))
//       .count('* as count')
//       .groupBy('day')
//       .orderBy('day', 'asc');

//     const createdByDay = await base.clone()
//       .select(db.raw("to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day"))
//       .count('* as count')
//       .groupBy('day')
//       .orderBy('day', 'asc');

//     const assigneeCounts = await base.clone()
//       .leftJoin('users as u', 'tasks.assigned_to', 'u.id')
//       .select(db.raw("coalesce(u.name, 'Unassigned') as assignee_name"))
//       .count('* as count')
//       .groupBy('assignee_name')
//       .orderBy('count', 'desc')
//       .limit(10);

//     res.json({
//       byStatus,
//       byPriority,
//       completedByDay,
//       createdByDay,
//       assigneeCounts,
//     });
//   } catch (error) {
//     console.error('Reports summary error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// module.exports = router;



const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/summary?teamId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', isAuthenticated, async (req, res) => {
  try {
    const { teamId, from, to } = req.query;
    if (!teamId) {
      return res.status(400).json({ message: 'teamId is required' });
    }

    const baseQuery = db('tasks').where('team_id', teamId);
    const startDate = from ? new Date(from) : null;
    const endDate = to ? new Date(to + ' 23:59:59') : null;

    const base = baseQuery.clone();

    const byStatus = await base.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const byPriority = await base.clone()
      .select('priority')
      .count('* as count')
      .groupBy('priority');

    const completedByDay = await base.clone()
      .where('status', 'completed')
      .select(db.raw("to_char(date_trunc('day', updated_at), 'YYYY-MM-DD') as day"))
      .count('* as count')
      .groupBy('day')
      .orderBy('day', 'asc');

    const createdByDay = await base.clone()
      .select(db.raw("to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day"))
      .count('* as count')
      .groupBy('day')
      .orderBy('day', 'asc');

    const assigneeCounts = await base.clone()
      .leftJoin('users as u', 'tasks.assigned_to', 'u.id')
      .select(db.raw("coalesce(u.name, 'Unassigned') as assignee_name"))
      .count('* as count')
      .groupBy('assignee_name')
      .orderBy('count', 'desc')
      .limit(10);

    res.json({
      byStatus,
      byPriority,
      completedByDay,
      createdByDay,
      assigneeCounts,
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;