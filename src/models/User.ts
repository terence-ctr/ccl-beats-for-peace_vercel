import { query, QueryResult } from '../config/database';
import { User, UserRole, AppRole, CreateUserRequest, AuthResponse } from '../types/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Stockage temporaire des codes de vérification en mémoire
const verificationCodes = new Map<string, { code: string; expiresAt: Date; type: 'email' | 'phone' }>();

export class UserModel {
  // Créer un nouvel utilisateur
  static async create(userData: CreateUserRequest & { phone?: string }): Promise<User> {
    const { email, password, username, phone } = userData;
    
    // Hasher le mot de passe
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Utiliser la fonction query du database.ts qui gère la conversion
    const sql = `
      INSERT INTO users (email, password_hash, username, raw_user_meta_data, phone, token)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      email,
      password_hash,
      username,
      JSON.stringify({ username }),
      phone || null,
      null // Token sera ajouté lors de la connexion
    ];
    
    const result = await query(sql, values);
    const userId = result.insertId;
    
    if (!userId) {
      throw new Error('Erreur lors de la création: insertId non retourné');
    }
    
    // Fetch the created user
    const user = await this.findById(userId);
    if (!user) throw new Error('Erreur création utilisateur');
    
    return user;
  }

  // Trouver un utilisateur par ID
  static async findById(id: number): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    return this.mapRowToUser(result.rows[0]);
  }

  // Trouver un utilisateur par email ou username
  static async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const sql = `
      SELECT * FROM users 
      WHERE email = ? OR username = ?
    `;
    const result = await query(sql, [emailOrUsername, emailOrUsername]);
    
    console.log('🔍 Backend - Requête SQL:', sql);
    console.log('🔍 Backend - Paramètres:', [emailOrUsername, emailOrUsername]);
    console.log('🔍 Backend - Résultat brut de la BDD:', result.rows[0]); // Debug pour voir les données brutes
    
    if (result.rows.length === 0) return null;
    
    return this.mapRowToUser(result.rows[0]);
  }

  // Mettre à jour le profil utilisateur
  static async updateProfile(userId: number, updates: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    
    if (updates.username) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    
    if (updates.raw_user_meta_data) {
      fields.push('raw_user_meta_data = ?');
      values.push(typeof updates.raw_user_meta_data === 'string' 
        ? updates.raw_user_meta_data 
        : JSON.stringify(updates.raw_user_meta_data));
    }
    
    if (fields.length === 0) return this.findById(userId);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    
    return this.findById(userId);
  }

  // Mettre à jour le token JWT d'un utilisateur
  static async updateToken(userId: number, token: string): Promise<boolean> {
    try {
      const sql = 'UPDATE users SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await query(sql, [token, userId]);
      
      console.log('🔍 Backend - Token mis à jour pour user ID:', userId);
      return !!(result.rowCount && result.rowCount > 0);
    } catch (error) {
      console.error('❌ Erreur mise à jour du token:', error);
      return false;
    }
  }

  // ==================== AUTHENTICATION ====================

  static async authenticate(emailOrUsername: string, password: string): Promise<User | null> {
    const user = await this.findByEmailOrUsername(emailOrUsername);
    if (!user) return null;
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return null;
    
    // Mettre à jour last_sign_in_at
    await query('UPDATE users SET last_sign_in_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    return user;
  }

  static async generateTokens(user: User): Promise<AuthResponse> {
    const jwtSecret = process.env.JWT_SECRET || 'ccl-beats-for-peace-dev-secret-2026';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'ccl-beats-for-peace-dev-refresh-secret-2026';
    
    console.log('🔍 Backend - User données pour token:', user); // Debug pour voir les données utilisateur
    
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone // Ajouter le numéro de téléphone au payload
    };
    
    console.log('🔍 Backend - Token payload généré:', payload); // Debug pour voir le payload
    
    const access_token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    const refresh_token = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '30d' });
    
    // Récupérer les rôles de l'utilisateur
    const roles = await this.getUserRoles(Number(user.id));
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        raw_user_meta_data: user.raw_user_meta_data,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        email_verified: user.email_verified,
        phone: user.phone
      },
      token: access_token,
      roles
    };
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      const user = await this.findById(decoded.id);
      if (!user) return null;
      
      return user;
    } catch (error: any) {
      console.error('Erreur lors de la vérification du token:', error.message);
      return null;
    }
  }

  // ==================== VERIFICATION ====================

  static async saveVerificationCode(identifier: string, code: string, type: 'email' | 'phone'): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Utiliser le stockage en mémoire
    verificationCodes.set(identifier, { code, expiresAt, type });
    
    console.log(`💾 Code sauvegardé en mémoire: ${identifier} -> ${code} (${type})`);
    
    // Nettoyer les codes expirés
    const now = new Date();
    for (const [key, value] of verificationCodes.entries()) {
      if (value.expiresAt < now) {
        verificationCodes.delete(key);
        console.log(`🗑️ Code expiré supprimé: ${key}`);
      }
    }
  }

  static async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const storedCode = verificationCodes.get(email);
    
    if (!storedCode) {
      console.log(`❌ Aucun code trouvé pour ${email}`);
      return false;
    }
    
    if (storedCode.type !== 'email') {
      console.log(`❌ Code de type incorrect pour ${email}: ${storedCode.type}`);
      return false;
    }
    
    if (storedCode.expiresAt < new Date()) {
      console.log(`❌ Code expiré pour ${email}`);
      verificationCodes.delete(email);
      return false;
    }
    
    if (storedCode.code !== code) {
      console.log(`❌ Code incorrect pour ${email}: ${code} != ${storedCode.code}`);
      return false;
    }
    
    // Code valide - le supprimer
    verificationCodes.delete(email);
    console.log(`✅ Code email vérifié pour ${email}`);
    
    // Marquer l'email comme vérifié
    await this.markEmailVerified(email);
    
    return true;
  }

  static async verifyPhoneCode(phone: string, code: string): Promise<boolean> {
    const storedCode = verificationCodes.get(phone);
    
    if (!storedCode) {
      console.log(`❌ Aucun code trouvé pour ${phone}`);
      return false;
    }
    
    if (storedCode.type !== 'phone') {
      console.log(`❌ Code de type incorrect pour ${phone}: ${storedCode.type}`);
      return false;
    }
    
    if (storedCode.expiresAt < new Date()) {
      console.log(`❌ Code expiré pour ${phone}`);
      verificationCodes.delete(phone);
      return false;
    }
    
    if (storedCode.code !== code) {
      console.log(`❌ Code incorrect pour ${phone}: ${code} != ${storedCode.code}`);
      return false;
    }
    
    // Code valide - le supprimer
    verificationCodes.delete(phone);
    console.log(`✅ Code SMS vérifié pour ${phone}`);
    
    // Marquer le téléphone comme vérifié
    await this.markPhoneVerified(phone);
    
    return true;
  }

  static async markEmailVerified(email: string): Promise<void> {
    const sql = `
      UPDATE users 
      SET email_confirmed_at = CURRENT_TIMESTAMP, email_verified = '1'
      WHERE email = ?
    `;
    await query(sql, [email]);
    console.log(`✅ Email marqué comme vérifié: ${email}`);
  }

  static async markPhoneVerified(phone: string): Promise<void> {
    const sql = `
      UPDATE users 
      SET phone_confirmed_at = CURRENT_TIMESTAMP
      WHERE phone = ?
    `;
    await query(sql, [phone]);
    console.log(`✅ Téléphone marqué comme vérifié: ${phone}`);
  }

  // ==================== ROLES ====================

  static async assignRole(userId: number, role: AppRole): Promise<void> {
    const sql = `
      INSERT INTO user_roles (user_id, role) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `;
    await query(sql, [userId, role]);
  }

  static async removeRole(userId: number, role: AppRole): Promise<void> {
    const sql = 'DELETE FROM user_roles WHERE user_id = ? AND role = ?';
    await query(sql, [userId, role]);
  }

  static async getUserRoles(userId: number): Promise<AppRole[]> {
    const sql = 'SELECT role FROM user_roles WHERE user_id = ?';
    const result = await query(sql, [userId]);
    
    return result.rows.map((row: any) => row.role as AppRole);
  }

  static async setSingleRole(userId: number, role: AppRole): Promise<void> {
    // Supprimer tous les rôles existants
    await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    
    // Ajouter le nouveau rôle
    await query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, role]);
  }

  // ==================== UTILS ====================

  private static mapRowToUser(row: any): User {
    return {
      id: parseInt(row.id),
      email: row.email,
      password_hash: row.password_hash,
      username: row.username,
      raw_user_meta_data: typeof row.raw_user_meta_data === 'string' 
        ? JSON.parse(row.raw_user_meta_data) 
        : row.raw_user_meta_data,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_sign_in_at: row.last_sign_in_at,
      email_confirmed_at: row.email_confirmed_at,
      phone_confirmed_at: row.phone_confirmed_at,
      email_verified: row.email_verified,
      phone: row.phone
    };
  }
}
