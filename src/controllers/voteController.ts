import { Request, Response } from 'express';
import { VoteModel } from '../models/Vote';
import { ScoreModel } from '../models/Score';
import { VoteRequest, AuthenticatedRequest } from '../types/database';
import { query } from '../config/database';

export class VoteController {
  // Voter pour un artiste (un seul vote par utilisateur)
  static async vote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validation des entrées
      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { artiste_id, phase_id }: VoteRequest = req.body as any;
      
      // Utiliser l'ID utilisateur ou 'visitor' pour les non-connectés
      const voterId = req.user?.id || 'visitor';
      
      // Vérifier si l'utilisateur a déjà voté pour cet artiste dans cette phase
      const hasVoted = await VoteModel.hasVoted(voterId, artiste_id, phase_id);
      
      if (hasVoted) {
        res.status(400).json({
          success: false,
          message: 'Vous avez déjà voté pour cet artiste',
          alreadyVoted: true
        });
        return;
      }

      console.log('Nouveau vote autorisé:', { voterId, artiste_id, phase_id });
      
      // Créer le vote
      const vote = await VoteModel.create({ artiste_id, phase_id }, voterId);
      console.log('Vote créé avec succès:', vote);

      res.status(201).json({
        success: true,
        message: 'Vote enregistré avec succès',
        data: { vote }
      });
    } catch (error: any) {
      console.error('Erreur vote détaillée:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vote',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les votes de l'utilisateur connecté
  static async getUserVotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { phaseId } = (req as any).query;
      const userId = req.user.id;

      const votes = await VoteModel.findByVoter(userId, phaseId as string);

      res.status(200).json({
        success: true,
        data: { votes }
      });
    } catch (error: any) {
      console.error('Erreur récupération votes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des votes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les votes pour un artiste
  static async getArtistVotes(req: Request, res: Response): Promise<void> {
    try {
      const { artisteId, phaseId, limit } = (req as any).query;

      if (!artisteId) {
        res.status(400).json({
          success: false,
          message: 'ID de l\'artiste requis'
        });
        return;
      }

      const votes = await VoteModel.findByArtiste(artisteId as string, phaseId as string);

      res.status(200).json({
        success: true,
        data: { votes }
      });
    } catch (error: any) {
      console.error('Erreur votes artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des votes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les votes pour une phase
  static async getPhaseVotes(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = req.params;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const votes = await VoteModel.findByPhase(phaseId);

      res.status(200).json({
        success: true,
        data: { votes }
      });
    } catch (error: any) {
      console.error('Erreur votes phase:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des votes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le classement pour une phase
  static async getRanking(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId } = (req as any).params;
      const { limit } = (req as any).query;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const ranking = await VoteModel.getRanking(phaseId, parseInt(limit));

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

  // Obtenir les statistiques de vote pour une phase
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

      const statistics = await VoteModel.getPhaseStatistics(phaseId);

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

  // Obtenir les tendances de vote
  static async getTrendingVotes(req: Request, res: Response): Promise<void> {
    try {
      const { phaseId, hours } = (req as any).query;

      if (!phaseId) {
        res.status(400).json({
          success: false,
          message: 'ID de phase requis'
        });
        return;
      }

      const trending = await VoteModel.getTrendingVotes(phaseId, parseInt(hours || '24'));

      res.status(200).json({
        success: true,
        data: { trending }
      });
    } catch (error: any) {
      console.error('Erreur tendances:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tendances',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer un vote (admin uniquement)
  static async deleteVote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { artisteId, phaseId } = (req as any).params;
      const voterId = req.user.id;

      await VoteModel.delete(voterId, artisteId, phaseId);

      res.status(200).json({
        success: true,
        message: 'Vote supprimé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur suppression vote:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du vote',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Ajouter un "j'aime" pour un artiste (illimité par utilisateur)
  static async like(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🎯 Like request received:', {
        body: req.body,
        user: req.user,
        userId: req.user?.id || 'visitor'
      });

      // Permettre aux visiteurs de liker (pas besoin d'authentification)
      const { artiste_id, phase_id } = req.body;
      
      // Utiliser un ID unique pour les likes multiples (visiteurs et utilisateurs)
      const uniqueUserId = req.user ? 
        `${req.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : 
        `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('🔥 Creating like with unique ID:', { uniqueUserId, artiste_id, phase_id });

      // Ajouter le like dans la table likes (illimité)
      const sql = `
        INSERT INTO likes (user_id, artiste_id, phase_id, nombre_like)
        VALUES (?, ?, ?, 1)
      `;
      
      const result = await query(sql, [uniqueUserId, artiste_id, phase_id]);
      console.log('✅ Like inserted successfully:', result);

      // Compter le nombre de likes pour cet artiste/phase
      const countLikesSql = `
        SELECT SUM(nombre_like) as total_likes 
        FROM likes 
        WHERE artiste_id = ? AND phase_id = ?
      `;
      
      const likesResult = await query(countLikesSql, [artiste_id, phase_id]);
      const totalLikes = (likesResult as any).rows[0]?.total_likes || 0;

      // Mettre à jour total_likes et score_final dans la table artiste
      const updateArtistSql = `
        UPDATE artiste 
        SET total_likes = ?,
            score_final = (total_votes + score_jury)
        WHERE id = ?
      `;
      
      await query(updateArtistSql, [totalLikes, artiste_id]);

      // Synchroniser seulement score_like dans la table scores (ne pas écraser score_vote)
      const syncScoresSql = `
        INSERT INTO scores (artiste_id, phase_id, score_like, score_jury)
        SELECT 
          a.id,
          a.phase_actuelle_id,
          a.total_likes,
          a.score_jury
        FROM artiste a
        WHERE a.id = ? AND a.phase_actuelle_id = ?
        ON DUPLICATE KEY UPDATE
          score_like = a.total_likes,
          score_jury = a.score_jury
      `;
      
      await query(syncScoresSql, [artiste_id, phase_id]);

      res.status(200).json({
        success: true,
        message: 'Like ajouté avec succès',
        data: { 
          totalLikes,
          unlimitedLikes: true,
          buttonType: 'like'
        }
      });
    } catch (error: any) {
      console.error('❌ Erreur like détaillée:', error);
      console.error('❌ Stack trace:', error.stack);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du like',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Vérifier le statut de vote de l'utilisateur
  static async getUserVoteStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { artiste_id, phase_id } = req.query;
      const userId = req.user.id;

      // Vérifier si l'utilisateur a déjà voté (vote officiel)
      const hasVoted = await ScoreModel.hasUserVoted(userId.toString(), artiste_id as string, phase_id as string);

      res.status(200).json({
        success: true,
        data: { 
          hasVoted,
          canVote: !hasVoted,
          unlimitedLikes: true,
          buttonType: hasVoted ? 'like' : 'vote'
        }
      });
    } catch (error: any) {
      console.error('Erreur statut vote:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les statistiques globales
  static async getGlobalStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await VoteModel.getGlobalStatistics();

      res.status(200).json({
        success: true,
        data: { statistics }
      });
    } catch (error: any) {
      console.error('Erreur statistiques globales:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques globales',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Récupérer les scores d'un artiste (pour le dashboard)
  static async getArtistScores(req: Request, res: Response): Promise<void> {
    try {
      const { artisteId } = req.params;

      if (!artisteId) {
        res.status(400).json({
          success: false,
          message: 'ID artiste requis'
        });
        return;
      }

      // Récupérer tous les scores de l'artiste
      const scores = await query(`
        SELECT * FROM scores 
        WHERE artiste_id = ?
        ORDER BY created_at DESC
      `, [artisteId]);

      res.status(200).json({
        success: true,
        data: scores.rows
      });
    } catch (error: any) {
      console.error('Erreur récupération scores artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des scores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
