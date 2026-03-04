import { query } from '../config/database';
import { UserModel } from '../models/User';
import { AppRole } from '../types/database';

// Script pour nettoyer les rôles et s'assurer que chaque utilisateur a un seul rôle
export async function cleanupUserRoles() {
  console.log('🧹 Nettoyage des rôles utilisateurs...');
  
  try {
    // 1. Obtenir tous les utilisateurs avec leurs rôles
    const usersWithRoles = await query(`
      SELECT u.id, u.username, u.email, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.id
    `);
    
    console.log(`📊 ${usersWithRoles.rows.length} utilisateurs trouvés`);
    
    // 2. Identifier les utilisateurs avec plusieurs rôles
    const usersWithMultipleRoles = new Map();
    
    for (const row of usersWithRoles.rows) {
      const userId = row.id;
      if (!usersWithMultipleRoles.has(userId)) {
        usersWithMultipleRoles.set(userId, []);
      }
      if (row.role) {
        usersWithMultipleRoles.get(userId).push(row.role);
      }
    }
    
    // 3. Nettoyer les utilisateurs avec plusieurs rôles
    let cleanedCount = 0;
    
    for (const [userId, roles] of usersWithMultipleRoles.entries()) {
      if (roles.length > 1) {
        console.log(`🔧 Utilisateur ${userId} a ${roles.length} rôles: ${roles.join(', ')}`);
        
        // Priorité des rôles: SUPER_ADMIN > ORGANIZER > JURY > CANDIDATE > VISITOR
        let selectedRole = AppRole.VISITOR;
        
        if (roles.includes(AppRole.SUPER_ADMIN)) {
          selectedRole = AppRole.SUPER_ADMIN;
        } else if (roles.includes(AppRole.ORGANIZER)) {
          selectedRole = AppRole.ORGANIZER;
        } else if (roles.includes(AppRole.JURY)) {
          selectedRole = AppRole.JURY;
        } else if (roles.includes(AppRole.CANDIDATE)) {
          selectedRole = AppRole.CANDIDATE;
        }
        
        console.log(`✅ Attribution du rôle unique: ${selectedRole}`);
        await UserModel.setSingleRole(userId, selectedRole);
        cleanedCount++;
      } else if (roles.length === 0) {
        console.log(`⚠️ Utilisateur ${userId} n'a aucun rôle, attribution du rôle VISITOR`);
        await UserModel.setSingleRole(userId, AppRole.VISITOR);
        cleanedCount++;
      }
    }
    
    console.log(`✨ Nettoyage terminé! ${cleanedCount} utilisateurs traités`);
    
    // 4. Vérification finale
    const finalCheck = await query(`
      SELECT u.id, u.username, COUNT(ur.role) as role_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.username
      HAVING role_count != 1
    `);
    
    if (finalCheck.rows.length > 0) {
      console.log('⚠️ Problèmes restants:');
      console.table(finalCheck.rows);
    } else {
      console.log('🎉 Tous les utilisateurs ont exactement un rôle!');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  cleanupUserRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
