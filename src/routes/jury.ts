import { Router } from 'express';
import { JuryController } from '../controllers/juryController';
import { authenticateToken, requireJury, requireOrganizer } from '../middleware/auth';

const router = Router();

// Routes spécifiques avant les routes paramétrées
router.get('/my-notes', authenticateToken, JuryController.getArtistNotes as any);
router.get('/my-decisions', authenticateToken, JuryController.getMyDecisions as any);
router.get('/ranking/:phaseId', JuryController.getJuryRanking);

// Routes publiques
router.get('/', JuryController.getAllJurys);
router.get('/:id', JuryController.getJuryById);

// Routes protégées - Jury
router.post('/profile', authenticateToken, JuryController.createJuryProfile as any);
router.put('/profile/:id', authenticateToken, requireJury, JuryController.updateJuryProfile as any);
router.post('/notes', authenticateToken, requireJury, JuryController.noteArtist as any);

// Routes protégées - Décisions détaillées
router.post('/decisions', authenticateToken, requireJury, JuryController.submitDecision as any);
router.put('/decisions/:id', authenticateToken, requireJury, JuryController.updateDecision as any);
router.post('/decisions/:id/finalize', authenticateToken, requireJury, JuryController.finalizeDecision as any);

// Routes admin
router.get('/notes/artist/:artisteId', authenticateToken, requireOrganizer, JuryController.getArtistNotes as any);
router.get('/decisions-summary/:phaseId', authenticateToken, requireOrganizer, JuryController.getDecisionsSummary as any);

export default router;
