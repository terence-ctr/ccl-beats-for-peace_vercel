import { query } from '../config/database';
import { Evenement, PhaseStatus } from '../types/database';

export class EventModel {
  // Créer un nouvel événement
  static async create(eventData: Partial<Evenement>): Promise<Evenement> {
    const {
      name,
      description,
      status = PhaseStatus.FUTURE,
      start_date,
      end_date,
      hashtag,
      vote_actif = false,
      periode_affichage,
      audio_rap_url,
      audio_slam_url,
      created_by
    } = eventData;

    // Auto-calculer phase_order si non fourni
    let phase_order = eventData.phase_order;
    if (!phase_order) {
      const countResult = await query<{ count: number }>('SELECT COUNT(*) as count FROM evenement');
      phase_order = (countResult.rows[0]?.count || 0) + 1;
    }

    const sql = `
      INSERT INTO evenement (
        name, description, phase_order, status, 
        start_date, end_date, hashtag, vote_actif, 
        periode_affichage, audio_rap_url, audio_slam_url, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      description || null,
      phase_order,
      status,
      start_date || null,
      end_date || null,
      hashtag || null,
      vote_actif,
      periode_affichage || null,
      audio_rap_url || null,
      audio_slam_url || null,
      created_by || null
    ];

    await query(sql, values);
    
    // MySQL doesn't support RETURNING, fetch the created event by phase_order
    const result = await query<Evenement>('SELECT * FROM evenement WHERE phase_order = ? ORDER BY id DESC LIMIT 1', [phase_order]);
    const event = result.rows[0];
    if (!event) throw new Error('Erreur création événement');
    return event;
  }

  // Trouver un événement par ID
  static async findById(id: string | number): Promise<Evenement | null> {
    const sql = `
      SELECT * FROM evenement WHERE id = ?
    `;
    
    const result = await query<Evenement>(sql, [id]);
    return result.rows[0] || null;
  }

  // Obtenir tous les événements
  static async findAll(status?: PhaseStatus): Promise<Evenement[]> {
    let sql = 'SELECT * FROM evenement';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY phase_order ASC';

    const result = await query<Evenement>(sql, params);
    return result.rows;
  }

  // Obtenir l'événement actif
  static async getActive(): Promise<Evenement | null> {
    const sql = `
      SELECT * FROM evenement 
      WHERE status = ? 
      ORDER BY phase_order ASC 
      LIMIT 1
    `;
    
    const result = await query<Evenement>(sql, [PhaseStatus.ACTIVE]);
    return result.rows[0] || null;
  }

  // Obtenir le prochain événement
  static async getNext(): Promise<Evenement | null> {
    const sql = `
      SELECT * FROM evenement 
      WHERE status = ? 
      ORDER BY phase_order ASC 
      LIMIT 1
    `;
    
    const result = await query<Evenement>(sql, [PhaseStatus.FUTURE]);
    return result.rows[0] || null;
  }

  // Mettre à jour un événement
  static async update(id: string | number, updates: Partial<Evenement>): Promise<Evenement> {
    console.log('🔍 EventModel.update - ID reçu:', id);
    console.log('🔍 EventModel.update - Type ID:', typeof id);
    console.log('🔍 EventModel.update - Updates:', updates);
    
    const fields = Object.keys(updates).filter(key => updates[key as keyof Evenement] !== undefined);
    console.log('🔍 EventModel.update - Fields à mettre à jour:', fields);
    
    if (fields.length === 0) {
      console.log('❌ EventModel.update - Aucun champ à mettre à jour');
      throw new Error('Aucun champ à mettre à jour');
    }

    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const values = [...fields.map(field => updates[field as keyof Evenement]), id];
    
    console.log('🔍 EventModel.update - SQL:', `UPDATE evenement SET ${setClause}, updated_at = NOW() WHERE id = ?`);
    console.log('🔍 EventModel.update - Values:', values);

    const sql = `
      UPDATE evenement 
      SET ${setClause}, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, values);
    console.log('🔍 EventModel.update - SQL exécuté avec succès');
    
    const event = await this.findById(id);
    console.log('🔍 EventModel.update - Event trouvé après mise à jour:', event);
    if (!event) throw new Error('Événement non trouvé');
    return event;
  }

  // Mettre à jour le statut d'un événement
  static async updateStatus(id: string | number, status: PhaseStatus): Promise<Evenement> {
    const sql = `
      UPDATE evenement 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, [status, id]);
    
    const event = await this.findById(id);
    if (!event) throw new Error('Événement non trouvé');
    return event;
  }

  // Activer/désactiver les votes pour un événement
  static async updateVotingStatus(id: string | number, vote_actif: boolean): Promise<Evenement> {
    const sql = `
      UPDATE evenement 
      SET vote_actif = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, [vote_actif, id]);
    
    const event = await this.findById(id);
    if (!event) throw new Error('Événement non trouvé');
    return event;
  }

  // Obtenir les événements par ordre de phase
  static async findByPhaseOrder(order: number): Promise<Evenement | null> {
    const sql = `
      SELECT * FROM evenement WHERE phase_order = ?
    `;
    
    const result = await query<Evenement>(sql, [order]);
    return result.rows[0] || null;
  }

  // Compter le nombre d'événements par statut
  static async countByStatus(status?: PhaseStatus): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM evenement';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0].count);
  }

  // Supprimer un événement
  static async delete(id: string | number): Promise<void> {
    await query('DELETE FROM evenement WHERE id = ?', [id]);
  }

  // Obtenir la progression de la compétition
  static async getProgress(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_phases,
        COUNT(CASE WHEN status = ? THEN 1 END) as completed_phases,
        COUNT(CASE WHEN status = ? THEN 1 END) as active_phases,
        COUNT(CASE WHEN status = ? THEN 1 END) as future_phases
      FROM evenement
    `;

    const result = await query(sql, [
      PhaseStatus.TERMINEE,
      PhaseStatus.ACTIVE,
      PhaseStatus.FUTURE
    ]);

    return result.rows[0];
  }
}
