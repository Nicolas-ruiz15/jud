// pages/api/test-db.js - SIN PREPARED STATEMENTS PARA EL TEST
import { query, testConnection } from '../../lib/database';

export default async function handler(req, res) {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // 1. Test básico de conexión
    const connectionTest = await testConnection();
    console.log('Connection test result:', connectionTest);

    if (!connectionTest) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo conectar a la base de datos',
        suggestion: 'Verifica las credenciales y que MariaDB esté ejecutándose'
      });
    }

    // 2. Verificar variables de entorno
    console.log('Environment variables:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'NOT SET');

    // 3. Test query simple (SIN PARÁMETROS)
    const testQuery = await query('SELECT 1 + 1 as result');
    console.log('Test query result:', testQuery);

    // 4. Verificar tabla users (SIN PARÁMETROS)
    const tableExists = await query("SHOW TABLES LIKE 'users'");
    console.log('Users table exists:', tableExists.length > 0);

    let tableStructure = [];
    let userCount = 0;
    let sampleUser = null;
    
    if (tableExists.length > 0) {
      try {
        // 5. Ver estructura de la tabla users
        tableStructure = await query('DESCRIBE users');
        console.log('Users table structure found, columns:', tableStructure.length);
        
        // 6. Contar usuarios existentes
        const userCountResult = await query('SELECT COUNT(*) as user_count FROM users');
        userCount = userCountResult[0].user_count;
        console.log('Existing users count:', userCount);

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
        if (userCount > 0) {
          const testUserQuery = await query('SELECT id, name, email, role FROM users LIMIT 1');
          sampleUser = testUserQuery.length > 0 ? testUserQuery[0] : null;
          console.log('Sample user found:', sampleUser ? 'Yes' : 'No');
        } else {
          console.log('No users found in database');
        }
      } catch (tableError) {
        console.error('Error querying users table:', tableError.message);
      }
    }

    // 9. Verificar JWT_SECRET
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'NOT SET ❌');

    // 10. Test de versión de BD
    let dbVersion = 'Unknown';
    try {
      const versionQuery = await query('SELECT VERSION() as version');
      dbVersion = versionQuery[0].version;
      console.log('Database version:', dbVersion);
    } catch (versionError) {
      console.error('Error getting DB version:', versionError.message);
    }

    // 11. Verificar tablas de autenticación (SIN PARÁMETROS)
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

    console.log('Auth tables check:', {
      required: authTables,
      existing: existingTables
    });

    // 12. Check final para autenticación
    const readyForAuth = !!(
      connectionTest && 
      process.env.JWT_SECRET && 
      tableExists.length > 0 &&
      tableStructure.length > 0
    );

    console.log('Ready for authentication:', readyForAuth);

    // 13. Información adicional útil
    const summary = {
      database: 'Connected ✅',
      usersTable: tableExists.length > 0 ? 'Exists ✅' : 'Missing ❌',
      userCount: userCount,
      jwtSecret: process.env.JWT_SECRET ? 'Configured ✅' : 'Missing ❌',
      authTablesCount: `${existingTables.length}/${authTables.length}`,
      readyForAuth: readyForAuth ? 'Ready ✅' : 'Not Ready ❌'
    };

    console.log('SUMMARY:', summary);

    res.status(200).json({
      success: true,
      message: 'Database tests completed successfully ✅',
      summary,
      results: {
        connectionTest,
        testQuery: testQuery[0],
        dbVersion,
        usersTable: {
          exists: tableExists.length > 0,
          userCount: userCount,
          structure: tableStructure,
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
        readyForAuth: readyForAuth
      }
    });

  } catch (error) {
    console.error('=== DATABASE TEST ERROR ===');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Database test failed ❌',
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      suggestion: 'Verifica la conexión a MariaDB y los permisos de usuario',
      debug: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        hasPassword: !!process.env.DB_PASSWORD
      }
    });
  }
}