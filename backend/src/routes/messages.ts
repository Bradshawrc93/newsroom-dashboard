import { Router } from 'express';
import { MessageController } from '../controllers/messageController';

const router = Router();
const messageController = new MessageController();

// Get messages with filtering
router.get('/', messageController.getMessages);

export default router;
