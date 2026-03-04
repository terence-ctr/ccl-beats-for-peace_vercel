import { query, transaction } from '../config/database';
import { Score } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

export class ScoreModel {
  // Créer ou mettre à jour un score
  static async upsert(scoreData: Partial<Score>): Promise<Score> {
    const { artiste_id, phase_id, score_vote = 0, score_like = 0, score_jury = 0 } = scoreData;

    const sql = `
      INSERT INTO scores (id, artiste_id, phase_id, score_vote, score_like, score_jury)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        score_vote = VALUES(score_vote),
        score_like = VALUES(score_like),
        score_jury = VALUES(score_jury)
    `;

    const values = [uuidv4(), artiste_id, phase_id, score_vote, score_like, score_jury];
    const result = await query(sql, values);
    return result.rows[0];
  }

  // Trouver le score d'un artiste pour une phase
  static async findByArtisteAndPhase(artisteId: string, phaseId: string): Promise<Score | null> {
    const sql = `
      SELECT s.*, a.nom_artiste
      FROM scores s
      JOIN artiste a ON s.artiste_id = a.id
      WHERE s.artiste_id = ? AND s.phase_id = ?
    `;

    const result = await query(sql, [artisteId, phaseId]);
    return result.rows[0] || null;
  }

  // Trouver les scores d'une phase
  static async findByPhaseId(phaseId: string): Promise<Score[]> {
    const sql = `
      SELECT s.*, a.nom_artiste, a.photo_url, a.discipline
      FROM scores s
      JOIN artiste a ON s.artiste_id = a.id
      WHERE s.phase_id = ?
      ORDER BY s.score_total DESC
    `;

    const result = await query(sql, [phaseId]);
    return result.rows;
  }

  // Obtenir le classement pour une phase
  static async getRanking(phaseId: string, limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT 
        s.*,
        a.nom_artiste,
        a.photo_url,
        a.discipline,
        (@row_number := @row_number + 1) as ranking
      FROM scores s
      JOIN artiste a ON s.artiste_id = a.id
      CROSS JOIN (SELECT @row_number := 0) r
      WHERE s.phase_id = ?
      ORDER BY s.score_total DESC
      LIMIT ?
    `;

    const result = await query(sql, [phaseId, limit]);
    return result.rows;
  }

  // Mettre à jour le classement pour une phase
  static async updateRanking(phaseId: string): Promise<void> {
    const sql = `
      UPDATE scores s
      SET classement = (
        SELECT COUNT(*) + 1 
        FROM scores s2 
        WHERE s2.phase_id = s.phase_id AND s2.score_total > s.score_total
      )
      WHERE s.phase_id = ?
    `;

    await query(sql, [phaseId]);
  }

  // Mettre à jour le score de vote
  static async updateVoteScore(artisteId: string, phaseId: string, scoreVote: number): Promise<Score> {
    const sql = `
      UPDATE scores 
      SET score_vote = ?
      WHERE artiste_id = ? AND phase_id = ?
    `;

    const result = await query(sql, [scoreVote, artisteId, phaseId]);
    return result.rows[0];
  }

  // Ajouter un vote (score_like) pour un artiste
  static async addLike(artisteId: string, phaseId: string): Promise<Score> {
    const sql = `
      INSERT INTO scores (id, artiste_id, phase_id, score_vote, score_like, score_jury)
      VALUES (?, ?, ?, 0, 1, 0)
      ON DUPLICATE KEY UPDATE 
        score_like = score_like + 1
    `;

    const result = await query(sql, [uuidv4(), artisteId, phaseId]);
    return result.rows[0];
  }

  // Vérifier si l'utilisateur a déjà voté pour cet artiste
  static async hasUserVoted(userId: string, artisteId: string, phaseId: string): Promise<boolean> {
    const sql = `
      SELECT 1 FROM votes 
      WHERE voter_id = ? AND artiste_id = ? AND phase_id = ?
      LIMIT 1
    `;

    const result = await query(sql, [userId, artisteId, phaseId]);
    return result.rows.length > 0;
  }

  // Mettre à jour le score like (TikTok)
  static async updateLikeScore(artisteId: string, phaseId: string, scoreLike: number): Promise<Score> {
    const sql = `
      UPDATE scores 
      SET score_like = ?
      WHERE artiste_id = ? AND phase_id = ?
    `;

    const result = await query(sql, [scoreLike, artisteId, phaseId]);
    return result.rows[0];
  }

  // Mettre à jour le score jury
  static async updateJuryScore(artisteId: string, phaseId: string, scoreJury: number): Promise<Score> {
    const sql = `
      UPDATE scores 
      SET score_jury = ?
      WHERE artiste_id = ? AND phase_id = ?
    `;

    const result = await query(sql, [scoreJury, artisteId, phaseId]);
    return result.rows[0];
  }

  // Recalculer tous les scores pour une phase
  static async recalculateAllScores(phaseId: string): Promise<void> {
    await transaction(async (client) => {
      // Calculer les scores de vote
      await client.query(`
        UPDATE scores s
        SET score_vote = COALESCE((
          SELECT SUM(v.vote_count)
          FROM votes v
          WHERE v.artiste_id = s.artiste_id AND v.phase_id = s.phase_id
        ), 0)
        WHERE s.phase_id = $1
      `, [phaseId]);

      // Calculer les scores like (TikTok)
      await client.query(`
        UPDATE scores s
        SET score_like = COALESCE((
          SELECT lt.nombre_likes
          FROM likes_tiktok lt
          WHERE lt.artiste_id = s.artiste_id AND lt.phase_id = s.phase_id
        ), 0)
        WHERE s.phase_id = $1
      `, [phaseId]);

      // Calculer les scores jury
      await client.query(`
        UPDATE scores s
        SET score_jury = COALESCE((
          SELECT AVG(nj.note)
          FROM notes_jury nj
          WHERE nj.artiste_id = s.artiste_id AND nj.phase_id = s.phase_id
        ), 0)
        WHERE s.phase_id = $1
      `, [phaseId]);

      // Mettre à jour le classement
      await client.query(`
        WITH ranked AS (
          SELECT 
            id,
            RANK() OVER (ORDER BY score_total DESC) as new_ranking
          FROM scores
          WHERE phase_id = $1
        )
        UPDATE scores s
        SET classement = r.new_ranking
        FROM ranked r
        WHERE s.id = r.id
      `, [phaseId]);
    });
  }

  // Initialiser les scores pour tous les artistes d'une phase
  static async initializeForPhase(phaseId: string): Promise<void> {
    const sql = `
      INSERT INTO scores (id, artiste_id, phase_id, score_vote, score_like, score_jury)
      SELECT 
        uuid_generate_v4(),
        a.id,
        $1,
        0, 0, 0
      FROM artiste a
      WHERE a.statut IN ('validee', 'en_competition')
        AND NOT EXISTS (
          SELECT 1 FROM scores s 
          WHERE s.artiste_id = a.id AND s.phase_id = $1
        )
    `;

    await query(sql, [phaseId]);
  }

  // Obtenir les statistiques globales pour une phase
  static async getPhaseStatistics(phaseId: string): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_artistes,
        COALESCE(SUM(score_vote), 0) as total_votes,
        COALESCE(SUM(score_like), 0) as total_likes,
        COALESCE(AVG(score_jury), 0) as avg_jury_score,
        COALESCE(MAX(score_total), 0) as max_score,
        COALESCE(MIN(score_total), 0) as min_score,
        COALESCE(AVG(score_total), 0) as avg_score
      FROM scores
      WHERE phase_id = $1
    `;

    const result = await query(sql, [phaseId]);
    return result.rows[0];
  }

  // Supprimer les scores d'une phase
  static async deleteByPhase(phaseId: string): Promise<void> {
    await query('DELETE FROM scores WHERE phase_id = $1', [phaseId]);
  }
}
