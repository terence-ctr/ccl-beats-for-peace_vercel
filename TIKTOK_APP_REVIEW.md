# Documentation pour l'App Review TikTok - CCL Beats for Peace

## Description de l'application

CCL Beats for Peace est une plateforme de concours musical qui permet aux artistes de participer à des défis créatifs, de soumettre leurs œuvres musicales et de recevoir des évaluations d'un jury et du public.

## Produits et Scopes TikTok utilisés

### 1. Login Kit (Authentication)
- **Scope**: `user.info.basic`
- **Utilisation**: Permet aux utilisateurs de se connecter avec leur compte TikTok
- **Fonctionnalité**: Authentification simplifiée pour les artistes participants
- **Flow**: 
  1. L'utilisateur clique sur "Se connecter avec TikTok"
  2. Redirection vers TikTok pour autorisation
  3. Retour avec les tokens d'accès
  4. Création automatique du profil artiste

### 2. Content Posting API
- **Scope**: `video.publish`
- **Utilisation**: Permet aux artistes de partager leurs participations sur TikTok
- **Fonctionnalité**: Publication automatique des vidéos de participation
- **Flow**:
  1. Après soumission d'une participation
  2. Option de partage sur TikTok
  3. Publication avec hashtags du concours

### 3. Display API
- **Scope**: `user.info.basic`, `user.info.profile`
- **Utilisation**: Affichage des profils TikTok des artistes
- **Fonctionnalité**: Intégration des profils TikTok dans la plateforme
- **Flow**:
  1. Récupération des informations du profil
  2. Affichage dans la galerie des artistes
  3. Lien vers le profil TikTok

## Flow d'intégration complet

1. **Inscription/Authentification**
   - L'utilisateur arrive sur la plateforme
   - Option de connexion avec TikTok via Login Kit
   - Autorisation des scopes nécessaires
   - Création du profil avec données TikTok

2. **Participation au concours**
   - Soumission des fichiers audio/vidéo
   - Option de partage sur TikTok (Content Posting API)
   - Publication avec hashtags #CCLBeats #BeatsForPeace

3. **Affichage et interaction**
   - Profil TikTok intégré (Display API)
   - Galerie des participants
   - Système de vote et évaluation

## URL de l'application
- **Production**: https://ccl-beats-for-peace.vercel.app
- **API**: https://ccl-beats-for-peace.vercel.app/api
- **Terms of Service**: https://ccl-beats-for-peace.vercel.app/api/legal/terms
- **Privacy Policy**: https://ccl-beats-for-peace.vercel.app/api/legal/privacy

## Points clés pour l'app review

1. **Utilisation légitime des données**: Les données utilisateur sont utilisées uniquement pour gérer la participation au concours
2. **Transparence**: Les utilisateurs savent exactement quelles données sont partagées
3. **Value proposition**: L'intégration TikTok enrichit l'expérience de participation
4. **Respect des guidelines**: Pas de collecte abusive, usage conforme aux termes TikTok

## Vidéo de démo requise

La vidéo de démonstration doit montrer:
1. La page d'accueil de la plateforme
2. Le processus de connexion avec TikTok
3. La soumission d'une participation
4. L'option de partage sur TikTok
5. L'affichage du profil TikTok intégré
6. La galerie des participants

## Configuration technique

- **Platforme**: Web application (Node.js + Express)
- **Domaine**: ccl-beats-for-peace.vercel.app
- **Callback URLs**: Configurées dans le dashboard TikTok Developer
- **Scopes demandés**: user.info.basic, user.info.profile, video.publish
