import { Request, Response } from 'express';
import { JuryInfoModel } from '../models/JuryInfo';
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

      const { nom, prenom, email, telephone, biographie } = req.body;

      if (!nom || !prenom || !email) {
        res.status(400).json({
          success: false,
          message: 'Nom, prénom et email sont requis'
        });
        return;
      }

      const juryData = {
        user_id: req.user.id,
        nom,
        prenom,
        email,
        telephone: telephone || '',
        biographie: biographie || '',
        valide: false
      };

      await JuryInfoModel.create(req.user.id, juryData);

      res.status(201).json({
        success: true,
        message: 'Profil jury créé avec succès',
        data: juryData
      });
    } catch (error: any) {
      console.error('Erreur création profil jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création du profil'
      });
    }
  }

  // Obtenir tous les jurys
  static async getAllJurys(req: Request, res: Response): Promise<void> {
    try {
      const jurys = await JuryInfoModel.findAll();
      res.status(200).json({
        success: true,
        data: jurys
      });
    } catch (error: any) {
      console.error('Erreur récupération jurys:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des jurys'
      });
    }
  }

  // Obtenir les notes d'un jury pour un artiste
  static async getArtistNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { artiste_id, phase_id } = req.query;

      if (!artiste_id || !phase_id) {
        res.status(400).json({
          success: false,
          message: 'artiste_id et phase_id sont requis'
        });
        return;
      }

      const notes = await query(
        `SELECT d.*, u.nom, u.prenom 
         FROM decisions_jury d 
         JOIN users u ON d.jury_id = u.id 
         WHERE d.artiste_id = ? AND d.phase_id = ?`,
        [artiste_id, phase_id]
      );

      res.status(200).json({
        success: true,
        data: notes.rows
      });
    } catch (error: any) {
      console.error('Erreur récupération notes artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des notes'
      });
    }
  }

  // Obtenir le classement par notes de jury
  static async getJuryRanking(req: Request, res: Response): Promise<void> {
    try {
      const { phase_id } = req.query;

      if (!phase_id) {
        res.status(400).json({
          success: false,
          message: 'phase_id est requis'
        });
        return;
      }

      const ranking = await query(
        `SELECT a.id, a.nom_artiste, a.discipline, AVG(d.score) as avg_score, COUNT(d.id) as vote_count
         FROM artiste a 
         JOIN decisions_jury d ON a.id = d.artiste_id 
         WHERE d.phase_id = ? 
         GROUP BY a.id, a.nom_artiste, a.discipline 
         ORDER BY avg_score DESC`,
        [phase_id]
      );

      res.status(200).json({
        success: true,
        data: ranking.rows
      });
    } catch (error: any) {
      console.error('Erreur récupération classement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du classement'
      });
    }
  }

  // Soumettre une décision de jury
  static async submitDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { artiste_id, phase_id, criteria, comments, decision, juryScore, note } = req.body;

      // Validation des données
      if (!artiste_id || !phase_id || !decision || juryScore === undefined) {
        res.status(400).json({
          success: false,
          message: 'artiste_id, phase_id, decision et juryScore (0-10) sont requis'
        });
        return;
      }

      // Validation du juryScore (0-10)
      if (typeof juryScore !== 'number' || juryScore < 0 || juryScore > 10) {
        res.status(400).json({
          success: false,
          message: 'juryScore invalide. Doit être entre 0 et 10'
        });
        return;
      }

      // Convertir juryScore (0-10) en score (0-50) pour decisions_jury
      const score = Math.round(juryScore * 5);

      // Valider la note si fournie (0-50)
      if (note !== undefined && (typeof note !== 'number' || note < 0 || note > 50)) {
        res.status(400).json({
          success: false,
          message: 'Note invalide. Doit être entre 0 et 50'
        });
        return;
      }

      console.log('📝 Submitting decision data:', {
        artiste_id,
        phase_id,
        criteria,
        comments,
        decision,
        juryScore,
        note,
        convertedScore: score
      });

      // Préparer les données de décision
      const decisionData = {
        artiste_id: Number(artiste_id),
        phase_id: Number(phase_id),
        criteria: criteria || {},
        comments: comments || '',
        decision,
        score // Score 0-50 pour decisions_jury (convertis de juryScore 0-10)
      };

      console.log('✅ Data validation passed, upserting decision...');
      const decisionResult = await DecisionsJuryModel.upsert(decisionData, req.user.id);
      console.log('✅ Decision upserted:', decisionResult);

      // Récupérer le score_vote existant
      console.log('🔍 Fetching existing score_vote...');
      const existingScore = await query(
        'SELECT score_vote FROM scores WHERE artiste_id = ? AND phase_id = ?',
        [decisionData.artiste_id, decisionData.phase_id]
      );
      const scoreVote = (existingScore as any).rows[0]?.score_vote || 0;
      console.log('✅ Score vote retrieved:', scoreVote);

      // Calculer le score total (votes + jury)
      const scoreTotal = scoreVote + (decisionData.score / 5); // Convertir 0-50 en 0-10
      console.log('📊 Calculated total score:', { scoreVote, juryScore: decisionData.score / 5, scoreTotal });

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
        decisionData.score / 5, // Convertir 0-50 en 0-10
        scoreTotal
      ]);
      console.log('✅ Scores synchronized');

      res.status(200).json({
        success: true,
        message: 'Décision soumise avec succès',
        data: {
          decision: decisionResult,
          score: decisionData.score
        }
      });

    } catch (error: any) {
      console.error('Erreur soumission décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la soumission de la décision'
      });
    }
  }

  // Mettre à jour une décision existante
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
      const { criteria, comments, decision, juryScore, note } = req.body;

      // Validation des données
      if (!decision || juryScore === undefined) {
        res.status(400).json({
          success: false,
          message: 'decision et juryScore (0-10) sont requis'
        });
        return;
      }

      // Validation du juryScore (0-10)
      if (typeof juryScore !== 'number' || juryScore < 0 || juryScore > 10) {
        res.status(400).json({
          success: false,
          message: 'juryScore invalide. Doit être entre 0 et 10'
        });
        return;
      }

      // Convertir juryScore (0-10) en score (0-50) pour decisions_jury
      const score = Math.round(juryScore * 5);

      // Valider la note si fournie (0-50)
      if (note !== undefined && (typeof note !== 'number' || note < 0 || note > 50)) {
        res.status(400).json({
          success: false,
          message: 'Note invalide. Doit être entre 0 et 50'
        });
        return;
      }

      // Récupérer la décision existante
      const existingDecision = await query(
        'SELECT * FROM decisions_jury WHERE id = ? AND jury_id = ?',
        [id, req.user.id]
      );

      if (!existingDecision.rows.length) {
        res.status(404).json({
          success: false,
          message: 'Décision non trouvée'
        });
        return;
      }

      const decisionData = {
        id: Number(id),
        artiste_id: existingDecision.rows[0].artiste_id,
        phase_id: existingDecision.rows[0].phase_id,
        criteria: criteria || existingDecision.rows[0].criteria,
        comments: comments || existingDecision.rows[0].comments,
        decision,
        score: Number(score)
      };

      console.log('📝 Updating decision data:', decisionData);
      const decisionResult = await DecisionsJuryModel.upsert(decisionData, req.user.id);
      console.log('✅ Decision updated:', decisionResult);

      // Récupérer le score_vote existant
      const existingScore = await query(
        'SELECT score_vote FROM scores WHERE artiste_id = ? AND phase_id = ?',
        [decisionData.artiste_id, decisionData.phase_id]
      );
      const scoreVote = (existingScore as any).rows[0]?.score_vote || 0;

      // Calculer le score total (votes + jury)
      const scoreTotal = scoreVote + (decisionData.score / 5); // Convertir 0-50 en 0-10
      console.log('📊 Updated total score:', { scoreVote, juryScore: decisionData.score / 5, scoreTotal });

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
        decisionData.score / 5, // Convertir 0-50 en 0-10
        scoreTotal
      ]);
      console.log('✅ Scores synchronized after update');

      res.status(200).json({
        success: true,
        message: 'Décision mise à jour avec succès',
        data: {
          decision: decisionResult,
          score: decisionData.score
        }
      });

    } catch (error: any) {
      console.error('Erreur mise à jour décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour de la décision'
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

      const { phase_id } = req.query;

      if (!phase_id) {
        res.status(400).json({
          success: false,
          message: 'phase_id est requis'
        });
        return;
      }

      const decisions = await query(
        `SELECT d.*, a.nom_artiste, a.discipline 
         FROM decisions_jury d 
         JOIN artiste a ON d.artiste_id = a.id 
         WHERE d.jury_id = ? AND d.phase_id = ? 
         ORDER BY d.created_at DESC`,
        [req.user.id, phase_id]
      );

      res.status(200).json({
        success: true,
        data: decisions.rows
      });
    } catch (error: any) {
      console.error('Erreur récupération décisions jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des décisions'
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

      const phaseId = req.query.phaseId || req.query.phase_id;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'phaseId est requis'
        });
        return;
      }

      const decisions = await query(
        `SELECT d.*, a.nom_artiste, a.discipline 
         FROM decisions_jury d 
         JOIN artiste a ON d.artiste_id = a.id 
         WHERE d.jury_id = ? AND d.phase_id = ? 
         ORDER BY d.created_at DESC`,
        [req.user.id, phaseId]
      );

      res.status(200).json({
        success: true,
        data: decisions.rows
      });
    } catch (error: any) {
      console.error('Erreur récupération décisions jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des décisions'
      });
    }
  }

  // Obtenir un jury par ID
  static async getJuryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID est requis'
        });
        return;
      }

      const jury = await query(
        `SELECT ji.*, u.username, u.email as user_email
         FROM jury_info ji
         JOIN users u ON ji.user_id = u.id
         WHERE ji.id = ?`,
        [id]
      );

      if (!jury.rows.length) {
        res.status(404).json({
          success: false,
          message: 'Jury non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: jury.rows[0]
      });
    } catch (error: any) {
      console.error('Erreur récupération jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du jury'
      });
    }
  }

  // Mettre à jour un profil jury
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
      const { nom, prenom, email, telephone, biographie } = req.body;

      const juryData = {
        nom,
        prenom,
        email,
        telephone: telephone || '',
        biographie: biographie || ''
      };

      await JuryInfoModel.update(id, req.user.id, juryData);

      res.status(200).json({
        success: true,
        message: 'Profil jury mis à jour avec succès',
        data: juryData
      });
    } catch (error: any) {
      console.error('Erreur mise à jour profil jury:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du profil'
      });
    }
  }

  // Noter un artiste (remplacé par submitDecision)
  static async noteArtist(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(400).json({
      success: false,
      message: 'Utilisez /decisions pour soumettre une évaluation'
    });
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

      const decision = await DecisionsJuryModel.finalize(Number(id), req.user.id);

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
        data: decision
      });
    } catch (error: any) {
      console.error('Erreur finalisation décision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la finalisation de la décision'
      });
    }
  }

  // Obtenir le récapitulatif des décisions pour une phase
  static async getDecisionsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'phaseId est requis'
        });
        return;
      }

      const summary = await DecisionsJuryModel.getSummaryByPhase(phaseId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('Erreur récupération récapitulatif décisions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du récapitulatif'
      });
    }
  }
}
