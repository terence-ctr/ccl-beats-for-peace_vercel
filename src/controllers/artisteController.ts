import { Request, Response } from 'express';
import { VoteModel } from '../models/Vote';
import { ArtisteModel } from '../models/Artiste';
import { UserModel } from '../models/User';
import { CreateArtisteRequest, AuthenticatedRequest } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { sendCandidatureConfirmationEmail } from '../services/emailService';
import { sendCandidatureConfirmationSms } from '../services/smsService';

// Helper function to save base64 file
const saveBase64File = async (base64Data: string, folder: string, prefix: string): Promise<string | null> => {
  if (!base64Data) return null;
  
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    
    const mimeType = matches[1];
    const data = matches[2];
    const extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
    const fileName = `${prefix}-${uuidv4()}.${extension}`;
    
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
};

export class ArtisteController {
  // Créer une candidature d'artiste
  static async createArtist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { photo_base64, video_base64, piece_identite_base64, ...artisteData } = req.body;
      const userId = req.user.id;

      // Vérifier si l'utilisateur a déjà une candidature
      const existingArtiste = await ArtisteModel.findByUserId(userId);
      if (existingArtiste) {
        res.status(409).json({
          success: false,
          message: 'Vous avez déjà une candidature en cours'
        });
        return;
      }

      // Sauvegarder les fichiers base64
      const photoUrl = await saveBase64File(photo_base64, 'photos', 'photo');
      const videoUrl = await saveBase64File(video_base64, 'videos', 'video');
      const pieceIdentiteUrl = await saveBase64File(piece_identite_base64, 'documents', 'piece');

      // Ajouter les URLs aux données
      const completeArtisteData: CreateArtisteRequest = {
        ...artisteData,
        photo_url: photoUrl,
        video_url: videoUrl,
        piece_identite_url: pieceIdentiteUrl,
      };

      // Créer la candidature
      const artiste = await ArtisteModel.create(userId, completeArtisteData);

      // Envoyer email et SMS de confirmation de candidature
      if (artiste) {
        let emailSent = false;
        let smsSent = false;
        
        if (artiste.email) {
          emailSent = await sendCandidatureConfirmationEmail(artiste.email, artiste.nom_artiste);
        }
        
        if (artiste.telephone) {
          smsSent = await sendCandidatureConfirmationSms(artiste.telephone, artiste.nom_artiste);
        }
        
        console.log('\n========================================');
        console.log('🎨 CANDIDATURE SOUMISE');
        console.log(`   Artiste: ${artiste.nom_artiste}`);
        console.log(`   Email: ${artiste.email || 'Non fourni'}`);
        console.log(`   Téléphone: ${artiste.telephone || 'Non fourni'}`);
        console.log(`   ${emailSent ? '✅ Email envoyé' : '⚠️ Email non envoyé'}`);
        console.log(`   ${smsSent ? '✅ SMS envoyé' : '⚠️ SMS non envoyé'}`);
        console.log('========================================\n');
      }

      res.status(201).json({
        success: true,
        message: 'Candidature créée avec succès. Un email et SMS de confirmation ont été envoyés.',
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur création artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la candidature',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le profil artiste de l'utilisateur connecté
  static async getMyArtistProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const artiste = await ArtisteModel.findByUserId(req.user.id);

      if (!artiste) {
        // Renvoyer les informations de base de l'utilisateur si pas de candidature
        const userProfile = await UserModel.findById(req.user.id);
        if (userProfile) {
          res.status(200).json({
            success: true,
            data: { 
              artiste: {
                user_id: userProfile.id,
                nom_complet: userProfile.username || '',
                nom_artiste: '',
                date_naissance: null,
                sexe: '',
                discipline: '',
                adresse: '',
                quartier: '',
                telephone: '',
                email: userProfile.email || '',
                biographie: '',
                province: '',
                ville: '',
                photo_url: '',
                video_url: '',
                piece_identite_url: '',
                statut: 'non_candidat',
                festiras_id: null,
                pays: 'RDC',
                hashtag_officiel: '',
                total_votes: 0,
                score_jury: 0,
                score_final: 0,
                phase_actuelle_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
          });
        } else {
          res.status(404).json({
            success: false,
            message: 'Aucune candidature trouvée'
          });
        }
        return;
      }

      res.status(200).json({
        success: true,
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur récupération profil artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les artistes
  static async getAllArtists(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '50', 
        status, 
        discipline 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const artistes = await ArtisteModel.findAll(
        status as any,
        discipline as any,
        limitNum,
        offset
      );

      res.status(200).json({
        success: true,
        data: { 
          artistes,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: artistes.length
          }
        }
      });
    } catch (error: any) {
      console.error('Erreur liste artistes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des artistes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les artistes validés (public)
  static async getValidatedArtists(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const artistes = await ArtisteModel.findValidated(limitNum, offset);

      res.status(200).json({
        success: true,
        data: { 
          artistes,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: artistes.length
          }
        }
      });
    } catch (error: any) {
      console.error('Erreur artistes validés:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des artistes validés',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir un artiste par ID
  static async getArtistById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de l\'artiste requis'
        });
        return;
      }

      const artiste = await ArtisteModel.findById(id);
      if (!artiste) {
        res.status(404).json({
          success: false,
          message: 'Artiste non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur artiste par ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'artiste',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour un artiste
  static async updateArtist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      // Validation des entrées (temporairement désactivée)
      // TODO: Réactiver la validation avec express-validator
      if (!req.body) {
        res.status(400).json({
          success: false,
          message: 'Données requises manquantes'
        });
        return;
      }

      const { id } = (req as any).params;
      const userId = req.user.id;
      const updates = req.body as any;

      // Vérifier si l'artiste appartient à l'utilisateur
      const existingArtiste = await ArtisteModel.findById(id);
      if (!existingArtiste || existingArtiste.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cet artiste'
        });
        return;
      }

      const artiste = await ArtisteModel.update(id, userId, updates);

      res.status(200).json({
        success: true,
        message: 'Artiste mis à jour avec succès',
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'artiste',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer un artiste
  static async deleteArtist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;
      const userId = req.user.id;

      // Vérifier si l'artiste appartient à l'utilisateur
      const existingArtiste = await ArtisteModel.findById(id);
      if (!existingArtiste || existingArtiste.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Non autorisé à supprimer cet artiste'
        });
        return;
      }

      await ArtisteModel.delete(id, userId);

      res.status(200).json({
        success: true,
        message: 'Artiste supprimé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur suppression artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'artiste',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour la photo de profil
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;
      const userId = req.user.id;

      // Vérifier si l'artiste appartient à l'utilisateur
      const existingArtiste = await ArtisteModel.findById(id);
      if (!existingArtiste || existingArtiste.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cet artiste'
        });
        return;
      }

      // TODO: Implémenter l'upload de fichier avec multer
      const photoUrl = (req.body as any)?.photoUrl || (req as any).file?.path;

      if (!photoUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de la photo requise'
        });
        return;
      }

      const artiste = await ArtisteModel.updatePhoto(id, userId, photoUrl);

      res.status(200).json({
        success: true,
        message: 'Photo mise à jour avec succès',
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement de la photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour la vidéo de présentation
  static async uploadVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;
      const userId = req.user.id;

      // Vérifier si l'artiste appartient à l'utilisateur
      const existingArtiste = await ArtisteModel.findById(id);
      if (!existingArtiste || existingArtiste.user_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cet artiste'
        });
        return;
      }

      // TODO: Implémenter l'upload de fichier avec multer
      const videoUrl = (req.body as any)?.videoUrl || (req as any).file?.path;

      if (!videoUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de la vidéo requise'
        });
        return;
      }

      const artiste = await ArtisteModel.updateVideo(id, userId, videoUrl);

      res.status(200).json({
        success: true,
        message: 'Vidéo mise à jour avec succès',
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur upload vidéo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement de la vidéo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour le statut (admin uniquement)
  static async updateArtistStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;
      const { status } = (req.body as any);

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Statut requis'
        });
        return;
      }

      const artiste = await ArtisteModel.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Statut de l\'artiste mis à jour avec succès',
        data: { artiste }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les votes d'un artiste (admin)
  static async getArtistVotes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).params;
      const { phaseId } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de l\'artiste requis'
        });
        return;
      }

      const votes = await VoteModel.findByArtiste(id, phaseId as string);

      res.status(200).json({
        success: true,
        data: { votes }
      });
    } catch (error: any) {
      console.error('Erreur votes artiste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des votes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les statistiques
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await ArtisteModel.getStatistics();

      res.status(200).json({
        success: true,
        data: { statistics }
      });
    } catch (error: any) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
