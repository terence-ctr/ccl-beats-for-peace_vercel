import { query } from '../config/database';
import { Video } from '../types/database';

export class VideoModel {
  // Créer une vidéo
  static async create(videoData: Partial<Video>): Promise<Video> {
    const { artiste_id, phase_id, url_video, description, source = 'plateforme' } = videoData;

    const sql = `
      INSERT INTO videos (artiste_id, phase_id, url_video, description, source)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [artiste_id, phase_id, url_video, description || null, source]);
    const videoId = result.insertId;
    
    if (!videoId) {
      throw new Error('Erreur lors de la création: insertId non retourné');
    }
    
    // Fetch the created video
    const video = await this.findById(videoId.toString());
    return video!;
  }

  // Trouver les vidéos d'un artiste
  static async findByArtisteId(artisteId: string, phaseId?: string): Promise<Video[]> {
    let sql = `
      SELECT v.*, a.nom_artiste, e.name as phase_name
      FROM videos v
      JOIN artiste a ON v.artiste_id = a.id
      JOIN evenement e ON v.phase_id = e.id
      WHERE v.artiste_id = ?
    `;
    const params: any[] = [artisteId];

    if (phaseId) {
      sql += ` AND v.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` ORDER BY v.created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // Trouver les vidéos d'une phase
  static async findByPhaseId(phaseId: string): Promise<Video[]> {
    const sql = `
      SELECT v.*, a.nom_artiste, a.photo_url as artiste_photo
      FROM videos v
      JOIN artiste a ON v.artiste_id = a.id
      WHERE v.phase_id = ?
      ORDER BY v.created_at DESC
    `;

    const result = await query(sql, [phaseId]);
    return result.rows;
  }

  // Trouver une vidéo par ID
  static async findById(id: string): Promise<Video | null> {
    const sql = `
      SELECT v.*, a.nom_artiste, e.name as phase_name
      FROM videos v
      JOIN artiste a ON v.artiste_id = a.id
      JOIN evenement e ON v.phase_id = e.id
      WHERE v.id = ?
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Mettre à jour une vidéo
  static async update(id: string, updates: Partial<Video>): Promise<Video> {
    const { url_video, description, source } = updates;

    const sql = `
      UPDATE videos 
      SET url_video = COALESCE(?, url_video),
          description = COALESCE(?, description),
          source = COALESCE(?, source)
      WHERE id = ?
    `;

    await query(sql, [url_video, description, source, id]);
    
    // Fetch updated video
    const video = await this.findById(id);
    return video!;
  }

  // Supprimer une vidéo
  static async delete(id: string): Promise<void> {
    await query('DELETE FROM videos WHERE id = ?', [id]);
  }

  // Supprimer les vidéos d'un artiste pour une phase
  static async deleteByArtisteAndPhase(artisteId: string, phaseId: string): Promise<void> {
    await query('DELETE FROM videos WHERE artiste_id = ? AND phase_id = ?', [artisteId, phaseId]);
  }

  // Compter les vidéos par source
  static async countBySource(phaseId?: string): Promise<any> {
    let sql = `
      SELECT source, COUNT(*) as count
      FROM videos
    `;
    const params: any[] = [];

    if (phaseId) {
      sql += ` WHERE phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` GROUP BY source`;

    const result = await query(sql, params);
    return result.rows;
  }
}
