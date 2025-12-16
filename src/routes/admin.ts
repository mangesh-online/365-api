import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminCheck.js';
import {
  // Resources
  getResources, createResource, updateResource, deleteResource,
  // Sessions
  getSessions, getSession, createSession, updateSession, deleteSession, toggleSessionFeatured,
  // Courses
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createLesson, updateLesson, deleteLesson,
  // Brain Tools
  getBrainTools, createBrainTool, updateBrainTool, deleteBrainTool,
  // Books
  getBooks, createBook, updateBook, deleteBook,
  // Templates
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  // Media
  getMedia, createMedia, updateMedia, deleteMedia,
  // Users
  getUsers, getUser, updateUser, toggleUserAdmin, banUser, unbanUser, deleteUser,
  // Dashboard
  getDashboardStats, getRecentActivity,
  // Analytics
  getUserAnalytics, getContentAnalytics,
  // Settings
  getSettings, updateSettings,
} from '../controllers/adminController.js';

const router = Router();

// ============ DASHBOARD ============
router.get('/dashboard/stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/dashboard/activity', authMiddleware, adminMiddleware, getRecentActivity);

// ============ USERS ============
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.get('/users/:userId', authMiddleware, adminMiddleware, getUser);
router.put('/users/:userId', authMiddleware, adminMiddleware, updateUser);
router.patch('/users/:userId/toggle-admin', authMiddleware, adminMiddleware, toggleUserAdmin);
router.post('/users/:userId/ban', authMiddleware, adminMiddleware, banUser);
router.post('/users/:userId/unban', authMiddleware, adminMiddleware, unbanUser);
router.delete('/users/:userId', authMiddleware, adminMiddleware, deleteUser);

// ============ SESSIONS ============
router.get('/sessions', authMiddleware, adminMiddleware, getSessions);
router.get('/sessions/:sessionId', authMiddleware, adminMiddleware, getSession);
router.post('/sessions', authMiddleware, adminMiddleware, createSession);
router.put('/sessions/:sessionId', authMiddleware, adminMiddleware, updateSession);
router.delete('/sessions/:sessionId', authMiddleware, adminMiddleware, deleteSession);
router.patch('/sessions/:sessionId/toggle-featured', authMiddleware, adminMiddleware, toggleSessionFeatured);

// ============ COURSES ============
router.get('/courses', authMiddleware, adminMiddleware, getCourses);
router.get('/courses/:courseId', authMiddleware, adminMiddleware, getCourse);
router.post('/courses', authMiddleware, adminMiddleware, createCourse);
router.put('/courses/:courseId', authMiddleware, adminMiddleware, updateCourse);
router.delete('/courses/:courseId', authMiddleware, adminMiddleware, deleteCourse);

// Course Lessons
router.post('/courses/:courseId/lessons', authMiddleware, adminMiddleware, createLesson);
router.put('/courses/:courseId/lessons/:lessonId', authMiddleware, adminMiddleware, updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', authMiddleware, adminMiddleware, deleteLesson);

// ============ RESOURCES ============

// Brain Tools
router.get('/brain-tools', authMiddleware, adminMiddleware, getBrainTools);
router.post('/brain-tools', authMiddleware, adminMiddleware, createBrainTool);
router.put('/brain-tools/:toolId', authMiddleware, adminMiddleware, updateBrainTool);
router.delete('/brain-tools/:toolId', authMiddleware, adminMiddleware, deleteBrainTool);

// Books
router.get('/books', authMiddleware, adminMiddleware, getBooks);
router.post('/books', authMiddleware, adminMiddleware, createBook);
router.put('/books/:bookId', authMiddleware, adminMiddleware, updateBook);
router.delete('/books/:bookId', authMiddleware, adminMiddleware, deleteBook);

// Templates
router.get('/templates', authMiddleware, adminMiddleware, getTemplates);
router.post('/templates', authMiddleware, adminMiddleware, createTemplate);
router.put('/templates/:templateId', authMiddleware, adminMiddleware, updateTemplate);
router.delete('/templates/:templateId', authMiddleware, adminMiddleware, deleteTemplate);

// Media (Audio/Video)
router.get('/media', authMiddleware, adminMiddleware, getMedia);
router.post('/media', authMiddleware, adminMiddleware, createMedia);
router.put('/media/:mediaId', authMiddleware, adminMiddleware, updateMedia);
router.delete('/media/:mediaId', authMiddleware, adminMiddleware, deleteMedia);

// Legacy resources endpoint
router.get('/resources', authMiddleware, adminMiddleware, getResources);
router.post('/resources', authMiddleware, adminMiddleware, createResource);
router.put('/resources/:resourceId', authMiddleware, adminMiddleware, updateResource);
router.delete('/resources/:resourceId', authMiddleware, adminMiddleware, deleteResource);

// ============ ANALYTICS ============
router.get('/analytics/users', authMiddleware, adminMiddleware, getUserAnalytics);
router.get('/analytics/content', authMiddleware, adminMiddleware, getContentAnalytics);

// ============ SETTINGS ============
router.get('/settings', authMiddleware, adminMiddleware, getSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateSettings);

export default router;
