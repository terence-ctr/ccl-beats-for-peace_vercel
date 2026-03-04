import { Request, Response } from 'express';
import { query } from '../config/database';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// Enregistrer un téléchargement
export const recordDownload = async (req: Request, res: Response) => {
  try {
    const { phase_id, discipline, artiste_id } = req.body;
    const userId = req.user?.id;
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';

    if (!phase_id || !discipline) {
      return res.status(400).json({
        success: false,
        message: 'phase_id et discipline sont requis'
      });
    }

    // Vérifier si l'utilisateur existe
    let userIdToUse: string | undefined = userId;
    if (!userId) {
      // Créer un utilisateur visiteur
      const visitorResult = await query(
        'INSERT INTO users (email, username, is_visitor) VALUES (?, ?, ?)',
        [`visitor_${userIp}_${Date.now()}`, `visitor_${Date.now()}`, true]
      );
      userIdToUse = visitorResult.insertId?.toString();
    }

    // Insérer un nouveau téléchargement à chaque fois
    await query(
      `INSERT INTO download_instru (user_id, phase_id, discipline, artiste_id, ip_address, download_count)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userIdToUse, phase_id, discipline, artiste_id || null, userIp]
    );

    res.json({
      success: true,
      message: 'Téléchargement enregistré avec succès'
    });
  } catch (error) {
    console.error('Erreur enregistrement téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Vérifier si l'utilisateur a déjà téléchargé
export const checkUserDownload = async (req: Request, res: Response) => {
  try {
    const { phase_id, discipline } = req.query;
    const userId = req.user?.id;
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';

    if (!phase_id || !discipline) {
      return res.status(400).json({
        success: false,
        message: 'phase_id et discipline sont requis'
      });
    }

    let hasDownloaded = false;

    if (userId) {
      // Vérifier pour un utilisateur connecté
      const downloads = await query(
        'SELECT COUNT(*) as count FROM download_instru WHERE user_id = ? AND phase_id = ? AND discipline = ?',
        [userId, phase_id, discipline]
      );
      hasDownloaded = downloads.rows[0].count > 0;
    } else {
      // Vérifier pour un visiteur par IP
      const downloads = await query(
        'SELECT COUNT(*) as count FROM download_instru WHERE ip_address = ? AND phase_id = ? AND discipline = ?',
        [userIp, phase_id, discipline]
      );
      hasDownloaded = downloads.rows[0].count > 0;
    }

    res.json({
      success: true,
      data: { hasDownloaded }
    });
  } catch (error) {
    console.error('Erreur vérification téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les téléchargements d'un utilisateur
export const getUserDownloads = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non connecté'
      });
    }

    const downloads = await query(
      `SELECT di.*, p.name as phase_name, a.nom_artiste
       FROM download_instru di
       LEFT JOIN phases p ON di.phase_id = p.id
       LEFT JOIN artistes a ON di.artiste_id = a.id
       WHERE di.user_id = ?
       ORDER BY di.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: downloads.rows
    });
  } catch (error) {
    console.error('Erreur récupération téléchargements utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir tous les téléchargements (admin seulement)
export const getAllDownloads = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, discipline, phase_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (discipline) {
      whereClause += ' AND di.discipline = ?';
      params.push(discipline);
    }

    if (phase_id) {
      whereClause += ' AND di.phase_id = ?';
      params.push(phase_id);
    }

    const downloads = await query(
      `SELECT di.*, u.username, p.name as phase_name, a.nom_artiste
       FROM download_instru di
       LEFT JOIN users u ON di.user_id = u.id
       LEFT JOIN phases p ON di.phase_id = p.id
       LEFT JOIN artistes a ON di.artiste_id = a.id
       ${whereClause}
       ORDER BY di.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM download_instru di ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        downloads: downloads.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countResult.rows[0].total,
          pages: Math.ceil(countResult.rows[0].total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération tous téléchargements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les statistiques de téléchargement
export const getDownloadStats = async (req: Request, res: Response) => {
  try {
    // Statistiques générales
    const totalStats = await query(`
      SELECT 
        COUNT(*) as total_downloads,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        AVG(download_count) as avg_downloads_per_user
      FROM download_instru
    `);

    // Statistiques par discipline
    const disciplineStats = await query(`
      SELECT 
        discipline,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM download_instru
      GROUP BY discipline
      ORDER BY count DESC
    `);

    // Statistiques par phase
    const phaseStats = await query(`
      SELECT 
        di.phase_id,
        p.name as phase_name,
        COUNT(*) as count,
        COUNT(DISTINCT di.user_id) as unique_users
      FROM download_instru di
      LEFT JOIN phases p ON di.phase_id = p.id
      GROUP BY di.phase_id, p.name
      ORDER BY count DESC
    `);

    // Statistiques quotidiennes (30 derniers jours)
    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as downloads
      FROM download_instru
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Top utilisateurs
    const topUsers = await query(`
      SELECT 
        u.username,
        COUNT(*) as download_count
      FROM download_instru di
      LEFT JOIN users u ON di.user_id = u.id
      WHERE di.user_id IS NOT NULL
      GROUP BY di.user_id, u.username
      ORDER BY download_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        total: totalStats.rows[0],
        by_discipline: disciplineStats.rows,
        by_phase: phaseStats.rows,
        daily: dailyStats.rows,
        top_users: topUsers.rows
      }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les statistiques par discipline
export const getDownloadStatsByDiscipline = async (req: Request, res: Response) => {
  try {
    const { discipline } = req.params;

    if (!discipline || !['rap', 'slam'].includes(discipline)) {
      return res.status(400).json({
        success: false,
        message: 'Discipline invalide'
      });
    }

    const stats = await query(`
      SELECT 
        COUNT(*) as total_downloads,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(download_count) as average_downloads_per_user
      FROM download_instru
      WHERE discipline = ?
    `, [discipline]);

    const recentDownloads = await query(`
      SELECT 
        di.created_at,
        u.username,
        p.name as phase_name
      FROM download_instru di
      LEFT JOIN users u ON di.user_id = u.id
      LEFT JOIN phases p ON di.phase_id = p.id
      WHERE di.discipline = ?
      ORDER BY di.created_at DESC
      LIMIT 20
    `, [discipline]);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recent_downloads: recentDownloads.rows
      }
    });
  } catch (error) {
    console.error('Erreur statistiques par discipline:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
