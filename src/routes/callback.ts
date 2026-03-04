import { Router } from 'express';

const router = Router();

// Page de callback TikTok simple
router.get('/tiktok/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  if (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur TikTok - CCL Beats for Peace</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1 class="error">Erreur d'authentification TikTok</h1>
        <p>Erreur: ${error}</p>
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
      </style>
    </head>
    <body>
      <h1 class="success">Authentification TikTok réussie!</h1>
      <p>Vous pouvez maintenant fermer cette fenêtre et retourner à l'application.</p>
      <p>Code: ${code}</p>
      <p>State: ${state}</p>
      <p><a href="/">Retour à l'accueil</a></p>
    </body>
    </html>
  `);
});

export default router;
