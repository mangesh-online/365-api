import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  getAllSessions, 
  getUpcomingSessions,
  getLiveSessions,
  getPastSessions,
  attendSession,
  rsvpSession,
  cancelRSVP,
  getUserRSVPs,
  getSessionRSVPs,
  getSessionStats,
  getActivityFeed,
  getRecommendations,
  createActivity
} from '../controllers/sessionController.js';

const router = Router();

// Get all sessions
router.get('/', getAllSessions);

// Get upcoming sessions
router.get('/upcoming', getUpcomingSessions);

// Get live sessions
router.get('/live', getLiveSessions);

// Get past sessions
router.get('/past', getPastSessions);

// Get session stats (authenticated)
router.get('/stats', authMiddleware, getSessionStats);

// Get activity feed
router.get('/activity', getActivityFeed);

// Get recommendations (authenticated)
router.get('/recommendations', authMiddleware, getRecommendations);

// Create activity (authenticated)
router.post('/activity', authMiddleware, createActivity);

// Get user's RSVPs
router.get('/my-rsvps', authMiddleware, getUserRSVPs);

// Get session RSVPs
router.get('/:sessionId/rsvps', getSessionRSVPs);

// RSVP to a session
router.post('/:sessionId/rsvp', authMiddleware, rsvpSession);

// Cancel RSVP
router.delete('/:sessionId/rsvp', authMiddleware, cancelRSVP);

// Attend a session (record attendance)
router.post('/:sessionId/attend', authMiddleware, attendSession);

export default router;
