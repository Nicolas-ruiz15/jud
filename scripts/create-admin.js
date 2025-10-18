// scripts/create-admin.js (Versión actualizada)
const bcrypt = require('bcryptjs');
const { query, closePool } = require('../lib/database');

async function getTableStructure() {
  try {
    const columns = await query('DESCRIBE users');
    return columns.map(col => col.Field);
  } catch (error) {
    console.log('❌ Error obteniendo estructura de tabla users:', error.message);
    return [];
  }
}

async function createAdmin() {
  try {
    console.log('🔧 Creando usuario administrador...\n');

    // Verificar estructura de la tabla
    const existingColumns = await getTableStructure();
    
    if (existingColumns.length === 0) {
      console.log('❌ No se pudo acceder a la tabla users');
      process.exit(1);
    }

    console.log('📋 Columnas disponibles en tabla users:', existingColumns.join(', '));

    // Datos del admin
    const adminData = {
      email: 'contacto@judaicabreslovcolombia.com',
      password: '15975312',  // Contraseña temporal
    };

    // Verificar si ya existe un admin
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = ? OR (role = "admin" AND role IS NOT NULL)',
      [adminData.email]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Ya existe un usuario administrador');
      console.log('📧 Para crear otro admin, usa un email diferente\n');
      process.exit(0);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Construir query dinámicamente basado en columnas disponibles
    const insertData = {
      email: adminData.email,
      password: hashedPassword,
    };

    // Agregar columnas opcionales si existen
    if (existingColumns.includes('first_name')) {
      insertData.first_name = 'Admin';
    }
    
    if (existingColumns.includes('last_name')) {
      insertData.last_name = 'Sistema';
    }
    
    if (existingColumns.includes('role')) {
      insertData.role = 'admin';
    }
    
    if (existingColumns.includes('status')) {
      insertData.status = 'active';
    }
    
    if (existingColumns.includes('email_verified')) {
      insertData.email_verified = true;
    }

    // Construir query
    const columns = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = columns.map(() => '?').join(', ');
    
    // Agregar timestamps si existen las columnas
    if (existingColumns.includes('created_at') && existingColumns.includes('updated_at')) {
      columns.push('created_at', 'updated_at');
      placeholders += ', NOW(), NOW()';
    } else if (existingColumns.includes('created_at')) {
      columns.push('created_at');
      placeholders += ', NOW()';
    }

    const insertQuery = `
      INSERT INTO users (${columns.join(', ')}) 
      VALUES (${placeholders})
    `;

    console.log('📝 Ejecutando query:', insertQuery);
    console.log('📊 Datos a insertar:', Object.keys(insertData));

    // Crear usuario admin
    const result = await query(insertQuery, values);

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Contraseña temporal:', adminData.password);
    console.log('🌐 URL de acceso: http://localhost:3000/admin/login\n');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login\n');

    // Verificar si se creó correctamente
    const createdUser = await query('SELECT id, email, role FROM users WHERE id = ?', [result.insertId]);
    console.log('🔍 Usuario creado:', createdUser[0]);
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    console.error('📝 Detalles del error:', error.sqlMessage || error.message);
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n💡 Sugerencia: Ejecuta primero:');
      console.log('   npm run check-users-table');
      console.log('   Para verificar y corregir la estructura de la tabla\n');
    }
    
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };