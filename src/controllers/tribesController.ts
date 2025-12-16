import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Tribe } from '../entities/Tribe.js';
import { TribeMember } from '../entities/TribeMember.js';
import { TribeJoinRequest } from '../entities/TribeJoinRequest.js';
import { Community } from '../entities/Community.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { upload, processTribeAvatar, processTribeCover, getFileUrl } from '../utils/upload.js';

// ============================================
// TRIBE DISCOVERY & BROWSING
// ============================================

/**
 * Get all public tribes with pagination and filtering
 */
export const getTribes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, goal, search, sortBy = 'membersCount' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const skip = (pageNum - 1) * limitNum;

    const tribeRepository = AppDataSource.getRepository(Tribe);
    let query = tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('tribe.members', 'members');

    // Filter by goal
    if (goal) {
      query = query.andWhere('tribe.goalType = :goal', { goal });
    }

    // Filter by search term
    if (search) {
      query = query.andWhere(
        '(tribe.name ILIKE :search OR tribe.description ILIKE :search OR tribe.interests ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        query = query.orderBy('tribe.createdAt', 'DESC');
        break;
      case 'active':
        query = query.orderBy('tribe.metadata', 'DESC'); // Would need to parse JSON
        break;
      case 'trending':
        query = query.orderBy('tribe.postCount', 'DESC');
        break;
      case 'membersCount':
      default:
        query = query.orderBy('tribe.membersCount', 'DESC');
    }

    query = query.skip(skip).take(limitNum);

    const [tribes, total] = await query.getManyAndCount();

    res.json({
      success: true,
      data: tribes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching tribes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tribes' });
  }
};

/**
 * Get recommended tribes based on user's profile and quiz answers
 */
export const discoverTribes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const tribeRepository = AppDataSource.getRepository(Tribe);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['interests', 'tribesMemberships'],
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get all public tribes user hasn't joined
    const userTribeIds = user.tribesMemberships?.map((m) => m.tribeId) || [];
    const tribes = await tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.isPublic = :isPublic', { isPublic: true })
      .andWhere('tribe.id NOT IN (:...tribeIds)', {
        tribeIds: userTribeIds.length > 0 ? userTribeIds : ['null'],
      })
      .leftJoinAndSelect('tribe.members', 'members')
      .orderBy('tribe.membersCount', 'DESC')
      .take(20)
      .getMany();

    // TODO: Implement advanced matching using TribeMatchingService
    // For now, return all public tribes user hasn't joined

    res.json({
      success: true,
      data: tribes,
      totalCount: tribes.length,
    });
  } catch (error) {
    console.error('Error discovering tribes:', error);
    res.status(500).json({ success: false, message: 'Failed to discover tribes' });
  }
};

// ============================================
// TRIBE MANAGEMENT (CRUD)
// ============================================

/**
 * Create a new tribe
 */
export const createTribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, description, goalType, interests, icon, banner, rules, isPublic = true } = req.body;

    // Validation
    if (!name || !description || !goalType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, goalType',
      });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Create tribe
    const tribe = tribeRepository.create({
      creatorId: userId,
      name,
      description,
      goalType,
      interests: interests || [],
      icon,
      banner,
      rules,
      isPublic,
      membersCount: 1, // Creator is first member
      postCount: 0,
    });

    const savedTribe = await tribeRepository.save(tribe);

    // Add creator as admin member
    const tribeMember = tribeMemberRepository.create({
      userId,
      tribeId: savedTribe.id,
      role: 'creator',
      isAdmin: true,
      contributionScore: 100,
    });

    await tribeMemberRepository.save(tribeMember);

    res.status(201).json({
      success: true,
      message: 'Tribe created successfully',
      data: savedTribe,
    });
  } catch (error) {
    console.error('Error creating tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to create tribe' });
  }
};

/**
 * Get tribe details including members and posts
 */
export const getTribeDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribe = await tribeRepository
      .createQueryBuilder('tribe')
      .where('tribe.id = :tribeId', { tribeId })
      .leftJoinAndSelect('tribe.members', 'members')
      .leftJoinAndSelect('members.user', 'user', 'user.id = members.userId')
      .getOne();

    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    // Check if user has access (public tribe or is member)
    const userId = req.userId;
    if (!tribe.isPublic && userId) {
      const isMember = tribe.members?.some((m) => m.userId === userId);
      if (!isMember) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    res.json({ success: true, data: tribe });
  } catch (error) {
    console.error('Error fetching tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tribe' });
  }
};

/**
 * Update tribe (creator/admin only)
 */
export const updateTribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;
    const { 
      name, 
      description, 
      goalType, 
      interests, 
      icon, 
      banner, 
      rules, 
      isPublic,
      category,
      welcomeMessage,
      goals,
      milestones,
      resources,
      image,
      coverImage,
      tags,
      membershipQuestions
    } = req.body;

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });

    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    // Check authorization (creator or admin)
    if (tribe.creatorId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to update this tribe' });
      return;
    }

    // Update fields
    if (name) tribe.name = name;
    if (description) tribe.description = description;
    if (goalType) tribe.goalType = goalType;
    if (interests) tribe.interests = interests;
    if (icon) tribe.icon = icon;
    if (banner) tribe.banner = banner;
    if (rules) tribe.rules = rules;
    if (isPublic !== undefined) tribe.isPublic = isPublic;
    if (category) tribe.category = category;
    if (welcomeMessage !== undefined) tribe.welcomeMessage = welcomeMessage;
    if (goals !== undefined) tribe.goals = goals;
    if (milestones !== undefined) tribe.milestones = milestones;
    if (resources !== undefined) tribe.resources = resources;
    if (image) tribe.image = image;
    if (coverImage) tribe.coverImage = coverImage;
    if (tags) tribe.tags = tags;
    if (membershipQuestions) tribe.membershipQuestions = membershipQuestions;

    const updated = await tribeRepository.save(tribe);

    res.json({ success: true, message: 'Tribe updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to update tribe' });
  }
};

/**
 * Delete tribe (creator only)
 */
export const deleteTribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });

    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    if (tribe.creatorId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this tribe' });
      return;
    }

    await tribeRepository.delete(tribeId);

    res.json({ success: true, message: 'Tribe deleted successfully' });
  } catch (error) {
    console.error('Error deleting tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tribe' });
  }
};

// ============================================
// TRIBE MEMBERSHIP
// ============================================

/**
 * Join a tribe
 */
export const joinTribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;
    const { answers } = req.body; // Answers to membership questions

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const requestRepository = AppDataSource.getRepository(TribeJoinRequest);

    // Check if tribe exists
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    // Check if already a member
    const existingMember = await tribeMemberRepository.findOne({
      where: { userId, tribeId },
    });

    if (existingMember) {
      res.status(400).json({ success: false, message: 'Already a member of this tribe' });
      return;
    }

    // Check if already has a pending request
    const existingRequest = await requestRepository.findOne({
      where: { userId, tribeId, status: 'pending' },
    });

    if (existingRequest) {
      res.status(400).json({ success: false, message: 'Join request already pending' });
      return;
    }

    // If tribe is public and has no membership questions, join directly
    if (tribe.isPublic && (!tribe.membershipQuestions || tribe.membershipQuestions.length === 0)) {
      const newMember = tribeMemberRepository.create({
        userId,
        tribeId,
        role: 'member',
        joinedAt: new Date(),
      });

      await tribeMemberRepository.save(newMember);

      // Increment member count
      await tribeRepository.increment({ id: tribeId }, 'membersCount', 1);

      res.status(201).json({
        success: true,
        message: 'Successfully joined tribe',
        data: newMember,
      });
      return;
    }

    // Otherwise, create a join request
    const joinRequest = requestRepository.create({
      userId,
      tribeId,
      answers: answers || [],
      status: 'pending',
    });

    await requestRepository.save(joinRequest);

    res.status(201).json({
      success: true,
      message: 'Join request submitted. Waiting for admin approval.',
      data: joinRequest,
    });
  } catch (error) {
    console.error('Error joining tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to join tribe' });
  }
};

/**
 * Leave a tribe
 */
export const leaveTribe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Check if member
    const member = await tribeMemberRepository.findOne({
      where: { userId, tribeId },
    });

    if (!member) {
      res.status(404).json({ success: false, message: 'Not a member of this tribe' });
      return;
    }

    // Prevent creator from leaving (must delete tribe instead)
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (tribe?.creatorId === userId) {
      res.status(400).json({
        success: false,
        message: 'Creator cannot leave tribe. Delete the tribe instead.',
      });
      return;
    }

    // Remove member
    await tribeMemberRepository.delete({ id: member.id });

    // Decrement member count
    if (tribe) {
      tribe.membersCount = Math.max(0, tribe.membersCount - 1);
      await tribeRepository.save(tribe);
    }

    res.json({ success: true, message: 'Successfully left tribe' });
  } catch (error) {
    console.error('Error leaving tribe:', error);
    res.status(500).json({ success: false, message: 'Failed to leave tribe' });
  }
};

/**
 * Get tribes the user is a member of
 */
export const getUserTribes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const members = await tribeMemberRepository
      .createQueryBuilder('member')
      .where('member.userId = :userId', { userId })
      .leftJoinAndSelect('member.tribe', 'tribe')
      .orderBy('member.joinedAt', 'DESC')
      .getMany();

    const tribes = members.map((m) => ({
      ...m.tribe,
      role: m.role,
      joinedAt: m.joinedAt,
      isMuted: m.isMuted,
      isBanned: m.isBanned,
    }));

    res.json({ success: true, data: tribes, count: tribes.length });
  } catch (error) {
    console.error('Error fetching user tribes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tribes' });
  }
};

// ============================================
// TRIBE CONTENT (POSTS)
// ============================================

/**
 * Get posts from a specific tribe
 */
export const getTribeFeed = async (req: Request, res: Response) => {
  try {
    const { tribeId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const communityRepository = AppDataSource.getRepository(Community);

    let query = communityRepository
      .createQueryBuilder('post')
      .where('post.tribeId = :tribeId', { tribeId })
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.shares', 'shares');

    // Sort
    if (sortBy === 'trending') {
      query = query.orderBy('post.likes', 'DESC');
    } else {
      query = query.orderBy('post.createdAt', 'DESC');
    }

    query = query.skip(skip).take(limitNum);
    const [posts, total] = await query.getManyAndCount();

    res.json({
      success: true,
      data: posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching tribe feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tribe feed' });
  }
};

// ============================================
// TRIBE MEMBERS
// ============================================

/**
 * Get all members of a tribe with their details
 */
export const getTribeMembers = async (req: Request, res: Response) => {
  try {
    const { tribeId } = req.params;
    const { page = 1, limit = 20, sortBy = 'joinedAt' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    let query = tribeMemberRepository
      .createQueryBuilder('member')
      .where('member.tribeId = :tribeId', { tribeId })
      .leftJoinAndSelect('member.user', 'user');

    // Sort
    if (sortBy === 'contribution') {
      query = query.orderBy('member.contributionScore', 'DESC');
    } else {
      query = query.orderBy('member.joinedAt', 'DESC');
    }

    query = query.skip(skip).take(limitNum);
    const [members, total] = await query.getManyAndCount();

    res.json({
      success: true,
      data: members,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching tribe members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// ============================================
// TRIBE IMAGE UPLOADS
// ============================================

/**
 * Upload tribe avatar image
 */
export const uploadTribeAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || member?.role === 'admin' || member?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can upload tribe images' });
      return;
    }

    // Process image
    const processedPath = await processTribeAvatar(req.file.path);
    const imageUrl = getFileUrl(processedPath);

    // Update tribe
    await tribeRepository.update(tribeId, { image: imageUrl });

    res.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Error uploading tribe avatar:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload avatar' });
  }
};

/**
 * Upload tribe cover photo
 */
export const uploadTribeCover = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || member?.role === 'admin' || member?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can upload tribe images' });
      return;
    }

    // Process image
    const processedPath = await processTribeCover(req.file.path);
    const coverUrl = getFileUrl(processedPath);

    // Update tribe
    await tribeRepository.update(tribeId, { coverImage: coverUrl });

    res.json({ success: true, url: coverUrl });
  } catch (error: any) {
    console.error('Error uploading tribe cover:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload cover' });
  }
};

// ============================================
// JOIN REQUEST MANAGEMENT
// ============================================

/**
 * Get pending join requests for a tribe
 */
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const requestRepository = AppDataSource.getRepository(TribeJoinRequest);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || member?.role === 'admin' || member?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can view join requests' });
      return;
    }

    // Get pending requests
    const requests = await requestRepository.find({
      where: { tribeId, status: 'pending' },
      relations: ['user'],
      order: { requestedAt: 'DESC' },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

/**
 * Approve a join request
 */
export const approveJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, requestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const requestRepository = AppDataSource.getRepository(TribeJoinRequest);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || member?.role === 'admin' || member?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can approve requests' });
      return;
    }

    // Get request
    const request = await requestRepository.findOne({
      where: { id: requestId, tribeId },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Request already processed' });
      return;
    }

    // Create tribe member
    const newMember = tribeMemberRepository.create({
      tribeId,
      userId: request.userId,
      role: 'member',
      joinedAt: new Date(),
    });
    await tribeMemberRepository.save(newMember);

    // Update request status
    await requestRepository.update(requestId, { status: 'approved' });

    // Increment members count
    await tribeRepository.increment({ id: tribeId }, 'membersCount', 1);

    res.json({ success: true, message: 'Request approved' });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
};

/**
 * Reject a join request
 */
export const rejectJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, requestId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const requestRepository = AppDataSource.getRepository(TribeJoinRequest);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || member?.role === 'admin' || member?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can reject requests' });
      return;
    }

    // Get request
    const request = await requestRepository.findOne({
      where: { id: requestId, tribeId },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Update request status
    await requestRepository.update(requestId, { status: 'rejected' });

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
};

// ============================================
// MEMBER MANAGEMENT
// ============================================

/**
 * Remove a member from the tribe
 */
export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, memberId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const adminMember = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || adminMember?.role === 'admin' || adminMember?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can remove members' });
      return;
    }

    // Get member to remove
    const memberToRemove = await tribeMemberRepository.findOne({
      where: { id: memberId, tribeId },
    });

    if (!memberToRemove) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    // Cannot remove creator
    if (memberToRemove.role === 'creator' || memberToRemove.userId === tribe.creatorId) {
      res.status(400).json({ success: false, message: 'Cannot remove tribe creator' });
      return;
    }

    // Remove member
    await tribeMemberRepository.delete(memberId);

    // Decrement members count
    await tribeRepository.decrement({ id: tribeId }, 'membersCount', 1);

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tribeId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!['admin', 'moderator', 'member'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' });
      return;
    }

    const tribeRepository = AppDataSource.getRepository(Tribe);
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);

    // Check if user is admin or creator
    const tribe = await tribeRepository.findOne({ where: { id: tribeId } });
    if (!tribe) {
      res.status(404).json({ success: false, message: 'Tribe not found' });
      return;
    }

    const adminMember = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    const isAdmin = tribe.creatorId === userId || adminMember?.role === 'admin' || adminMember?.role === 'creator';
    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can change member roles' });
      return;
    }

    // Get member to update
    const memberToUpdate = await tribeMemberRepository.findOne({
      where: { id: memberId, tribeId },
    });

    if (!memberToUpdate) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    // Cannot change creator role
    if (memberToUpdate.role === 'creator' || memberToUpdate.userId === tribe.creatorId) {
      res.status(400).json({ success: false, message: 'Cannot change creator role' });
      return;
    }

    // Update role
    await tribeMemberRepository.update(memberId, { role });

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};
