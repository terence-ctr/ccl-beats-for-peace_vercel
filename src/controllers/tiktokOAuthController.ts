import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/database';
import { query } from '../config/database';

export class TiktokOAuthController {
  // 1. Rediriger vers TikTok pour autorisation
  static async authorize(req: Request, res: Response): Promise<void> {
    const { artisteId } = req.query;
    
    if (!artisteId) {
      res.status(400).json({
        success: false,
        message: 'ID artiste requis'
      });
      return;
    }

    // Paramètres OAuth TikTok
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/tiktok/callback`;
    const state = Buffer.from(JSON.stringify({ artisteId })).toString('base64');
    const scopes = 'video.publish,user.info.basic';

    const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    res.redirect(tiktokAuthUrl);
  }

  // 2. Callback TikTok après autorisation
  static async callback(req: Request, res: Response): Promise<void> {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
      return;
    }

    try {
      // Décoder le state pour récupérer artisteId
      const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const { artisteId } = decodedState;

      // Échanger le code contre un access token
      const tokenParams = new URLSearchParams({
        client_id: process.env.TIKTOK_CLIENT_ID || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/tiktok/callback`,
      });

      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString()
      });

      const tokenData = await tokenResponse.json() as any;

      // Sauvegarder le token TikTok pour l'artiste
      await query(`
        INSERT INTO tiktok_tokens (artiste_id, access_token, refresh_token, expires_at, created_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        expires_at = VALUES(expires_at)
      `, [artisteId, tokenData.access_token, tokenData.refresh_token, new Date(Date.now() + tokenData.expires_in * 1000)]);

      // Rediriger vers le frontend avec succès
      res.redirect(`${process.env.FRONTEND_URL}/tiktok/success?artisteId=${artisteId}`);

    } catch (error: any) {
      console.error('Erreur callback TikTok:', error);
      res.redirect(`${process.env.FRONTEND_URL}/tiktok/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // 3. Publier directement sur TikTok avec l'API Content Posting
  static async publishDirect(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }

    const { artisteId, videoUrl, caption, hashtags } = req.body;

    if (!artisteId || !videoUrl) {
      res.status(400).json({
        success: false,
        message: 'ID artiste et URL vidéo requis'
      });
      return;
    }

    try {
      // Récupérer le token TikTok de l'utilisateur connecté (jury)
      const tokenResult = await query(`
        SELECT access_token FROM tiktok_tokens 
        WHERE user_id = ? AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `, [req.user.id]);

      if (!tokenResult.rows.length) {
        res.status(401).json({
          success: false,
          message: 'Token TikTok expiré ou non trouvé. Veuillez vous réauthentifier.'
        });
        return;
      }

      const accessToken = tokenResult.rows[0].access_token;

      // Préparer les données pour l'API TikTok
      const videoFileUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `${process.env.BACKEND_URL || 'http://localhost:3001'}${videoUrl}`;

      const fullCaption = caption ? `${caption}\n\n${hashtags}` : hashtags;

      // Appeler l'API TikTok Content Posting
      const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoFileUrl,
          caption: fullCaption,
          privacy_level: 'public' // ou 'private' selon vos besoins
        })
      });

      const publishData = await publishResponse.json() as any;

      if (publishData.error) {
        throw new Error(publishData.error.message);
      }

      // Enregistrer la publication dans notre base
      await query(`
        INSERT INTO tiktok_publications (
          artiste_id, video_url, caption, hashtags, status, 
          tiktok_video_id, published_at, platform
        ) VALUES (?, ?, ?, ?, 'published', ?, NOW(), 'tiktok')
      `, [
        artisteId, videoUrl, fullCaption, hashtags,
        publishData.data?.video_id || null
      ]);

      res.status(200).json({
        success: true,
        message: 'Vidéo publiée avec succès sur TikTok',
        data: {
          publish_id: publishData.data?.publish_id,
          video_id: publishData.data?.video_id,
          status: publishData.status
        }
      });

    } catch (error: any) {
      console.error('Erreur publication TikTok:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la publication TikTok'
      });
    }
  }

  // 4. Vérifier le statut d'une publication
  static async checkPublishStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { publishId } = req.params;

    try {
      const tokenResult = await query(`
        SELECT access_token FROM tiktok_tokens 
        WHERE user_id = ? AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `, [req.user.id]);

      if (!tokenResult.rows.length) {
        res.status(401).json({
          success: false,
          message: 'Token TikTok expiré'
        });
        return;
      }

      const accessToken = tokenResult.rows[0].access_token;

      const statusResponse = await fetch(`https://open.tiktokapis.com/v2/post/publish/status/${publishId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      const statusData = await statusResponse.json() as any;

      res.status(200).json({
        success: true,
        data: statusData
      });

    } catch (error: any) {
      console.error('Erreur vérification statut TikTok:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la vérification du statut'
      });
    }
  }
}
