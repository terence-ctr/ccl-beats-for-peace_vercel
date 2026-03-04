import { Request, Response } from 'express';
import { JuryInfoModel } from '../models/JuryInfo';
import { NotesJuryModel } from '../models/NotesJury';
import { DecisionsJuryModel } from '../models/DecisionsJury';
import { AuthenticatedRequest } from '../types/database';
import { query } from '../config/database';

export class JuryController {
  // Créer un profil jury
  static async createJuryProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const existingJury = await JuryInfoModel.findByUserId(req.user.id);
      if (existingJury) {
        res.status(409).json({
          success: false,
          message: 'Vous avez déjà un profil jury'
        });
        return;
      }

      const juryData = req.body as any;
      const jury = await JuryInfoModel.create(req.user.id, juryData);

      res.status(201).json({
        success: true,
        message: 'Profil jury créé avec succès',
        data: { jury }
      });
    } catch (error: any) {
      console.error('Erreur création jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du profil jury',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les jurys
  static async getAllJurys(req: Request, res: Response): Promise<void> {
    try {
      const jurys = await JuryInfoModel.findAll();

      res.status(200).json({
        success: true,
        data: { jurys }
      });
    } catch (error: any) {
      console.error('Erreur liste jurys:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des jurys',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir un jury par ID
  static async getJuryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const jury = await JuryInfoModel.findById(id);

      if (!jury) {
        res.status(404).json({
          success: false,
          message: 'Jury non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { jury }
      });
    } catch (error: any) {
      console.error('Erreur jury par ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du jury',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour son profil jury
  static async updateJuryProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const jury = await JuryInfoModel.update(id, req.user.id, updates);

      res.status(200).json({
        success: true,
        message: 'Profil jury mis à jour avec succès',
        data: { jury }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil jury',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Noter un artiste
  static async noteArtist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { artiste_id, phase_id, note } = req.body as any;

      if (note < 0 || note > 50) {
        res.status(400).json({
          success: false,
          message: 'La note doit être comprise entre 0 et 50'
        });
        return;
      }

      const noteJury = await NotesJuryModel.upsert(
        { artiste_id, phase_id, note },
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Note enregistrée avec succès',
        data: { note: noteJury }
      });
    } catch (error: any) {
      console.error('Erreur notation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement de la note',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les notes d'un jury
  static async getJuryNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      // Vérifier si l'utilisateur a un profil jury
      const juryProfile = await JuryInfoModel.findByUserId(req.user.id);
      if (!juryProfile) {
        res.status(404).json({
          success: false,
          message: 'Profil jury non trouvé. Veuillez créer votre profil jury d\'abord.'
        });
        return;
      }

      const { phaseId } = req.query;
      const notes = await NotesJuryModel.findByJuryId(req.user.id, phaseId as string);

      res.status(200).json({
        success: true,
        data: { notes }
      });
    } catch (error: any) {
      console.error('Erreur récupération notes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les notes pour un artiste (admin)
  static async getArtistNotes(req: Request, res: Response): Promise<void> {
    try {
      const { artisteId } = req.params;
      const { phaseId } = req.query;

      const notes = await NotesJuryModel.findByArtisteId(artisteId, phaseId as string);

      res.status(200).json({
        success: true,
        data: { notes }
      });
    } catch (error: any) {
      console.error('Erreur notes artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le classement par notes jury
  static async getJuryRanking(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;

      const ranking = await NotesJuryModel.getRankingByJuryNotes(phaseId);

      res.status(200).json({
        success: true,
        data: { ranking }
      });
    } catch (error: any) {
      console.error('Erreur classement jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du classement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Soumettre une décision détaillée
  static async submitDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const decisionData = req.body;
      const decision = await DecisionsJuryModel.upsert(decisionData, req.user.id);

      // Calculer le score jury depuis les critères
      const criteria = decisionData.criteria;
      const juryScore = Object.values(criteria).reduce((sum: number, value: any) => sum + value, 0) / 2; // Convertir 0-20 à 0-10

      // Récupérer le score_vote existant
      const existingScore = await query(
        'SELECT score_vote FROM scores WHERE artiste_id = ? AND phase_id = ?',
        [decisionData.artiste_id, decisionData.phase_id]
      );
      const scoreVote = (existingScore as any).rows[0]?.score_vote || 0;

      // Synchroniser avec la table scores
      const syncScoresSql = `
        INSERT INTO scores (artiste_id, phase_id, score_jury, score_total)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          score_jury = VALUES(score_jury),
          score_total = VALUES(score_total)
      `;
      
      await query(syncScoresSql, [
        decisionData.artiste_id,
        decisionData.phase_id,
        juryScore,
        juryScore + scoreVote
      ]);

      // Traiter les mises à jour de classement
      await JuryController.processRankingUpdates();

      res.status(201).json({
        success: true,
        message: 'Décision soumise avec succès',
        data: { decision }
      });
    } catch (error: any) {
      console.error('Erreur soumission décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la soumission de la décision',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour une décision
  static async updateDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      const decision = await DecisionsJuryModel.update(parseInt(id), req.user.id, updates);

      if (!decision) {
        res.status(404).json({
          success: false,
          message: 'Décision non trouvée'
        });
        return;
      }

      // Si les critères sont mis à jour, synchroniser avec la table scores
      if (updates.criteria) {
        const criteria = updates.criteria;
        const juryScore = Object.values(criteria).reduce((sum: number, value: any) => sum + value, 0) / 2; // Convertir 0-20 à 0-10

        // Récupérer le score_vote existant
        const existingScore = await query(
          'SELECT score_vote FROM scores WHERE artiste_id = ? AND phase_id = ?',
          [decision.artiste_id, decision.phase_id]
        );
        const scoreVote = (existingScore as any).rows[0]?.score_vote || 0;

        // Synchroniser avec la table scores
        const syncScoresSql = `
          INSERT INTO scores (artiste_id, phase_id, score_jury, score_total)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            score_jury = VALUES(score_jury),
            score_total = VALUES(score_total)
        `;
        
        await query(syncScoresSql, [
          decision.artiste_id,
          decision.phase_id,
          juryScore,
          juryScore + scoreVote
        ]);

        // Traiter les mises à jour de classement
        await JuryController.processRankingUpdates();
      }

      res.status(200).json({
        success: true,
        message: 'Décision mise à jour avec succès',
        data: { decision }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la décision',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les décisions d'un jury
  static async getJuryDecisions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      // Vérifier si l'utilisateur a un profil jury
      const juryProfile = await JuryInfoModel.findByUserId(req.user.id);
      if (!juryProfile) {
        res.status(404).json({
          success: false,
          message: 'Profil jury non trouvé. Veuillez créer votre profil jury d\'abord.'
        });
        return;
      }

      const { phaseId } = req.query;
      const decisions = await DecisionsJuryModel.findByJuryId(req.user.id, phaseId as string);

      res.status(200).json({
        success: true,
        data: { decisions }
      });
    } catch (error: any) {
      console.error('Erreur récupération décisions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des décisions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Finaliser une décision
  static async finalizeDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const decision = await DecisionsJuryModel.finalize(parseInt(id), req.user.id);

      if (!decision) {
        res.status(404).json({
          success: false,
          message: 'Décision non trouvée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Décision finalisée avec succès',
        data: { decision }
      });
    } catch (error: any) {
      console.error('Erreur finalisation décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la finalisation de la décision',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le récapitulatif des décisions (admin)
  static async getDecisionsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;
      const summary = await DecisionsJuryModel.getSummaryByPhase(phaseId);

      res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error: any) {
      console.error('Erreur récapitulatif décisions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du récapitulatif',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les décisions du jury connecté
  static async getMyDecisions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { phaseId } = req.query;
      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'phaseId est requis'
        });
        return;
      }

      // Vérifier que le jury a un profil
      const juryProfile = await JuryInfoModel.findByUserId(req.user.id);
      if (!juryProfile) {
        res.status(404).json({
          success: false,
          message: 'Profil jury non trouvé. Veuillez créer votre profil jury d\'abord.'
        });
        return;
      }

      const decisions = await DecisionsJuryModel.findByJuryId(juryProfile.id, phaseId.toString());

      res.status(200).json({
        success: true,
        data: { decisions }
      });
    } catch (error: any) {
      console.error('Erreur récupération décisions jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des décisions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Traiter les mises à jour de classement en attente
  static async processRankingUpdates(): Promise<void> {
    try {
      // Récupérer les phases qui nécessitent une mise à jour
      const phasesToUpdate = await query(
        `SELECT DISTINCT phase_id FROM ranking_updates WHERE needs_update = TRUE`
      );

      const rows = (phasesToUpdate as any).rows;
      for (const row of rows) {
        const phaseId = row.phase_id;
        
        // Mettre à jour le classement pour cette phase
        await query(
          `UPDATE scores s1 
           SET classement = (
             SELECT COUNT(*) + 1 
             FROM scores s2 
             WHERE s2.phase_id = s1.phase_id 
             AND CAST(s2.score_total AS DECIMAL(10,2)) > CAST(s1.score_total AS DECIMAL(10,2))
           )
           WHERE phase_id = ?`,
          [phaseId]
        );

        // Marquer comme traité
        await query(
          `UPDATE ranking_updates SET needs_update = FALSE WHERE phase_id = ?`,
          [phaseId]
        );

        console.log(`🏆 Classement mis à jour pour la phase ${phaseId}`);
      }
    } catch (error) {
      console.error('Erreur traitement mises à jour classement:', error);
    }
  }
}
