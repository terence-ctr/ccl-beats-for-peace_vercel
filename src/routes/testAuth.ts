import { Router } from 'express';

const router = Router();

// Endpoint de test direct pour TikTok OAuth
router.get('/test-tiktok-auth', (req, res) => {
  const clientId = 'awth1iqf71f5qtrj'; // Nouveau client ID
  const redirectUri = 'https://ccl-beats-for-peace.vercel.app/tiktok/callback';
  const scopes = 'user.info.basic,user.info.profile,video.publish';
  const state = 'test-state-' + Date.now();

  // URL correcte pour TikTok Login Kit
  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${state}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test TikTok Auth</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .test-btn { background: #1da1f2; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px; }
        .url { background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 5px; word-break: break-all; font-family: monospace; }
        .warning { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ffeaa7; }
      </style>
    </head>
    <body>
      <h1>🧪 Test Authentification TikTok</h1>
      
      <div class="warning">
        <p><strong>Client Key:</strong> ${clientId}</p> Utilise les credentials codés en dur pour diagnostiquer le problème
      </div>

      <div class="url">
        <h3>Redirect URI configurée:</h3>
        <code>${redirectUri}</code>
      </div>

      <div class="url">
        <h3>URL d'autorisation générée:</h3>
        <code>${tiktokAuthUrl}</code>
      </div>

      <button class="test-btn" onclick="window.open('${tiktokAuthUrl}', '_blank')">
        🚀 Lancer l'authentification TikTok
      </button>

      <button class="test-btn" onclick="window.location.href='${tiktokAuthUrl}'">
        🔄 Rediriger vers TikTok
      </button>

      <div class="url">
        <h3>📋 À vérifier dans TikTok Developer:</h3>
        <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
          <li>Redirect URI exact: <code>${redirectUri}</code></li>
          <li>Client Key: <code>${clientId}</code></li>
          <li>Scopes: <code>${scopes}</code></li>
          <li>Status de l'app: Actif et en production</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

export default router;
