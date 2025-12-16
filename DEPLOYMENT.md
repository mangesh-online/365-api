# 365Days.club Backend - Deployment Guide

## Automatic Database Initialization

This backend is designed to be **deployment-ready** with zero manual setup. When deployed to any environment with a valid database connection, it will:

1. ✅ **Auto-create all database tables** on first run
2. ✅ **Auto-seed master data** (brain tools, books, templates, sessions, courses, media)
3. ✅ **Skip re-seeding** on subsequent runs (checks if data exists)

## Environment Setup

### Required Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=mysql://username:password@host:port/database
PORT=5001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
```

### Supported Databases

- MySQL / MariaDB
- PostgreSQL (detected automatically from DATABASE_URL)

## Deployment Steps

### 1. Fresh Deployment (Empty Database)

```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

**What happens:**
- ✅ Connects to database
- ✅ Creates all tables automatically
- ✅ Seeds master data:
  - 42 Brain Tools (CBT techniques, mindfulness, etc.)
  - 28 Books (self-help resources)
  - 15 Templates (worksheets, journals)
  - 30 Media items (audio, video guides)
  - 12 Courses (structured programs)
  - 27 Sessions (group sessions/workshops)

### 2. Subsequent Runs (Existing Data)

```bash
npm run dev
```

**What happens:**
- ✅ Connects to database
- ✅ Detects existing tables and data
- ✅ Skips recreation/re-seeding
- ✅ Starts server immediately

## Master Data Management

### Current Approach
All master data is seeded from `src/seed.ts` on first deployment.

### Future: Admin Panel Management

Content will be manageable via admin screens:

- **Brain Tools**: `/admin/brain-tools` - Add/edit/delete tools
- **Courses**: `/admin/courses` - Manage course content and lessons
- **Sessions**: `/admin/sessions` - Schedule and manage group sessions
- **Templates**: `/admin/templates` - Upload and manage worksheets
- **Media**: `/admin/media` - Upload audio/video resources
- **Books**: `/admin/books` - Add recommended reading materials

*Admin routes are already implemented in* `src/routes/admin.ts`

## Database Schema

### Core Tables

**Users & Authentication:**
- `users` - User accounts
- `user_settings` - User preferences
- `user_profile_views` - Profile analytics
- `follows` - User following relationships

**Content:**
- `communities` - Posts/discussions
- `comments` - Post comments
- `community_roles` - User roles in communities
- `post_reactions` - Likes, reactions
- `moderation_logs` - Content moderation history

**Wellness:**
- `habits` - User habits
- `habit_logs` - Habit tracking entries
- `mood_entries` - Daily mood tracking
- `journal_entries` - Private journals

**Resources:**
- `brain_tools` - CBT tools and techniques
- `tool_progress` - User progress in tools
- `resource_books` - Self-help books
- `user_book_progress` - Reading progress
- `resource_templates` - Downloadable worksheets
- `resource_media` - Audio/video content
- `user_favorites` - Saved resources

**Learning:**
- `courses` - Course catalog
- `lessons` - Course lessons
- `course_enrollments` - User enrollments
- `lesson_progress` - Learning progress
- `course_resources` - Course materials

**Community:**
- `sessions` - Group sessions/workshops
- `session_attendance` - Attendance tracking
- `session_rsvps` - Event RSVPs
- `session_activities` - Session interactions

**Tribes (Communities):**
- `tribes` - User-created groups
- `tribe_members` - Membership
- `tribe_join_requests` - Pending requests
- `tribe_events` - Tribe events
- `tribe_channels` - Chat channels
- `tribe_messages` - Channel messages
- `tribe_quiz_answers` - Onboarding quiz

**Messaging:**
- `conversations` - Direct message threads
- `messages` - Direct messages

**Admin:**
- `activity_logs` - User activity tracking

## Troubleshooting

### Issue: Tables don't exist error

**Solution:** The backend will auto-create tables. If you see this error:
1. Ensure `DATABASE_URL` is correct
2. Ensure database exists (create manually if needed)
3. Restart the server - tables will be created automatically

### Issue: No master data

**Solution:** Data is seeded automatically. To force re-seed:
```bash
# Drop all tables or clear the database
# Restart server - tables and data will be recreated
npm run dev
```

### Issue: Foreign key constraints

**Solution:** This is handled automatically by the initialization script. Tables are created in the correct order with proper foreign key relationships.

## Development

### Development Mode
```bash
npm run dev
```
Uses `tsx watch` for hot-reload on file changes.

### Production Mode
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

## API Documentation

Server runs on `http://localhost:5001` (or PORT from .env)

### Core Endpoints

- **Auth**: `/api/auth/*`
- **Habits**: `/api/habits/*`
- **Community**: `/api/community/*`
- **Courses**: `/api/courses/*`
- **Resources**: `/api/resources/*`
- **Sessions**: `/api/sessions/*`
- **Tribes**: `/api/tribes/*`
- **Brain Tools**: `/api/brain-tools/*`
- **Admin**: `/api/admin/*`
- **Messages**: `/api/messages/*`

## Architecture

```
backend/
├── src/
│   ├── entities/        # TypeORM entities (database models)
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, error handling, etc.
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   │   └── initDatabase.ts  # Auto-initialization logic
│   ├── seed.ts          # Master data seeding
│   ├── database.ts      # Database configuration
│   └── index.ts         # Server entry point
├── migrations/          # Database migrations (optional)
└── uploads/             # User-uploaded files
```

## Production Deployment

### Environment Variables (Production)

```env
DATABASE_URL=mysql://prod-user:prod-pass@prod-host:3306/prod-db
PORT=5001
FRONTEND_URL=https://365days.club
JWT_SECRET=secure-random-secret-key
NODE_ENV=production
```

### Deployment Checklist

- [ ] Set all environment variables
- [ ] Ensure database is accessible
- [ ] Run `npm install --production`
- [ ] Run `npm run build`
- [ ] Start with `npm start`
- [ ] Verify tables are created (check logs)
- [ ] Verify master data is seeded (check logs)
- [ ] Test API endpoints

### Docker Deployment (Optional)

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
```

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Ensure database credentials are valid
- Check that database server is running and accessible

---

**Note:** This backend is designed for **zero-configuration deployment**. Simply provide database credentials and everything else is handled automatically!
