import { Router } from 'express';

const router = Router();

// Endpoint de debug pour vérifier la configuration OAuth
router.get('/oauth/debug', (req, res) => {
  const config = {
    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID ? '✅ Configuré' : '❌ Manquant',
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? '✅ Configuré' : '❌ Manquant',
    FRONTEND_URL: process.env.FRONTEND_URL || '❌ Manquant',
    VERCEL: process.env.VERCEL || '❌ Non défini',
    NODE_ENV: process.env.NODE_ENV || '❌ Non défini'
  };

  // URL d'autorisation générée
  const clientId = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = process.env.VERCEL === '1' 
    ? 'https://ccl-beats-for-peace.vercel.app/tiktok/callback'
    : `${process.env.FRONTEND_URL}/tiktok/callback`;
  const scopes = 'user.info.basic,user.info.profile,video.publish';
  
  const authUrl = clientId ? `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=test` : 'URL non générable (CLIENT_ID manquant)';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debug OAuth TikTok</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .config { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .url { background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px; word-break: break-all; }
        .test-btn { background: #1da1f2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>🔍 Debug Configuration OAuth TikTok</h1>
      
      <div class="config">
        <h3>Variables d'environnement:</h3>
        <ul>
          ${Object.entries(config).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
        </ul>
      </div>

      <div class="url">
        <h3>Redirect URI utilisée:</h3>
        <code>${redirectUri}</code>
      </div>

      <div class="url">
        <h3>URL d'autorisation générée:</h3>
        <code>${authUrl}</code>
        ${clientId ? `<br><br><button class="test-btn" onclick="window.open('${authUrl}', '_blank')">🚀 Tester l'authentification</button>` : ''}
      </div>

      <div class="config">
        <h3>Instructions:</h3>
        <ol>
          <li>Vérifiez que toutes les variables sont ✅</li>
          <li>Assurez-vous que la Redirect URI dans TikTok Developer correspond exactement à: <code>${redirectUri}</code></li>
          <li>Cliquez sur "Tester l'authentification" pour vérifier le flow</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

export default router;
