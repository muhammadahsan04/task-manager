const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const { sendEmail } = require('../config/mailer');

const router = express.Router();

// Get current user's email preferences
router.get('/preferences', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const prefs = await db('user_email_preferences')
      .where({ user_id: userId })
      .first();

    const defaults = {
      instant_task_assigned: true,
      instant_comment: true,
      instant_team_invite: true,
      deadline_reminders: true,
      digest_frequency: 'weekly'
    };

    res.json({ preferences: prefs || defaults });
  } catch (error) {
    console.error('Get email preferences error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update current user's email preferences
router.put('/preferences', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Basic validation
    const allowedDigest = ['off', 'daily', 'weekly'];
    if (updates.digest_frequency && !allowedDigest.includes(updates.digest_frequency)) {
      return res.status(400).json({ message: 'Invalid digest frequency' });
    }

    const existing = await db('user_email_preferences').where({ user_id: userId }).first();
    if (existing) {
      await db('user_email_preferences')
        .where({ user_id: userId })
        .update({
          ...updates,
          updated_at: db.fn.now()
        });
    } else {
      await db('user_email_preferences').insert({
        user_id: userId,
        ...updates
      });
    }

    const prefs = await db('user_email_preferences').where({ user_id: userId }).first();
    res.json({ message: 'Preferences updated', preferences: prefs });
  } catch (error) {
    console.error('Update email preferences error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send test email to current user
router.post('/test', isAuthenticated, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    const { sendTemplatedEmail } = require('../config/mailer');
    const { welcomeTemplate } = require('../config/emailTemplates');
    const template = welcomeTemplate({ userName: user.name, dashboardUrl: process.env.CLIENT_URL || 'http://localhost:5173' });
    await sendTemplatedEmail({
      to: user.email,
      subject: `Test Email from ${process.env.APP_NAME || 'Glacier'}`,
      template
    });
    res.json({ message: 'Test email sent' });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;



