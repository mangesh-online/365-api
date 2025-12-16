import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getFollowStats
} from '../controllers/followController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Follow/Unfollow
router.post('/:userId/follow', authMiddleware, followUser);
router.delete('/:userId/unfollow', authMiddleware, unfollowUser);

// Get followers/following
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Check follow status
router.get('/:userId/follow-status', authMiddleware, checkFollowStatus);

// Get follow stats
router.get('/:userId/stats', getFollowStats);

export default router;
