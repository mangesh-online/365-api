import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  addReaction,
  editMessage,
  togglePinConversation,
  toggleArchiveConversation,
  searchMessages,
  forwardMessage
} from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All message routes require authentication
router.use(authMiddleware);

// Send message
router.post('/', sendMessage);

// Get all conversations
router.get('/conversations', getConversations);

// Search messages
router.get('/search', searchMessages);

// Get messages in a conversation
router.get('/conversations/:conversationId', getMessages);

// Mark conversation as read
router.post('/conversations/:conversationId/read', markAsRead);

// Pin/Unpin conversation
router.post('/conversations/:conversationId/pin', togglePinConversation);

// Archive/Unarchive conversation
router.post('/conversations/:conversationId/archive', toggleArchiveConversation);

// Delete message
router.delete('/:messageId', deleteMessage);

// Edit message
router.put('/:messageId', editMessage);

// Add/remove reaction
router.post('/:messageId/react', addReaction);

// Forward message
router.post('/:messageId/forward', forwardMessage);

// Get unread count
router.get('/unread-count', getUnreadCount);

export default router;
