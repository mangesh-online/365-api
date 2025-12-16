import { Router } from 'express';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import {
  getTribeDetails,
  getTribeMembers,
  assignRole,
  removeMember,
  banMember,
  deletePost,
  getModerationLogs,
  updateTribeSettings,
  getTribeAnalytics,
} from '../controllers/tribeManagementController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tribe management routes
router.get('/:tribeId', getTribeDetails);
router.get('/:tribeId/members', getTribeMembers);
router.post('/:tribeId/members/:userId/role', assignRole);
router.delete('/:tribeId/members/:userId', removeMember);
router.post('/:tribeId/members/:userId/ban', banMember);
router.delete('/:tribeId/posts/:postId', deletePost);
router.get('/:tribeId/moderation-logs', getModerationLogs);
router.put('/:tribeId/settings', updateTribeSettings);
router.get('/:tribeId/analytics', getTribeAnalytics);

export default router;
