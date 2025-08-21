import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/slack-login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/status', optionalAuth, authController.status);

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);
router.get('/channels', authenticateToken, authController.getChannels);
router.get('/test-connection', authenticateToken, authController.testConnection);

export default router;
