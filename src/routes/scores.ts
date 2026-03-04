import { Router } from 'express';
import { ScoreController } from '../controllers/scoreController';
import { authenticateToken, requireOrganizer } from '../middleware/auth';

const router = Router();

// Routes publiques
router.get('/ranking/:phaseId', ScoreController.getRanking);
router.get('/phase/:phaseId', ScoreController.getPhaseScores);
router.get('/artist/:artisteId/phase/:phaseId', ScoreController.getArtistScore);
router.get('/statistics/:phaseId', ScoreController.getPhaseStatistics);

// Routes admin
router.post('/recalculate/:phaseId', authenticateToken, requireOrganizer, ScoreController.recalculateScores as any);
router.post('/initialize/:phaseId', authenticateToken, requireOrganizer, ScoreController.initializeScores as any);
router.post('/update-ranking/:phaseId', authenticateToken, requireOrganizer, ScoreController.updateRanking as any);

export default router;
