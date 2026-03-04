import { Router } from 'express';
import { VoteController } from '../controllers/voteController';
import { authenticateToken, requireOrganizer } from '../middleware/auth';
import { wrapControllerSimple } from '../utils/routeWrapper';

const router = Router();

// Routes publiques
router.get('/artist/:artisteId', VoteController.getArtistVotes);
router.get('/scores/:artisteId', VoteController.getArtistScores);
router.get('/ranking/:phaseId', VoteController.getRanking);
router.get('/trending', VoteController.getTrendingVotes);

// Routes protégées - Utilisateurs authentifiés
router.post('/', authenticateToken, VoteController.vote as any);
router.post('/like', authenticateToken, VoteController.like as any);
router.get('/status', authenticateToken, VoteController.getUserVoteStatus as any);
router.get('/user', authenticateToken, VoteController.getUserVotes as any);

// Routes protégées - Administration uniquement
router.delete('/:artisteId/:phaseId/:voterId', authenticateToken, requireOrganizer, VoteController.deleteVote as any);

export default router;
