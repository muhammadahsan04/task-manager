const express = require('express');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const commentRoutes = require('./routes/comments');
const attachmentRoutes = require('./routes/attachments');
const searchRoutes = require('./routes/search');
const labelRoutes = require('./routes/labels');
const reportRoutes = require('./routes/reports');
const subtaskRoutes = require('./routes/subtasks');
const timeEntryRoutes = require('./routes/timeEntries');
const emailRoutes = require('./routes/email');
const chatRoutes = require('./routes/chat');
const { Server } = require('socket.io');
const cron = require('node-cron');
const db = require('./config/database');
const { sendEmail } = require('./config/mailer');

// Import passport configuration
require('./config/passport');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  // Client should emit 'join_team' with teamId to join its room
  socket.on('join_team', (teamId) => {
    if (teamId) {
      socket.join(`team_${teamId}`);
    }
  });

  // Allow leaving a room explicitly
  socket.on('leave_team', (teamId) => {
    if (teamId) {
      socket.leave(`team_${teamId}`);
    }
  });

  // Typing indicators
  socket.on('typing', ({ teamId, user }) => {
    if (teamId && user) {
      socket.to(`team_${teamId}`).emit('user_typing', { user });
    }
  });

  socket.on('stop_typing', ({ teamId, user }) => {
    if (teamId && user) {
      socket.to(`team_${teamId}`).emit('user_stop_typing', { user });
    }
  });
});
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chat', chatRoutes);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Schedule daily/weekly digest emails
cron.schedule('0 8 * * *', async () => {
  try {
    const appName = process.env.APP_NAME || 'Glacier';
    const { sendTemplatedEmail } = require('./config/mailer');
    const { digestTemplate } = require('./config/emailTemplates');
    // Daily digests
    const dailyUsers = await db('user_email_preferences').where({ digest_frequency: 'daily' });
    for (const pref of dailyUsers) {
      const user = await db('users').where({ id: pref.user_id }).first();
      const recent = await db('tasks')
        .where('assigned_to', user.id)
        .andWhere('created_at', '>=', db.raw("now() - interval '1 day'"))
        .select('id', 'title', 'status', 'priority');
      const template = digestTemplate({ period: 'Daily', items: recent });
      await sendTemplatedEmail({ to: user.email, subject: `${appName} — Daily Digest`, template });
    }
    // Weekly digests (send on Mondays)
    const today = new Date();
    if (today.getDay() === 1) {
      const weeklyUsers = await db('user_email_preferences').where({ digest_frequency: 'weekly' });
      for (const pref of weeklyUsers) {
        const user = await db('users').where({ id: pref.user_id }).first();
        const recent = await db('tasks')
          .where('assigned_to', user.id)
          .andWhere('created_at', '>=', db.raw("now() - interval '7 days'"))
          .select('id', 'title', 'status', 'priority');
        const template = digestTemplate({ period: 'Weekly', items: recent });
        await sendTemplatedEmail({ to: user.email, subject: `${appName} — Weekly Digest`, template });
      }
    }
  } catch (e) {
    console.warn('Digest job failed:', e.message);
  }
});





