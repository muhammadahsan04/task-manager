// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
};

// Check if user is team admin
const isTeamAdmin = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    const db = require('../config/database');
    
    // Check if user is team creator
    const team = await db('teams').where({ id: teamId, created_by: userId }).first();
    if (team) {
      req.isTeamCreator = true;
      return next();
    }
    
    // Check if user is team admin
    const membership = await db('team_members')
      .where({ team_id: teamId, user_id: userId, role: 'admin' })
      .first();
    
    if (membership) {
      req.isTeamCreator = false;
      return next();
    }
    
    return res.status(403).json({ message: 'Admin access required' });
  } catch (error) {
    console.error('Error in isTeamAdmin middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if user is team member
const isTeamMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    const db = require('../config/database');
    
    // Check if user is team creator
    const team = await db('teams').where({ id: teamId, created_by: userId }).first();
    if (team) {
      req.isTeamCreator = true;
      return next();
    }
    
    // Check if user is team member
    const membership = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();
    
    if (membership) {
      req.isTeamCreator = false;
      req.memberRole = membership.role;
      return next();
    }
    
    return res.status(403).json({ message: 'Team membership required' });
  } catch (error) {
    console.error('Error in isTeamMember middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Require one of the allowed roles within a team (creator implicitly allowed)
const requireTeamRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    const { teamId } = req.params
    const userId = req.user.id
    const db = require('../config/database')

    const team = await db('teams').where({ id: teamId }).first()
    if (!team) return res.status(404).json({ message: 'Team not found' })
    if (team.created_by === userId) return next() // creator always allowed

    const membership = await db('team_members').where({ team_id: teamId, user_id: userId }).first()
    if (!membership) return res.status(403).json({ message: 'Team membership required' })
    if (!allowedRoles.length) return next()
    if (allowedRoles.includes(membership.role)) return next()
    return res.status(403).json({ message: 'Insufficient permissions' })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in requireTeamRole middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = {
  isAuthenticated,
  isTeamAdmin,
  isTeamMember,
  requireTeamRole
};





