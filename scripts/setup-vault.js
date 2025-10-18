// scripts/setup-vault.js - Configuración inicial de dotenv-vault
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Función para ejecutar comandos con manejo de errores
function runCommand(command) {
  try {
    console.log(`${colors.cyan}Ejecutando: ${command}${colors.reset}`);
    const output = execSync(command, { stdio: 'pipe' }).toString();
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout ? error.stdout.toString() : ''
    };
  }
}

// Función principal
async function setupVault() {
  console.log(`\n${colors.bright}${colors.green}=== Configuración de dotenv-vault ===${colors.reset}\n`);
  
  // Verificar si .env.vault ya existe
  const vaultPath = path.join(process.cwd(), '.env.vault');
  const vaultExists = fs.existsSync(vaultPath);
  
  if (vaultExists) {
    console.log(`${colors.yellow}El archivo .env.vault ya existe.${colors.reset}`);
    console.log(`Si deseas reiniciar la configuración, elimina el archivo .env.vault primero.\n`);
  } else {
    // Inicializar dotenv-vault
    console.log(`${colors.cyan}Inicializando dotenv-vault...${colors.reset}`);
    const initResult = runCommand('npx dotenv-vault new');
    
    if (!initResult.success) {
      console.error(`${colors.red}Error al inicializar dotenv-vault:${colors.reset}`);
      console.error(initResult.error);
      return;
    }
    
    console.log(`${colors.green}dotenv-vault inicializado correctamente.${colors.reset}\n`);
  }
  
  // Mostrar instrucciones
  console.log(`${colors.bright}${colors.green}=== Próximos pasos ===${colors.reset}\n`);
  console.log(`1. Inicia sesión en dotenv-vault:`);
  console.log(`   ${colors.cyan}npm run secrets:login${colors.reset}`);
  console.log(`\n2. Sube tus variables de entorno al vault:`);
  console.log(`   ${colors.cyan}npm run secrets:push${colors.reset}`);
  console.log(`\n3. Genera las claves para los diferentes entornos:`);
  console.log(`   ${colors.cyan}npm run secrets:keys${colors.reset}`);
  console.log(`\n4. Abre el panel de dotenv-vault para gestionar tus secretos:`);
  console.log(`   ${colors.cyan}npm run secrets:open${colors.reset}`);
  
  console.log(`\n${colors.bright}${colors.green}=== Beneficios de dotenv-vault ===${colors.reset}\n`);
  console.log(`1. Gestión segura de secretos sin exponerlos en el código`);
  console.log(`2. Sincronización de variables entre entornos (desarrollo, producción, etc.)`);
  console.log(`3. Control de acceso y auditoría de cambios`);
  console.log(`4. Integración con CI/CD`);
  
  console.log(`\n${colors.bright}${colors.green}=== Documentación ===${colors.reset}`);
  console.log(`Para más información, visita: ${colors.cyan}https://www.dotenv.org/docs${colors.reset}\n`);
}

// Ejecutar la función principal
setupVault().catch(error => {
  console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
  process.exit(1);
});