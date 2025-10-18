// scripts/setup-admin-fixed.js
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('../lib/database');

async function setupAdminFixed() {
  console.log('🚀 Configuración Completa del Panel de Administración\n');
  console.log('📍 Judaica Breslov Colombia\n');

  try {
    // 1. Verificar y preparar tabla users
    console.log('📊 PASO 1: Verificando base de datos...');
    
    // Verificar estructura de la tabla users
    console.log('🔍 Verificando estructura de tabla users...');
    
    const tableExists = await query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );

    if (tableExists[0].count === 0) {
      console.log('❌ La tabla "users" no existe');
      throw new Error('Tabla users no encontrada');
    }

    // Obtener estructura actual
    const columns = await query('DESCRIBE users');
    const existingColumns = columns.map(col => col.Field);
    
    console.log('📋 Columnas existentes:', existingColumns.join(', '));

    // Verificar columnas necesarias para admin
    const requiredColumns = ['email', 'password', 'role'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Faltan columnas requeridas:', missingColumns.join(', '));
      throw new Error('Columnas requeridas faltantes');
    }

    // Agregar columnas opcionales si no existen
    if (!existingColumns.includes('first_name')) {
      await query(`ALTER TABLE users ADD COLUMN first_name VARCHAR(100) AFTER password`);
      console.log('✅ Columna first_name agregada');
    }
    
    if (!existingColumns.includes('last_name')) {
      await query(`ALTER TABLE users ADD COLUMN last_name VARCHAR(100) AFTER first_name`);
      console.log('✅ Columna last_name agregada');
    }

    console.log('✅ Base de datos preparada\n');

    // 2. Crear directorio de uploads
    console.log('📁 PASO 2: Configurando directorio de uploads...');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
      console.log('✅ Directorio de uploads ya existe');
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('✅ Directorio de uploads creado');
    }

    // 3. Verificar variables de entorno
    console.log('\n🔧 PASO 3: Verificando configuración...');
    const envFile = path.join(process.cwd(), '.env.local');
    let envExists = false;
    let jwtSecretExists = false;

    try {
      const envContent = await fs.readFile(envFile, 'utf8');
      envExists = true;
      
      if (envContent.includes('JWT_SECRET')) {
        jwtSecretExists = true;
        console.log('✅ Variables de entorno configuradas');
      } else {
        console.log('⚠️  Falta JWT_SECRET en .env.local');
      }
    } catch {
      console.log('⚠️  Archivo .env.local no encontrado');
    }

    if (!jwtSecretExists) {
      console.log('📝 Agregando JWT_SECRET a .env.local...');
      
      // Generar JWT_SECRET seguro
      const crypto = require('crypto');
      const jwtSecret = crypto.randomBytes(64).toString('hex');
      
      const envContent = envExists ? await fs.readFile(envFile, 'utf8') : '';
      const newEnvContent = envContent + `\n# JWT Secret para autenticación admin\nJWT_SECRET=${jwtSecret}\n`;
      
      await fs.writeFile(envFile, newEnvContent);
      console.log('✅ JWT_SECRET agregado automáticamente');
    }

    // 4. Crear usuario admin
    console.log('\n👤 PASO 4: Configurando usuario administrador...');
    
    // Datos del admin
    const adminData = {
      email: 'admin@judaicabreslovcolombia.com',
      password: 'admin123!',
    };

    // Verificar si ya existe un admin
    const existingAdmin = await query(
      'SELECT id, email FROM users WHERE email = ? OR role = "admin"',
      [adminData.email]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Ya existe un usuario administrador:', existingAdmin[0].email);
      console.log('✅ Saltando creación de admin\n');
    } else {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // Obtener columnas actualizadas después de las modificaciones
      const updatedColumns = await query('DESCRIBE users');
      const finalColumns = updatedColumns.map(col => col.Field);

      // Construir datos de inserción
      const insertData = {
        email: adminData.email,
        password: hashedPassword,
        role: 'admin'
      };

      // Agregar columnas opcionales
      if (finalColumns.includes('first_name')) {
        insertData.first_name = 'Admin';
      }
      
      if (finalColumns.includes('last_name')) {
        insertData.last_name = 'Sistema';
      }
      
      if (finalColumns.includes('name')) {
        insertData.name = 'Admin Sistema';
      }

      // Construir query dinámicamente
      const columns = Object.keys(insertData);
      const values = Object.values(insertData);
      const placeholders = columns.map(() => '?').join(', ');
      
      const insertQuery = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`;

      // Crear usuario admin
      const result = await query(insertQuery, values);

      console.log('✅ Usuario administrador creado exitosamente!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Contraseña temporal:', adminData.password);
    }

    // 5. Verificación final
    console.log('\n🧪 PASO 5: Verificando configuración...');
    
    const adminUser = await query(
      'SELECT id, email, role FROM users WHERE role = "admin" LIMIT 1'
    );
    
    if (adminUser.length > 0) {
      console.log('✅ Usuario admin verificado:', adminUser[0].email);
    } else {
      throw new Error('No se encontró usuario admin después de la configuración');
    }

    console.log('\n🎉 ¡Configuración completada exitosamente!\n');
    
    console.log('📋 RESUMEN DE CONFIGURACIÓN:');
    console.log('─'.repeat(50));
    console.log('✅ Base de datos preparada');
    console.log('✅ Directorio de uploads configurado');
    console.log('✅ Variables de entorno configuradas');
    console.log('✅ Usuario administrador listo');
    console.log('✅ Configuración verificada');
    
    console.log('\n🚀 ACCESO AL PANEL:');
    console.log('🌐 URL: http://localhost:3000/admin/login');
    console.log('📧 Email: admin@judaicabreslovcolombia.com');
    console.log('🔑 Contraseña: admin123!');
    console.log('⚠️  CAMBIAR contraseña después del primer login\n');

    console.log('🏃‍♂️ SIGUIENTE PASO:');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('❌ Error en configuración:', error.message);
    
    if (error.code === 'ER_POOL_ALREADY_CLOSED') {
      console.log('\n💡 Error de conexión de base de datos');
      console.log('🔧 Intenta ejecutar el script nuevamente');
    }
    
    console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:');
    console.log('1. Verificar conexión a base de datos en .env.local');
    console.log('2. Verificar permisos de base de datos');
    console.log('3. Reiniciar el proceso');
    
    process.exit(1);
  }
}

if (require.main === module) {
  setupAdminFixed();
}

module.exports = { setupAdminFixed };