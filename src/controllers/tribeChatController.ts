import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { TribeChannel } from '../entities/TribeChannel.js';
import { TribeMessage } from '../entities/TribeMessage.js';
import { TribeMember } from '../entities/TribeMember.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Get or create default channels for a tribe
 */
export const getTribeChannels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can view channels',
      });
      return;
    }

    // Get existing channels
    const channelRepository = AppDataSource.getRepository(TribeChannel);
    let channels = await channelRepository.find({
      where: { tribeId },
      order: { createdAt: 'ASC' },
    });

    // Create default channels if none exist
    if (channels.length === 0) {
      const defaultChannels = [
        { name: 'general', description: 'General discussion', channelType: 'text' as const },
        { name: 'wins-and-celebrations', description: 'Share your wins!', channelType: 'text' as const },
        { name: 'help-needed', description: 'Ask for help', channelType: 'text' as const },
        { name: 'resources', description: 'Share useful resources', channelType: 'text' as const },
      ];

      for (const channelData of defaultChannels) {
        const channel = channelRepository.create({
          tribeId,
          ...channelData,
        });
        await channelRepository.save(channel);
        channels.push(channel);
      }
    }

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Error fetching tribe channels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channels' });
  }
};

/**
 * Get messages for a channel
 */
export const getChannelMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, channelId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can view messages',
      });
      return;
    }

    // Fetch messages
    const messageRepository = AppDataSource.getRepository(TribeMessage);
    let query = messageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId })
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.createdAt', 'DESC')
      .take(parseInt(limit as string));

    if (before) {
      query = query.andWhere('message.createdAt < :before', { before: new Date(before as string) });
    }

    const messages = await query.getMany();

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * Send a message to a channel
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, channelId } = req.params;
    const { content, messageType = 'text', attachments, replyToId, mentions } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
      relations: ['user'],
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can send messages',
      });
      return;
    }

    // Create message
    const messageRepository = AppDataSource.getRepository(TribeMessage);
    const message = messageRepository.create({
      channelId,
      tribeId,
      senderId: userId,
      content: content.trim(),
      messageType,
      attachments: attachments || [],
      replyToId,
      mentions: mentions || [],
      reactions: [],
    });

    const savedMessage = await messageRepository.save(message);

    // Update channel message count
    const channelRepository = AppDataSource.getRepository(TribeChannel);
    await channelRepository.increment({ id: channelId }, 'messageCount', 1);

    // Fetch the complete message with sender info
    const completeMessage = await messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: completeMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * Edit a message
 */
export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, channelId, messageId } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
      return;
    }

    const messageRepository = AppDataSource.getRepository(TribeMessage);
    const message = await messageRepository.findOne({
      where: { id: messageId, channelId, tribeId },
    });

    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    if (message.senderId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only edit your own messages',
      });
      return;
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    const updatedMessage = await messageRepository.save(message);

    // Fetch complete message with sender
    const completeMessage = await messageRepository.findOne({
      where: { id: updatedMessage.id },
      relations: ['sender'],
    });

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: completeMessage,
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, channelId, messageId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const messageRepository = AppDataSource.getRepository(TribeMessage);
    const message = await messageRepository.findOne({
      where: { id: messageId, channelId, tribeId },
    });

    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    // Check if user is the sender or admin
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
    });

    if (message.senderId !== userId && !member?.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
      return;
    }

    await messageRepository.remove(message);

    // Update channel message count
    const channelRepository = AppDataSource.getRepository(TribeChannel);
    await channelRepository.decrement({ id: channelId }, 'messageCount', 1);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

/**
 * Add reaction to a message
 */
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { tribeId, channelId, messageId } = req.params;
    const { emoji } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!emoji) {
      res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
      return;
    }

    // Check if user is a member
    const tribeMemberRepository = AppDataSource.getRepository(TribeMember);
    const member = await tribeMemberRepository.findOne({
      where: { tribeId, userId },
      relations: ['user'],
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Only tribe members can react to messages',
      });
      return;
    }

    const messageRepository = AppDataSource.getRepository(TribeMessage);
    const message = await messageRepository.findOne({
      where: { id: messageId, channelId, tribeId },
    });

    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    // Add or update reaction
    const reactions = message.reactions || [];
    const existingReactionIndex = reactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Remove reaction if it already exists (toggle)
      reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      reactions.push({
        userId,
        userName: member.user?.name || 'Unknown',
        emoji,
        createdAt: new Date(),
      });
    }

    message.reactions = reactions;
    const updatedMessage = await messageRepository.save(message);

    // Fetch complete message
    const completeMessage = await messageRepository.findOne({
      where: { id: updatedMessage.id },
      relations: ['sender'],
    });

    res.json({
      success: true,
      message: 'Reaction updated successfully',
      data: completeMessage,
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: 'Failed to add reaction' });
  }
};
