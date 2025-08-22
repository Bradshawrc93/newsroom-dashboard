import { Router } from 'express';
import { AIController } from '../controllers/aiController';

const router = Router();
const aiController = new AIController();

// Message analysis routes
router.post('/analyze/message/:messageId', aiController.analyzeMessage);
router.post('/analyze/messages', aiController.analyzeMessages);

// Summary routes
router.post('/summary/generate/:date', aiController.generateDailySummary);
router.get('/summary/:date', aiController.getDailySummary);
router.get('/summaries/recent', aiController.getRecentSummaries);

// Utility routes
router.get('/test', aiController.testConnection);
router.get('/stats', aiController.getStats);

export default router;
