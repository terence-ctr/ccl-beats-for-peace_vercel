import { Router } from 'express';
import { TiktokController } from '../controllers/tiktokController';
import { authenticateToken, requireOrganizer, requireJury } from '../middleware/auth';

const router = Router();

// Routes publiques
router.get('/publications/:artisteId', TiktokController.getArtistPublications);

// Route de publication sans authentification (pour développement)
router.post('/publish-direct', TiktokController.publishVideoDirect as any);

// Routes protégées - Jury uniquement
router.post('/publish', authenticateToken, requireJury, TiktokController.publishVideo as any);

// Routes protégées - Administration uniquement
router.put('/stats/:publicationId', authenticateToken, requireOrganizer, TiktokController.updatePublicationStats as any);

export default router;
