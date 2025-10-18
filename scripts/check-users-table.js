// scripts/check-users-table.js
const { query, closePool } = require('../lib/database');

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando estructura de tabla users...\n');

    // Verificar si la tabla users existe
    const tableExists = await query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );

    if (tableExists[0].count === 0) {
      console.log('❌ La tabla "users" no existe');
      console.log('📋 Creando tabla users...\n');
      
      await query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          role ENUM('customer', 'admin') DEFAULT 'customer',
          status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          email_verified BOOLEAN DEFAULT FALSE,
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_status (status)
        )
      `);
      
      console.log('✅ Tabla users creada exitosamente');
      return;
    }

    // Obtener estructura de la tabla
    const columns = await query('DESCRIBE users');
    
    console.log('📋 Estructura actual de la tabla users:');
    console.log('Columna\t\tTipo\t\tNulo\tClave\tDefault');
    console.log('─'.repeat(60));
    
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(15)}\t${col.Type.padEnd(15)}\t${col.Null}\t${col.Key}\t${col.Default || ''}`);
    });

    console.log('\n🔍 Verificando columnas necesarias para admin...');
    
    const requiredColumns = ['email', 'password', 'role'];
    const existingColumns = columns.map(col => col.Field);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Faltan columnas requeridas:', missingColumns.join(', '));
      
      // Crear las columnas faltantes
      for (const column of missingColumns) {
        if (column === 'role') {
          await query(`ALTER TABLE users ADD COLUMN role ENUM('customer', 'admin') DEFAULT 'customer'`);
          console.log('✅ Columna role agregada');
        }
      }
    } else {
      console.log('✅ Todas las columnas requeridas existen');
    }

    // Verificar si existen columnas de nombre
    const hasFirstName = existingColumns.includes('first_name');
    const hasLastName = existingColumns.includes('last_name');
    
    if (!hasFirstName) {
      await query(`ALTER TABLE users ADD COLUMN first_name VARCHAR(100) AFTER password`);
      console.log('✅ Columna first_name agregada');
    }
    
    if (!hasLastName) {
      await query(`ALTER TABLE users ADD COLUMN last_name VARCHAR(100) AFTER first_name`);
      console.log('✅ Columna last_name agregada');
    }

    console.log('\n✅ Tabla users lista para admin');

  } catch (error) {
    console.error('❌ Error verificando tabla users:', error.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  checkUsersTable();
}

module.exports = { checkUsersTable };