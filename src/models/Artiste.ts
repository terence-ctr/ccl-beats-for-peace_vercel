import { query } from '../config/database';
import { 
  Artiste, 
  CreateArtisteRequest, 
  CandidatureStatus, 
  ArtisticDiscipline, 
  Gender,
  AppRole 
} from '../types/database';
import { UserModel } from './User';

export class ArtisteModel {
  // Créer une nouvelle candidature d'artiste
  static async create(userId: number | string, artisteData: CreateArtisteRequest): Promise<Artiste | null> {
    const {
      nom_complet,
      nom_artiste,
      date_naissance,
      sexe,
      discipline,
      adresse,
      quartier,
      telephone,
      email,
      biographie,
      province,
      ville,
      photo_url,
      video_url,
      piece_identite_url
    } = artisteData;
    
    const sql = `
      INSERT INTO artiste (
        user_id, nom_complet, nom_artiste, date_naissance, 
        sexe, discipline, adresse, quartier, telephone, email, 
        biographie, province, ville, photo_url, video_url, piece_identite_url, statut, pays
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      nom_complet,
      nom_artiste,
      date_naissance,
      sexe,
      discipline,
      adresse,
      quartier || null,
      telephone,
      email,
      biographie || null,
      province || null,
      ville || null,
      photo_url || null,
      video_url || null,
      piece_identite_url || null,
      CandidatureStatus.EN_ATTENTE,
      'RDC'
    ];

    const result = await query(sql, values);
    const artistId = result.insertId;
    
    if (!artistId) {
      throw new Error('Erreur lors de la création: insertId non retourné');
    }
    
    // Fetch the created artist
    const artist = await this.findById(artistId);
    return artist;
  }

  // Trouver un artiste par ID utilisateur
  static async findByUserId(userId: number | string): Promise<Artiste | null> {
    const sql = `
      SELECT * FROM artiste WHERE user_id = ?
    `;
    
    const result = await query<Artiste>(sql, [userId]);
    return result.rows[0] || null;
  }

  // Trouver un artiste par ID
  static async findById(id: number | string): Promise<Artiste | null> {
    const sql = `
      SELECT a.*, u.username, u.email as user_email
      FROM artiste a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `;
    
    const result = await query<Artiste>(sql, [id]);
    return result.rows[0] || null;
  }

  // Obtenir tous les artistes avec filtres
  static async findAll(
    status?: CandidatureStatus,
    discipline?: ArtisticDiscipline,
    limit: number = 50,
    offset: number = 0
  ): Promise<Artiste[]> {
    let sql = `
      SELECT a.*, u.username, u.email as user_email
      FROM artiste a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND a.statut = ?`;
      params.push(status);
    }

    if (discipline) {
      sql += ` AND a.discipline = ?`;
      params.push(discipline);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await query<Artiste>(sql, params);
    return result.rows;
  }

  // Obtenir les artistes validés (publics)
  static async findValidated(limit: number = 50, offset: number = 0): Promise<Artiste[]> {
    const sql = `
      SELECT a.*, u.username, u.email as user_email
      FROM artiste a
      JOIN users u ON a.user_id = u.id
      WHERE a.statut IN (?, ?, ?)
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await query<Artiste>(sql, [
      CandidatureStatus.VALIDEE,
      CandidatureStatus.EN_COMPETITION,
      CandidatureStatus.LAUREAT,
      limit,
      offset
    ]);
    return result.rows;
  }

  // Mettre à jour le statut d'un artiste
  static async updateStatus(id: string, status: CandidatureStatus): Promise<Artiste | null> {
    const sql = `
      UPDATE artiste 
      SET statut = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, [status, id]);
    
    // Fetch the updated artist
    const artiste = await this.findById(id);
    
    // Si le statut passe à validé, ajouter le rôle candidate
    if (status === CandidatureStatus.VALIDEE && artiste) {
      await UserModel.assignRole(Number(artiste.user_id), AppRole.CANDIDATE);
    }
    
    return artiste;
  }

  // Mettre à jour les informations d'un artiste
  static async update(id: number | string, userId: number | string, updates: Partial<CreateArtisteRequest>): Promise<Artiste> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof CreateArtisteRequest] !== undefined);
    
    if (fields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => updates[field as keyof CreateArtisteRequest]), id, userId];

    const sql = `
      UPDATE artiste 
      SET ${setClause}, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await query(sql, values);
    
    // MySQL doesn't support RETURNING, fetch the updated artist
    const artist = await this.findById(id);
    if (!artist) throw new Error('Artiste non trouvé');
    return artist;
  }

  // Mettre à jour la photo de profil
  static async updatePhoto(id: number | string, userId: number | string, photoUrl: string): Promise<Artiste> {
    const sql = `
      UPDATE artiste 
      SET photo_url = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await query(sql, [photoUrl, id, userId]);
    
    const artist = await this.findById(id);
    if (!artist) throw new Error('Artiste non trouvé');
    return artist;
  }

  // Mettre à jour la vidéo de présentation
  static async updateVideo(id: number | string, userId: number | string, videoUrl: string): Promise<Artiste> {
    const sql = `
      UPDATE artiste 
      SET video_url = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await query(sql, [videoUrl, id, userId]);
    
    const artist = await this.findById(id);
    if (!artist) throw new Error('Artiste non trouvé');
    return artist;
  }

  // Mettre à jour le score d'un artiste
  static async updateScore(id: number | string, scoreJury: number, scoreFinal: number): Promise<Artiste> {
    const sql = `
      UPDATE artiste 
      SET score_jury = ?, score_final = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, [scoreJury, scoreFinal, id]);
    
    const artist = await this.findById(id);
    if (!artist) throw new Error('Artiste non trouvé');
    return artist;
  }

  // Compter le nombre d'artistes par statut
  static async countByStatus(status?: CandidatureStatus): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM artiste';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE statut = ?';
      params.push(status);
    }

    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0].count);
  }

  // Obtenir les statistiques des artistes
  static async getStatistics(): Promise<any> {
    const sql = `
      SELECT 
        a.statut,
        COUNT(*) as count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as rap_count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as slam_count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as chant_count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as danse_count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as theatre_count,
        COUNT(CASE WHEN a.discipline = ? THEN 1 END) as autre_count,
        COALESCE(SUM(s.score_vote), 0) as score_vote
      FROM artiste a
      LEFT JOIN scores s ON a.id = s.artiste_id
      GROUP BY a.statut
    `;

    const result = await query(sql, [
      ArtisticDiscipline.RAP,
      ArtisticDiscipline.SLAM,
      ArtisticDiscipline.CHANT,
      ArtisticDiscipline.DANSE,
      ArtisticDiscipline.THEATRE,
      ArtisticDiscipline.AUTRE
    ]);

    return result.rows;
  }

  // Supprimer un artiste (avec ses dépendances)
  static async delete(id: number | string, userId: number | string): Promise<void> {
    // Supprimer les votes
    await query('DELETE FROM votes WHERE artiste_id = ?', [id]);
    
    // Supprimer les vidéos
    await query('DELETE FROM videos WHERE artiste_id = ?', [id]);
    
    // Supprimer les notes du jury
    await query('DELETE FROM notes_jury WHERE artiste_id = ?', [id]);
    
    // Supprimer les scores
    await query('DELETE FROM scores WHERE artiste_id = ?', [id]);
    
    // Supprimer l'artiste
    await query('DELETE FROM artiste WHERE id = ? AND user_id = ?', [id, userId]);
  }
}
