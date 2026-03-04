import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Page d'accueil - servir public/index.html
router.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, '../../public/index.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Fallback: page d'accueil simple
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCL Beats for Peace</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: white; }
          .container { max-width: 600px; margin: 0 auto; }
          .btn { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 25px; text-decoration: none; display: inline-block; margin: 10px; }
          .btn:hover { background: #ee5a24; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎵 CCL Beats for Peace</h1>
          <p>Application backend pour TikTok OAuth</p>
          <div>
            <a href="/api/health" class="btn">API Health</a>
            <a href="/test/test-tiktok-auth" class="btn">Test TikTok</a>
            <a href="/debug/oauth/debug" class="btn">Debug</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Page de callback TikTok simple
router.get('/tiktok/callback', (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  if (error || !code) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur TikTok - CCL Beats for Peace</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; }
          .info { color: #666; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1 class="error">Erreur d'authentification TikTok</h1>
        <p>Erreur: ${error || 'Code manquant'}</p>
        ${error_description ? `<p>Description: ${error_description}</p>` : ''}
        <div class="info">
          <p>Paramètres reçus:</p>
          <p>Code: ${code || 'undefined'}</p>
          <p>State: ${state || 'undefined'}</p>
          <p>Erreur: ${error || 'undefined'}</p>
        </div>
        <p><a href="/">Retour à l'accueil</a></p>
      </body>
      </html>
    `);
    return;
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentification TikTok - CCL Beats for Peace</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .success { color: green; }
        .info { background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
      <script>
        // Envoyer les données au parent si dans une popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'tiktok_auth_success',
            code: '${code}',
            state: '${state}'
          }, '*');
          window.close();
        }
      </script>
    </head>
    <body>
      <h1 class="success">Authentification TikTok réussie!</h1>
      <div class="info">
        <p>Vous pouvez maintenant fermer cette fenêtre et retourner à l'application.</p>
        <p><strong>Code:</strong> ${code}</p>
        <p><strong>State:</strong> ${state}</p>
      </div>
      <p><a href="/">Retour à l'accueil</a></p>
    </body>
    </html>
  `);
});

export default router;
