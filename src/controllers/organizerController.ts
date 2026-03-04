import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../types/database';

export class OrganizerController {
  // Mettre à jour la validation d'un candidat
  static async updateCandidateValidation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const { statut } = req.body;

      // Valider les valeurs de statut
      if (!['en_attente', 'validee', 'rejetee', 'en_competition', 'elimine', 'laureat'].includes(statut)) {
        res.status(400).json({
          success: false,
          message: 'Valeur de statut invalide'
        });
        return;
      }

      // Mettre à jour le statut du candidat
      const updateQuery = `
        UPDATE artiste 
        SET statut = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      await query(updateQuery, [statut, id]);

      // Récupérer le candidat mis à jour
      const selectQuery = `
        SELECT id, nom_artiste, nom_complet, statut, updated_at
        FROM artiste 
        WHERE id = ?
      `;

      const result = await query(selectQuery, [id]);
      const updatedCandidate = (result as any).rows[0];

      res.status(200).json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: { candidate: updatedCandidate }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les candidats avec leur statut
  static async getCandidatesWithValidation(req: Request, res: Response): Promise<void> {
    try {
      const candidatesQuery = `
        SELECT 
          a.id, a.user_id, a.nom_complet, a.nom_artiste, a.date_naissance, a.sexe, a.discipline,
          a.adresse, a.quartier, a.telephone, a.email, a.biographie, a.photo_url, a.video_url,
          a.statut, a.festiras_id, a.province, a.ville, a.pays, a.hashtag_officiel,
          COALESCE(SUM(v.vote_count), 0) as total_votes, 
          a.score_jury, a.score_final, a.phase_actuelle_id, 
          a.created_at, a.updated_at, a.total_likes
        FROM artiste a
        LEFT JOIN votes v ON a.id = v.artiste_id
        GROUP BY a.id, a.user_id, a.nom_complet, a.nom_artiste, a.date_naissance, a.sexe, a.discipline,
          a.adresse, a.quartier, a.telephone, a.email, a.biographie, a.photo_url, a.video_url,
          a.statut, a.festiras_id, a.province, a.ville, a.pays, a.hashtag_officiel,
          a.score_jury, a.score_final, a.phase_actuelle_id, a.created_at, a.updated_at, a.total_likes
        ORDER BY COALESCE(SUM(v.vote_count), 0) DESC, a.created_at DESC
      `;

      const result = await query(candidatesQuery as string);
      const candidates = (result as any).rows;

      res.status(200).json({
        success: true,
        data: { candidates }
      });
    } catch (error: any) {
      console.error('Erreur récupération candidats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des candidats',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Statistiques des statuts
  static async getValidationStats(req: Request, res: Response): Promise<void> {
    try {
      const statsQuery = `
        SELECT 
          statut,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM artiste), 2) as percentage
        FROM artiste 
        GROUP BY statut
        ORDER BY statut DESC
      `;

      const result = await query(statsQuery as string);
      const stats = (result as any).rows;

      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (error: any) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
