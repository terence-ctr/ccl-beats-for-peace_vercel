import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireOrganizer } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// Vérifier si nous sommes sur Vercel
const isVercel = process.env.VERCEL === '1';

// Configuration multer pour les fichiers audio
const audioStorage = isVercel ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    
    // Créer les dossiers seulement si ce n'est pas Vercel
    if (!isVercel) {
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
    }
    
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    // Utiliser le nom original du fichier envoyé par le frontend
    // Le frontend renomme déjà le fichier en 'ccl_beats_instrumental.mp3' ou 'ccl_beats_slam.mp3'
    console.log('📁 Fichier uploadé avec le nom:', file.originalname);
    cb(null, file.originalname);
  }
});

const audioFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Types MIME audio acceptés (incluant les variations des navigateurs)
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/ogg', 'audio/vorbis', 'audio/m4a', 'audio/x-m4a', 'audio/mp4',
    'audio/aac', 'audio/x-aac', 'audio/webm', 'audio/flac'
  ];
  
  // Vérifier aussi l'extension du fichier
  const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.flac'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.log('Type MIME rejeté:', file.mimetype, 'Extension:', ext);
    cb(new Error('Type de fichier non autorisé. Utilisez MP3, WAV, OGG, M4A, AAC, WEBM ou FLAC.'));
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// Upload d'un fichier audio (organisateur uniquement)
router.post('/audio', authenticateToken, requireOrganizer, uploadAudio.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
      return;
    }

    console.log('📝 Détails du fichier reçu:');
    console.log('  - Nom original:', req.file.originalname);
    console.log('  - Taille:', req.file.size);

    // Sur Vercel, retourner une réponse de succès sans stockage physique
    if (isVercel) {
      res.status(200).json({
        success: true,
        message: 'Fichier reçu avec succès (mode Vercel)',
        data: {
          filename: req.file.originalname,
          originalName: req.file.originalname,
          size: req.file.size,
          url: null, // Pas d'URL sur Vercel
          note: 'Stockage physique désactivé sur Vercel'
        }
      });
      return;
    }

    const fileUrl = `/uploads/audio/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Fichier uploadé avec succès',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error: any) {
    console.error('Erreur upload audio:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur lors de l\'upload' });
  }
});

// Supprimer un fichier audio
router.delete('/audio/:filename', authenticateToken, requireOrganizer, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Sur Vercel, retourner un message indiquant que l'opération n'est pas supportée
    if (isVercel) {
      res.status(200).json({ 
        success: true, 
        message: 'Suppression non applicable sur Vercel (stockage en mémoire uniquement)' 
      });
      return;
    }

    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    const filePath = path.join(audioDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ success: true, message: 'Fichier supprimé' });
    } else {
      res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lister les fichiers audio
router.get('/audio', authenticateToken, requireOrganizer, async (req: Request, res: Response) => {
  try {
    // Sur Vercel, retourner une liste vide
    if (isVercel) {
      res.status(200).json({ 
        success: true, 
        data: { 
          files: [],
          note: 'Stockage physique désactivé sur Vercel'
        } 
      });
      return;
    }

    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    const files = fs.readdirSync(audioDir).map((filename: string) => ({
      filename,
      url: `/uploads/audio/${filename}`,
      size: fs.statSync(path.join(audioDir, filename)).size
    }));
    
    res.status(200).json({ success: true, data: { files } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
