import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';
import {
  getProfile,
  updateProfile,
  getStats,
  getUserPosts,
  getUserTribes,
  getSettings,
  updateSettings,
  changePassword,
  disconnectGoogle,
  deleteAccount,
  uploadAvatar,
  uploadCover,
  searchUsers,
} from '../controllers/userController.js';

const router = Router();

// Search routes
router.get('/search', authMiddleware, searchUsers);

// Profile routes
router.get('/:userId/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/:userId/stats', authMiddleware, getStats);
router.get('/:userId/posts', authMiddleware, getUserPosts);
router.get('/:userId/tribes', authMiddleware, getUserTribes);

// Settings routes
router.get('/settings', authMiddleware, getSettings);
router.put('/settings', authMiddleware, updateSettings);

// Security routes
router.put('/password', authMiddleware, changePassword);
router.post('/disconnect-google', authMiddleware, disconnectGoogle);
router.delete('/account', authMiddleware, deleteAccount);

// Upload routes
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.post('/upload-cover', authMiddleware, upload.single('cover'), uploadCover);

export default router;
