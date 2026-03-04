import { Request, Response } from 'express';
import { ScoreModel } from '../models/Score';
import { AuthenticatedRequest } from '../types/database';

export class ScoreController {
  // Obtenir le classement pour une phase
  static async getRanking(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;
      const { limit } = req.query;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const ranking = await ScoreModel.getRanking(phaseId, parseInt(limit as string) || 50);

      res.status(200).json({
        success: true,
        data: { ranking }
      });
    } catch (error: any) {
      console.error('Erreur classement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du classement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les scores d'une phase
  static async getPhaseScores(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const scores = await ScoreModel.findByPhaseId(phaseId);


      res.status(200).json({
        success: true,
        data: { scores }
      });
    } catch (error: any) {
      console.error('Erreur scores phase:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des scores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le score d'un artiste
  static async getArtistScore(req: Request, res: Response): Promise<void> {
    try {
      const { artisteId, phaseId } = req.params;

      if (!artisteId || !phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID artiste et ID phase requis'
        });
        return;
      }

      const score = await ScoreModel.findByArtisteAndPhase(artisteId, phaseId);

      res.status(200).json({
        success: true,
        data: { score }
      });
    } catch (error: any) {
      console.error('Erreur score artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du score',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les statistiques d'une phase
  static async getPhaseStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const statistics = await ScoreModel.getPhaseStatistics(phaseId);

      res.status(200).json({
        success: true,
        data: { statistics }
      });
    } catch (error: any) {
      console.error('Erreur statistiques phase:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Recalculer les scores (admin)
  static async recalculateScores(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { phaseId } = req.params;

      await ScoreModel.recalculateAllScores(phaseId);

      res.status(200).json({
        success: true,
        message: 'Scores recalculés avec succès'
      });
    } catch (error: any) {
      console.error('Erreur recalcul scores:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du recalcul des scores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Initialiser les scores pour une phase (admin)
  static async initializeScores(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { phaseId } = req.params;

      await ScoreModel.initializeForPhase(phaseId);

      res.status(200).json({
        success: true,
        message: 'Scores initialisés avec succès'
      });
    } catch (error: any) {
      console.error('Erreur initialisation scores:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation des scores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour le classement (admin)
  static async updateRanking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { phaseId } = req.params;

      await ScoreModel.updateRanking(phaseId);

      res.status(200).json({
        success: true,
        message: 'Classement mis à jour avec succès'
      });
    } catch (error: any) {
      console.error('Erreur mise à jour classement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du classement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
