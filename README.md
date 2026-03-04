# CCL Beats for Peace - Backend API

Backend Express.js TypeScript pour la plateforme CCL Beats for Peace, alternative à Supabase.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Créer la base de données PostgreSQL
createdb ccl_beats

# Exécuter les migrations
npm run migrate

# Insérer les données initiales
npm run seed

# Démarrer le serveur de développement
npm run dev
```

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts     # Configuration PostgreSQL
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── artisteController.ts
│   │   └── ...
│   ├── middleware/
│   │   └── auth.ts          # JWT et rôles
│   ├── models/
│   │   ├── User.ts
│   │   ├── Artiste.ts
│   │   ├── Event.ts
│   │   └── Vote.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── artists.ts
│   │   └── ...
│   ├── types/
│   │   └── database.ts      # Types TypeScript
│   └── server.ts             # Point d'entrée
├── database/
│   └── schema.sql          # Schéma PostgreSQL
├── .env.example              # Variables d'environnement
└── package.json
```

## 🔧 Configuration

### Variables d'environnement

Copier `.env.example` vers `.env` et configurer:

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ccl_beats
DB_USER=ccl_app
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_tres_long_32_caracteres_min
JWT_EXPIRES_IN=7d

# Serveur
PORT=3001
NODE_ENV=development

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
```

### Base de données

Le schéma complet est dans `database/schema.sql`. Pour l'appliquer:

```bash
# Avec psql
psql -d ccl_beats -f database/schema.sql

# Ou avec le script
npm run migrate
```

## 📚 Documentation API

### Authentification

#### POST /api/auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "username": "username"
}
```

#### POST /api/auth/login
Connexion d'un utilisateur.

**Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "Password123"
}
```

#### GET /api/auth/profile
Profil utilisateur (token requis).

**Headers:**
```
Authorization: Bearer <token>
```

### Artistes

#### GET /api/artists
Liste des artistes avec filtres.

**Query params:**
- `page`: numéro de page (défaut: 1)
- `limit`: nombre par page (max: 100)
- `status`: filtre par statut
- `discipline`: filtre par discipline

#### POST /api/artists
Création d'une candidature d'artiste (token + rôle candidate requis).

**Body:**
```json
{
  "nom_complet": "Nom Complet",
  "nom_artiste": "Artist Name",
  "date_naissance": "1990-01-01",
  "sexe": "masculin",
  "discipline": "rap",
  "adresse": "Adresse complète",
  "telephone": "+243123456789",
  "email": "artist@example.com"
}
```

### Votes

#### POST /api/votes
Voter pour un artiste (token requis).

**Body:**
```json
{
  "artiste_id": "uuid",
  "phase_id": "uuid"
}
```

#### GET /api/votes/ranking/:phaseId
Classement des artistes pour une phase.

## 🔐 Sécurité

- **JWT**: Tokens d'authentification avec expiration
- **Rôles**: visitor, candidate, jury, organizer, super_admin
- **Rate Limiting**: 100 requêtes/15 minutes par IP
- **CORS**: Configuration pour le frontend
- **Helmet**: Headers de sécurité
- **Validation**: Entrées validées avec express-validator

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

## 🚀 Déploiement

### Production

```bash
# Compiler TypeScript
npm run build

# Démarrer en production
npm start
```

### Docker (optionnel)

```bash
# Construire l'image
docker build -t ccl-backend .

# Démarrer le conteneur
docker run -p 3001:3001 --env-file .env ccl-backend
```

## 📊 Monitoring

- **Logs**: Morgan (development/production)
- **Health Check**: GET /api/health
- **Error Handling**: Centralisé avec messages détaillés

## 🔄 Développement

```bash
# Mode développement avec rechargement automatique
npm run dev

# Vérification des types TypeScript
npm run typecheck

# Linter
npm run lint
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche `feature/nom-feature`
3. Commit les changements
4. Push vers la branche
5. Créer une Pull Request

## 📄 Licence

MIT License - voir fichier LICENSE
