import { Response } from 'express';
import { AppDataSource } from '../database.js';
import { Tribe } from '../entities/Tribe.js';
import { TribeMember } from '../entities/TribeMember.js';
import { CommunityRole, RoleType } from '../entities/CommunityRole.js';
import { ModerationLog } from '../entities/ModerationLog.js';
import { Community } from '../entities/Community.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { In } from 'typeorm';

const tribeRepository = AppDataSource.getRepository(Tribe);
const memberRepository = AppDataSource.getRepository(TribeMember);
const roleRepository = AppDataSource.getRepository(CommunityRole);
const modLogRepository = AppDataSource.getRepository(ModerationLog);
const postRepository = AppDataSource.getRepository(Community);
const userRepository = AppDataSource.getRepository(User);

// Helper function to check if user has permission
async function hasPermission(
  userId: string,
  tribeId: string,
  requiredPermission: keyof NonNullable<typeof CommunityRole.prototype.permissions>
): Promise<boolean> {
  const role = await roleRepository.findOne({
    where: { userId, tribeId },
  });

  if (!role) return false;
  if (role.roleType === 'owner') return true; // Owner has all permissions

  const permissions = role.permissions;
  return permissions ? permissions[requiredPermission] : false;
}

// Get tribe details with user's role
export const getTribeDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    
    const tribe = await tribeRepository.findOne({
      where: { id: tribeId },
      relations: ['creator'],
    });

    if (!tribe) {
      res.status(404).json({ error: 'Tribe not found' });
      return;
    }

    // Get user's membership and role
    const membership = await memberRepository.findOne({
      where: { userId: req.userId!, tribeId },
    });

    const userRole = await roleRepository.findOne({
      where: { userId: req.userId!, tribeId },
    });

    // Get member count
    const memberCount = await memberRepository.count({ where: { tribeId } });

    // Get recent posts count
    const postCount = await postRepository.count({ where: { tribeId } });

    res.json({
      ...tribe,
      memberCount,
      postCount,
      isMember: !!membership,
      userRole: userRole?.roleType || null,
      permissions: userRole?.permissions || null,
    });
  } catch (error) {
    console.error('Error fetching tribe details:', error);
    res.status(500).json({ error: 'Failed to fetch tribe details' });
  }
};

// Get tribe members with their roles
export const getTribeMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const { page = 1, limit = 20, role } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const whereClause: any = { tribeId };
    if (role) {
      const roles = await roleRepository.find({
        where: { tribeId, roleType: role as RoleType },
      });
      const userIds = roles.map(r => r.userId);
      whereClause.userId = In(userIds);
    }

    const [members, total] = await memberRepository.findAndCount({
      where: whereClause,
      relations: ['user'],
      skip,
      take: Number(limit),
      order: { joinedAt: 'DESC' },
    });

    // Attach roles to members
    const memberIds = members.map(m => m.userId);
    const roles = await roleRepository.find({
      where: { userId: In(memberIds), tribeId },
    });

    const roleMap = new Map(roles.map(r => [r.userId, r]));

    const membersWithRoles = members.map(member => ({
      ...member,
      role: roleMap.get(member.userId)?.roleType || 'member',
      customTitle: roleMap.get(member.userId)?.customTitle,
      badgeColor: roleMap.get(member.userId)?.badgeColor,
    }));

    res.json({
      members: membersWithRoles,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching tribe members:', error);
    res.status(500).json({ error: 'Failed to fetch tribe members' });
  }
};

// Assign role to member (admin/moderator only)
export const assignRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, userId } = req.params;
    const { roleType, customTitle, badgeColor, permissions } = req.body;

    // Check if requester has permission
    const canManageRoles = await hasPermission(req.userId!, tribeId, 'canManageRoles');
    if (!canManageRoles) {
      res.status(403).json({ error: 'You do not have permission to manage roles' });
      return;
    }

    // Check if tribe and user exist
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ error: 'Tribe not found' });
      return;
    }

    const member = await memberRepository.findOne({ where: { userId, tribeId } });
    if (!member) {
      res.status(404).json({ error: 'User is not a member of this tribe' });
      return;
    }

    // Check if role already exists
    let role = await roleRepository.findOne({ where: { userId, tribeId } });

    if (role) {
      // Update existing role
      role.roleType = roleType;
      role.customTitle = customTitle;
      role.badgeColor = badgeColor;
      role.permissions = permissions;
    } else {
      // Create new role
      role = roleRepository.create({
        userId,
        tribeId,
        roleType,
        customTitle,
        badgeColor,
        permissions,
      });
    }

    await roleRepository.save(role);

    // Log the action
    await modLogRepository.save(
      modLogRepository.create({
        tribeId,
        moderatorId: req.userId!,
        targetUserId: userId,
        actionType: 'assign_role',
        reason: `Assigned role: ${roleType}`,
        metadata: { roleType, customTitle },
      })
    );

    res.json({ success: true, role });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

// Remove member from tribe (admin/moderator only)
export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, userId } = req.params;
    const { reason } = req.body;

    // Check if requester has permission
    const canManageMembers = await hasPermission(req.userId!, tribeId, 'canManageMembers');
    if (!canManageMembers) {
      res.status(403).json({ error: 'You do not have permission to remove members' });
      return;
    }

    // Cannot remove the tribe owner
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (tribe?.creatorId === userId) {
      res.status(403).json({ error: 'Cannot remove the tribe owner' });
      return;
    }

    // Remove member
    await memberRepository.delete({ userId, tribeId });
    await roleRepository.delete({ userId, tribeId });

    // Update member count
    await tribeRepository.decrement({ id: tribeId }, 'membersCount', 1);

    // Log the action
    await modLogRepository.save(
      modLogRepository.create({
        tribeId,
        moderatorId: req.userId!,
        targetUserId: userId,
        actionType: 'remove_member',
        reason: reason || 'No reason provided',
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Ban member from tribe
export const banMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, userId } = req.params;
    const { reason, duration } = req.body; // duration in days, null for permanent

    // Check if requester has permission
    const canBanMembers = await hasPermission(req.userId!, tribeId, 'canBanMembers');
    if (!canBanMembers) {
      res.status(403).json({ error: 'You do not have permission to ban members' });
      return;
    }

    // Cannot ban the tribe owner
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (tribe?.creatorId === userId) {
      res.status(403).json({ error: 'Cannot ban the tribe owner' });
      return;
    }

    // Remove member
    await memberRepository.delete({ userId, tribeId });
    await roleRepository.delete({ userId, tribeId });

    // Update member count
    await tribeRepository.decrement({ id: tribeId }, 'membersCount', 1);

    // Log the action
    await modLogRepository.save(
      modLogRepository.create({
        tribeId,
        moderatorId: req.userId!,
        targetUserId: userId,
        actionType: 'ban_user',
        reason: reason || 'No reason provided',
        metadata: { duration },
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error banning member:', error);
    res.status(500).json({ error: 'Failed to ban member' });
  }
};

// Delete post (moderator only)
export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, postId } = req.params;
    const { reason } = req.body;

    // Check if requester has permission
    const canDeletePosts = await hasPermission(req.userId!, tribeId, 'canDeletePosts');
    if (!canDeletePosts) {
      res.status(403).json({ error: 'You do not have permission to delete posts' });
      return;
    }

    const post = await postRepository.findOne({ where: { id: postId, tribeId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    await postRepository.remove(post);

    // Log the action
    await modLogRepository.save(
      modLogRepository.create({
        tribeId,
        moderatorId: req.userId!,
        targetPostId: postId,
        targetUserId: post.userId,
        actionType: 'delete_post',
        reason: reason || 'Violated community guidelines',
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Get moderation logs
export const getModerationLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if requester has permission to view logs
    const canViewAnalytics = await hasPermission(req.userId!, tribeId, 'canViewAnalytics');
    if (!canViewAnalytics) {
      res.status(403).json({ error: 'You do not have permission to view moderation logs' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await modLogRepository.findAndCount({
      where: { tribeId },
      relations: ['moderator', 'targetUser'],
      skip,
      take: Number(limit),
      order: { createdAt: 'DESC' },
    });

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    res.status(500).json({ error: 'Failed to fetch moderation logs' });
  }
};

// Update tribe settings (admin only)
export const updateTribeSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const updates = req.body;

    // Check if requester has permission
    const canEditTribe = await hasPermission(req.userId!, tribeId, 'canEditTribe');
    if (!canEditTribe) {
      res.status(403).json({ error: 'You do not have permission to edit tribe settings' });
      return;
    }

    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ error: 'Tribe not found' });
      return;
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'description',
      'category',
      'rules',
      'welcomeMessage',
      'goals',
      'isPublic',
      'banner',
      'icon',
      'coverImage',
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (tribe as any)[field] = updates[field];
      }
    });

    await tribeRepository.save(tribe);

    // Log the action
    await modLogRepository.save(
      modLogRepository.create({
        tribeId,
        moderatorId: req.userId!,
        actionType: 'edit_tribe',
        reason: 'Updated tribe settings',
        metadata: { updatedFields: Object.keys(updates) },
      })
    );

    res.json({ success: true, tribe });
  } catch (error) {
    console.error('Error updating tribe settings:', error);
    res.status(500).json({ error: 'Failed to update tribe settings' });
  }
};

// Get tribe analytics (admin only)
export const getTribeAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, all

    // Check if requester has permission
    const canViewAnalytics = await hasPermission(req.userId!, tribeId, 'canViewAnalytics');
    if (!canViewAnalytics) {
      res.status(403).json({ error: 'You do not have permission to view analytics' });
      return;
    }

    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ error: 'Tribe not found' });
      return;
    }

    // Calculate date range
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date(0); // Beginning of time

    // Get member growth
    const newMembers = await memberRepository.count({
      where: {
        tribeId,
        joinedAt: period !== 'all' ? { $gte: startDate } as any : undefined,
      } as any,
    });

    // Get post activity
    const postStats = await postRepository
      .createQueryBuilder('post')
      .where('post.tribeId = :tribeId', { tribeId })
      .andWhere(period !== 'all' ? 'post.createdAt >= :startDate' : '1=1', { startDate })
      .select('COUNT(post.id)', 'totalPosts')
      .addSelect('SUM(post.likes)', 'totalLikes')
      .addSelect('SUM(post.views)', 'totalViews')
      .getRawOne();

    // Get active members (posted or commented in period)
    const activeMembers = await postRepository
      .createQueryBuilder('post')
      .where('post.tribeId = :tribeId', { tribeId })
      .andWhere(period !== 'all' ? 'post.createdAt >= :startDate' : '1=1', { startDate })
      .select('COUNT(DISTINCT post.userId)', 'count')
      .getRawOne();

    res.json({
      memberGrowth: {
        newMembers,
        total: tribe.membersCount,
      },
      engagement: {
        totalPosts: Number(postStats.totalPosts) || 0,
        totalLikes: Number(postStats.totalLikes) || 0,
        totalViews: Number(postStats.totalViews) || 0,
        activeMembers: Number(activeMembers.count) || 0,
      },
      period,
    });
  } catch (error) {
    console.error('Error fetching tribe analytics:', error);
    res.status(500).json({ error: 'Failed to fetch tribe analytics' });
  }
};
