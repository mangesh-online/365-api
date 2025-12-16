import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Follow } from '../entities/Follow.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const followRepo = AppDataSource.getRepository(Follow);
const userRepo = AppDataSource.getRepository(User);

export const followUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.userId;
    const { userId: followingId } = req.params;

    if (!followerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userToFollow = await userRepo.findOne({ where: { id: followingId } });
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const existingFollow = await followRepo.findOne({
      where: { followerId, followingId }
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Create follow relationship
    const follow = followRepo.create({
      followerId,
      followingId
    });

    await followRepo.save(follow);

    res.json({ 
      message: 'Successfully followed user',
      follow 
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.userId;
    const { userId: followingId } = req.params;

    if (!followerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const follow = await followRepo.findOne({
      where: { followerId, followingId }
    });

    if (!follow) {
      return res.status(404).json({ message: 'Not following this user' });
    }

    await followRepo.remove(follow);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followers = await followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' }
    });

    const followerUsers = followers.map(f => ({
      id: f.follower.id,
      name: f.follower.name,
      avatar: f.follower.avatar,
      bio: f.follower.bio,
      followedAt: f.createdAt
    }));

    res.json(followerUsers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Failed to get followers' });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const following = await followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' }
    });

    const followingUsers = following.map(f => ({
      id: f.following.id,
      name: f.following.name,
      avatar: f.following.avatar,
      bio: f.following.bio,
      followedAt: f.createdAt
    }));

    res.json(followingUsers);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Failed to get following' });
  }
};

export const checkFollowStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.userId;
    const { userId: followingId } = req.params;

    if (!followerId) {
      return res.json({ isFollowing: false });
    }

    const follow = await followRepo.findOne({
      where: { followerId, followingId }
    });

    res.json({ 
      isFollowing: !!follow,
      followedAt: follow?.createdAt 
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ message: 'Failed to check follow status' });
  }
};

export const getFollowStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      followRepo.count({ where: { followingId: userId } }),
      followRepo.count({ where: { followerId: userId } })
    ]);

    res.json({
      followers: followersCount,
      following: followingCount
    });
  } catch (error) {
    console.error('Get follow stats error:', error);
    res.status(500).json({ message: 'Failed to get follow stats' });
  }
};
