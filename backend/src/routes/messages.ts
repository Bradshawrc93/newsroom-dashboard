import { Router } from 'express';
import { MessageController } from '../controllers/messageController';


const router = Router();
const messageController = new MessageController();

// Apply authentication middleware to all routes
// router.use(authenticateToken); // Temporarily disabled for testing

// Fetch messages from a specific channel
router.post('/fetch', messageController.fetchChannelMessages);

// Get stored messages with filtering
router.get('/', messageController.getMessages);

// Search messages by text content
router.post('/search', messageController.searchMessages);

// Get messages from yesterday (for daily summaries)
router.get('/yesterday', messageController.getYesterdayMessages);

// Get message statistics
router.get('/stats', messageController.getMessageStats);

export default router;
