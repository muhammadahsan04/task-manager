const express = require('express');
const db = require('../config/database');
const { teamValidation, validate } = require('../middleware/validation');
const { isAuthenticated, isTeamMember, isTeamAdmin, requireTeamRole } = require('../middleware/auth');

const router = express.Router();

// Get all teams for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get teams created by user (LIFO - newest first)
    const createdTeams = await db('teams')
      .where('created_by', userId)
      .orderBy('created_at', 'desc')
      .select('*');
    
    // Get teams where user is a member (LIFO - newest first)
    const memberTeams = await db('teams')
      .join('team_members', 'teams.id', 'team_members.team_id')
      .where('team_members.user_id', userId)
      .orderBy('team_members.joined_at', 'desc')
      .select('teams.*', 'team_members.role', 'team_members.joined_at')
      .whereNot('teams.created_by', userId); // Exclude teams already in createdTeams
    
    const allTeams = [
      ...createdTeams.map(team => ({ ...team, role: 'creator' })),
      ...memberTeams
    ];
    
    res.json({ teams: allTeams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new team
router.post('/', isAuthenticated, validate(teamValidation.create), async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.id;
    
    const [newTeam] = await db('teams')
      .insert({
        name,
        description,
        created_by: createdBy
      })
      .returning('*');
    
    // Add creator as admin member
    await db('team_members').insert({
      team_id: newTeam.id,
      user_id: createdBy,
      role: 'admin'
    });
    
    res.status(201).json({
      message: 'Team created successfully',
      team: { ...newTeam, role: 'creator' }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get team details
router.get('/:teamId', isAuthenticated, isTeamMember, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await db('teams')
      .where('id', teamId)
      .first();
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Get team members
    const members = await db('team_members')
      .join('users', 'team_members.user_id', 'users.id')
      .where('team_members.team_id', teamId)
      .select('users.id', 'users.name', 'users.email', 'team_members.role', 'team_members.joined_at');
    
    // Get team creator info
    const creator = await db('users')
      .where('id', team.created_by)
      .select('id', 'name', 'email')
      .first();
    
    res.json({
      team: {
        ...team,
        creator,
        members
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update team
router.put('/:teamId', isAuthenticated, isTeamAdmin, validate(teamValidation.update), async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;
    
    const [updatedTeam] = await db('teams')
      .where('id', teamId)
      .update({
        ...updates,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete team (only creator can delete)
router.delete('/:teamId', isAuthenticated, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    // Check if user is team creator
    const team = await db('teams')
      .where({ id: teamId, created_by: userId })
      .first();
    
    if (!team) {
      return res.status(403).json({ message: 'Only team creator can delete team' });
    }
    
    await db('teams').where('id', teamId).del();
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Invite member by email (send real email via SMTP)
router.post('/:teamId/invitations', isAuthenticated, isTeamAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.id;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Prevent duplicate pending invites for same email
    const existingPending = await db('team_invitations')
      .where({ team_id: teamId, email, status: 'pending' })
      .first();

    let invitation = existingPending;
    if (!existingPending) {
      const token = require('crypto').randomBytes(16).toString('hex');
      [invitation] = await db('team_invitations')
        .insert({ team_id: teamId, email, token, invited_by: inviterId })
        .returning(['id', 'email', 'status', 'token']);
    }

    // Send invitation email
    try {
      const { sendTemplatedEmail } = require('../config/mailer');
      const { teamInviteTemplate } = require('../config/emailTemplates');
      const inviter = await db('users').where({ id: inviterId }).first();
      const appName = process.env.APP_NAME || 'Glacier';
      const acceptUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite?token=${invitation.token}`;
      const template = teamInviteTemplate({ inviterName: inviter.name, teamName: `Team ${teamId}`, acceptUrl });
      await sendTemplatedEmail({
        to: email,
        subject: `[${appName}] Team Invitation`,
        template
      });
    } catch (mailErr) {
      console.warn('Invitation email failed:', mailErr.message);
    }

    res.status(201).json({
      message: 'Invitation created (stubbed email send)',
      invitation
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Accept invitation (stubbed: auto-join on valid token)
router.post('/invitations/accept', isAuthenticated, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const invitation = await db('team_invitations')
      .where({ token, status: 'pending' })
      .first();
    if (!invitation) return res.status(404).json({ message: 'Invitation not found or already used' });

    // Add as member if not already
    const exists = await db('team_members').where({ team_id: invitation.team_id, user_id: userId }).first();
    if (!exists) {
      await db('team_members').insert({ team_id: invitation.team_id, user_id: userId, role: 'member' });
    }

    // Mark invitation accepted
    await db('team_invitations').where({ id: invitation.id }).update({ status: 'accepted', updated_at: db.fn.now() });

    res.json({ message: 'Invitation accepted', teamId: invitation.team_id });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// List pending invitations for a team (admin only)
router.get('/:teamId/invitations', isAuthenticated, isTeamAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const invites = await db('team_invitations')
      .where({ team_id: teamId, status: 'pending' })
      .select('id', 'email', 'status', 'created_at');
    res.json({ invitations: invites });
  } catch (error) {
    console.error('List invites error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Revoke a pending invitation (admin only)
router.post('/:teamId/invitations/:invitationId/revoke', isAuthenticated, isTeamAdmin, async (req, res) => {
  try {
    const { teamId, invitationId } = req.params;
    const invite = await db('team_invitations')
      .where({ id: invitationId, team_id: teamId, status: 'pending' })
      .first();
    if (!invite) return res.status(404).json({ message: 'Pending invitation not found' });

    await db('team_invitations')
      .where({ id: invitationId })
      .update({ status: 'revoked', updated_at: db.fn.now() });

    res.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add member to team
router.post('/:teamId/members', isAuthenticated, isTeamAdmin, validate(teamValidation.addMember), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    
    // Find user by email
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await db('team_members')
      .where({ team_id: teamId, user_id: user.id })
      .first();
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }
    
    // Add member
    await db('team_members').insert({
      team_id: teamId,
      user_id: user.id,
      role: 'member'
    });
    
    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove member from team
router.delete('/:teamId/members/:userId', isAuthenticated, isTeamAdmin, async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const currentUserId = req.user.id;
    
    // Prevent removing yourself
    if (userId == currentUserId) {
      return res.status(400).json({ message: 'Cannot remove yourself from team' });
    }
    
    // Check if user is team creator
    const team = await db('teams')
      .where({ id: teamId, created_by: currentUserId })
      .first();
    
    if (!team) {
      return res.status(403).json({ message: 'Only team creator can remove members' });
    }
    
    const deletedCount = await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .del();
    
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change member role (creator or admin can change; creator can promote/demote admins)
router.post('/:teamId/members/:userId/role', isAuthenticated, requireTeamRole(['admin']), async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body; // 'member' | 'admin'
    const currentUserId = req.user.id;

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const team = await db('teams').where({ id: teamId }).first();
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only creator can change roles for other admins
    if (role === 'member') {
      // Demote target: if target is admin and current user is not creator, block
      const target = await db('team_members').where({ team_id: teamId, user_id: userId }).first();
      if (!target) return res.status(404).json({ message: 'Member not found' });
      if (target.role === 'admin' && team.created_by !== currentUserId) {
        return res.status(403).json({ message: 'Only team creator can demote an admin' });
      }
    }

    // Upsert membership to ensure exists
    const existing = await db('team_members').where({ team_id: teamId, user_id: userId }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .update({ role, joined_at: existing.joined_at });

    res.json({ message: 'Role updated', userId, role });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;





