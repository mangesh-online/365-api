import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as brainToolsController from '../controllers/brainToolsController.js';

const router = Router();

// ========== BRAIN TOOLS ==========
router.get('/tools', authMiddleware, brainToolsController.getAllBrainTools);
router.post('/tools/:toolId/start', authMiddleware, brainToolsController.startBrainTool);
router.post('/tools/:toolId/complete', authMiddleware, brainToolsController.completeBrainTool);

// ========== BOOKS ==========
router.get('/books', authMiddleware, brainToolsController.getAllBooks);
router.put('/books/:bookId/progress', authMiddleware, brainToolsController.updateBookProgress);

// ========== COURSES ==========
router.get('/courses', authMiddleware, brainToolsController.getAllCourses);
router.post('/courses/:courseId/enroll', authMiddleware, brainToolsController.enrollInCourse);

// ========== TEMPLATES ==========
router.get('/templates', authMiddleware, brainToolsController.getAllTemplates);
router.post('/templates/:templateId/download', authMiddleware, brainToolsController.downloadTemplate);

// ========== MEDIA (AUDIO/VIDEO) ==========
router.get('/media', authMiddleware, brainToolsController.getAllMedia);
router.post('/media/:mediaId/play', authMiddleware, brainToolsController.trackMediaPlay);

// ========== FAVORITES ==========
router.get('/favorites', authMiddleware, brainToolsController.getUserFavorites);
router.post('/favorites/toggle', authMiddleware, brainToolsController.toggleFavorite);

export default router;
