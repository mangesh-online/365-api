import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as wellnessController from '../controllers/wellnessController.js';

const router = Router();

// Log Mood
router.post('/mood', authMiddleware, wellnessController.logMood);

// Get Latest Mood
router.get('/mood/latest', authMiddleware, wellnessController.getLatestMood);

// Get Mood History
router.get('/mood/history', authMiddleware, wellnessController.getMoodHistory);

// Create Journal Entry
router.post('/journal', authMiddleware, wellnessController.createJournalEntry);

// Get Journal History
router.get('/journal/history', authMiddleware, wellnessController.getJournalHistory);

// Delete Journal Entry
router.delete('/journal/:id', authMiddleware, wellnessController.deleteJournalEntry);

// Get Activity Log
router.get('/activities', authMiddleware, wellnessController.getActivities);

export default router;
