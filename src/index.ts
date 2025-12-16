import 'reflect-metadata';
import 'dotenv/config';
import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';
import { AppDataSource } from './database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './utils/initDatabase.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import communityRoutes from './routes/community.js';
import courseRoutes from './routes/courses.js';
import wellnessRoutes from './routes/wellness.js';
import resourcesRoutes from './routes/resources.js';
import sessionsRoutes from './routes/sessions.js';
import adminRoutes from './routes/admin.js';
import tribeRoutes from './routes/tribes.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import followRoutes from './routes/follows.js';
import messageRoutes from './routes/messages.js';
import brainToolsRoutes from './routes/brainTools.js';
import tribeManagementRoutes from './routes/tribeManagement.js';

const app: Express = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from frontend URL or localhost
  if (origin === FRONTEND_URL || origin?.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON and URL-encoded bodies, but skip for file upload routes
app.use((req, res, next) => {
  if (req.path.includes('/upload-image') || req.path.includes('/upload-cover')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.includes('/upload-image') || req.path.includes('/upload-cover')) {
    return next();
  }
  express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/brain-tools', brainToolsRoutes);
app.use('/api/tribe-management', tribeManagementRoutes);
app.use('/api', tribeRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error Handling
app.use(errorHandler);

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Initialize tables and seed data if needed
    await initDatabase(AppDataSource);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
