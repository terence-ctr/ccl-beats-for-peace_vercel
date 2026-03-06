import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/database';
import { query } from '../config/database';

export class TiktokController {
  // Publier une vidéo d'un candidat validé sur TikTok
  static async publishVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
        return;
      }

      // Vérifier si l'utilisateur est un membre du jury
      const userRoles = await query(`
        SELECT role FROM user_roles WHERE user_id = ?
      `, [req.user.id]);

      const isJury = userRoles.rows.some((row: any) => row.role === 'jury');

      if (!isJury) {
        res.status(403).json({
          success: false,
          message: 'Seuls les membres du jury peuvent publier sur TikTok'
        });
        return;
      }

      const { artisteId, videoUrl, caption, hashtags } = req.body;

      // Validation des entrées
      if (!artisteId || !videoUrl) {
        res.status(400).json({
          success: false,
          message: 'ID artiste et URL vidéo requis'
        });
        return;
      }

      // Vérifier si l'artiste est validé
      const artiste = await query(`
        SELECT * FROM artiste 
        WHERE id = ? AND statut = 'validee'
      `, [artisteId]);

      if (!artiste.rows.length) {
        res.status(404).json({
          success: false,
          message: 'Artiste non trouvé ou non validé'
        });
        return;
      }

      // Hashtag officiel du concours
      const officialHashtag = '#CCLBeatsForPeace';
      
      // Ajouter le hashtag officiel s'il n'est pas déjà présent
      const allHashtags = hashtags ? 
        (hashtags.includes(officialHashtag) ? hashtags : `${hashtags} ${officialHashtag}`) : 
        officialHashtag;

      // Préparer le caption avec hashtags
      const fullCaption = caption ? `${caption}\n\n${allHashtags}` : allHashtags;

      // Simuler la publication TikTok (à remplacer avec l'API TikTok réelle)
      const publicationData = {
        artiste_id: artisteId,
        video_url: videoUrl,
        caption: fullCaption,
        hashtags: allHashtags,
        status: 'published',
        published_at: new Date(),
        platform: 'tiktok'
      };

      // Enregistrer la publication dans la base de données
      const insertQuery = `
        INSERT INTO tiktok_publications (
          artiste_id, video_url, caption, hashtags, status, published_at, platform
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertQuery, [
        publicationData.artiste_id,
        publicationData.video_url,
        publicationData.caption,
        publicationData.hashtags,
        publicationData.status,
        publicationData.published_at,
        publicationData.platform
      ]);

      console.log('🎵 Publication TikTok créée:', {
        artisteId,
        caption: fullCaption,
        hashtags: allHashtags
      });

      res.status(201).json({
        success: true,
        message: 'Vidéo publiée sur TikTok avec succès',
        data: {
          publication: publicationData,
          officialHashtag,
          caption: fullCaption
        }
      });

    } catch (error: any) {
      console.error('Erreur publication TikTok:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la publication TikTok',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Récupérer les publications TikTok d'un artiste
  static async getArtistPublications(req: Request, res: Response): Promise<void> {
    try {
      const { artisteId } = req.params;

      if (!artisteId) {
        res.status(400).json({
          success: false,
          message: 'ID artiste requis'
        });
        return;
      }

      const publications = await query(`
        SELECT * FROM tiktok_publications 
        WHERE artiste_id = ?
        ORDER BY published_at DESC
      `, [artisteId]);

      res.status(200).json({
        success: true,
        data: publications.rows
      });

    } catch (error: any) {
      console.error('Erreur récupération publications TikTok:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des publications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour les statistiques d'une publication
  static async updatePublicationStats(req: Request, res: Response): Promise<void> {
    try {
      const { publicationId } = req.params;
      const { views, likes, shares, comments } = req.body;

      const updateQuery = `
        UPDATE tiktok_publications 
        SET views = ?, likes = ?, shares = ?, comments = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await query(updateQuery, [views, likes, shares, comments, publicationId]);

      res.status(200).json({
        success: true,
        message: 'Statistiques de publication mises à jour'
      });

    } catch (error: any) {
      console.error('Erreur mise à jour stats TikTok:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
