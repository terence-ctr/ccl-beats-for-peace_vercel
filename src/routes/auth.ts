import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { wrapControllerSimple } from '../utils/routeWrapper';

const router = Router();

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.requestPasswordReset);

// Routes de vérification (publiques)
router.post('/verify-email', AuthController.verifyEmail);
router.post('/verify-phone', AuthController.verifyPhone);
router.post('/resend-email-code', AuthController.resendEmailCode);
router.post('/resend-phone-code', AuthController.resendPhoneCode);

// Routes protégées
router.get('/profile', authenticateToken, AuthController.getProfile as any);
router.put('/profile', authenticateToken, AuthController.updateProfile as any);
router.get('/verify', authenticateToken, AuthController.verifyToken as any);
router.get('/roles', authenticateToken, AuthController.getUserRoles as any);
// router.get('/check-token', AuthController.checkTokenValidity as any); // Temporairement désactivé

// Routes super admin - Gestion des rôles
router.post('/assign-role', authenticateToken, requireSuperAdmin, AuthController.assignRole as any);
router.delete('/remove-role', authenticateToken, requireSuperAdmin, AuthController.removeRole as any);
router.get('/users', authenticateToken, requireSuperAdmin, AuthController.getAllUsers as any);

export default router;
