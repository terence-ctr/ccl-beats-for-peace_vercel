import { Router } from 'express';
import { TiktokOAuthController } from '../controllers/tiktokOAuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes publiques - OAuth TikTok
router.get('/authorize', TiktokOAuthController.authorize);
router.get('/callback', TiktokOAuthController.callback);

// Routes protégées - Publication directe
router.post('/publish-direct', authenticateToken, TiktokOAuthController.publishDirect as any);
router.get('/status/:publishId', authenticateToken, TiktokOAuthController.checkPublishStatus as any);

export default router;
