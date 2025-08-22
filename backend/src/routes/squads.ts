import { Router } from 'express';
import { SquadController } from '../controllers/squadController';


const router = Router();
const squadController = new SquadController();

// Initialize squad data
router.post('/initialize', squadController.initialize);

// Get squad information
router.get('/', squadController.getAllSquads);
router.get('/main', squadController.getMainSquads);
router.get('/hierarchy', squadController.getSquadHierarchy);
router.get('/stats', squadController.getSquadStats);
router.get('/:squadId', squadController.getSquad);
router.get('/:parentSquadId/subsquads', squadController.getSubsquads);

// Squad management
router.post('/', squadController.addSquad);
router.put('/:squadId', squadController.updateSquad);
router.delete('/:squadId', squadController.removeSquad);

// Channel management
router.post('/:squadId/channels', squadController.addChannelToSquad);
router.delete('/:squadId/channels/:channelId', squadController.removeChannelFromSquad);

// Person management
router.post('/:squadId/people', squadController.addPersonToSquad);
router.delete('/:squadId/people/:personId', squadController.removePersonFromSquad);

// Tag management
router.post('/:squadId/tags', squadController.addTagToSquad);
router.delete('/:squadId/tags/:tagId', squadController.removeTagFromSquad);

// Configuration import/export
router.get('/export/config', squadController.exportConfiguration);
router.post('/import/config', squadController.importConfiguration);

export default router;
