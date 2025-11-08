const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const cloudinary = require('../config/cloudinary');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Multer memory storage with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// List attachments for a task
router.get('/task/:taskId', isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await db('tasks').where('id', taskId).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Access: team member or team creator
    const hasAccess = await db('team_members').where({ team_id: task.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: task.team_id, created_by: req.user.id }).first();
    if (!hasAccess && !isCreator) return res.status(403).json({ message: 'Access denied' });

    const attachments = await db('task_attachments')
      .join('users', 'task_attachments.uploaded_by', 'users.id')
      .where('task_attachments.task_id', taskId)
      .select(
        'task_attachments.*',
        'users.name as uploader_name',
        'users.email as uploader_email'
      )
      .orderBy('task_attachments.created_at', 'desc');

    res.json({ attachments });
  } catch (error) {
    console.error('List attachments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed',
  'text/plain'
]);

// Upload attachment to Cloudinary
router.post('/task/:taskId', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'File is required' });
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    const task = await db('tasks').where('id', taskId).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Access check
    const hasAccess = await db('team_members').where({ team_id: task.team_id, user_id: req.user.id }).first();
    const isCreator = await db('teams').where({ id: task.team_id, created_by: req.user.id }).first();
    if (!hasAccess && !isCreator) return res.status(403).json({ message: 'Access denied' });

    // Upload buffer to Cloudinary
    const resource_type = file.mimetype.startsWith('image/') ? 'image' : 'raw';

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(file.buffer);
    });

    const [attachment] = await db('task_attachments')
      .insert({
        task_id: taskId,
        comment_id: comment_id ? Number(comment_id) : null,
        uploaded_by: req.user.id,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      })
      .returning('*');

    res.status(201).json({ attachment });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete attachment (uploader or team creator can delete)
router.delete('/:attachmentId', isAuthenticated, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await db('task_attachments').where('id', attachmentId).first();
    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

    const task = await db('tasks').where('id', attachment.task_id).first();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isUploader = attachment.uploaded_by === req.user.id;
    const isTeamCreator = await db('teams').where({ id: task.team_id, created_by: req.user.id }).first();
    if (!isUploader && !isTeamCreator) return res.status(403).json({ message: 'Access denied' });

    // Delete on Cloudinary
    const resource_type = (attachment.file_type || '').startsWith('image/') ? 'image' : 'raw';
    await cloudinary.uploader.destroy(attachment.public_id, { resource_type }).catch(() => {});

    await db('task_attachments').where('id', attachmentId).del();
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;






