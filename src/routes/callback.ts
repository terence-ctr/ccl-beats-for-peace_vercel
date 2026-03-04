import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Page d'accueil - servir tiktok-publish.html
router.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, '../../tiktok-publish.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCL Beats for Peace</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #ff6b6b; }
        </style>
      </head>
      <body>
        <h1 class="error">Page d'accueil non trouvée</h1>
        <p>Le fichier tiktok-publish.html n'existe pas.</p>
        <p><a href="/api/health">API Health</a></p>
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
