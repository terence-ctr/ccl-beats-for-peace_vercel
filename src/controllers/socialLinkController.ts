import { Request, Response } from 'express';
import { SocialLinkModel } from '../models/SocialLink';
import { AuthenticatedRequest } from '../types/database';

export class SocialLinkController {
  // Obtenir tous les liens sociaux actifs (public)
  static async getActiveLinks(req: Request, res: Response): Promise<void> {
    try {
      const links = await SocialLinkModel.findAllActive();

      res.status(200).json({
        success: true,
        data: { links }
      });
    } catch (error: any) {
      console.error('Erreur récupération liens:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des liens sociaux',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les liens sociaux (admin)
  static async getAllLinks(req: Request, res: Response): Promise<void> {
    try {
      const links = await SocialLinkModel.findAll();

      res.status(200).json({
        success: true,
        data: { links }
      });
    } catch (error: any) {
      console.error('Erreur récupération liens:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des liens sociaux',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir un lien par plateforme
  static async getLinkByPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { platform } = req.params;
      const link = await SocialLinkModel.findByPlatform(platform);

      if (!link) {
        res.status(404).json({
          success: false,
          message: 'Lien non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { link }
      });
    } catch (error: any) {
      console.error('Erreur récupération lien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du lien',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Créer un lien social (admin)
  static async createLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { platform, url } = req.body as any;

      if (!platform || !url) {
        res.status(400).json({
          success: false,
          message: 'Plateforme et URL requises'
        });
        return;
      }

      const link = await SocialLinkModel.create(platform, url);

      res.status(201).json({
        success: true,
        message: 'Lien social créé',
        data: { link }
      });
    } catch (error: any) {
      console.error('Erreur création lien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du lien',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour un lien social (admin)
  static async updateLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body as any;

      const link = await SocialLinkModel.update(id, updates);

      res.status(200).json({
        success: true,
        message: 'Lien social mis à jour',
        data: { link }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour lien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du lien',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Activer/désactiver un lien (admin)
  static async toggleLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const link = await SocialLinkModel.toggleActive(id);

      res.status(200).json({
        success: true,
        message: `Lien ${link.is_active ? 'activé' : 'désactivé'}`,
        data: { link }
      });
    } catch (error: any) {
      console.error('Erreur toggle lien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de statut',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer un lien social (admin)
  static async deleteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      await SocialLinkModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Lien social supprimé'
      });
    } catch (error: any) {
      console.error('Erreur suppression lien:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du lien',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
