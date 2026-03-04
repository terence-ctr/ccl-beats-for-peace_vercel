import { query } from '../config/database';
import { SocialLink } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

export class SocialLinkModel {
  // Créer un lien social
  static async create(platform: string, url: string): Promise<SocialLink> {
    const sql = `
      INSERT INTO social_links (id, platform, url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query<SocialLink>(sql, [uuidv4(), platform, url]);
    return result.rows[0];
  }

  // Trouver tous les liens sociaux actifs
  static async findAllActive(): Promise<SocialLink[]> {
    try {
      const sql = `
        SELECT * FROM social_links 
        WHERE is_active = true 
        ORDER BY platform ASC
      `;

      const result = await query<SocialLink>(sql);
      return result.rows;
    } catch (error) {
      console.log('⚠️ Table social_links non trouvée, utilisation des liens par défaut');
      // Retourner des liens par défaut si la table n'existe pas
      return [
        {
          id: 1,
          platform: 'facebook',
          url: 'https://facebook.com/cclbeatsforpeace',
          is_active: true,
          updated_at: new Date()
        },
        {
          id: 2,
          platform: 'twitter',
          url: 'https://twitter.com/cclbeatsforpeace',
          is_active: true,
          updated_at: new Date()
        },
        {
          id: 3,
          platform: 'instagram',
          url: 'https://instagram.com/cclbeatsforpeace',
          is_active: true,
          updated_at: new Date()
        }
      ];
    }
  }

  // Trouver tous les liens sociaux
  static async findAll(): Promise<SocialLink[]> {
    const sql = `SELECT * FROM social_links ORDER BY platform ASC`;
    const result = await query<SocialLink>(sql);
    return result.rows;
  }

  // Trouver un lien par plateforme
  static async findByPlatform(platform: string): Promise<SocialLink | null> {
    const sql = `SELECT * FROM social_links WHERE platform = $1`;
    const result = await query<SocialLink>(sql, [platform]);
    return result.rows[0] || null;
  }

  // Trouver un lien par ID
  static async findById(id: string): Promise<SocialLink | null> {
    const sql = `SELECT * FROM social_links WHERE id = $1`;
    const result = await query<SocialLink>(sql, [id]);
    return result.rows[0] || null;
  }

  // Mettre à jour un lien social
  static async update(id: string, updates: Partial<SocialLink>): Promise<SocialLink> {
    const { url, is_active } = updates;
    
    const sql = `
      UPDATE social_links 
      SET url = COALESCE($2, url), 
          is_active = COALESCE($3, is_active),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query<SocialLink>(sql, [id, url, is_active]);
    return result.rows[0];
  }

  // Activer/désactiver un lien
  static async toggleActive(id: string): Promise<SocialLink> {
    const sql = `
      UPDATE social_links 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query<SocialLink>(sql, [id]);
    return result.rows[0];
  }

  // Supprimer un lien social
  static async delete(id: string): Promise<void> {
    await query('DELETE FROM social_links WHERE id = $1', [id]);
  }
}
