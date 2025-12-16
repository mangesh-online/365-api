import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getQuiz,
  getQuizVersion,
  submitQuiz,
  getQuizResults,
  retakeQuiz,
  skipQuiz,
  getQuizStats
} from '../controllers/quizController.js';

const router = Router();

// Routes that need authentication
const authenticatedRoutes = Router();
authenticatedRoutes.use(authMiddleware);

// ============================================
// QUIZ RETRIEVAL (Public)
// ============================================

router.get('/quiz', getQuiz);
router.get('/quiz/version', getQuizVersion);

// ============================================
// QUIZ SUBMISSION & MATCHING (Authenticated)
// ============================================

authenticatedRoutes.post('/quiz/submit', submitQuiz);
authenticatedRoutes.get('/quiz/results/:resultUserId', getQuizResults);
authenticatedRoutes.post('/quiz/retake', retakeQuiz);
authenticatedRoutes.get('/quiz/skip', skipQuiz);

// ============================================
// QUIZ ADMIN ENDPOINTS
// ============================================

authenticatedRoutes.get('/quiz/stats', getQuizStats);

// Merge authenticated routes
router.use(authenticatedRoutes);

export default router;
