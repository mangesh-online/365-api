import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { Message } from '../entities/Message.js';
import { Conversation } from '../entities/Conversation.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LessThan } from 'typeorm';

const messageRepo = AppDataSource.getRepository(Message);
const conversationRepo = AppDataSource.getRepository(Conversation);
const userRepo = AppDataSource.getRepository(User);

// Get or create conversation between two users
const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
  // Always store user IDs in consistent order
  const [lowerId, higherId] = [user1Id, user2Id].sort();

  let conversation = await conversationRepo.findOne({
    where: [
      { user1Id: lowerId, user2Id: higherId },
      { user1Id: higherId, user2Id: lowerId }
    ]
  });

  if (!conversation) {
    conversation = conversationRepo.create({
      user1Id: lowerId,
      user2Id: higherId
    });
    await conversationRepo.save(conversation);
  }

  return conversation;
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.userId;
    const { receiverId, content, messageType = 'text', attachments, replyToId } = req.body;

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Check if receiver exists
    const receiver = await userRepo.findOne({ where: { id: receiverId } });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(senderId, receiverId);

    // Create message
    const message = messageRepo.create({
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
      messageType,
      attachments: attachments || [],
      reactions: [],
      replyToId: replyToId || null
    });

    await messageRepo.save(message);

    // Update conversation
    const unreadField = conversation.user1Id === receiverId ? 'user1UnreadCount' : 'user2UnreadCount';
    await conversationRepo.update(conversation.id, {
      lastMessageId: message.id,
      lastMessageText: content.substring(0, 100),
      lastMessageAt: message.createdAt,
      [unreadField]: () => `${unreadField} + 1`
    });

    // Load message with sender details
    const savedMessage = await messageRepo.findOne({
      where: { id: message.id },
      relations: ['sender']
    });

    res.json({ message: 'Message sent successfully', data: savedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversations = await conversationRepo
      .createQueryBuilder('conversation')
      .where('conversation.user1Id = :userId OR conversation.user2Id = :userId', { userId })
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();

    const conversationsWithDetails = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const unreadCount = conv.user1Id === userId ? conv.user1UnreadCount : conv.user2UnreadCount;
      const isPinned = conv.user1Id === userId ? conv.user1Pinned : conv.user2Pinned;
      const isArchived = conv.user1Id === userId ? conv.user1Archived : conv.user2Archived;
      const isMuted = conv.user1Id === userId ? conv.user1Muted : conv.user2Muted;

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar
        },
        lastMessage: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isPinned,
        isArchived,
        isMuted,
        createdAt: conv.createdAt
      };
    });

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is part of conversation
    const conversation = await conversationRepo.findOne({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query
    const query = messageRepo
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.createdAt', 'DESC')
      .take(Number(limit));

    if (before) {
      const beforeDate = new Date(before as string);
      query.andWhere('message.createdAt < :before', { before: beforeDate });
    }

    const messages = await query.getMany();

    // Mark messages as read
    const unreadMessages = messages.filter(m => m.receiverId === userId && !m.isRead);
    if (unreadMessages.length > 0) {
      await messageRepo.update(
        { id: unreadMessages.map(m => m.id) as any },
        { isRead: true, readAt: new Date() }
      );

      // Update conversation unread count
      const unreadField = conversation.user1Id === userId ? 'user1UnreadCount' : 'user2UnreadCount';
      await conversationRepo.update(conversation.id, {
        [unreadField]: 0
      });
    }

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is part of conversation
    const conversation = await conversationRepo.findOne({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark all unread messages as read
    await messageRepo.update(
      {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const unreadField = conversation.user1Id === userId ? 'user1UnreadCount' : 'user2UnreadCount';
    await conversationRepo.update(conversation.id, {
      [unreadField]: 0
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const message = await messageRepo.findOne({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }

    await messageRepo.update(messageId, { isDeleted: true });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversations = await conversationRepo
      .createQueryBuilder('conversation')
      .where('conversation.user1Id = :userId OR conversation.user2Id = :userId', { userId })
      .getMany();

    const totalUnread = conversations.reduce((sum, conv) => {
      const unreadCount = conv.user1Id === userId ? conv.user1UnreadCount : conv.user2UnreadCount;
      return sum + unreadCount;
    }, 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Add reaction to message
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is part of conversation
    const conversation = await conversationRepo.findOne({ where: { id: message.conversationId } });
    if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reactions = message.reactions || [];
    const existingReactionIndex = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      // Remove reaction if already exists
      reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      reactions.push({
        userId,
        emoji,
        createdAt: new Date().toISOString()
      });
    }

    await messageRepo.update(messageId, { reactions });

    res.json({ message: 'Reaction updated', reactions });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
};

// Edit message
export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await messageRepo.findOne({ where: { id: messageId } });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }

    // Only allow editing within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > fifteenMinutes) {
      return res.status(400).json({ message: 'Message can only be edited within 15 minutes' });
    }

    await messageRepo.update(messageId, {
      content,
      isEdited: true,
      editedAt: new Date()
    });

    const updatedMessage = await messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender']
    });

    res.json({ message: 'Message updated', data: updatedMessage });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Failed to edit message' });
  }
};

// Pin/Unpin conversation
export const togglePinConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await conversationRepo.findOne({ where: { id: conversationId } });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pinnedField = conversation.user1Id === userId ? 'user1Pinned' : 'user2Pinned';
    const currentValue = conversation.user1Id === userId ? conversation.user1Pinned : conversation.user2Pinned;

    await conversationRepo.update(conversationId, {
      [pinnedField]: !currentValue
    });

    res.json({ message: 'Conversation pin status updated', pinned: !currentValue });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Failed to toggle pin' });
  }
};

// Archive/Unarchive conversation
export const toggleArchiveConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conversation = await conversationRepo.findOne({ where: { id: conversationId } });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const archivedField = conversation.user1Id === userId ? 'user1Archived' : 'user2Archived';
    const currentValue = conversation.user1Id === userId ? conversation.user1Archived : conversation.user2Archived;

    await conversationRepo.update(conversationId, {
      [archivedField]: !currentValue
    });

    res.json({ message: 'Conversation archive status updated', archived: !currentValue });
  } catch (error) {
    console.error('Toggle archive error:', error);
    res.status(500).json({ message: 'Failed to toggle archive' });
  }
};

// Search messages
export const searchMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { query, conversationId } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchQuery = messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('LOWER(message.content) LIKE LOWER(:query)', { query: `%${query}%` });

    if (conversationId) {
      // Verify user is part of conversation
      const conversation = await conversationRepo.findOne({ where: { id: conversationId as string } });
      if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      searchQuery = searchQuery.andWhere('message.conversationId = :conversationId', { conversationId });
    } else {
      // Search across all user's conversations
      searchQuery = searchQuery.andWhere(
        '(message.senderId = :userId OR message.receiverId = :userId)',
        { userId }
      );
    }

    const messages = await searchQuery
      .orderBy('message.createdAt', 'DESC')
      .take(50)
      .getMany();

    res.json(messages);
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Failed to search messages' });
  }
};

// Forward message
export const forwardMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { receiverIds } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ message: 'Receiver IDs are required' });
    }

    const originalMessage = await messageRepo.findOne({ where: { id: messageId } });
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has access to the message
    if (originalMessage.senderId !== userId && originalMessage.receiverId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const forwardedMessages = [];

    for (const receiverId of receiverIds) {
      if (receiverId === userId) continue;

      const receiver = await userRepo.findOne({ where: { id: receiverId } });
      if (!receiver) continue;

      const conversation = await getOrCreateConversation(userId, receiverId);

      const forwardedMessage = messageRepo.create({
        conversationId: conversation.id,
        senderId: userId,
        receiverId,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        attachments: originalMessage.attachments,
        forwardedFromId: originalMessage.id
      });

      await messageRepo.save(forwardedMessage);

      const unreadField = conversation.user1Id === receiverId ? 'user1UnreadCount' : 'user2UnreadCount';
      await conversationRepo.update(conversation.id, {
        lastMessageId: forwardedMessage.id,
        lastMessageText: originalMessage.content.substring(0, 100),
        lastMessageAt: forwardedMessage.createdAt,
        [unreadField]: () => `${unreadField} + 1`
      });

      forwardedMessages.push(forwardedMessage);
    }

    res.json({ message: 'Message forwarded successfully', count: forwardedMessages.length });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({ message: 'Failed to forward message' });
  }
};
