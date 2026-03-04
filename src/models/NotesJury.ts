import { query } from '../config/database';
import { NotesJury, NoteJuryRequest } from '../types/database';

export class NotesJuryModel {
  // Créer ou mettre à jour une note
  static async upsert(noteData: NoteJuryRequest, juryId: number | string): Promise<NotesJury> {
    const { artiste_id, phase_id, note } = noteData;

    // Vérifier si une note existe déjà
    const existingNote = await query<NotesJury>(
      `SELECT * FROM notes_jury WHERE jury_id = ? AND artiste_id = ? AND phase_id = ?`,
      [juryId, artiste_id, phase_id]
    );

    let noteId: number;

    if (existingNote.rows.length > 0) {
      // Mise à jour
      noteId = existingNote.rows[0].id;
      await query(
        `UPDATE notes_jury SET note = ?, created_at = NOW() WHERE id = ?`,
        [note, noteId]
      );
    } else {
      // Création
      const result = await query(
        `INSERT INTO notes_jury (jury_id, artiste_id, phase_id, note) VALUES (?, ?, ?, ?)`,
        [juryId, artiste_id, phase_id, note]
      );
      if (!result.insertId) throw new Error('Erreur création note');
      noteId = result.insertId;
    }

    // Récupérer la note mise à jour
    const result = await query<NotesJury>(
      `SELECT * FROM notes_jury WHERE id = ?`,
      [noteId]
    );
    return result.rows[0];
  }

  // Trouver les notes d'un jury
  static async findByJuryId(juryId: number | string, phaseId?: number | string): Promise<NotesJury[]> {
    let sql = `
      SELECT nj.*, a.nom_artiste, e.name as phase_name
      FROM notes_jury nj
      JOIN artiste a ON nj.artiste_id = a.id
      JOIN evenement e ON nj.phase_id = e.id
      WHERE nj.jury_id = ?
    `;
    const params: any[] = [juryId];

    if (phaseId) {
      sql += ` AND nj.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` ORDER BY nj.created_at DESC`;

    const result = await query<NotesJury>(sql, params);
    return result.rows;
  }

  // Trouver les notes pour un artiste
  static async findByArtisteId(artisteId: number | string, phaseId?: number | string): Promise<NotesJury[]> {
    let sql = `
      SELECT nj.*, ji.nom_complet as jury_name
      FROM notes_jury nj
      LEFT JOIN jury_info ji ON nj.jury_id = ji.user_id
      WHERE nj.artiste_id = ?
    `;
    const params: any[] = [artisteId];

    if (phaseId) {
      sql += ` AND nj.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` ORDER BY nj.created_at DESC`;

    const result = await query<NotesJury>(sql, params);
    return result.rows;
  }

  // Trouver les notes d'une phase
  static async findByPhaseId(phaseId: number | string): Promise<NotesJury[]> {
    const sql = `
      SELECT nj.*, a.nom_artiste, ji.nom_complet as jury_name
      FROM notes_jury nj
      JOIN artiste a ON nj.artiste_id = a.id
      LEFT JOIN jury_info ji ON nj.jury_id = ji.user_id
      WHERE nj.phase_id = ?
      ORDER BY a.nom_artiste, nj.created_at DESC
    `;

    const result = await query<NotesJury>(sql, [phaseId]);
    return result.rows;
  }

  // Obtenir la moyenne des notes pour un artiste dans une phase
  static async getAverageNote(artisteId: number | string, phaseId: number | string): Promise<number> {
    const sql = `
      SELECT COALESCE(AVG(note), 0) as average
      FROM notes_jury
      WHERE artiste_id = ? AND phase_id = ?
    `;

    const result = await query<{ average: string }>(sql, [artisteId, phaseId]);
    return parseFloat(result.rows[0].average);
  }

  // Obtenir le classement des artistes par notes jury
  static async getRankingByJuryNotes(phaseId: number | string): Promise<any[]> {
    const sql = `
      SELECT 
        a.id as artiste_id,
        a.nom_artiste,
        a.photo_url,
        COUNT(nj.id) as jury_count,
        COALESCE(AVG(nj.note), 0) as average_note,
        COALESCE(SUM(nj.note), 0) as total_note
      FROM artiste a
      LEFT JOIN notes_jury nj ON a.id = nj.artiste_id AND nj.phase_id = ?
      WHERE a.statut IN ('validee', 'en_competition', 'laureat')
      GROUP BY a.id, a.nom_artiste, a.photo_url
      ORDER BY average_note DESC
    `;

    const result = await query(sql, [phaseId]);
    return result.rows;
  }

  // Supprimer une note
  static async delete(juryId: number | string, artisteId: number | string, phaseId: number | string): Promise<void> {
    await query(
      'DELETE FROM notes_jury WHERE jury_id = ? AND artiste_id = ? AND phase_id = ?',
      [juryId, artisteId, phaseId]
    );
  }

  // Vérifier si un jury a noté un artiste
  static async hasNoted(juryId: number | string, artisteId: number | string, phaseId: number | string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count FROM notes_jury
      WHERE jury_id = ? AND artiste_id = ? AND phase_id = ?
    `;

    const result = await query<{ count: number }>(sql, [juryId, artisteId, phaseId]);
    return result.rows[0].count > 0;
  }

  // Mettre à jour les scores jury des artistes pour une phase
  static async updateArtisteScores(phaseId: number | string): Promise<void> {
    // Calculer et mettre à jour le score jury pour chaque artiste
    await query(`
      UPDATE artiste a
      SET score_jury = COALESCE((
        SELECT AVG(nj.note)
        FROM notes_jury nj
        WHERE nj.artiste_id = a.id AND nj.phase_id = ?
      ), 0)
      WHERE a.phase_actuelle_id = ?
    `, [phaseId, phaseId]);

    // Mettre à jour la table scores avec INSERT ... ON DUPLICATE KEY UPDATE
    await query(`
      INSERT INTO scores (artiste_id, phase_id, score_jury)
      SELECT 
        a.id,
        ?,
        COALESCE((
          SELECT AVG(nj.note)
          FROM notes_jury nj
          WHERE nj.artiste_id = a.id AND nj.phase_id = ?
        ), 0)
      FROM artiste a
      WHERE a.phase_actuelle_id = ?
      ON DUPLICATE KEY UPDATE score_jury = VALUES(score_jury)
    `, [phaseId, phaseId, phaseId]);
  }
}
