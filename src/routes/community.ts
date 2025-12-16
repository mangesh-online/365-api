import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as communityController from '../controllers/communityController.js';

const router = Router();

// Get All Posts
router.get('/', authMiddleware, communityController.getAllPosts);

// Create Post
router.post('/', authMiddleware, communityController.createPost);

// Get Post Detail
router.get('/:postId', authMiddleware, communityController.getPostDetail);

// Like Post (toggle like/unlike)
router.put('/:postId/like', authMiddleware, communityController.likePost);
router.post('/:postId/like', authMiddleware, communityController.likePost);

// Get Comments
router.get('/:postId/comments', authMiddleware, communityController.getComments);

// Add Comment
router.post('/:postId/comments', authMiddleware, communityController.addComment);

// Delete Comment
router.delete('/:postId/comments/:commentId', authMiddleware, communityController.deleteComment);

// Like Comment (toggle like/unlike)
router.put('/:postId/comments/:commentId/like', authMiddleware, communityController.likeComment);
router.post('/:postId/comments/:commentId/like', authMiddleware, communityController.likeComment);

// Delete Post
router.delete('/:postId', authMiddleware, communityController.deletePost);

// Update Post
router.put('/:postId', authMiddleware, communityController.updatePost);

// Share Post
router.post('/:postId/share', authMiddleware, communityController.sharePost);

// Get Share Count
router.get('/:postId/shares', authMiddleware, communityController.getShareCount);

// React to Post (add/update reaction)
router.post('/:postId/react', authMiddleware, communityController.reactToPost);

// Remove Reaction
router.delete('/:postId/react', authMiddleware, communityController.removeReaction);

// Get Post Reactions
router.get('/:postId/reactions', authMiddleware, communityController.getPostReactions);

export default router;

