# Guide de Déploiement Vercel - CCL Beats Backend

## 🚀 Configuration Vercel

Votre backend est maintenant configuré pour Vercel !

### Fichiers créés :
- ✅ `vercel.json` - Configuration de déploiement Vercel
- ✅ `api/index.ts` - Point d'entrée serverless
- ✅ `README.md` - Ce guide

## 📋 Prérequis

1. **Vercel CLI** installé :
   ```bash
   npm install -g vercel
   ```

2. **Git** configuré et branch principale

3. **Variables d'environnement** configurées

## 🔧 Installation et Déploiement

### Option 1 : Via GitHub (Recommandé)

1. Poussez votre code sur GitHub
2. Allez sur [vercel.com](https://vercel.com)
3. Cliquez "New Project"
4. Sélectionnez votre repo
5. Configurez les variables d'environnement
6. Déployez

### Option 2 : Via CLI Vercel

```bash
# Connexion à Vercel
vercel login

# Déployement
vercel --prod
```

## 🔐 Variables d'Environnement à Configurer

**Essentielles :**
```
NODE_ENV=production
VERCEL=1
JWT_SECRET=<your-secure-key>
DB_HOST=<your-database-host>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_NAME=<your-database-name>
FRONTEND_URL=https://your-frontend.com
```

**Email (Nodemailer) :**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cclbeats.com
```

**TikTok OAuth (si applicable) :**
```
TIKTOK_CLIENT_ID=<your-client-id>
TIKTOK_CLIENT_SECRET=<your-secret>
TIKTOK_REDIRECT_URI=https://your-domain.com/api/tiktok/oauth/callback
```

## 📘 Structure du Projet

```
backend/
├── api/
│   └── index.ts              <- Point d'entrée Vercel
├── src/
│   ├── server.ts             <- App Express principale
│   ├── config/               <- Configuration DB
│   ├── controllers/          <- Logique métier
│   ├── routes/               <- Définition des routes
│   ├── middleware/           <- Middleware personnalisé
│   └── ...
├── dist/                     <- Sortie TypeScript compilée
├── vercel.json               <- Configuration Vercel
├── tsconfig.json             <- Configuration TypeScript
└── package.json              <- Dépendances npm
```

## ✨ Points de Configuration

### 1. **Port Automatique**
Le serveur utilise automatiquement le port fourni par Vercel (variable `PORT`).

### 2. **Mode Serverless**
La variable `VERCEL=1` est détectée pour désactiver `app.listen()`.

### 3. **Base de Données**
⚠️ **Important** : Assurez-vous que votre base de données est accessible depuis Vercel :
- Si MySQL local, utilisez une base **cloud** (PlanetScale, Railway, etc.)
- Configurez les whitelist IPs ou utilisez VPN privé

### 4. **Endpoints**
Les endpoints sont accessibles via :
- Production : `https://your-domain.com/api/...`
- Exemple : `https://your-domain.com/api/health`

## 🔍 Endpoints Utiles

```
GET  /api/health              <- Vérifier le statut
POST /api/auth/login          <- Authentification
GET  /api/events              <- Liste des événements
POST /api/votes               <- Soumettre un vote
...
```

## 🆘 Débogage

### Logs Vercel
```bash
vercel logs
```

### Build local
```bash
npm run build
```

### Tests locaux
```bash
npm run dev
```

## 🛠️ Maintenance

### Mettre à jour
```bash
# Modificatinos locales
git push

# Vercel redéploie automatiquement (si CI/CD GitHub activé)
```

### Rollback
```bash
# Via Vercel Dashboard: Settings → Deployments → Promote
```

## 📚 Exemple de Configuration Complète (.env)

```
NODE_ENV=production
VERCEL=1
PORT=3001

DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_USER=ccl_user
DB_PASSWORD=secure-password
DB_NAME=ccl_beats_db
DB_POOL_LIMIT=10

FRONTEND_URL=https://app.cclbeats.com

JWT_SECRET=super-secret-jwt-key-min-32-characters-long

EMAIL_USER=backend@cclbeats.com
EMAIL_PASSWORD=app-specific-password
EMAIL_FROM=noreply@cclbeats.com

TIKTOK_CLIENT_ID=xxx
TIKTOK_CLIENT_SECRET=xxx
TIKTOK_REDIRECT_URI=https://api.cclbeats.com/api/tiktok/oauth/callback

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200

LOG_LEVEL=info
ALLOWED_ORIGINS=https://app.cclbeats.com,https://www.cclbeats.com
```

## 🎯 Checklist avant Production

- [ ] Variables d'environnement configurées
- [ ] Base de données accessible (`DB_HOST` accessible de Vercel)
- [ ] JWT_SECRET généré aléatoirement
- [ ] CORS correctement configuré (`FRONTEND_URL`)
- [ ] Email Service testé
- [ ] Tests passants (`npm test`)
- [ ] Build TypeScript sans erreurs (`npm run build`)
- [ ] Endpoints critiques testés

## 📞 Support

Pour plus d'aide :
- [Vercel Docs](https://vercel.com/docs)
- [Express Guides](https://expressjs.com/)
- Consulter les logs : `vercel logs --follow`

---

✅ **Configuration complète for Vercel!**
