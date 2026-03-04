import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticateToken, requireOrganizer } from '../middleware/auth';
import { wrapControllerSimple } from '../utils/routeWrapper';

const router = Router();

// Routes publiques
router.get('/', EventController.getAllEvents);
router.get('/active', EventController.getActiveEvent);
router.get('/next', EventController.getNextEvent);
router.get('/:id', EventController.getEventById);

// Routes protégées - Administration uniquement
router.post('/', authenticateToken, requireOrganizer, EventController.createEvent as any);
router.put('/:id', authenticateToken, requireOrganizer, EventController.updateEvent as any);
router.put('/:id/status', authenticateToken, requireOrganizer, EventController.updateEventStatus as any);
router.put('/:id/voting', authenticateToken, requireOrganizer, EventController.updateVotingStatus as any);
router.delete('/:id', authenticateToken, requireOrganizer, EventController.deleteEvent as any);

export default router;
