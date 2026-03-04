import { query } from '../config/database';
import { Notification } from '../types/database';

export class NotificationModel {
  // Créer une notification
  static async create(notificationData: Partial<Notification>): Promise<Notification> {
    const { user_id, title, message, type = 'info' } = notificationData;

    const sql = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [user_id, title, message, type]);
    if (!result.insertId) throw new Error('Erreur création notification');
    return await this.findById(result.insertId) as Notification;
  }

  // Créer plusieurs notifications (pour broadcast)
  static async createBulk(userIds: (number | string)[], title: string, message: string, type: string = 'info'): Promise<void> {
    const values = userIds.map(userId => 
      `(${userId}, '${title}', '${message}', '${type}')`
    ).join(', ');

    const sql = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ${values}
    `;

    await query(sql);
  }

  // Trouver les notifications d'un utilisateur
  static async findByUserId(userId: number | string, unreadOnly: boolean = false): Promise<Notification[]> {
    let sql = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    
    if (unreadOnly) {
      sql += ` AND is_read = false`;
    }
    
    sql += ` ORDER BY created_at DESC`;

    const result = await query<Notification>(sql, [userId]);
    return result.rows;
  }

  // Trouver une notification par ID
  static async findById(id: number | string): Promise<Notification | null> {
    const sql = `SELECT * FROM notifications WHERE id = ?`;
    const result = await query<Notification>(sql, [id]);
    return result.rows[0] || null;
  }

  // Marquer une notification comme lue
  static async markAsRead(id: number | string, userId: number | string): Promise<Notification | null> {
    const sql = `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = ? AND user_id = ?
    `;

    await query(sql, [id, userId]);
    return await this.findById(id);
  }

  // Marquer toutes les notifications d'un utilisateur comme lues
  static async markAllAsRead(userId: number | string): Promise<void> {
    const sql = `
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = ? AND is_read = false
    `;

    await query(sql, [userId]);
  }

  // Supprimer une notification
  static async delete(id: number | string, userId: number | string): Promise<void> {
    await query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  }

  // Supprimer toutes les notifications d'un utilisateur
  static async deleteAll(userId: number | string): Promise<void> {
    await query('DELETE FROM notifications WHERE user_id = ?', [userId]);
  }

  // Compter les notifications non lues
  static async countUnread(userId: number | string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = false
    `;
    
    const result = await query<{ count: string }>(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
}
