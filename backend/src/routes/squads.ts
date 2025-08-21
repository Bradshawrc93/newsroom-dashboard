import { Router } from 'express';
import { SquadController } from '../controllers/squadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const squadController = new SquadController();

// Initialize squad data
router.post('/initialize', authenticateToken, squadController.initialize);

// Get squad information
router.get('/', authenticateToken, squadController.getAllSquads);
router.get('/main', authenticateToken, squadController.getMainSquads);
router.get('/hierarchy', authenticateToken, squadController.getSquadHierarchy);
router.get('/stats', authenticateToken, squadController.getSquadStats);
router.get('/:squadId', authenticateToken, squadController.getSquad);
router.get('/:parentSquadId/subsquads', authenticateToken, squadController.getSubsquads);

// Squad management
router.post('/', authenticateToken, squadController.addSquad);
router.put('/:squadId', authenticateToken, squadController.updateSquad);
router.delete('/:squadId', authenticateToken, squadController.removeSquad);

// Channel management
router.post('/:squadId/channels', authenticateToken, squadController.addChannelToSquad);
router.delete('/:squadId/channels/:channelId', authenticateToken, squadController.removeChannelFromSquad);

// Person management
router.post('/:squadId/people', authenticateToken, squadController.addPersonToSquad);
router.delete('/:squadId/people/:personId', authenticateToken, squadController.removePersonFromSquad);

// Tag management
router.post('/:squadId/tags', authenticateToken, squadController.addTagToSquad);
router.delete('/:squadId/tags/:tagId', authenticateToken, squadController.removeTagFromSquad);

// Configuration import/export
router.get('/export/config', authenticateToken, squadController.exportConfiguration);
router.post('/import/config', authenticateToken, squadController.importConfiguration);

export default router;
