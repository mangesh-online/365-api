import { Response } from 'express';
import { AppDataSource } from '../database.js';
import { Community } from '../entities/Community.js';
import { Comment } from '../entities/Comment.js';
import { Share } from '../entities/Share.js';
import { EngagementStat } from '../entities/EngagementStat.js';
import { User } from '../entities/User.js';
import { PostReaction, ReactionType } from '../entities/PostReaction.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { IsNull } from 'typeorm';

const postRepository = AppDataSource.getRepository(Community);
const commentRepository = AppDataSource.getRepository(Comment);
const shareRepository = AppDataSource.getRepository(Share);
const engagementRepository = AppDataSource.getRepository(EngagementStat);
const userRepository = AppDataSource.getRepository(User);
const reactionRepository = AppDataSource.getRepository(PostReaction);

export const getAllPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await postRepository.find({
      relations: ['user', 'comments'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Get all likes for current user
    const userLikes = await engagementRepository.find({
      where: { userId: req.userId, action: 'like' },
    });
    const likedPostIds = new Set(userLikes.map(like => like.postId));

    // Add liked status to each post
    const postsWithLikedStatus = posts.map(post => ({
      ...post,
      liked: likedPostIds.has(post.id)
    }));

    res.json(postsWithLikedStatus);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, category, tribeId, eventDetails, media, hashtags, mentions } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const post = postRepository.create({
      userId: req.userId,
      title,
      content,
      category: category || 'General',
      tribeId,
      eventDetails,
      media,
      hashtags,
      mentions,
      likes: 0,
      reactions: [],
    });

    const savedPost = await postRepository.save(post);
    const postWithUser = await postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['user', 'comments'],
    });

    res.status(201).json(postWithUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const getPostDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'comments.user', 'shares'],
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await postRepository.save(post);

    // Check if current user has liked this post
    const userLike = await engagementRepository.findOne({
      where: { postId, userId: req.userId, action: 'like' },
    });

    const postResponse = {
      ...post,
      liked: !!userLike
    };

    res.json(postResponse);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const likePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await postRepository.findOne({ 
      where: { id: postId },
      relations: ['user', 'comments', 'shares']
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user already liked
    const existingLike = await engagementRepository.findOne({
      where: { postId, userId: req.userId, action: 'like' },
    });

    let liked = false;

    if (existingLike) {
      // Unlike: Remove the like
      post.likes = Math.max(0, post.likes - 1);
      await postRepository.save(post);
      await engagementRepository.remove(existingLike);
      liked = false;
    } else {
      // Like: Add the like
      post.likes += 1;
      await postRepository.save(post);

      // Track engagement
      const engagement = engagementRepository.create({
        postId,
        userId: req.userId,
        action: 'like',
      });
      await engagementRepository.save(engagement);
      liked = true;
    }

    // Return post with liked status
    const postResponse = {
      ...post,
      liked
    };

    res.json(postResponse);
  } catch (error) {
    console.error('Failed to like/unlike post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await commentRepository.findOne({ where: { id: parentId } });
      if (!parentComment) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const comment = commentRepository.create({
      postId,
      userId: req.userId,
      parentId: parentId || null,
      content,
      likes: 0,
    });

    const savedComment = await commentRepository.save(comment);
    const commentWithUser = await commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    // Track engagement
    const engagement = engagementRepository.create({
      postId,
      userId: req.userId,
      action: 'comment',
    });
    await engagementRepository.save(engagement);

    // Add liked status (always false for newly created comment)
    const commentWithLikedStatus = { ...commentWithUser, liked: false };

    res.status(201).json(commentWithLikedStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const getComments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const comments = await commentRepository.find({
      where: { postId, parentId: IsNull() }, // Only top-level comments
      relations: ['user', 'replies', 'replies.user'],
      order: { createdAt: 'ASC' },
    });

    // Add liked status as false for now (will be implemented after DB migration)
    const commentsWithLikedStatus = comments.map(comment => ({
      ...comment,
      liked: false,
      replies: (comment.replies || []).map(reply => ({ ...reply, liked: false }))
    }));

    res.json(commentsWithLikedStatus);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await postRepository.findOne({ where: { id: postId } });

    if (!post || post.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await postRepository.remove(post);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, category, title } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const post = await postRepository.findOne({ 
      where: { id: postId },
      relations: ['user', 'comments', 'shares']
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (post.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized to edit this post' });
      return;
    }

    // Update post fields
    post.content = content;
    if (category) post.category = category;
    if (title !== undefined) post.title = title;
    post.updatedAt = new Date();

    await postRepository.save(post);

    // Check if current user has liked this post
    const userLike = await engagementRepository.findOne({
      where: { postId, userId: req.userId, action: 'like' },
    });

    const postResponse = {
      ...post,
      liked: !!userLike
    };

    res.json(postResponse);
  } catch (error) {
    console.error('Failed to update post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const sharePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    
    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user already shared this post
    const existingShare = await shareRepository.findOne({
      where: { postId, userId: req.userId },
    });

    if (existingShare) {
      res.status(400).json({ error: 'Already shared this post' });
      return;
    }

    const share = shareRepository.create({
      postId,
      userId: req.userId,
    });

    await shareRepository.save(share);

    // Track engagement
    const engagement = engagementRepository.create({
      postId,
      userId: req.userId,
      action: 'share',
    });
    await engagementRepository.save(engagement);

    // Get updated share count
    const shareCount = await shareRepository.count({ where: { postId } });
    
    res.status(201).json({ message: 'Post shared', shareCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share post' });
  }
};

export const getShareCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const shareCount = await shareRepository.count({ where: { postId } });
    
    res.json({ postId, shareCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch share count' });
  }
};

// Add or update reaction to post
export const reactToPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body as { reactionType: ReactionType };

    if (!reactionType || !['like', 'love', 'support', 'celebrate', 'insightful', 'thinking'].includes(reactionType)) {
      res.status(400).json({ error: 'Invalid reaction type' });
      return;
    }

    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check if user already reacted
    let reaction = await reactionRepository.findOne({
      where: { postId, userId: req.userId! },
    });

    if (reaction) {
      // Update existing reaction
      reaction.reactionType = reactionType;
    } else {
      // Create new reaction
      reaction = reactionRepository.create({
        postId,
        userId: req.userId!,
        reactionType,
      });
    }

    await reactionRepository.save(reaction);

    // Track engagement
    await engagementRepository.save(
      engagementRepository.create({
        postId,
        userId: req.userId!,
        action: 'react',
      })
    );

    // Get reaction counts
    const reactions = await getReactionCounts(postId);

    res.json({ success: true, reaction, reactions });
  } catch (error) {
    console.error('Error reacting to post:', error);
    res.status(500).json({ error: 'Failed to react to post' });
  }
};

// Remove reaction from post
export const removeReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const reaction = await reactionRepository.findOne({
      where: { postId, userId: req.userId! },
    });

    if (!reaction) {
      res.status(404).json({ error: 'Reaction not found' });
      return;
    }

    await reactionRepository.remove(reaction);

    // Get updated reaction counts
    const reactions = await getReactionCounts(postId);

    res.json({ success: true, reactions });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

// Get reaction counts for a post
export const getPostReactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const reactions = await getReactionCounts(postId);

    // Get user's reaction if exists
    const userReaction = await reactionRepository.findOne({
      where: { postId, userId: req.userId! },
    });

    res.json({
      postId,
      reactions,
      userReaction: userReaction?.reactionType || null,
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
};

// Helper function to get reaction counts
async function getReactionCounts(postId: string) {
  const reactions = await reactionRepository
    .createQueryBuilder('reaction')
    .where('reaction.postId = :postId', { postId })
    .select('reaction.reactionType', 'type')
    .addSelect('COUNT(*)', 'count')
    .groupBy('reaction.reactionType')
    .getRawMany();

  const reactionMap: { [key: string]: number } = {};
  reactions.forEach(r => {
    reactionMap[r.type] = parseInt(r.count);
  });

  return reactionMap;
}

// Delete Comment
export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, commentId } = req.params;
    
    const comment = await commentRepository.findOne({ 
      where: { id: commentId, postId } 
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check if user is the comment author
    if (comment.userId !== req.userId) {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }

    await commentRepository.remove(comment);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Like Comment (simplified version - just increment likes)
export const likeComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, commentId } = req.params;

    const comment = await commentRepository.findOne({ 
      where: { id: commentId, postId } 
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Simple increment for now (toggle will be added after DB migration)
    comment.likes = (comment.likes || 0) + 1;
    await commentRepository.save(comment);

    res.json({ 
      success: true, 
      liked: true,
      likes: comment.likes 
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
};
