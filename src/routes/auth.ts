import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { signup, login, getCurrentUser, googleLogin, updatePlan } from '../controllers/authController.js';

const router = Router();

// Register / Signup
router.post('/signup', signup);

// Login
router.post('/login', login);

// Get Current User
router.get('/me', authMiddleware, getCurrentUser);

// Google OAuth Login (Simplified)
router.post('/google', googleLogin);

// Update Plan
router.put('/plan', authMiddleware, updatePlan);

export default router;
