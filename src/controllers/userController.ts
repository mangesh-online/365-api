import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { UserSettings } from '../entities/UserSettings.js';
import { Community } from '../entities/Community.js';
import { TribeMember } from '../entities/TribeMember.js';
import { Habit } from '../entities/Habit.js';
import { UserInterest } from '../entities/UserInterest.js';
import { UserProfileView } from '../entities/UserProfileView.js';
import bcrypt from 'bcryptjs';
import { processAvatar, processCoverPhoto, getFileUrl } from '../utils/upload.js';

const userRepository = AppDataSource.getRepository(User);
const settingsRepository = AppDataSource.getRepository(UserSettings);
const communityRepository = AppDataSource.getRepository(Community);
const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
const habitRepository = AppDataSource.getRepository(Habit);
const interestRepository = AppDataSource.getRepository(UserInterest);
const profileViewRepository = AppDataSource.getRepository(UserProfileView);

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const viewerId = (req as any).userId; // Current logged-in user
    
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['interests'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Track profile view if viewer is different from profile owner
    if (viewerId && viewerId !== userId) {
      try {
        const existingView = await profileViewRepository.findOne({
          where: {
            profileOwnerId: userId,
            viewerId: viewerId,
          },
        });

        if (!existingView) {
          // Create new view record
          const profileView = profileViewRepository.create({
            profileOwnerId: userId,
            viewerId: viewerId,
          });
          await profileViewRepository.save(profileView);
        } else {
          // Update view timestamp
          existingView.viewedAt = new Date();
          await profileViewRepository.save(existingView);
        }
      } catch (viewError) {
        console.error('Error tracking profile view:', viewError);
        // Don't fail the request if view tracking fails
      }
    }

    // Remove sensitive data
    const { password, ...userProfile } = user;

    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updates = req.body;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'bio', 'location', 'website', 'twitter', 
      'instagram', 'linkedin', 'phone', 'dateOfBirth', 
      'gender', 'avatar', 'coverPhoto'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (user as any)[field] = updates[field];
      }
    });

    await userRepository.save(user);

    // Handle interests separately
    if (updates.interests && Array.isArray(updates.interests)) {
      // Delete existing interests
      await interestRepository.delete({ userId: user.id });

      // Create new interests
      const interests = updates.interests.map((interest: any) => {
        const newInterest = new UserInterest();
        newInterest.userId = user.id;
        newInterest.interest = `${interest.category}-${interest.subcategory}`.toLowerCase();
        newInterest.proficiency = (interest.level || 'Beginner').toLowerCase() as any;
        newInterest.weight = interest.level === 'Expert' ? 10 : interest.level === 'Advanced' ? 7 : interest.level === 'Intermediate' ? 5 : 3;
        return newInterest;
      });

      if (interests.length > 0) {
        await interestRepository.save(interests);
      }
    }

    // Get updated user with interests
    const updatedUser = await userRepository.findOne({
      where: { id: userId },
      relations: ['interests'],
    });

    const { password, ...userProfile } = updatedUser!;

    res.json(userProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get user stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get post stats
    const posts = await communityRepository.find({ 
      where: { userId },
    });

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    
    // Count comments made by user (would need Comment entity)
    const totalComments = 0; // TODO: Implement when Comment entity is ready

    // Get tribes
    const tribeMembers = await tribeMemberRepository.find({
      where: { userId },
    });
    const tribesJoined = tribeMembers.length;

    // Get habit stats
    const habits = await habitRepository.find({ where: { userId } });
    const habitsCompleted = habits.reduce((sum, habit) => sum + (habit.totalCompletions || 0), 0);
    const currentStreak = Math.max(...habits.map(h => h.streak || 0), 0);
    const longestStreak = Math.max(...habits.map(h => h.bestStreak || 0), 0);

    // Count unique profile views
    const uniqueViews = await profileViewRepository
      .createQueryBuilder('view')
      .where('view.profileOwnerId = :userId', { userId })
      .select('COUNT(DISTINCT view.viewerId)', 'count')
      .getRawOne();
    const profileViews = parseInt(uniqueViews?.count || '0', 10);

    res.json({
      totalPosts,
      totalLikes,
      totalComments,
      tribesJoined,
      habitsCompleted,
      currentStreak,
      longestStreak,
      profileViews,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

// Get user posts
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const posts = await communityRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // Transform to match FeedPost type
    const formattedPosts = posts.map(post => ({
      id: post.id,
      user: post.user?.name || 'Anonymous',
      avatar: post.user?.avatar || '',
      content: post.content,
      likes: post.likes || 0,
      comments: 0, // TODO: Count from Comment entity
      timeAgo: getTimeAgo(post.createdAt),
      category: post.category || 'General',
      liked: false, // TODO: Check if current user liked
      hashtags: post.hashtags || [],
      mentions: post.mentions || [],
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to get user posts' });
  }
};

// Get user tribes
export const getUserTribes = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const memberships = await tribeMemberRepository.find({
      where: { userId },
      relations: ['tribe'],
    });

    const tribes = memberships.map(m => m.tribe);

    res.json(tribes);
  } catch (error) {
    console.error('Get user tribes error:', error);
    res.status(500).json({ message: 'Failed to get user tribes' });
  }
};

// Get user settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    let settings = await settingsRepository.findOne({ where: { userId } });

    // Create default settings if they don't exist
    if (!settings) {
      settings = settingsRepository.create({
        userId,
        profilePublic: true,
        showEmail: false,
        showActivity: true,
        showTribes: true,
        emailNotifications: true,
        postLikeNotifications: true,
        commentNotifications: true,
        tribeInviteNotifications: true,
        habitReminderNotifications: true,
        weeklyDigest: false,
        monthlyReport: false,
        marketingEmails: true,
        productUpdates: true,
        digestFrequency: 'daily',
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
      });
      await settingsRepository.save(settings);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// Update user settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updates = req.body;

    let settings = await settingsRepository.findOne({ where: { userId } });

    if (!settings) {
      const newSettings = new UserSettings();
      newSettings.userId = userId;
      Object.assign(newSettings, updates);
      settings = newSettings;
    } else {
      Object.assign(settings, updates);
    }

    const saved = await settingsRepository.save(settings);

    res.json(saved);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user || !user.password) {
      return res.status(400).json({ message: 'Cannot change password for this account' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await userRepository.save(user);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

// Disconnect Google account
export const disconnectGoogle = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ 
        message: 'Please set a password before disconnecting Google account' 
      });
    }

    user.googleId = undefined as any;
    await userRepository.save(user);

    res.json({ message: 'Google account disconnected' });
  } catch (error) {
    console.error('Disconnect Google error:', error);
    res.status(500).json({ message: 'Failed to disconnect Google account' });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await userRepository.delete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Process image
    const processedPath = await processAvatar(req.file.path);
    const url = getFileUrl(processedPath);

    // Update user avatar
    const user = await userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.avatar = url;
      await userRepository.save(user);
    }

    res.json({ url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

// Upload cover photo
export const uploadCover = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Process image
    const processedPath = await processCoverPhoto(req.file.path);
    const url = getFileUrl(processedPath);

    // Update user cover photo
    const user = await userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.coverPhoto = url;
      await userRepository.save(user);
    }

    res.json({ url });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ message: 'Failed to upload cover photo' });
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const currentUserId = (req as any).userId;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q.trim()}%`;

    const users = await userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('(user.name LIKE :searchTerm OR user.email LIKE :searchTerm)', { searchTerm })
      .select(['user.id', 'user.name', 'user.email', 'user.avatar', 'user.bio'])
      .take(20)
      .getMany();

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
