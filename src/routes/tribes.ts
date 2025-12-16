import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getTribes,
  discoverTribes,
  createTribe,
  getTribeDetails,
  updateTribe,
  deleteTribe,
  joinTribe,
  leaveTribe,
  getUserTribes,
  getTribeFeed,
  getTribeMembers,
  uploadTribeAvatar,
  uploadTribeCover,
  getPendingRequests,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  updateMemberRole,
} from '../controllers/tribesController.js';
import {
  createTribeEvent,
  getTribeEvents,
  getEventDetails,
  updateTribeEvent,
  deleteTribeEvent,
  rsvpToEvent,
} from '../controllers/tribeEventsController.js';
import {
  getTribeChannels,
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
} from '../controllers/tribeChatController.js';
import { upload } from '../utils/upload.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// TRIBE DISCOVERY & BROWSING
// ============================================

router.get('/tribes', getTribes);
router.get('/tribes/discover', discoverTribes);

// ============================================
// TRIBE MANAGEMENT (CRUD)
// ============================================

router.post('/tribes', createTribe);
router.get('/tribes/:tribeId', getTribeDetails);
router.put('/tribes/:tribeId', updateTribe);
router.delete('/tribes/:tribeId', deleteTribe);

// ============================================
// TRIBE MEMBERSHIP
// ============================================

router.post('/tribes/:tribeId/join', joinTribe);
router.post('/tribes/:tribeId/leave', leaveTribe);
router.get('/my-tribes', getUserTribes);

// ============================================
// TRIBE CONTENT (POSTS)
// ============================================

router.get('/tribes/:tribeId/feed', getTribeFeed);

// ============================================
// TRIBE MEMBERS
// ============================================

router.get('/tribes/:tribeId/members', getTribeMembers);

// ============================================
// TRIBE IMAGE UPLOADS
// ============================================

router.post('/tribes/:tribeId/upload-image', upload.single('image'), uploadTribeAvatar);
router.post('/tribes/:tribeId/upload-cover', upload.single('cover'), uploadTribeCover);

// ============================================
// JOIN REQUEST MANAGEMENT
// ============================================

router.get('/tribes/:tribeId/pending-requests', getPendingRequests);
router.post('/tribes/:tribeId/requests/:requestId/approve', approveJoinRequest);
router.post('/tribes/:tribeId/requests/:requestId/reject', rejectJoinRequest);

// ============================================
// MEMBER MANAGEMENT
// ============================================

router.delete('/tribes/:tribeId/members/:memberId', removeMember);
router.put('/tribes/:tribeId/members/:memberId/role', updateMemberRole);

// ============================================
// TRIBE EVENTS
// ============================================

router.post('/tribes/:tribeId/events', createTribeEvent);
router.get('/tribes/:tribeId/events', getTribeEvents);
router.get('/tribes/:tribeId/events/:eventId', getEventDetails);
router.put('/tribes/:tribeId/events/:eventId', updateTribeEvent);
router.delete('/tribes/:tribeId/events/:eventId', deleteTribeEvent);
router.post('/tribes/:tribeId/events/:eventId/rsvp', rsvpToEvent);

// ============================================
// TRIBE CHAT & CHANNELS
// ============================================

router.get('/tribes/:tribeId/channels', getTribeChannels);
router.get('/tribes/:tribeId/channels/:channelId/messages', getChannelMessages);
router.post('/tribes/:tribeId/channels/:channelId/messages', sendMessage);
router.put('/tribes/:tribeId/channels/:channelId/messages/:messageId', editMessage);
router.delete('/tribes/:tribeId/channels/:channelId/messages/:messageId', deleteMessage);
router.post('/tribes/:tribeId/channels/:channelId/messages/:messageId/reactions', addReaction);

export default router;
