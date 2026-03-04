import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthenticatedRequest, AppRole } from '../types/database';

// Middleware d'authentification JWT
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('🔍 Middleware - Auth header:', authHeader);
    console.log('🔍 Middleware - Token extrait:', token ? 'présent' : 'absent');

    if (!token) {
      console.log('❌ Middleware - Token manquant');
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
      return;
    }

    // Vérifier le token (avec fallback pour le développement)
    const secret = process.env.JWT_SECRET || 'ccl-beats-for-peace-dev-secret-2026';
    const decoded = jwt.verify(token, secret) as any;
    
    console.log('🔍 Middleware - Token décodé:', decoded);
    
    // Obtenir les informations complètes de l'utilisateur
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      console.log('❌ Middleware - Utilisateur non trouvé:', decoded.id);
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    console.log('✅ Middleware - Utilisateur trouvé:', user.email);

    // Obtenir les rôles de l'utilisateur
    const roles = await UserModel.getUserRoles(Number(user.id));

    // Ajouter les informations à la requête
    req.user = user;
    req.roles = roles;

    console.log('✅ Middleware - Authentification réussie');
    next();
  } catch (error: any) {
    console.error('❌ Middleware - Erreur authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur d\'authentification'
      });
    }
  }
};

// Middleware pour vérifier les rôles
export const requireRole = (roles: AppRole | AppRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.roles) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = requiredRoles.some(role => req.roles!.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
      return;
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est un candidat
export const requireCandidate = requireRole(AppRole.CANDIDATE);

// Middleware pour vérifier si l'utilisateur est un jury
export const requireJury = requireRole(AppRole.JURY);

// Middleware pour vérifier si l'utilisateur est un organisateur
export const requireOrganizer = requireRole([AppRole.ORGANIZER, AppRole.SUPER_ADMIN]);

// Middleware pour vérifier si l'utilisateur est un super admin
export const requireSuperAdmin = requireRole(AppRole.SUPER_ADMIN);

// Middleware optionnel - ne bloque pas si non authentifié
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const secret = process.env.JWT_SECRET || 'ccl-beats-for-peace-dev-secret-2026';
      const decoded = jwt.verify(token, secret) as any;
      const user = await UserModel.findById(decoded.id);
      
      if (user) {
        const roles = await UserModel.getUserRoles(Number(user.id));
        req.user = user;
        req.roles = roles;
      }
    }

    next();
  } catch (error) {
    // Ignorer les erreurs pour l'auth optionnelle
    next();
  }
};

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres ressources
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
      return;
    }

    const targetUserId = (req as any).params[userIdParam];
    const currentUserId = req.user.id;

    // L'utilisateur peut accéder à ses propres ressources
    if (targetUserId === currentUserId) {
      next();
      return;
    }

    // Les organisateurs et super admins peuvent accéder à toutes les ressources
    const hasAdminAccess = req.roles?.some(role => 
      role === AppRole.ORGANIZER || role === AppRole.SUPER_ADMIN
    );

    if (hasAdminAccess) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Accès non autorisé à cette ressource'
    });
  };
};
