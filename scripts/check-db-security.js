// scripts/check-db-security.js - Verificar la seguridad de la conexión a la base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function checkDatabaseSecurity() {
  console.log(`\n${colors.bright}${colors.green}=== Verificación de Seguridad de Base de Datos ===${colors.reset}\n`);
  
  // Verificar variables de entorno
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT || 3306;
  const dbUseSSL = process.env.DB_USE_SSL === 'true';
  const dbRejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED === 'true';
  
  console.log(`${colors.cyan}Configuración actual:${colors.reset}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Puerto: ${dbPort}`);
  console.log(`Usuario: ${dbUser}`);
  console.log(`Base de datos: ${dbName}`);
  console.log(`SSL habilitado: ${dbUseSSL ? colors.green + 'Sí' + colors.reset : colors.red + 'No' + colors.reset}`);
  console.log(`Rechazar no autorizado: ${dbRejectUnauthorized ? colors.green + 'Sí' + colors.reset : colors.yellow + 'No' + colors.reset}`);
  
  // Verificar si falta alguna variable crítica
  if (!dbUser || !dbPassword || !dbName) {
    console.error(`\n${colors.red}Error: Faltan variables de entorno críticas para la base de datos.${colors.reset}`);
    console.log(`Asegúrate de configurar DB_USER, DB_PASSWORD y DB_NAME en el archivo .env`);
    return;
  }
  
  // Intentar conexión
  try {
    console.log(`\n${colors.cyan}Intentando conexión a la base de datos...${colors.reset}`);
    
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      ssl: dbUseSSL ? {
        rejectUnauthorized: dbRejectUnauthorized
      } : undefined
    });
    
    console.log(`${colors.green}✓ Conexión exitosa${colors.reset}`);
    
    // Verificar si la conexión usa SSL
    const [sslRows] = await connection.execute('SHOW STATUS LIKE \'Ssl_cipher\'');
    const sslEnabled = sslRows.length > 0 && sslRows[0].Value && sslRows[0].Value !== '';
    
    if (sslEnabled) {
      console.log(`${colors.green}✓ La conexión está utilizando SSL/TLS${colors.reset}`);
      
      // Obtener más detalles sobre la conexión SSL
      const [sslVersion] = await connection.execute('SHOW STATUS LIKE \'Ssl_version\'');
      const [sslCipher] = await connection.execute('SHOW STATUS LIKE \'Ssl_cipher\'');
      
      console.log(`${colors.cyan}Detalles SSL:${colors.reset}`);
      console.log(`Versión: ${sslVersion[0].Value}`);
      console.log(`Cifrado: ${sslCipher[0].Value}`);
    } else {
      console.log(`${colors.red}✗ La conexión NO está utilizando SSL/TLS${colors.reset}`);
      console.log(`${colors.yellow}Recomendación: Habilita SSL para conexiones a la base de datos en producción.${colors.reset}`);
      console.log(`Configura DB_USE_SSL=true en el archivo .env`);
    }
    
    // Verificar usuario y privilegios
    console.log(`\n${colors.cyan}Verificando privilegios del usuario...${colors.reset}`);
    const [userPrivileges] = await connection.execute('SHOW GRANTS FOR CURRENT_USER()');
    
    console.log(`Privilegios:`);
    userPrivileges.forEach(row => {
      const grantInfo = Object.values(row)[0];
      console.log(`- ${grantInfo}`);
      
      // Verificar si tiene privilegios excesivos
      if (grantInfo.includes('ALL PRIVILEGES') && grantInfo.includes('*.*')) {
        console.log(`${colors.red}✗ El usuario tiene privilegios excesivos (ALL PRIVILEGES)${colors.reset}`);
        console.log(`${colors.yellow}Recomendación: Limita los privilegios solo a lo necesario.${colors.reset}`);
      }
    });
    
    // Cerrar conexión
    await connection.end();
    
    // Recomendaciones finales
    console.log(`\n${colors.bright}${colors.green}=== Recomendaciones de Seguridad ===${colors.reset}`);
    
    if (!dbUseSSL) {
      console.log(`${colors.yellow}1. Habilita SSL para conexiones a la base de datos:${colors.reset}`);
      console.log(`   Configura DB_USE_SSL=true en el archivo .env`);
    }
    
    if (dbUseSSL && !dbRejectUnauthorized) {
      console.log(`${colors.yellow}2. Habilita la verificación de certificados SSL:${colors.reset}`);
      console.log(`   Configura DB_REJECT_UNAUTHORIZED=true en el archivo .env`);
    }
    
    console.log(`${colors.yellow}3. Asegúrate de que el usuario de la base de datos tenga solo los privilegios necesarios.${colors.reset}`);
    console.log(`${colors.yellow}4. Considera usar un sistema de gestión de secretos como dotenv-vault.${colors.reset}`);
    console.log(`   Ejecuta: npm run secrets:setup`);
    
  } catch (error) {
    console.error(`\n${colors.red}Error al conectar a la base de datos:${colors.reset}`, error.message);
    
    if (error.message.includes('SSL connection is required')) {
      console.log(`\n${colors.yellow}El servidor requiere conexiones SSL. Asegúrate de configurar:${colors.reset}`);
      console.log(`DB_USE_SSL=true`);
    }
    
    if (error.message.includes('certificate')) {
      console.log(`\n${colors.yellow}Problema con el certificado SSL. Puedes:${colors.reset}`);
      console.log(`1. Obtener un certificado válido para el servidor MySQL`);
      console.log(`2. Configurar DB_REJECT_UNAUTHORIZED=false (menos seguro)`);
    }
  }
}

// Ejecutar la función principal
checkDatabaseSecurity().catch(error => {
  console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
  process.exit(1);
});