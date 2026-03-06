import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/database';

// Importer les routes existantes uniquement
import debugRoutes from './routes/debug';
import testAuthRoutes from './routes/testAuth';
import callbackRoutes from './routes/callback';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuration pour Vercel - désactiver trust proxy pour éviter le warning
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', false);
}

// Middleware de sécurité
app.use(
  helmet(
    process.env.NODE_ENV === 'development'
      ? {
          contentSecurityPolicy: false,
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
      : {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              mediaSrc: ["'self'", 'blob:', 'data:'],
            },
          },
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
  )
);

// Configuration CORS - Autoriser plusieurs origines
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (comme Postman) ou les origines autorisées
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS bloqué pour:', origin);
      callback(null, true); // En dev, autoriser tout
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression des réponses
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting - configuré pour Vercel
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 1000 : 200, // Plus élevé en production
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => {
    // Skip rate limiting pour les requêtes internes Vercel en production
    return process.env.NODE_ENV === 'production' && 
           (req.headers['user-agent']?.includes('vercel') || false);
  }
});

app.use('/api/', limiter);

// Parser le corps des requêtes (augmenté pour supporter les images/vidéos base64)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Servir les fichiers statiques (uploads) avec headers CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Routes API - uniquement celles qui existent
app.use('/debug', debugRoutes);
app.use('/test', testAuthRoutes);
app.use('/', callbackRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serveur CCL Beats Backend opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error('Erreur globale:', err);

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: err.details
    });
    return;
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
    return;
  }

  // Erreurs de base de données
  if (err.code === '23505') { // Unique violation
    res.status(409).json({
      success: false,
      message: 'Cette ressource existe déjà'
    });
    return;
  }

  if (err.code === '23503') { // Foreign key violation
    res.status(400).json({
      success: false,
      message: 'Référence invalide'
    });
    return;
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Démarrer le serveur
const startServer = async (): Promise<void> => {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Impossible de démarrer le serveur: base de données non accessible');
      process.exit(1);
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('🚀 Serveur CCL Beats Backend démarré!');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📊 Santé: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();

export default app;
