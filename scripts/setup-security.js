// scripts/setup-security.js - Script para configurar las dependencias de seguridad
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para ejecutar comandos
function runCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error al verificar si existe el archivo ${filePath}:`, error);
    return false;
  }
}

// Función principal
async function setupSecurity() {
  console.log('🔒 Configurando dependencias de seguridad...');
  
  // Verificar que estamos en la raíz del proyecto
  if (!fileExists('package.json')) {
    console.error('❌ Este script debe ejecutarse desde la raíz del proyecto');
    process.exit(1);
  }
  
  // Instalar dependencias de seguridad
  console.log('📦 Instalando dependencias de seguridad...');
  
  const dependencies = [
    'zod@3.22.4',
    'rate-limiter-flexible@2.4.2',
    'next-connect@1.0.0'
  ];
  
  const installCommand = `npm install ${dependencies.join(' ')} --save`;
  if (!runCommand(installCommand)) {
    console.error('❌ Error al instalar dependencias');
    process.exit(1);
  }
  
  // Verificar que los archivos de seguridad existen
  console.log('🔍 Verificando archivos de seguridad...');
  
  const securityFiles = [
    'lib/validation.js',
    'lib/rate-limiter.js',
    'lib/epayco-validation.js',
    'middleware/security.js',
    'middleware/epayco.js',
    'pages/api/_middleware.js',
    'pages/api/epayco/proxy.js',
    'docs/EPAYCO-CORS.md',
    'scripts/test-epayco-cors.js'
  ];
  
  let missingFiles = [];
  for (const file of securityFiles) {
    if (!fileExists(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.warn('⚠️ Los siguientes archivos de seguridad no existen:');
    missingFiles.forEach(file => console.warn(`   - ${file}`));
    console.warn('Por favor, crea estos archivos manualmente o ejecuta los scripts correspondientes.');
  } else {
    console.log('✅ Todos los archivos de seguridad están presentes');
  }
  
  // Ejecutar pruebas de seguridad
  console.log('🧪 Ejecutando pruebas de seguridad...');
  
  const securityScripts = [
    'test:db-security',
    'test:epayco-security',
    'test:site-security'
  ];
  
  for (const script of securityScripts) {
    console.log(`\n🔍 Ejecutando ${script}...`);
    runCommand(`npm run ${script}`);
  }
  
  console.log('\n✅ Configuración de seguridad completada');
  console.log('\n📚 Para más información, consulta el archivo SECURITY.md');
}

// Ejecutar la función principal
setupSecurity().catch(error => {
  console.error('Error inesperado:', error);
  process.exit(1);
});