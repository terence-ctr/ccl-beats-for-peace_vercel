import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification';
import { AuthenticatedRequest } from '../types/database';

export class NotificationController {
  // Obtenir les notifications de l'utilisateur connecté
  static async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { unreadOnly } = req.query;
      const notifications = await NotificationModel.findByUserId(
        req.user.id, 
        unreadOnly === 'true'
      );

      res.status(200).json({
        success: true,
        data: { notifications }
      });
    } catch (error: any) {
      console.error('Erreur récupération notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Compter les notifications non lues
  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const count = await NotificationModel.countUnread(req.user.id);

      res.status(200).json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error: any) {
      console.error('Erreur comptage notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du comptage des notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const notification = await NotificationModel.markAsRead(id, req.user.id);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marquée comme lue',
        data: { notification }
      });
    } catch (error: any) {
      console.error('Erreur marquage notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      await NotificationModel.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });
    } catch (error: any) {
      console.error('Erreur marquage notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer une notification
  static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      await NotificationModel.delete(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification supprimée'
      });
    } catch (error: any) {
      console.error('Erreur suppression notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Supprimer toutes les notifications
  static async deleteAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      await NotificationModel.deleteAll(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Toutes les notifications supprimées'
      });
    } catch (error: any) {
      console.error('Erreur suppression notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression des notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Créer une notification (admin)
  static async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { user_id, title, message, type } = req.body as any;

      const notification = await NotificationModel.create({
        user_id,
        title,
        message,
        type
      });

      res.status(201).json({
        success: true,
        message: 'Notification créée',
        data: { notification }
      });
    } catch (error: any) {
      console.error('Erreur création notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
