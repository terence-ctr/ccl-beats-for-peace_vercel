import { Router } from 'express';
import { SocialLinkController } from '../controllers/socialLinkController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Routes publiques
router.get('/', SocialLinkController.getActiveLinks);
router.get('/active', SocialLinkController.getActiveLinks); // Route pour le frontend
router.get('/platform/:platform', SocialLinkController.getLinkByPlatform);

// Routes admin
router.get('/all', authenticateToken, requireSuperAdmin, SocialLinkController.getAllLinks as any);
router.post('/', authenticateToken, requireSuperAdmin, SocialLinkController.createLink as any);
router.put('/:id', authenticateToken, requireSuperAdmin, SocialLinkController.updateLink as any);
router.put('/:id/toggle', authenticateToken, requireSuperAdmin, SocialLinkController.toggleLink as any);
router.delete('/:id', authenticateToken, requireSuperAdmin, SocialLinkController.deleteLink as any);

export default router;
