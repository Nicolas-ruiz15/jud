// scripts/setup-env.js
const fs = require('fs').promises;
const path = require('path');

async function setupEnvironment() {
  try {
    console.log('🔧 Configurando variables de entorno...\n');

    const envFile = path.join(process.cwd(), '.env.local');
    let envContent = '';
    let envExists = false;

    // Verificar si existe .env.local
    try {
      envContent = await fs.readFile(envFile, 'utf8');
      envExists = true;
      console.log('📄 Archivo .env.local encontrado');
    } catch {
      console.log('📄 Archivo .env.local no existe, creando...');
    }

    // Verificar JWT_SECRET
    if (envContent.includes('JWT_SECRET')) {
      console.log('✅ JWT_SECRET ya existe');
    } else {
      console.log('🔑 Generando JWT_SECRET...');
      
      const crypto = require('crypto');
      const jwtSecret = crypto.randomBytes(64).toString('hex');
      
      const jwtConfig = `
# JWT Secret para autenticación admin
JWT_SECRET=${jwtSecret}
`;
      
      envContent += jwtConfig;
      console.log('✅ JWT_SECRET generado');
    }

    // Verificar SITE_URL
    if (!envContent.includes('SITE_URL')) {
      const siteConfig = `
# URLs del sitio
SITE_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
`;
      envContent += siteConfig;
      console.log('✅ URLs del sitio agregadas');
    }

    // Escribir archivo
    await fs.writeFile(envFile, envContent);
    console.log('✅ Archivo .env.local actualizado');

    // Crear directorio uploads
    console.log('\n📁 Configurando directorio de uploads...');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.access(uploadsDir);
      console.log('✅ Directorio public/uploads ya existe');
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('✅ Directorio public/uploads creado');
    }

    console.log('\n🎉 Configuración de entorno completada!\n');
    
    console.log('📋 VARIABLES CONFIGURADAS:');
    console.log('• JWT_SECRET - Para autenticación admin');
    console.log('• SITE_URL - URL del sitio web'); 
    console.log('• ADMIN_URL - URL del panel admin');
    console.log('• public/uploads/ - Directorio para imágenes\n');

  } catch (error) {
    console.error('❌ Error configurando entorno:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment };