import { query } from '../config/database';

export interface DecisionsJury {
  id: number;
  jury_id: number | string;
  artiste_id: number | string;
  phase_id: number | string;
  criteria: {
    technique: number;
    creativity: number;
    stage_presence: number;
    interpretation: number;
    overall: number;
  };
  comments: string;
  decision: 'selected' | 'rejected' | 'pending';
  finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface DecisionJuryRequest {
  artiste_id: number | string;
  phase_id: number | string;
  criteria: {
    technique: number;
    creativity: number;
    stage_presence: number;
    interpretation: number;
    overall: number;
  };
  comments: string;
  decision: 'selected' | 'rejected' | 'pending';
  jury_id?: number | string;
}

export class DecisionsJuryModel {
  // Créer ou mettre à jour une décision
  static async upsert(decisionData: DecisionJuryRequest, juryId: number | string): Promise<DecisionsJury> {
    const { artiste_id, phase_id, criteria, comments, decision } = decisionData;

    // Vérifier si une décision existe déjà
    const existingDecision = await query<DecisionsJury>(
      `SELECT * FROM decisions_jury WHERE jury_id = ? AND artiste_id = ? AND phase_id = ?`,
      [juryId, artiste_id, phase_id]
    );

    let decisionId: number;

    if (existingDecision.rows.length > 0) {
      // Mise à jour
      decisionId = existingDecision.rows[0].id;
      await query(
        `UPDATE decisions_jury 
         SET criteria = ?, comments = ?, decision = ?, finalized = false, updated_at = NOW() 
         WHERE id = ?`,
        [JSON.stringify(criteria), comments, decision, decisionId]
      );
    } else {
      // Création
      const result = await query(
        `INSERT INTO decisions_jury (jury_id, artiste_id, phase_id, criteria, comments, decision, finalized) 
         VALUES (?, ?, ?, ?, ?, ?, false)`,
        [juryId, artiste_id, phase_id, JSON.stringify(criteria), comments, decision]
      );
      if (!result.insertId) throw new Error('Erreur création décision');
      decisionId = result.insertId;
    }

    // Récupérer la décision mise à jour
    const result = await query<DecisionsJury>(
      `SELECT * FROM decisions_jury WHERE id = ?`,
      [decisionId]
    );
    return result.rows[0];
  }

  // Mettre à jour une décision
  static async update(decisionId: number, juryId: number | string, updates: Partial<DecisionJuryRequest>): Promise<DecisionsJury | null> {
    const fields = [];
    const values = [];

    if (updates.criteria) {
      fields.push('criteria = ?, finalized = false');
      values.push(JSON.stringify(updates.criteria));
    }
    if (updates.comments !== undefined) {
      fields.push('comments = ?, finalized = false');
      values.push(updates.comments);
    }
    if (updates.decision) {
      fields.push('decision = ?, finalized = false');
      values.push(updates.decision);
    }

    if (fields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    fields.push('updated_at = NOW()');
    values.push(decisionId, juryId);

    await query(
      `UPDATE decisions_jury SET ${fields.join(', ')} WHERE id = ? AND jury_id = ?`,
      values
    );

    // Récupérer la décision mise à jour
    const result = await query<DecisionsJury>(
      `SELECT * FROM decisions_jury WHERE id = ? AND jury_id = ?`,
      [decisionId, juryId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Finaliser une décision
  static async finalize(decisionId: number, juryId: number | string): Promise<DecisionsJury | null> {
    await query(
      `UPDATE decisions_jury SET finalized = true, updated_at = NOW() WHERE id = ? AND jury_id = ?`,
      [decisionId, juryId]
    );

    const result = await query<DecisionsJury>(
      `SELECT * FROM decisions_jury WHERE id = ? AND jury_id = ?`,
      [decisionId, juryId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Trouver les décisions d'un jury
  static async findByJuryId(juryId: number | string, phaseId?: number | string): Promise<DecisionsJury[]> {
    let sql = `
      SELECT dj.*, a.nom_artiste, e.name as phase_name
      FROM decisions_jury dj
      JOIN artiste a ON dj.artiste_id = a.id
      JOIN evenement e ON dj.phase_id = e.id
      WHERE dj.jury_id = ?
    `;
    const params = [juryId];

    if (phaseId) {
      sql += ` AND dj.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` ORDER BY dj.updated_at DESC`;

    const result = await query<DecisionsJury>(sql, params);
    return result.rows;
  }

  // Trouver les décisions pour un artiste
  static async findByArtisteId(artisteId: number | string, phaseId?: number | string): Promise<DecisionsJury[]> {
    let sql = `
      SELECT dj.*, j.nom as jury_name, j.prenom as jury_prenom
      FROM decisions_jury dj
      JOIN jury_info j ON dj.jury_id = j.user_id
      WHERE dj.artiste_id = ?
    `;
    const params = [artisteId];

    if (phaseId) {
      sql += ` AND dj.phase_id = ?`;
      params.push(phaseId);
    }

    sql += ` ORDER BY dj.updated_at DESC`;

    const result = await query<DecisionsJury>(sql, params);
    return result.rows;
  }

  // Obtenir le récapitulatif des décisions pour une phase
  static async getSummaryByPhase(phaseId: number | string): Promise<any> {
    const result = await query(
      `
      SELECT 
        dj.decision,
        COUNT(*) as count,
        AVG(dj.criteria.technique) as avg_technique,
        AVG(dj.criteria.creativity) as avg_creativity,
        AVG(dj.criteria.stage_presence) as avg_stage_presence,
        AVG(dj.criteria.interpretation) as avg_interpretation,
        AVG(dj.criteria.overall) as avg_overall,
        COUNT(CASE WHEN dj.finalized = true THEN 1 END) as finalized_count
      FROM decisions_jury dj
      WHERE dj.phase_id = ?
      GROUP BY dj.decision
      `,
      [phaseId]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM decisions_jury WHERE phase_id = ?`,
      [phaseId]
    );

    return {
      summary: result.rows,
      total: totalResult.rows[0]?.total || 0
    };
  }

  // Obtenir les statistiques détaillées par phase
  static async getDetailedStatsByPhase(phaseId: number | string): Promise<any> {
    const result = await query(
      `
      SELECT 
        a.id as artiste_id,
        a.nom_artiste,
        COUNT(dj.id) as decision_count,
        AVG(dj.criteria.technique) as avg_technique,
        AVG(dj.criteria.creativity) as avg_creativity,
        AVG(dj.criteria.stage_presence) as avg_stage_presence,
        AVG(dj.criteria.interpretation) as avg_interpretation,
        AVG(dj.criteria.overall) as avg_overall,
        COUNT(CASE WHEN dj.decision = 'selected' THEN 1 END) as selected_count,
        COUNT(CASE WHEN dj.decision = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN dj.decision = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN dj.finalized = true THEN 1 END) as finalized_count
      FROM artiste a
      LEFT JOIN decisions_jury dj ON a.id = dj.artiste_id AND dj.phase_id = ?
      WHERE a.statut = 'validated'
      GROUP BY a.id, a.nom_artiste
      ORDER BY a.nom_artiste
      `,
      [phaseId]
    );

    return result.rows;
  }
}
