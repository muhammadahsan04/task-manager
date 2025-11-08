# Local Development Setup Guide

This guide will help you set up the Team Task Manager application for local development.

## Prerequisites

Before starting, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Database Setup

#### Install PostgreSQL

**Windows:**
1. Download PostgreSQL from the official website
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL to your PATH

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE team_task_manager;

# Create user (optional)
CREATE USER taskmanager_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE team_task_manager TO taskmanager_user;

# Exit psql
\q
```

### 4. Environment Configuration

#### Backend Environment

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173
```

#### Frontend Environment

Create a `.env` file in the client directory:

```bash
cd client
cp env.example .env
```

Edit `client/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Environment
VITE_NODE_ENV=development
```

### 5. Database Migration

Run the database migrations to create tables:

```bash
# From the root directory
npx knex migrate:latest
```

You should see output like:
```
Using environment: development
Batch 1 run: 4 migrations
```

### 6. Start the Application

#### Option 1: Run Both Backend and Frontend (Recommended)

```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend dev server (port 5173).

#### Option 2: Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
cd client
npm run dev
```

### 7. Verify Installation

1. **Backend**: Open http://localhost:5000/api/health
   - Should return: `{"status":"OK","message":"Server is running"}`

2. **Frontend**: Open http://localhost:5173
   - Should show the login page

3. **Test Registration**: Create a new account
4. **Test Login**: Login with your credentials
5. **Test Features**: Create a team and add tasks

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `Database connection failed`

**Solutions:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check if PostgreSQL is listening on the correct port

```bash
# Check if PostgreSQL is running
# Windows
sc query postgresql

# macOS/Linux
brew services list | grep postgres
# or
sudo systemctl status postgresql
```

#### 2. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solutions:**
- Change the PORT in `.env` file
- Kill the process using the port

```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or use a different port
# In .env file: PORT=5001
```

#### 3. Migration Errors

**Error**: `migration failed`

**Solutions:**
- Check database connection
- Verify database exists
- Run migrations in order

```bash
# Check migration status
npx knex migrate:status

# Rollback and re-run
npx knex migrate:rollback
npx knex migrate:latest
```

#### 4. Frontend Build Errors

**Error**: `Module not found` or build failures

**Solutions:**
- Clear node_modules and reinstall
- Check Node.js version compatibility

```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

#### 5. CORS Errors

**Error**: `CORS policy` errors in browser console

**Solutions:**
- Check `CLIENT_URL` in backend `.env`
- Verify frontend is running on correct port
- Check CORS configuration in `server.js`

### Database Issues

#### Reset Database

If you need to start fresh:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS team_task_manager;"
psql -U postgres -c "CREATE DATABASE team_task_manager;"

# Run migrations
npx knex migrate:latest
```

#### Check Database Tables

```bash
# Connect to database
psql -U postgres -d team_task_manager

# List tables
\dt

# Check table structure
\d users
\d teams
\d tasks
\d team_members

# Exit
\q
```

### Performance Issues

#### Slow Database Queries

- Add database indexes for frequently queried columns
- Use database query logging to identify slow queries
- Consider connection pooling for high traffic

#### Frontend Performance

- Check browser dev tools for slow network requests
- Optimize bundle size with code splitting
- Use React DevTools for component performance

## Development Workflow

### 1. Making Changes

1. Create a new branch: `git checkout -b feature/new-feature`
2. Make your changes
3. Test locally
4. Commit changes: `git commit -am 'Add new feature'`
5. Push branch: `git push origin feature/new-feature`
6. Create pull request

### 2. Database Changes

When modifying database schema:

1. Create new migration: `npx knex migrate:make migration_name`
2. Edit migration file in `migrations/` folder
3. Test migration: `npx knex migrate:latest`
4. Test rollback: `npx knex migrate:rollback`

### 3. API Changes

1. Update API routes in `routes/` folder
2. Update frontend API calls in components
3. Test with Postman or similar tool
4. Update API documentation

### 4. Frontend Changes

1. Modify components in `src/components/`
2. Update styles in Tailwind classes
3. Test responsive design
4. Check browser compatibility

## Useful Commands

```bash
# Backend commands
npm run server          # Start backend server
npm run dev            # Start both backend and frontend
npm start              # Start production server

# Database commands
npx knex migrate:latest    # Run migrations
npx knex migrate:rollback  # Rollback last migration
npx knex migrate:status    # Check migration status

# Frontend commands (from client directory)
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build

# Git commands
git status             # Check git status
git log --oneline      # View commit history
git diff               # View changes
```

## IDE Setup

### VS Code Extensions

Recommended extensions for development:

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **PostgreSQL**
- **GitLens**
- **Prettier - Code formatter**
- **ESLint**

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  }
}
```

## Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Team creation works
- [ ] Team member addition works
- [ ] Task creation works
- [ ] Task assignment works
- [ ] Task status updates work
- [ ] Responsive design works on mobile
- [ ] Error handling works properly

### Browser Testing

Test in multiple browsers:
- Chrome
- Firefox
- Safari
- Edge

### Mobile Testing

Use browser dev tools to test responsive design:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1024px+)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Create a new issue with:
   - Your operating system
   - Node.js version
   - PostgreSQL version
   - Error messages
   - Steps to reproduce

## Next Steps

Once setup is complete:

1. Explore the codebase structure
2. Read the API documentation
3. Check the deployment guide
4. Start developing new features!





