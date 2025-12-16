import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as habitController from '../controllers/habitController.js';

const router = Router();

// Get User's Habits
router.get('/', authMiddleware, habitController.getHabits);

// Create Habit
router.post('/', authMiddleware, habitController.createHabit);

// Toggle Habit Completion
router.put('/:id/toggle', authMiddleware, habitController.toggleHabit);

// Get Habit Logs
router.get('/:id/logs', authMiddleware, habitController.getHabitLogs);

// Delete Habit
router.delete('/:id', authMiddleware, habitController.deleteHabit);

export default router;
