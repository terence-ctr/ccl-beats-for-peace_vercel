# ✅ Vercel Pre-Deployment Checklist

## Avant de Déployer sur Vercel

### 📋 Configuration

- [ ] **Base de Données Cloud**
  - [ ] Compte créé (PlanetScale / Railway / AWS RDS)
  - [ ] Database créée
  - [ ] Host URI copié
  - [ ] Username et Password générés
  - [ ] Whitelist IP Vercel (si nécessaire)

- [ ] **Variables d'Environnement Vercel**
  - [ ] `NODE_ENV` = `production`
  - [ ] `VERCEL` = `1`
  - [ ] `DB_HOST` = cloud database (PAS localhost!)
  - [ ] `DB_PORT` = 3306 (ou le port spécifié)
  - [ ] `DB_USER` = username
  - [ ] `DB_PASSWORD` = password
  - [ ] `DB_NAME` = database name
  - [ ] `JWT_SECRET` = clé sécurisée (min 32 caractères)
  - [ ] `FRONTEND_URL` = votre URL frontend de prod
  - [ ] `EMAIL_USER` = émetteur de mails
  - [ ] `EMAIL_PASS` = password/token de l'email

### 🔨 Build & Code

- [ ] **TypeScript**
  - [ ] `npm run typecheck` ✓ (aucune erreur)
  - [ ] `npm run build` ✓ (compile sans erreur)
  - [ ] `ls dist/` vérifie les fichiers compilés

- [ ] **Dependencies**
  - [ ] `npm install` exécuté
  - [ ] `package-lock.json` commité

- [ ] **Fichiers Vercel**
  - [ ] `vercel.json` existe et est valide
  - [ ] `api/index.ts` existe
  - [ ] `.vercelignore` existe (optionnel)
  - [ ] `tsconfig.json` include `src/**/*` et `api/**/*`

### 🧪 Vérification Locale

```bash
# Test 1: Build
npm run build
echo "✓ Build réussi"

# Test 2: Vérification Types
npm run typecheck
echo "✓ Types vérifiés"

# Test 3: Fichiers de sortie
ls -la dist/
ls -la dist/api/
echo "✓ Fichiers présents"

# Test 4: En mode production local
NODE_ENV=production npm run dev
# Tester http://localhost:3001/api/health
```

### 📤 Avant Git Push

- [ ] Dernière version clonée localement
- [ ] Tous les fichiers commitables ajoutés
- [ ] `.env.local` NON commité (ajouter à `.gitignore` si manquant)
- [ ] `node_modules/` dans `.gitignore`
- [ ] `dist/` dans `.gitignore`

### 🚀 Déploiement

```bash
# 1. Commit tout
git add -A
git commit -m "Configure for Vercel deployment"

# 2. Push
git push origin main

# 3. Vercel redéploie auto (si connecté à GitHub)
# OU manuel: vercel --prod
```

### ✨ Post-Déploiement

- [ ] Vérifier les logs Vercel: `vercel logs --follow`
- [ ] Tester l'endpoint santé:
  ```bash
  curl https://your-domain.com/api/health
  ```
- [ ] Vérifier la réponse JSON:
  ```json
  {
    "success": true,
    "message": "Serveur CCL Beats Backend opérationnel",
    ...
  }
  ```
- [ ] Tester au moins un endpoint API (login, get events, etc.)

---

## 🆘 En Cas de Problème

1. **Lire les logs** → `vercel logs --follow`
2. **Consulter** → [VERCEL_TROUBLESHOOTING.md](VERCEL_TROUBLESHOOTING.md)
3. **Vérifier** → Variables d'environnement Vercel Dashboard
4. **Redéployer** → Force redeploy si nécessaire

---

## 💡 Reminders

- ⚠️ **Pas de localhost** pour `DB_HOST` sur Vercel!
- 🔐 **JWT_SECRET** doit être aléatoire et sécurisé
- 📧 **Email passwords** utiliser app-specific passwords (Gmail, etc.)
- 🔗 **FRONTEND_URL** doit être votre URL de production
- ⏱️ **Max duration** est de 30s par défaut (peut être augmenté)

---

## ✅ Succès!

Si tout fonctionne, vous devriez voir:
- ✅ Deploy status: "Ready"
- ✅ 200 response de `/api/health`
- ✅ Autres endpoints répondent correctement

🎉 Votre backend est maintenant en production sur Vercel!

---

**Créé le**: 4 Mars 2026
**Project**: CCL Beats Backend
**Environment**: Production (Vercel)
