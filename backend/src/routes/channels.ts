import { Router } from 'express';
import { ChannelController } from '../controllers/channelController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const channelController = new ChannelController();

// Apply authentication middleware to all routes
// router.use(authenticateToken); // Temporarily disabled for testing

// Get all channels
router.get('/', channelController.getAllChannels);

// Get connected channels only
router.get('/connected', channelController.getConnectedChannels);

// Get specific channel details
router.get('/:channelId', channelController.getChannel);

// Connect a channel
router.post('/connect', channelController.connectChannel);

// Disconnect a channel
router.post('/disconnect', channelController.disconnectChannel);

// Refresh channels from Slack
router.post('/refresh', channelController.refreshChannels);

export default router;
