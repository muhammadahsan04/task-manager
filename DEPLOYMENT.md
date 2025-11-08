# Deployment Guide

This guide covers deploying the Team Task Manager application to various platforms.

## Prerequisites

- GitHub repository with your code
- PostgreSQL database (managed service recommended)
- Domain name (optional)

## Platform Options

### 1. Render (Recommended)

Render provides easy deployment for both backend and frontend with built-in PostgreSQL.

#### Backend Deployment

1. **Create Account & Connect GitHub**
   - Go to [render.com](https://render.com)
   - Sign up and connect your GitHub account

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Configure:
     - **Name**: `team-task-manager-backend`
     - **Root Directory**: `/` (root)
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free or Starter

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=team_task_manager
   DB_USER=your-postgres-user
   DB_PASSWORD=your-postgres-password
   SESSION_SECRET=your-super-secret-session-key
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```

4. **Add PostgreSQL Database**
   - Go to Dashboard → "New +" → "PostgreSQL"
   - Name: `team-task-manager-db`
   - Copy connection details to environment variables

#### Frontend Deployment

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect your repository
   - Configure:
     - **Name**: `team-task-manager-frontend`
     - **Root Directory**: `/client`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_NODE_ENV=production
   ```

### 2. Heroku

#### Backend Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login & Create App**
   ```bash
   heroku login
   heroku create your-app-backend
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-super-secret-session-key
   heroku config:set CLIENT_URL=https://your-frontend-url.herokuapp.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

#### Frontend Deployment

1. **Create Frontend App**
   ```bash
   heroku create your-app-frontend
   ```

2. **Buildpack Setup**
   ```bash
   heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
   ```

3. **Environment Variables**
   ```bash
   heroku config:set REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix=client heroku main
   ```

### 3. Vercel (Frontend Only)

Vercel is excellent for React applications.

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login & Deploy**
   ```bash
   cd client
   vercel login
   vercel
   ```

3. **Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   ```
   VITE_API_URL=https://your-backend-url.com/api
   VITE_NODE_ENV=production
   ```

### 4. Railway

Railway provides simple deployment with built-in databases.

#### Backend Deployment

1. **Connect GitHub**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Create Project**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection string

4. **Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:port/db
   SESSION_SECRET=your-super-secret-session-key
   CLIENT_URL=https://your-frontend-url.com
   ```

#### Frontend Deployment

1. **Create New Service**
   - Add service → "GitHub Repo"
   - Select your repository
   - Set root directory to `/client`

2. **Configure Build**
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview`

## Database Setup

### PostgreSQL Setup

1. **Create Database**
   ```sql
   CREATE DATABASE team_task_manager;
   ```

2. **Run Migrations**
   ```bash
   # Local
   npx knex migrate:latest
   
   # Production (add to deployment script)
   npm run migrate
   ```

### Database Migration Script

Add to `package.json`:
```json
{
  "scripts": {
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback"
  }
}
```

## Production Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Error logging enabled
- [ ] Health check endpoint working

### Frontend
- [ ] API URL points to production backend
- [ ] Build optimized for production
- [ ] Static files served correctly
- [ ] HTTPS enabled
- [ ] Error boundaries implemented

### Security
- [ ] Strong session secrets
- [ ] Database credentials secure
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation enabled

## Monitoring

### Recommended Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: New Relic, DataDog

### Health Checks
- Backend: `GET /api/health`
- Frontend: Static file serving
- Database: Connection test

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Verify connection string format
   - Check firewall settings
   - Confirm database credentials

3. **CORS Errors**
   - Update `CLIENT_URL` environment variable
   - Check CORS configuration in server.js

4. **Session Issues**
   - Verify `SESSION_SECRET` is set
   - Check cookie settings
   - Confirm HTTPS in production

### Debug Commands

```bash
# Check logs
heroku logs --tail

# Database connection test
heroku run node -e "console.log(process.env.DATABASE_URL)"

# Environment variables
heroku config
```

## Scaling Considerations

### Database
- Use connection pooling
- Implement read replicas for large datasets
- Consider database sharding for high traffic

### Application
- Use PM2 for process management
- Implement Redis for session storage
- Add load balancing for multiple instances

### Frontend
- Use CDN for static assets
- Implement caching strategies
- Optimize bundle size

## Cost Optimization

### Free Tiers
- **Render**: Free tier available
- **Heroku**: Free tier discontinued, consider alternatives
- **Vercel**: Generous free tier
- **Railway**: Free tier with usage limits

### Paid Tiers
- Start with smallest paid plans
- Monitor usage and scale as needed
- Use auto-scaling features
- Optimize database queries

## Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication

2. **Code Backups**
   - Git repository (primary)
   - Regular local backups
   - Documentation updates

3. **Configuration Backups**
   - Environment variables documented
   - Deployment scripts versioned
   - Infrastructure as code





