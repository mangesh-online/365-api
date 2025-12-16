import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

// Get comprehensive dashboard data
router.get('/overview', authMiddleware, dashboardController.getDashboardOverview);

// Get dashboard stats (habits, wellness, learning)
router.get('/stats', authMiddleware, dashboardController.getDashboardStats);

// Get weekly progress
router.get('/weekly-progress', authMiddleware, dashboardController.getWeeklyProgress);

// Get achievements and badges
router.get('/achievements', authMiddleware, dashboardController.getAchievements);

// Get leaderboard preview
router.get('/leaderboard', authMiddleware, dashboardController.getLeaderboardPreview);

export default router;
