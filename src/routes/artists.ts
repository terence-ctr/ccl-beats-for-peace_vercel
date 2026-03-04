import { Router } from 'express';
import { ArtisteController } from '../controllers/artisteController';
import { authenticateToken, requireOrganizer } from '../middleware/auth';
import { wrapControllerSimple } from '../utils/routeWrapper';

const router = Router();

// Routes publiques - IMPORTANT: /statistics et /validated AVANT /:id
router.get('/statistics', ArtisteController.getStatistics);
router.get('/validated', ArtisteController.getValidatedArtists);
router.get('/', ArtisteController.getAllArtists);

// Route pour obtenir le profil artiste de l'utilisateur connecté
router.get('/me', authenticateToken, wrapControllerSimple(ArtisteController.getMyArtistProfile));

// Route d'inscription artiste (authentifié)
router.post('/register', authenticateToken, wrapControllerSimple(ArtisteController.createArtist));

router.get('/:id', ArtisteController.getArtistById);

// Routes protégées - Utilisateurs authentifiés (simplifiées)
router.post('/', authenticateToken, wrapControllerSimple(ArtisteController.createArtist));
router.put('/:id', authenticateToken, wrapControllerSimple(ArtisteController.updateArtist));
router.delete('/:id', authenticateToken, wrapControllerSimple(ArtisteController.deleteArtist));

// Routes protégées - Upload de fichiers
router.post('/:id/photo', authenticateToken, wrapControllerSimple(ArtisteController.uploadPhoto));
router.post('/:id/video', authenticateToken, wrapControllerSimple(ArtisteController.uploadVideo));

// Routes protégées - Administration uniquement
router.put('/:id/status', authenticateToken, requireOrganizer, wrapControllerSimple(ArtisteController.updateArtistStatus));
router.get('/:id/votes', authenticateToken, requireOrganizer, wrapControllerSimple(ArtisteController.getArtistVotes));

export default router;
