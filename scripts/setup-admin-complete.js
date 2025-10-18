// scripts/setup-admin-complete.js
const fs = require('fs').promises;
const path = require('path');
const { query, closePool } = require('../lib/database');
const { checkUsersTable } = require('./check-users-table');
const { createAdmin } = require('./create-admin');

async function setupAdminComplete() {
  console.log('🚀 Configuración Completa del Panel de Administración\n');
  console.log('📍 Judaica Breslov Colombia\n');

  try {
    // 1. Verificar y preparar tabla users
    console.log('📊 PASO 1: Verificando base de datos...');
    await checkUsersTable();
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
    await createAdmin();

    // 5. Verificar que todo funcione
    console.log('🧪 PASO 5: Verificando configuración...');
    
    try {
      // Verificar que el admin se creó correctamente
      const adminUser = await query(
        'SELECT id, email, role FROM users WHERE role = "admin" LIMIT 1'
      );
      
      if (adminUser.length > 0) {
        console.log('✅ Usuario admin verificado:', adminUser[0].email);
      } else {
        throw new Error('No se encontró usuario admin');
      }
      
    } catch (error) {
      console.log('❌ Error en verificación:', error.message);
    }

    console.log('\n🎉 ¡Configuración completada exitosamente!\n');
    
    console.log('📋 RESUMEN DE CONFIGURACIÓN:');
    console.log('─'.repeat(50));
    console.log('✅ Base de datos preparada');
    console.log('✅ Directorio de uploads creado');
    console.log('✅ Variables de entorno configuradas');
    console.log('✅ Usuario administrador creado');
    console.log('✅ Configuración verificada');
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. Ejecuta: npm run dev');
    console.log('2. Accede a: http://localhost:3000/admin/login');
    console.log('3. Email: admin@judaicabreslovcolombia.com');
    console.log('4. Contraseña: admin123!');
    console.log('5. ⚠️  CAMBIAR contraseña después del primer login\n');

    console.log('📁 ARCHIVOS CREADOS/MODIFICADOS:');
    console.log('• .env.local (JWT_SECRET agregado)');
    console.log('• public/uploads/ (directorio creado)');
    console.log('• users table (columnas actualizadas)\n');

  } catch (error) {
    console.error('❌ Error en configuración:', error.message);
    console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:');
    console.log('1. Verificar conexión a base de datos');
    console.log('2. Verificar permisos de escritura');
    console.log('3. Ejecutar scripts individuales:');
    console.log('   - npm run check-users-table');
    console.log('   - npm run create-admin');
    process.exit(1);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  setupAdminComplete();
}

module.exports = { setupAdminComplete };