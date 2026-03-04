# 🔧 Guide de Dépannage - Vercel 500 Error

## ❌ Erreur : FUNCTION_INVOCATION_FAILED

Vous recevez une erreur `500: INTERNAL_SERVER_ERROR` avec le code `FUNCTION_INVOCATION_FAILED`. Voici comment la résoudre.

---

## 🔍 Diagnostics : Vérifier les Logs Vercel

### 1. **Via le Dashboard Vercel**
```
https://vercel.com/dashboard → Your Project → Deployments → Logs
```

### 2. **Via la CLI**
```bash
# Installer la CLI
npm install -g vercel

# Se connecter
vercel login

# Voir les logs en temps réel
vercel logs --follow

# Voir les logs d'une fonction spécifique
vercel logs api
```

### 3. **Vérifier le Status du Build**
```
Dashboard → Deployments → Click on a deployment → Build Logs
```

---

## ✅ Checklist à Vérifier

### 1️⃣ **Variables d'Environnement**
```
✓ VERCEL=1
✓ NODE_ENV=production
✓ DB_HOST=<your-cloud-database>  (PAS localhost!)
✓ DB_USER, DB_PASSWORD, DB_NAME configurés
✓ JWT_SECRET défini
```

**⚠️ PROBLÈME COURANT**: `DB_HOST=localhost` ne fonctionne pas sur Vercel!
→ Utilisez une base de données cloud (PlanetScale, Railway, AWS RDS)

### 2️⃣ **Build TypeScript**
Vérifier que le build compile sans erreurs :
```bash
npm run build
npm run typecheck
```

### 3️⃣ **Fichiers Requis**
```
✓ api/index.ts          exists
✓ src/server.ts         exists
✓ vercel.json          exists
✓ tsconfig.json        updated
```

### 4️⃣ **Package.json**
```bash
✓ "build": "tsc" script exist
✓ Dépendances installées : npm install
```

---

## 🛠️ Solutions Selon l'Erreur

### **Erreur 1: Module not found**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
npm install
git add package-lock.json
git commit -m "Add dependencies"
git push
```

---

### **Erreur 2: Port already in use (local dev)**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution :**
```bash
# Changer le port
PORT=3002 npm run dev

# Ou tuer le processus
lsof -ti:3001 | xargs kill -9  # macOS/Linux
```

---

### **Erreur 3: Database connection failed**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**

1. **Migrer vers une DB Cloud**
   - [PlanetScale](https://planetscale.com) (MySQL gratuit)
   - [Railway.app](https://railway.app) (PostgreSQL/MySQL)
   - [AWS RDS](https://aws.amazon.com/rds) (MySQL payant)

2. **Mettre à jour .env**
   ```
   DB_HOST=your-cloud-db.mysql.com
   DB_PORT=3306
   DB_NAME=production_db
   DB_USER=db_user
   DB_PASSWORD=db_password
   ```

3. **Redéployer**
   ```bash
   git push  # Auto-redeploy se fera
   ```

---

### **Erreur 4: TypeScript compilation error**
```
error TS1005: ';' expected
```

**Solution:**
```bash
# Vérifier les erreurs locales
npm run typecheck

# Corriger src/ ou api/
# Puis redéployer
git push
```

---

### **Erreur 5: Module path issues**
```
Error: Cannot find module '../src/server'
```

**Solution:**
L'import dans `api/index.ts` doit être correct après compilation. Vérifier:
```typescript
// api/index.ts
import app from '../src/server';  // ✓ Correct

// Après compilation, cela devient:
// dist/api/index.ts  →  ../src/server (relativement)
```

---

## 🚀 Recompiler et Redéployer

### Option A: Redéploiement Automatique (Recommandé)
```bash
# Faire une modification
echo "# Updated" >> README.md

# Push to GitHub
git add -A
git commit -m "Fix Vercel deployment"
git push origin main

# Vercel redéploie automatiquement
```

### Option B: Redéploiement Manual
```bash
# Via CLI
vercel --prod --force

# Via Dashboard
https://vercel.com/dashboard → Deployments → Redeploy
```

---

## 📝 Exemple de Configuration Correcte

### `.env` pour Vercel
```
NODE_ENV=production
VERCEL=1
PORT=3001

DB_HOST=your-db.mysql.com
DB_PORT=3306
DB_NAME=app_production
DB_USER=app_user
DB_PASSWORD=super_secure_password_123

JWT_SECRET=your-random-256-bit-secret-here-min-32-chars

FRONTEND_URL=https://app.example.com
EMAIL_USER=backend@example.com
EMAIL_PASS=app-specific-password
```

### `package.json` Script
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 🧪 Tests Locaux Avant Déploiement

```bash
# 1. Build
npm run build

# 2. Test du build
npm run typecheck

# 3. Vérifier les fichiers compilés
ls -la dist/
ls -la dist/api/

# 4. Run locally (simulation)
NODE_ENV=production VERCEL=1 DB_HOST=localhost npm start

# 5. Test health endpoint
curl http://localhost:3001/api/health
```

---

## 🔗 Ressources Utiles

- [Vercel Docs](https://vercel.com/docs)
- [Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [Vercel CLI](https://vercel.com/cli)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)

---

## 💬 Si le problème persiste

1. **Vérifier les logs Vercel**
   ```bash
   vercel logs --tail
   ```

2. **Voir l'erreur exacte**
   → Cliquer sur le log line pour plus de détails

3. **Rollback si nécessaire**
   ```
   Dashboard → Deployments → Promotions → Rollback
   ```

4. **Demander du support**
   - Vercel Support: https://vercel.com/support
   - GitHub Issues avec le code d'erreur: `ID: cpt1::...`

---

✅ **Après correction, testez:**
```bash
curl https://your-domain.com/api/health
```

Vous devriez voir:
```json
{
  "success": true,
  "message": "Serveur CCL Beats Backend opérationnel",
  "timestamp": "2026-03-04T...",
  "version": "1.0.0"
}
```

Bonne chance! 🚀
