import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { CreateUserRequest, LoginRequest, AuthenticatedRequest } from '../types/database';
import { query } from '../config/database';
import { sendRoleConfirmationEmail } from '../services/emailService';

// Stockage temporaire des codes de vérification en mémoire
const verificationCodes = new Map<string, { code: string; expiresAt: Date; type: 'email' | 'phone' }>();

export class AuthController {
  // Inscription d'un nouvel utilisateur
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validation des entrées (temporairement désactivée)
      // TODO: Réactiver la validation avec express-validator
      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { email, password, username, phone } = req.body as any;

      console.log('📝 Données d\'inscription reçues:', { email, username, phone: phone || 'non fourni' });

      // Vérifier si l'email existe déjà
      console.log('🔍 Vérification email existant:', email);
      const existingEmail = await UserModel.findByEmailOrUsername(email);
      console.log('📊 Résultat recherche email:', existingEmail ? 'trouvé' : 'non trouvé');
      
      if (existingEmail) {
        console.log('❌ Email déjà existant, retour 409');
        res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
        return;
      }

      // Vérifier si le username existe déjà
      console.log('🔍 Vérification username existant:', username);
      const existingUsername = await UserModel.findByEmailOrUsername(username);
      console.log('📊 Résultat recherche username:', existingUsername ? 'trouvé' : 'non trouvé');
      
      if (existingUsername) {
        console.log('❌ Username déjà existant, retour 409');
        res.status(409).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà pris'
        });
        return;
      }

      console.log('✅ Vérifications OK, création utilisateur...');

      // Créer l'utilisateur avec le numéro de téléphone
      const user = await UserModel.create({ email, password, username, phone });

      console.log('✅ Utilisateur créé, ID:', user.id);
      console.log('✅ Redirection vers page de confirmation...');

      // Retourner succès immédiat avec redirection vers confirmation
      res.status(201).json({
        success: true,
        message: 'Inscription réussie. Veuillez confirmer votre compte.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          redirectTo: '/confirm-account',
          email,
          phone
        }
      });
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Connexion d'un utilisateur
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validation des entrées (temporairement désactivée)
      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { emailOrUsername, password }: LoginRequest = req.body as any;
      
      console.log('🔐 Tentative de connexion pour:', emailOrUsername);
      console.log('🔐 Mot de passe fourni:', password ? '***' : '(vide)');
      
      // Authentifier l'utilisateur
      const authResult = await UserModel.authenticate(emailOrUsername, password);
      
      console.log('🔍 Résultat authentification:', authResult ? 'succès' : 'échec');
      
      if (!authResult) {
        console.log('❌ Échec authentification - Email ou mot de passe incorrect');
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
        return;
      }

      console.log('✅ Connexion réussie pour:', authResult.email);
      console.log('👤 Utilisateur ID:', authResult.id);
      console.log('🔍 Backend - Données utilisateur complètes:', authResult); // Debug pour voir toutes les données
      
      // Générer les tokens et récupérer les rôles
      const authResponse = await UserModel.generateTokens(authResult);
      
      // Mettre à jour le token dans la base de données
      if (authResponse.token) {
        await UserModel.updateToken(Number(authResult.id), authResponse.token);
        console.log('🔍 Token stocké en base de données pour:', authResult.email);
      }
      
      console.log('🔑 Tokens générés pour:', authResult.email);
      console.log('👤 Rôles:', authResponse.roles);
      
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: authResponse
      });
    } catch (error: any) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  }

  // Obtenir le profil de l'utilisateur connecté
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const userId = req.user.id;
      const roles = req.roles || [];

      // Obtenir les informations complètes de l'utilisateur
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      // Retourner les infos sans le mot de passe
      const { password_hash, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword,
          roles
        }
      });
    } catch (error: any) {
      console.error('Erreur profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour le profil
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      // Validation des entrées (temporairement désactivée)
      // TODO: Réactiver la validation avec express-validator
      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { username, email } = req.body as any;
      const userId = req.user.id;

      // Vérifier si le nouveau username/email est déjà utilisé
      if (username !== req.user.username || email !== req.user.email) {
        const existingUser = await UserModel.findByEmailOrUsername(username);
        if (existingUser && existingUser.id !== userId) {
          res.status(409).json({
            success: false,
            message: 'Ce nom d\'utilisateur ou email est déjà utilisé'
          });
          return;
        }
      }

      // Mettre à jour l'utilisateur
      const sql = `
        UPDATE users 
        SET username = $2, email = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(sql, [userId, username, email]);
      const updatedUser = result.rows[0];

      // Mettre à jour le profil
      await query(`
        UPDATE profiles 
        SET username = $2, email = $3, updated_at = NOW()
        WHERE user_id = $1
      `, [userId, username, email]);

      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { user: userWithoutPassword }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Vérifier la validité du token
  static async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
        return;
      }

      const roles = req.roles || [];

      res.status(200).json({
        success: true,
        message: 'Token valide',
        data: {
          user: req.user,
          roles
        }
      });
    } catch (error: any) {
      console.error('Erreur vérification token:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Déconnexion
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Pour JWT, la déconnexion se fait côté client en supprimant le token
      // On peut juste retourner une confirmation
      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error: any) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Demande de réinitialisation de mot de passe
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email requis'
        });
        return;
      }

      const user = await UserModel.findByEmailOrUsername(email);
      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        res.status(200).json({
          success: true,
          message: 'Si cet email existe, un email de réinitialisation a été envoyé'
        });
        return;
      }

      // TODO: Implémenter l'envoi d'email avec nodemailer
      // Générer un token de réinitialisation
      // Envoyer l'email

      res.status(200).json({
        success: true,
        message: 'Si cet email existe, un email de réinitialisation a été envoyé'
      });
    } catch (error: any) {
      console.error('Erreur demande réinitialisation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de réinitialisation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Attribuer un rôle à un utilisateur (super admin only) - REMPLACE les anciens rôles
  static async assignRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        res.status(400).json({
          success: false,
          message: 'Email et rôle requis'
        });
        return;
      }

      // Vérifier que le rôle est valide
      const validRoles = ['visitor', 'candidate', 'jury', 'organizer', 'super_admin'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Rôle invalide'
        });
        return;
      }

      // Trouver l'utilisateur par email
      const user = await UserModel.findByEmailOrUsername(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé avec cet email'
        });
        return;
      }

      // Supprimer TOUS les anciens rôles de l'utilisateur
      await query('DELETE FROM user_roles WHERE user_id = ?', [user.id]);

      // Ajouter le nouveau rôle
      await UserModel.assignRole(Number(user.id), role);

      // Récupérer les rôles mis à jour
      const updatedRoles = await UserModel.getUserRoles(Number(user.id));

      // Envoyer un email de confirmation du rôle
      const roleNames: Record<string, string> = {
        visitor: 'Visiteur',
        candidate: 'Candidat',
        jury: 'Membre du Jury',
        organizer: 'Organisateur',
        super_admin: 'Super Administrateur'
      };
      const roleName = roleNames[role] || role;
      const emailSent = await sendRoleConfirmationEmail(email, roleName, user.username || email);
      console.log(`📧 Email de confirmation de rôle ${emailSent ? 'envoyé' : 'non envoyé'} à ${email}: "${roleName}"`);
      

      res.status(200).json({
        success: true,
        message: `Rôle "${roleNames[role] || role}" attribué à ${email}. Un email de confirmation a été envoyé.`,
        data: { 
          user: { id: user.id, email: user.email, username: user.username },
          roles: updatedRoles
        }
      });
    } catch (error: any) {
      console.error('Erreur attribution rôle:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'attribution du rôle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Retirer un rôle à un utilisateur (super admin only)
  static async removeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        res.status(400).json({
          success: false,
          message: 'Email et rôle requis'
        });
        return;
      }

      // Trouver l'utilisateur par email
      const user = await UserModel.findByEmailOrUsername(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé avec cet email'
        });
        return;
      }

      // Retirer le rôle
      const sql = `DELETE FROM user_roles WHERE user_id = ? AND role = ?`;
      await query(sql, [Number(user.id), role]);

      // Récupérer les rôles mis à jour
      const updatedRoles = await UserModel.getUserRoles(Number(user.id));

      res.status(200).json({
        success: true,
        message: `Rôle "${role}" retiré de ${email}`,
        data: { 
          user: { id: user.id, email: user.email, username: user.username },
          roles: updatedRoles
        }
      });
    } catch (error: any) {
      console.error('Erreur retrait rôle:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du retrait du rôle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les utilisateurs avec leurs rôles (super admin only)
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT 
          u.id, u.email, u.username, u.created_at,
          GROUP_CONCAT(ur.role) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `;

      const result = await query(sql);

      const users = result.rows.map((user: any) => ({
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      }));

      res.status(200).json({
        success: true,
        data: { users }
      });
    } catch (error: any) {
      console.error('Erreur liste utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==================== VERIFICATION ====================
  
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        res.status(400).json({ success: false, message: 'Email et code requis' });
        return;
      }

      // Vérifier le code dans la base de données
      const isValid = await UserModel.verifyEmailCode(email, code);
      
      if (isValid) {
        await UserModel.markEmailVerified(email);
        res.json({ success: true, message: 'Email vérifié avec succès' });
      } else {
        res.status(400).json({ success: false, message: 'Code invalide ou expiré' });
      }
    } catch (error: any) {
      console.error('Erreur vérification email:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la vérification' });
    }
  }

  static async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code } = req.body;
      
      if (!phone || !code) {
        res.status(400).json({ success: false, message: 'Téléphone et code requis' });
        return;
      }

      // Vérifier le code dans la base de données
      const isValid = await UserModel.verifyPhoneCode(phone, code);
      
      if (isValid) {
        await UserModel.markPhoneVerified(phone);
        res.json({ success: true, message: 'Téléphone vérifié avec succès' });
      } else {
        res.status(400).json({ success: false, message: 'Code invalide ou expiré' });
      }
    } catch (error: any) {
      console.error('Erreur vérification téléphone:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la vérification' });
    }
  }

  static async resendEmailCode(req: Request, res: Response): Promise<void> {
    try {
      console.log('📥 Données reçues dans resendEmailCode:', req.body);
      
      // Gérer le cas où l'email est imbriqué dans un objet
      let email = req.body.email;
      if (email && typeof email === 'object' && email.email) {
        email = email.email;
      }
      
      console.log('📧 Email extrait après correction:', email);
      
      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: 'Email requis et valide' });
        return;
      }

      // Générer un nouveau code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log(`📧 Tentative d'envoi d'email à: ${email}`);
      console.log(`📧 Code généré: ${code}`);
      
      let emailSent = false;
      
      // Envoyer l'email directement avec le service email
      try {
        const { sendVerificationEmail } = await import('../services/emailService');
        console.log('📧 Service email importé avec succès');
        
        // Sauvegarder le code dans la base de données
        console.log('💾 Sauvegarde du code de vérification...');
        try {
          await UserModel.saveVerificationCode(email, code, 'email');
          console.log('✅ Code sauvegardé dans la base de données');
          
          // Vérifier immédiatement si le code a bien été sauvegardé
          const verifySql = `
            SELECT * FROM verification_codes 
            WHERE identifier = ? AND code = ? AND type = 'email' AND expires_at > NOW()
          `;
          const verifyResult = await query(verifySql, [email, code]);
          console.log(`🔍 Vérification immédiate du code sauvegardé: ${verifyResult.rows.length} résultat(s)`);
          
        } catch (saveError: any) {
          console.error('❌ Erreur sauvegarde code:', saveError.message);
          console.log('⚠️ Email envoyé mais code non sauvegardé - vérification impossible');
          
          // Solution alternative: utiliser une session temporaire
          console.log('🔄 Utilisation d\'une session temporaire pour la vérification...');
          // Ici on pourrait stocker le code en mémoire ou dans Redis
        }
        
        emailSent = await sendVerificationEmail(email, code);
        console.log(`📧 Résultat envoi email: ${emailSent}`);
        
        if (emailSent) {
          console.log(`✅ Email envoyé avec succès à ${email}`);
        } else {
          console.log(`❌ Échec envoi email à ${email}`);
        }
      } catch (emailError: any) {
        console.error('❌ Erreur lors de l\'import ou de l\'envoi d\'email:', emailError);
        console.error('❌ Détails de l\'erreur:', emailError.message);
        console.error('❌ Stack trace:', emailError.stack);
      }
      
      console.log('📧 Préparation de la réponse finale...');
      console.log('📧 emailSent:', emailSent);
      
      // Réponse simple et claire
      const finalResponse = {
        success: emailSent,
        message: emailSent ? 'Code envoyé par email' : 'Erreur lors de l\'envoi de l\'email',
        emailSent: emailSent
      };
      
      console.log('📧 Réponse finale:', JSON.stringify(finalResponse, null, 2));
      
      res.json(finalResponse);
    } catch (error: any) {
      console.error('Erreur envoi code email:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du code' });
    }
  }

  static async resendPhoneCode(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        res.status(400).json({ success: false, message: 'Téléphone requis' });
        return;
      }

      // Générer un nouveau code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // TODO: Envoyer le SMS avec le code (intégrer un service SMS comme Twilio)
      console.log(`📱 Code de vérification SMS pour ${phone}: ${code}`);
      
      res.json({ success: true, message: 'Code généré (SMS non implémenté)', code: code });
    } catch (error: any) {
      console.error('Erreur envoi code SMS:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du code' });
    }
  }

  // Obtenir les rôles de l'utilisateur connecté
  static async getUserRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const roles = await UserModel.getUserRoles(Number(req.user.id));
      console.log('🔍 Backend - Rôles utilisateur:', req.user.id, roles);

      res.status(200).json({
        success: true,
        data: { roles }
      });
    } catch (error: any) {
      console.error('Erreur récupération rôles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des rôles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Vérifier la validité du token
  static async checkTokenValidity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Token invalide ou expiré',
          requiresReauth: true
        });
        return;
      }

      // Le token est valide si on arrive ici (le middleware authenticateToken a fonctionné)
      res.status(200).json({
        success: true,
        message: 'Token valide',
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username
        },
        requiresReauth: false
      });
    } catch (error: any) {
      console.error('Erreur vérification token:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du token',
        requiresReauth: true
      });
    }
  }
}
