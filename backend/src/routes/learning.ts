import { Router } from 'express';
import { LearningController } from '../controllers/learningController';

const router = Router();
const learningController = new LearningController();

// Tag correction and feedback routes
router.post('/corrections', learningController.recordTagCorrection);
router.post('/feedback', learningController.recordTagFeedback);
router.post('/suggestions/improve', learningController.getImprovedTagSuggestions);

// Analytics and metrics routes
router.get('/metrics', learningController.getLearningMetrics);
router.get('/corrections/recent', learningController.getRecentCorrections);

export default router;
