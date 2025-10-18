// lib/database.js - VERSION SIMPLIFICADA Y FUNCIONAL
import mysql from 'mysql2/promise';

// Pool de conexiones
let pool;

function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'usr_tienda_judaica_breslov',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'Tienda_Judaica_Breslov',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4',
      ssl: process.env.DB_USE_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true'
      } : undefined
    });
  }
  return pool;
}

// Query básica
export const query = async (sql, params = []) => {
  try {
    const connection = createPool();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', {
      error: error.message,
      sql: sql.substring(0, 100) + '...',
      params: params
    });
    throw error;
  }
};

// Query que retorna un solo resultado
export const queryOne = async (sql, params = []) => {
  try {
    const results = await query(sql, params);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
};

// Función para transacciones simplificada
export const transaction = async (callback) => {
  const connection = await createPool().getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Crear wrapper para el callback
    const connWrapper = {
      query: async (sql, params = []) => {
        const [results] = await connection.execute(sql, params);
        return results;
      },
      queryOne: async (sql, params = []) => {
        const results = await connWrapper.query(sql, params);
        return results.length > 0 ? results[0] : null;
      }
    };
    
    const result = await callback(connWrapper);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Test de conexión
export const testConnection = async () => {
  try {
    const connection = createPool();
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default createPool;