import { Router } from 'express';
import path from 'path';

const router = Router();

// Terms of Service
router.get('/terms', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conditions d'utilisation - CCL Beats for Peace</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .date { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Conditions d'utilisation - CCL Beats for Peace</h1>
    <p class="date">Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}</p>
    
    <h2>1. Acceptation des conditions</h2>
    <p>En utilisant la plateforme CCL Beats for Peace, vous acceptez ces conditions d'utilisation.</p>
    
    <h2>2. Description du service</h2>
    <p>CCL Beats for Peace est une plateforme de concours musical permettant aux artistes de participer à des défis créatifs, de soumettre leurs œuvres musicales et de recevoir des évaluations d'un jury et du public.</p>
    
    <h2>3. Responsabilités des utilisateurs</h2>
    <p>Les utilisateurs s'engagent à:</p>
    <ul>
        <li>Fournir des informations exactes et véridiques</li>
        <li>Respecter les droits d'auteur et propriété intellectuelle</li>
        <li>Ne pas publier de contenu offensant, illégal ou inapproprié</li>
        <li>Respecter les autres participants et membres du jury</li>
    </ul>
    
    <h2>4. Propriété intellectuelle</h2>
    <p>Les artistes conservent les droits sur leurs œuvres. En participant au concours, ils accordent à CCL Beats for Peace le droit d'utiliser leurs créations pour promouvoir l'événement.</p>
    
    <h2>5. Confidentialité</h2>
    <p>Nous collectons et utilisons vos données conformément à notre politique de confidentialité.</p>
    
    <h2>6. Limitation de responsabilité</h2>
    <p>CCL Beats for Peace n'est pas responsable des contenus publiés par les utilisateurs.</p>
    
    <h2>7. Contact</h2>
    <p>Pour toute question concernant ces conditions: contact@cclbeats.com</p>
</body>
</html>
  `);
});

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de confidentialité - CCL Beats for Peace</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .date { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Politique de confidentialité - CCL Beats for Peace</h1>
    <p class="date">Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}</p>
    
    <h2>1. Données collectées</h2>
    <p>Nous collectons les informations suivantes:</p>
    <ul>
        <li>Informations d'inscription (nom, email, pseudonyme)</li>
        <li>Données de profil (photo, biographie)</li>
        <li>Contenus créés (musiques, vidéos)</li>
        <li>Données de connexion et d'utilisation</li>
        <li>Informations des réseaux sociaux (avec consentement)</li>
    </ul>
    
    <h2>2. Utilisation des données</h2>
    <p>Vos données sont utilisées pour:</p>
    <ul>
        <li>Gérer votre participation au concours</li>
        <li>Améliorer nos services</li>
        <li>Communiquer avec vous</li>
        <li>Assurer la sécurité de la plateforme</li>
    </ul>
    
    <h2>3. Partage des données</h2>
    <p>Nous ne partageons vos données qu'avec:</p>
    <ul>
        <li>Les membres du jury (pour évaluation)</li>
        <li>Les prestataires techniques nécessaires</li>
        <li>Les autorités légales (si requis)</li>
    </ul>
    
    <h2>4. Cookies</h2>
    <p>Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site.</p>
    
    <h2>5. Vos droits</h2>
    <p>Vous avez le droit d'accéder, modifier ou supprimer vos données personnelles.</p>
    
    <h2>6. Contact</h2>
    <p>Pour toute question concernant vos données: privacy@cclbeats.com</p>
</body>
</html>
  `);
});

export default router;
