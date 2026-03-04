import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken, requireOrganizer } from '../middleware/auth';

const router = Router();

// Routes protégées - Utilisateur
router.get('/', authenticateToken, NotificationController.getUserNotifications as any);
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount as any);
router.put('/:id/read', authenticateToken, NotificationController.markAsRead as any);
router.put('/read-all', authenticateToken, NotificationController.markAllAsRead as any);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification as any);
router.delete('/', authenticateToken, NotificationController.deleteAllNotifications as any);

// Routes admin
router.post('/', authenticateToken, requireOrganizer, NotificationController.createNotification as any);

export default router;
