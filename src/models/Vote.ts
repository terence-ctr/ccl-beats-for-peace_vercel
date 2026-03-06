import { query } from '../config/database';
import { Vote, VoteRequest, VoteStatistics } from '../types/database';

export class VoteModel {
  // Créer un vote (un seul vote par utilisateur)
  static async create(voteData: VoteRequest, voterId: number | string): Promise<Vote> {
    const { artiste_id, phase_id } = voteData;

    // Insérer le vote avec l'ID voter réel et user_id, en utilisant l'auto-incrément
    const result = await query(
      `INSERT INTO votes (voter_id, user_id, artiste_id, phase_id, vote_count) VALUES (?, ?, ?, ?, 1)`,
      [voterId, voterId, artiste_id, phase_id]
    );
    
    if (!result.insertId) throw new Error('Erreur création vote');
    
    // Synchronisation manuelle au lieu du trigger pour éviter l'erreur MySQL
    await this.syncVoteData(artiste_id, phase_id);
    
    const created = await query<Vote>(`SELECT * FROM votes WHERE id = ?`, [result.insertId]);
    return created.rows[0];
  }

  // Synchroniser les données de vote manuellement
  private static async syncVoteData(artisteId: number | string, phaseId: number | string): Promise<void> {
    // Compter le nombre total de votes pour cet artiste/phase
    const voteCountResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM votes WHERE artiste_id = ? AND phase_id = ?`,
      [artisteId, phaseId]
    );
    const voteCount = voteCountResult.rows[0].count;
    
    console.log(`📊 Synchronisation vote: artiste=${artisteId}, phase=${phaseId}, count=${voteCount}`);
    
    // Mettre à jour la table artiste pour cohérence (priorité absolue)
    // Désactivé temporairement à cause d'un conflit de trigger
    // try {
    //   await query(`
    //     UPDATE artiste 
    //     SET total_votes = ?
    //     WHERE id = ?
    //   `, [voteCount, artisteId]);
    //   console.log('✅ Mise à jour artiste réussie');
    // } catch (error) {
    //   console.log('❌ Erreur mise à jour artiste:', error);
    //   // Ne pas bloquer l'opération si la mise à jour de scores échoue
    // }
    
    // Mettre à jour la table scores (optionnel, avec gestion d'erreur)
    try {
      await query(`
        INSERT INTO scores (artiste_id, phase_id, score_vote)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          score_vote = ?
      `, [artisteId, phaseId, voteCount, voteCount]);
      console.log('✅ Mise à jour scores réussie');
    } catch (error) {
      console.log('⚠️ Erreur mise à jour scores (non critique):', error);
      // Le vote est déjà enregistré, c'est l'essentiel
    }
  }

  
  // Vérifier si un utilisateur a déjà voté pour un artiste dans une phase
  static async hasVoted(voterId: number | string, artisteId: number | string, phaseId: number | string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count FROM votes 
      WHERE voter_id = ? AND artiste_id = ? AND phase_id = ?
    `;

    const result = await query<{ count: number }>(sql, [voterId, artisteId, phaseId]);
    return result.rows[0].count > 0;
  }

  // Obtenir les votes d'un utilisateur
  static async findByVoter(voterId: number | string, phaseId?: number | string): Promise<Vote[]> {
    let sql = `
      SELECT v.*, a.nom_artiste, e.name as phase_name
      FROM votes v
      JOIN artiste a ON v.artiste_id = a.id
      JOIN evenement e ON v.phase_id = e.id
      WHERE v.voter_id = ?
    `;
    const params: any[] = [voterId];

    if (phaseId) {
      sql += ` AND v.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ' ORDER BY v.created_at DESC';

    const result = await query<Vote>(sql, params);
    return result.rows;
  }

  // Obtenir les votes pour un artiste
  static async findByArtiste(artisteId: number | string, phaseId?: number | string): Promise<Vote[]> {
    let sql = `
      SELECT v.*, u.username as voter_username
      FROM votes v
      JOIN users u ON v.voter_id = u.id
      WHERE v.artiste_id = ?
    `;
    const params: any[] = [artisteId];

    if (phaseId) {
      sql += ` AND v.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ' ORDER BY v.created_at DESC';

    const result = await query<Vote>(sql, params);
    return result.rows;
  }

  // Obtenir les votes pour une phase
  static async findByPhase(phaseId: number | string): Promise<Vote[]> {
    const sql = `
      SELECT v.*, a.nom_artiste, u.username as voter_username
      FROM votes v
      JOIN artiste a ON v.artiste_id = a.id
      JOIN users u ON v.voter_id = u.id
      WHERE v.phase_id = ?
      ORDER BY v.created_at DESC
    `;

    const result = await query<Vote>(sql, [phaseId]);
    return result.rows;
  }

  // Compter les votes pour un artiste dans une phase
  static async countVotes(artisteId: number | string, phaseId: number | string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(vote_count), 0) as total_votes
      FROM votes 
      WHERE artiste_id = ? AND phase_id = ?
    `;

    const result = await query<{ total_votes: string }>(sql, [artisteId, phaseId]);
    return parseInt(result.rows[0].total_votes);
  }

  // Obtenir les statistiques de vote pour une phase
  static async getPhaseStatistics(phaseId: number | string): Promise<VoteStatistics[]> {
    const sql = `
      SELECT 
        v.artiste_id,
        a.nom_artiste,
        COUNT(*) as total_votes,
        e.name as phase_name
      FROM votes v
      JOIN artiste a ON v.artiste_id = a.id
      JOIN evenement e ON v.phase_id = e.id
      WHERE v.phase_id = ?
      GROUP BY v.artiste_id, a.nom_artiste, e.name
      ORDER BY total_votes DESC
    `;

    const result = await query<VoteStatistics>(sql, [phaseId]);
    return result.rows;
  }

  // Obtenir le classement pour une phase
  static async getRanking(phaseId: number | string, limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT 
        a.id,
        a.nom_artiste,
        a.photo_url,
        a.discipline,
        COUNT(v.id) as vote_count,
        COALESCE(SUM(v.vote_count), 0) as total_votes
      FROM artiste a
      LEFT JOIN votes v ON a.id = v.artiste_id AND v.phase_id = ?
      WHERE a.statut IN ('validee', 'en_competition', 'laureat')
      GROUP BY a.id, a.nom_artiste, a.photo_url, a.discipline
      ORDER BY total_votes DESC
      LIMIT ?
    `;

    const result = await query(sql, [phaseId, limit]);
    return result.rows;
  }

  // Supprimer un vote (uniquement pour l'admin)
  static async delete(voterId: number | string, artisteId: number | string, phaseId: number | string): Promise<void> {
    const sql = `
      DELETE FROM votes 
      WHERE voter_id = ? AND artiste_id = ? AND phase_id = ?
    `;
    await query(sql, [voterId, artisteId, phaseId]);
  }

  // Réinitialiser les votes pour une phase
  static async resetPhaseVotes(phaseId: number | string): Promise<void> {
    // Supprimer les votes
    await query('DELETE FROM votes WHERE phase_id = ?', [phaseId]);
    
    // Réinitialiser les scores de vote
    await query(`
      UPDATE scores 
      SET score_vote = 0, score_total = score_like + score_jury
      WHERE phase_id = ?
    `, [phaseId]);
    
    // Réinitialiser les totaux de votes des artistes
    await query(`
      UPDATE artiste 
      SET total_votes = 0 
      WHERE phase_actuelle_id = ?
    `, [phaseId]);
  }

  // Mettre à jour le nombre total de votes pour un artiste
  static async updateArtistVoteCount(artisteId: number | string): Promise<void> {
    const sql = `
      UPDATE artiste 
      SET total_votes = (
        SELECT COALESCE(SUM(vote_count), 0) 
        FROM votes 
        WHERE artiste_id = ?
      )
      WHERE id = ?
    `;
    await query(sql, [artisteId, artisteId]);
  }

  // Obtenir les tendances de vote (derniers 24h)
  static async getTrendingVotes(phaseId: number | string, hours: number = 24): Promise<any[]> {
    const sql = `
      SELECT 
        a.id,
        a.nom_artiste,
        a.photo_url,
        COUNT(v.id) as recent_votes,
        COALESCE(SUM(v.vote_count), 0) as recent_vote_count
      FROM artiste a
      JOIN votes v ON a.id = v.artiste_id
      WHERE v.phase_id = ? 
        AND v.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      GROUP BY a.id, a.nom_artiste, a.photo_url
      ORDER BY recent_vote_count DESC
      LIMIT 10
    `;

    const result = await query(sql, [phaseId, hours]);
    return result.rows;
  }

  // Obtenir les statistiques globales de vote
  static async getGlobalStatistics(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(DISTINCT v.voter_id) as total_voters,
        COUNT(DISTINCT v.artiste_id) as voted_artists,
        COUNT(*) as total_votes,
        COUNT(DISTINCT v.phase_id) as active_phases
      FROM votes v
    `;

    const result = await query(sql);
    return result.rows[0];
  }
}
