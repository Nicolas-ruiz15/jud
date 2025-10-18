// pages/api/test-db.js - ARREGLADO PARA MARIADB SIN PREPARED STATEMENTS
import { query, testConnection } from '../../lib/database';

export default async function handler(req, res) {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // 1. Test básico de conexión
    const connectionTest = await testConnection();
    console.log('Connection test result:', connectionTest);

    // 2. Verificar variables de entorno
    console.log('Environment variables:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'NOT SET');

    // 3. Test query simple
    const testQuery = await query('SELECT 1 + 1 as result');
    console.log('Test query result:', testQuery);

    // 4. Verificar tabla users (SIN PARÁMETROS)
    const tableExists = await query("SHOW TABLES LIKE 'users'");
    console.log('Users table exists:', tableExists.length > 0);
    
    if (tableExists.length > 0) {
      // 5. Ver estructura de la tabla users
      const tableStructure = await query('DESCRIBE users');
      console.log('Users table structure:', tableStructure);
      
      // 6. Contar usuarios existentes
      const userCount = await query('SELECT COUNT(*) as user_count FROM users');
      console.log('Existing users count:', userCount[0].user_count);

      // 7. Verificar campos requeridos
      const requiredFields = ['id', 'name', 'email', 'password', 'role'];
      const existingFields = tableStructure.map(field => field.Field);
      const hasRequiredFields = requiredFields.every(field => existingFields.includes(field));
      
      console.log('Required fields check:', {
        required: requiredFields,
        existing: existingFields,
        hasAll: hasRequiredFields
      });

      // 8. Test de usuario de muestra (sin crear)
      let sampleUser = null;
      try {
        const testUserQuery = await query('SELECT id, name, email, role FROM users LIMIT 1');
        sampleUser = testUserQuery.length > 0 ? testUserQuery[0] : null;
        console.log('Sample user:', sampleUser || 'No users found');
      } catch (userError) {
        console.log('Error getting sample user:', userError.message);
      }
    }

    // 9. Verificar JWT_SECRET
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'NOT SET ❌');

    // 10. Test de versión de BD
    const versionQuery = await query('SELECT VERSION() as version');
    console.log('Database version:', versionQuery[0].version);

    // 11. Verificar todas las tablas necesarias para autenticación
    const authTables = ['users', 'user_addresses', 'user_payment_methods', 'password_reset_tokens'];
    const existingTables = [];
    for (const tableName of authTables) {
      try {
        const tableCheck = await query(`SHOW TABLES LIKE '${tableName}'`);
        if (tableCheck.length > 0) {
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`Error checking table ${tableName}:`, err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Database tests completed successfully ✅',
      results: {
        connectionTest,
        testQuery: testQuery[0],
        dbVersion: versionQuery[0].version,
        usersTable: {
          exists: tableExists.length > 0,
          userCount: tableExists.length > 0 ? userCount[0].user_count : 0,
          structure: tableExists.length > 0 ? tableStructure : [],
          sampleUser: sampleUser
        },
        authTablesStatus: {
          required: authTables,
          existing: existingTables,
          allPresent: authTables.every(table => existingTables.includes(table))
        },
        dbConfig: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          database: process.env.DB_NAME,
          passwordSet: !!process.env.DB_PASSWORD
        },
        jwtSecretSet: !!process.env.JWT_SECRET,
        readyForAuth: !!(
          connectionTest && 
          process.env.JWT_SECRET && 
          tableExists.length > 0
        )
      }
    });

  } catch (error) {
    console.error('=== DATABASE TEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Database test failed ❌',
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      suggestion: 'Verifica la conexión a MariaDB y los permisos de usuario'
    });
  }
}