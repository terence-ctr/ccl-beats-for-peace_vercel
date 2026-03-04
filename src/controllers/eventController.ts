import { Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { AuthenticatedRequest } from '../types/database';

export class EventController {
  // Créer un nouvel événement
  static async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const eventData = req.body as any;
      eventData.created_by = req.user.id;

      const event = await EventModel.create(eventData);

      res.status(201).json({
        success: true,
        message: 'Événement créé avec succès',
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur création événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'événement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir tous les événements
  static async getAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      const events = await EventModel.findAll(status as any);

      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error: any) {
      console.error('Erreur liste événements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir l'événement actif
  static async getActiveEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = await EventModel.getActive();

      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur événement actif:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'événement actif',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir le prochain événement
  static async getNextEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = await EventModel.getNext();

      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur prochain événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du prochain événement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir un événement par ID
  static async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de l\'événement requis'
        });
        return;
      }

      const event = await EventModel.findById(id);
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Événement non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur événement par ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'événement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour un événement
  static async updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const updates = req.body as any;
      
      console.log('🔍 EventController.updateEvent - ID:', id);
      console.log('🔍 EventController.updateEvent - Updates:', updates);
      console.log('🔍 EventController.updateEvent - Type ID:', typeof id);

      const event = await EventModel.update(id, updates);
      console.log('🔍 EventController.updateEvent - Event mis à jour:', event);

      res.status(200).json({
        success: true,
        message: 'Événement mis à jour avec succès',
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour événement:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'événement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mettre à jour le statut d'un événement
  static async updateEventStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const event = await EventModel.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Statut de l\'événement mis à jour avec succès',
        data: { event }
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

  // Activer/désactiver les votes pour un événement
  static async updateVotingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;
      const { vote_actif } = (req.body as any);

      if (typeof vote_actif !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'vote_actif doit être un booléen'
        });
        return;
      }

      const event = await EventModel.updateVotingStatus(id, vote_actif);

      res.status(200).json({
        success: true,
        message: 'Statut de vote mis à jour avec succès',
        data: { event }
      });
    } catch (error: any) {
      console.error('Erreur mise à jour vote:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut de vote',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer un événement
  static async deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = (req as any).params;

      await EventModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Événement supprimé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur suppression événement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'événement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir la progression de la compétition
  static async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const progress = await EventModel.getProgress();

      res.status(200).json({
        success: true,
        data: { progress }
      });
    } catch (error: any) {
      console.error('Erreur progression:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la progression',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
