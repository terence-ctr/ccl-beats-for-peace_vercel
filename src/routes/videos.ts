import { Router } from 'express';
import { VideoModel } from '../models/Video';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Obtenir les vidéos d'un artiste
router.get('/artist/:artisteId', async (req, res) => {
  try {
    const { artisteId } = req.params;
    const { phaseId } = req.query;
    
    const videos = await VideoModel.findByArtisteId(artisteId, phaseId as string);
    
    res.json({
      success: true,
      data: { videos }
    });
  } catch (error: any) {
    console.error('Erreur récupération vidéos artiste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des vidéos'
    });
  }
});

// Obtenir les vidéos d'une phase
router.get('/phase/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params;
    
    const videos = await VideoModel.findByPhaseId(phaseId);
    
    res.json({
      success: true,
      data: { videos }
    });
  } catch (error: any) {
    console.error('Erreur récupération vidéos phase:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des vidéos'
    });
  }
});

// Obtenir une vidéo par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await VideoModel.findById(id);
    
    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
      return;
    }
    
    res.json({
      success: true,
      data: { video }
    });
  } catch (error: any) {
    console.error('Erreur récupération vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la vidéo'
    });
  }
});

// Créer une vidéo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const videoData = req.body;
    
    const video = await VideoModel.create(videoData);
    
    res.status(201).json({
      success: true,
      message: 'Vidéo créée avec succès',
      data: { video }
    });
  } catch (error: any) {
    console.error('Erreur création vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la vidéo'
    });
  }
});

// Mettre à jour une vidéo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const video = await VideoModel.update(id, updates);
    
    res.json({
      success: true,
      message: 'Vidéo mise à jour avec succès',
      data: { video }
    });
  } catch (error: any) {
    console.error('Erreur mise à jour vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la vidéo'
    });
  }
});

// Supprimer une vidéo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await VideoModel.delete(id);
    
    res.json({
      success: true,
      message: 'Vidéo supprimée avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la vidéo'
    });
  }
});

export default router;
