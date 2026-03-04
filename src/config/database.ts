// Configuration de la base de données XAMPP local (MySQL)
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Interface pour les résultats de requête
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
  fields: any[];
  insertId?: number;
  affectedRows?: number;
}

// Configuration XAMPP local
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'congochallenge',
  charset: 'utf8mb4',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Pool de connexions
let pool: mysql.Pool | null = null;

// Fonction pour créer le pool de connexions
function createPool() {
  if (!pool) {
    console.log('🔗 Connexion à la base de données XAMPP MySQL...');
    console.log('� Configuration:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***' : '(vide)'
    });
    
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Fonction pour exécuter des requêtes
export async function query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const connectionPool = createPool();
  
  try {
    console.log(`📤 Exécution requête SQL:`, { sql, params });
    
    const [rows, fields] = await connectionPool.execute(sql, params || []);
    const duration = Date.now() - start;
    
    console.log(`📊 Requête exécutée en ${duration}ms`, { 
      rows: Array.isArray(rows) ? rows.length : 0,
      insertId: (rows as any).insertId 
    });
    
    return {
      rows: rows as T[],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      fields: fields || [],
      insertId: (rows as any).insertId,
      affectedRows: (rows as any).affectedRows
    };
  } catch (error: any) {
    console.error('❌ Erreur SQL:', error);
    throw error;
  }
}

// Fonction pour tester la connexion
export async function testConnection(): Promise<boolean> {
  try {
    const connectionPool = createPool();
    await connectionPool.execute('SELECT 1');
    console.log('✅ Connexion à MySQL XAMPP réussie');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de connexion à MySQL XAMPP:', error.message);
    console.log('💡 Vérifiez que:');
    console.log('   1. XAMPP est démarré (Apache + MySQL)');
    console.log('   2. La base de données "congochallenge" existe');
    console.log('   3. Les identifiants MySQL sont corrects');
    console.log('   4. Le port 3306 est disponible');
    return false;
  }
}

// Fonction transaction
export async function transaction<T = any>(callback: (client: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connectionPool = createPool();
  const connection = await connectionPool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('🔄 Transaction démarrée');
    
    const result = await callback(connection);
    
    await connection.commit();
    console.log('✅ Transaction validée');
    
    return result;
  } catch (error: any) {
    await connection.rollback();
    console.log('❌ Transaction annulée:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Export pour compatibilité
export default {};

// Fermer le pool à l'arrêt du serveur
process.on('SIGINT', async () => {
  if (pool) {
    console.log('🛑 Fermeture du pool de connexions...');
    await pool.end();
    pool = null;
  }
  process.exit(0);
});
