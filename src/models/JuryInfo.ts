import { query } from '../config/database';
import { JuryInfo, AppRole } from '../types/database';
import { UserModel } from './User';

export class JuryInfoModel {
  // Créer un profil jury
  static async create(userId: number | string, juryData: Partial<JuryInfo>): Promise<JuryInfo> {
    const {
      instagram_url,
      competences,
      description,
      photo_url,
      nom_complet,
      specialite
    } = juryData;

    const sql = `
      INSERT INTO jury_info (
        user_id, instagram_url, competences, description,
        photo_url, nom_complet, specialite
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      instagram_url || null,
      Array.isArray(competences) ? competences.join(', ') : (competences || null),
      description || null,
      photo_url || null,
      nom_complet || null,
      specialite || null
    ];

    const result = await query(sql, values);
    
    if (!result.insertId) throw new Error('Erreur création profil jury');
    
    // Ajouter le rôle jury
    await UserModel.assignRole(Number(userId), AppRole.JURY);
    
    return await this.findById(result.insertId) as JuryInfo;
  }

  // Trouver un jury par ID utilisateur
  static async findByUserId(userId: number | string): Promise<JuryInfo | null> {
    const sql = `
      SELECT ji.*, u.username, u.email as user_email
      FROM jury_info ji
      JOIN users u ON ji.user_id = u.id
      WHERE ji.user_id = ?
    `;
    
    const result = await query<JuryInfo>(sql, [userId]);
    return result.rows[0] || null;
  }

  // Trouver un jury par ID
  static async findById(id: number | string): Promise<JuryInfo | null> {
    const sql = `
      SELECT ji.*, u.username, u.email as user_email
      FROM jury_info ji
      JOIN users u ON ji.user_id = u.id
      WHERE ji.id = ?
    `;
    
    const result = await query<JuryInfo>(sql, [id]);
    return result.rows[0] || null;
  }

  // Obtenir tous les jurys
  static async findAll(): Promise<JuryInfo[]> {
    const sql = `
      SELECT ji.*, u.username, u.email as user_email
      FROM jury_info ji
      JOIN users u ON ji.user_id = u.id
      ORDER BY ji.created_at DESC
    `;

    const result = await query<JuryInfo>(sql, []);
    return result.rows;
  }

  // Mettre à jour un profil jury
  static async update(id: number | string, userId: number | string, updates: Partial<JuryInfo>): Promise<JuryInfo> {
    const fields = Object.keys(updates).filter(key => 
      updates[key as keyof JuryInfo] !== undefined && 
      !['id', 'user_id', 'created_at', 'updated_at'].includes(key)
    );
    
    if (fields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => updates[field as keyof JuryInfo]), id, userId];

    const sql = `
      UPDATE jury_info 
      SET ${setClause}, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await query(sql, values);
    return await this.findById(id) as JuryInfo;
  }

  // Supprimer un profil jury
  static async delete(id: number | string, userId: number | string): Promise<void> {
    await query('DELETE FROM jury_info WHERE id = ? AND user_id = ?', [id, userId]);
  }

  // Compter le nombre de jurys
  static async count(): Promise<number> {
    const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM jury_info');
    return parseInt(result.rows[0].count);
  }
}
