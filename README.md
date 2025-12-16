# 365Days Backend API

A complete Node.js/Express backend for the 365Days habit tracking platform with PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Create `.env` file** (copy from `.env.example`)
```bash
cp .env.example .env
```

3. **Update `.env` with your values**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/365days_club
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. **Create PostgreSQL Database**
```bash
createdb 365days_club
```

5. **Start the server**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/plan` - Update subscription plan

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:habitId/toggle` - Complete/uncomplete habit
- `GET /api/habits/:habitId/logs` - Get habit logs
- `DELETE /api/habits/:habitId` - Delete habit

### Community
- `GET /api/community` - Get all posts
- `POST /api/community` - Create post
- `GET /api/community/:postId` - Get post detail
- `POST /api/community/:postId/like` - Like post
- `POST /api/community/:postId/comments` - Add comment
- `DELETE /api/community/:postId` - Delete post

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:courseId` - Get course detail
- `POST /api/courses/:courseId/enroll` - Enroll in course
- `GET /api/courses/user/enrollments` - Get user enrollments
- `POST /api/courses/:courseId/lessons/:lessonId/complete` - Mark lesson complete

### Wellness
- `POST /api/wellness/mood` - Log mood entry
- `GET /api/wellness/mood/latest` - Get latest mood
- `GET /api/wellness/mood/history` - Get mood history
- `POST /api/wellness/journal` - Create journal entry
- `GET /api/wellness/journal/history` - Get journal history
- `GET /api/wellness/activities` - Get activity log

## 📦 Project Structure

```
src/
├── entities/           # Database models
├── routes/             # API routes
├── middleware/         # Express middleware
├── utils/              # Helper functions
├── services/           # Business logic (optional)
├── database.ts         # Database configuration
└── index.ts            # Server entry point
```

## 🗄️ Database Schema

### Users
- id (UUID)
- email (unique)
- name
- password (hashed)
- avatar
- plan (Free|Monthly|Annual)
- xp (experience points)
- level
- joinDate
- updatedAt

### Habits
- id (UUID)
- userId (FK)
- name
- completed
- streak
- bestStreak
- totalCompletions
- category
- frequency
- timeOfDay
- createdAt
- updatedAt

### Community Posts
- id (UUID)
- userId (FK)
- content
- category (General|Win|Help|Mindset)
- image
- likes
- reactions
- createdAt
- updatedAt

### Courses & Lessons
- Courses: id, title, description, category, totalLessons
- Lessons: id, courseId (FK), title, type, content, duration
- CourseEnrollments: userId, courseId, progress, enrolledAt
- LessonProgress: enrollmentId, lessonId, completed, progress

### Wellness
- MoodEntries: userId, mood, energyLevel, note, createdAt
- JournalEntries: userId, type, prompts, createdAt
- ActivityLogs: userId, type, content, createdAt

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for stateless authentication:
- Tokens expire after 7 days (configurable)
- Include token in Authorization header: `Bearer <token>`
- Password hashed with bcryptjs

## 🚢 Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Environment for Production
Update `.env` with:
- Strong `JWT_SECRET`
- Production `DATABASE_URL`
- Correct `FRONTEND_URL`
- `NODE_ENV=production`

## 📝 Notes

- Uses TypeORM ORM for database operations
- Automatic database synchronization in development
- CORS enabled for frontend communication
- Error handling with custom middleware
- All routes require authentication except `/health`, `/api/auth/signup`, `/api/auth/login`, `/api/community` (GET)

## 🐛 Troubleshooting

**Database Connection Error:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists: `createdb 365days_club`

**Port Already in Use:**
- Change PORT in .env
- Or kill process: `lsof -i :5000 | kill -9`

**JWT Errors:**
- Clear browser localStorage
- Re-login and get new token
- Check JWT_SECRET matches across restarts

## 📄 License

MIT
