import { Router } from 'express';
import { summaryController } from '../controllers/summaryController';

const router = Router();

// Get all summaries
router.get('/', summaryController.getSummaries);

// Generate a new summary
router.post('/generate', summaryController.generateSummary);

// Get daily summary for a specific date
router.get('/daily', summaryController.getDailySummary);

// Get summary by ID
router.get('/:id', summaryController.getSummary);

// Update summary
router.put('/:id', summaryController.updateSummary);

// Delete summary
router.delete('/:id', summaryController.deleteSummary);

export default router;
