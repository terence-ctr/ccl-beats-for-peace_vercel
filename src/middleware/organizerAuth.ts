import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthenticatedRequest, AppRole } from '../types/database';

// Middleware pour vérifier que l'utilisateur a un rôle valide pour l'accès admin
export const requireOrganizerRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Vérifier le token JWT
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Middleware organizer - Auth header:', authHeader);
    console.log('🔍 Middleware organizer - Token extrait:', token ? 'présent' : 'absent');

    if (!token) {
      console.log('❌ Middleware organizer - Token manquant');
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
      return;
    }

    // Vérifier le token
    const secret = process.env.JWT_SECRET || 'ccl-beats-for-peace-dev-secret-2026';
    console.log('🔍 Middleware organizer - Secret utilisé:', secret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, secret) as any;
    console.log('🔍 Middleware organizer - Token décodé:', decoded);
    
    // Obtenir les informations complètes de l'utilisateur
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      console.log('❌ Middleware organizer - Utilisateur non trouvé:', decoded.id);
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    console.log('✅ Middleware organizer - Utilisateur trouvé:', user.email);

    // Attacher l'utilisateur à la requête
    req.user = user;

    // Obtenir les rôles de l'utilisateur
    const userRoles = await UserModel.getUserRoles(Number(user.id));
    console.log('🔍 Middleware organizer - Rôles utilisateur:', userRoles);
    
    // Vérifier que l'utilisateur a au moins un rôle valide pour l'accès admin
    const hasRequiredRole = userRoles.includes(AppRole.ORGANIZER) || userRoles.includes(AppRole.SUPER_ADMIN);
    console.log('🔍 Middleware organizer - Has required role:', hasRequiredRole);

    if (!hasRequiredRole) {
      console.log('❌ Middleware organizer - Accès refusé - Rôles:', userRoles);
      res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle d\'organisateur requis.',
        userRoles: userRoles // Pour débogage
      });
      return;
    }

    console.log('✅ Middleware organizer - Accès autorisé');
    // Continuer vers la prochaine middleware/route
    next();
  } catch (error: any) {
    console.error('❌ Erreur middleware organizer:', error);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Middleware organizer - Token invalide ou signature incorrecte');
      res.status(401).json({
        success: false,
        message: 'Token invalide. Veuillez vous reconnecter.',
        error: 'invalid_token'
      });
    } else if (error.name === 'TokenExpiredError') {
      console.log('❌ Middleware organizer - Token expiré');
      res.status(401).json({
        success: false,
        message: 'Token expiré. Veuillez vous reconnecter.',
        error: 'token_expired'
      });
    } else {
      console.error('❌ Middleware organizer - Erreur inattendue:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
};
