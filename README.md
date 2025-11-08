# Team Task Manager

A full-stack team task management application built with React, Node.js, Express, and PostgreSQL.

## Features

- **User Authentication**: Secure registration and login with session management
- **Team Management**: Create teams, add/remove members, role-based access control
- **Task Management**: Create, assign, and track tasks with status updates
- **Dashboard**: Overview of teams, tasks, and user statistics
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Updates**: Dynamic task status changes and team management

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js
- Express.js
- PostgreSQL with Knex.js
- Passport.js for authentication
- Express sessions
- bcrypt for password hashing
- Joi for validation
- Helmet for security

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd team-task-manager
\`\`\`

### 2. Backend Setup

\`\`\`bash
# Install backend dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your database credentials
\`\`\`

Update the `.env` file:
\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=postgres
DB_PASSWORD=your_password
SESSION_SECRET=your_super_secret_session_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
\`\`\`

### 3. Database Setup

\`\`\`bash
# Create PostgreSQL database
createdb team_task_manager

# Run migrations
npx knex migrate:latest
\`\`\`

### 4. Frontend Setup

\`\`\`bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file
\`\`\`

Update `client/.env`:
\`\`\`env
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
\`\`\`

## Running the Application

### Development Mode

\`\`\`bash
# From root directory - runs both backend and frontend
npm run dev

# Or run separately:

# Backend only
npm run server

# Frontend only (from client directory)
npm run client
\`\`\`

### Production Mode

\`\`\`bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
npm start
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/status` - Check authentication status

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Tasks
- `GET /api/tasks/team/:teamId` - Get team tasks
- `GET /api/tasks/my-tasks` - Get user's assigned tasks
- `POST /api/tasks/team/:teamId` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

## Database Schema

### Users Table
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password` (Hashed)
- `created_at`, `updated_at` (Timestamps)

### Teams Table
- `id` (Primary Key)
- `name` (String)
- `description` (Text)
- `created_by` (Foreign Key to Users)
- `created_at`, `updated_at` (Timestamps)

### Team Members Table
- `id` (Primary Key)
- `team_id` (Foreign Key to Teams)
- `user_id` (Foreign Key to Users)
- `role` (Enum: 'member', 'admin')
- `joined_at` (Timestamp)

### Tasks Table
- `id` (Primary Key)
- `title` (String)
- `description` (Text)
- `status` (Enum: 'pending', 'in_progress', 'completed')
- `priority` (Enum: 'low', 'medium', 'high')
- `team_id` (Foreign Key to Teams)
- `assigned_to` (Foreign Key to Users)
- `created_by` (Foreign Key to Users)
- `due_date` (Timestamp)
- `created_at`, `updated_at` (Timestamps)

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- HTTP-only cookies
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention with Knex.js

## Deployment

### Using Render (Recommended)

1. **Backend Deployment:**
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables
   - Add PostgreSQL database

2. **Frontend Deployment:**
   - Create a new Static Site on Render
   - Set build command: `cd client && npm install && npm run build`
   - Set publish directory: `client/dist`
   - Add environment variables

### Using Heroku

1. **Install Heroku CLI**
2. **Create Heroku apps:**
   \`\`\`bash
   # Backend
   heroku create your-app-backend
   
   # Frontend
   heroku create your-app-frontend
   \`\`\`

3. **Add PostgreSQL addon:**
   \`\`\`bash
   heroku addons:create heroku-postgresql:hobby-dev
   \`\`\`

4. **Deploy:**
   \`\`\`bash
   git subtree push --prefix=client heroku-frontend main
   git push heroku-backend main
   \`\`\`

### Environment Variables for Production

**Backend:**
\`\`\`env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=your-production-db-name
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
SESSION_SECRET=your-production-session-secret
CLIENT_URL=https://your-frontend-url.com
\`\`\`

**Frontend:**
\`\`\`env
VITE_API_URL=https://your-backend-url.com/api
VITE_NODE_ENV=production
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email your-email@example.com or create an issue in the repository.





