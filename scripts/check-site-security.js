// scripts/check-site-security.js - Verificar la seguridad general del sitio web
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function checkSiteSecurity() {
  console.log(`\n${colors.bright}${colors.green}=== Verificación de Seguridad del Sitio ===${colors.reset}\n`);
  
  // Verificar variables de entorno
  console.log(`${colors.cyan}Verificando variables de entorno:${colors.reset}`);
  
  const envFiles = [
    { path: '.env', type: 'Privado' },
    { path: '.env.local', type: 'Público' },
    { path: '.env.example', type: 'Ejemplo' },
    { path: '.env.local.example', type: 'Ejemplo público' },
    { path: '.env.vault', type: 'Vault' }
  ];
  
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile.path);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ Archivo ${envFile.path} (${envFile.type}) encontrado${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Archivo ${envFile.path} (${envFile.type}) no encontrado${colors.reset}`);
    }
  }
  
  // Verificar configuración de seguridad de Next.js
  console.log(`\n${colors.cyan}Verificando configuración de seguridad de Next.js:${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Verificar cabeceras de seguridad
    const securityHeaders = [
      { name: 'X-Frame-Options', regex: /X-Frame-Options/i },
      { name: 'X-Content-Type-Options', regex: /X-Content-Type-Options/i },
      { name: 'X-XSS-Protection', regex: /X-XSS-Protection/i },
      { name: 'Strict-Transport-Security', regex: /Strict-Transport-Security/i },
      { name: 'Referrer-Policy', regex: /Referrer-Policy/i },
      { name: 'Permissions-Policy', regex: /Permissions-Policy/i }
    ];
    
    for (const header of securityHeaders) {
      if (header.regex.test(nextConfig)) {
        console.log(`${colors.green}✓ Cabecera ${header.name} configurada${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Cabecera ${header.name} no configurada${colors.reset}`);
      }
    }
    
    // Verificar CORS
    if (/Access-Control-Allow-Origin/i.test(nextConfig)) {
      console.log(`${colors.green}✓ CORS configurado${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ CORS no configurado${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Archivo next.config.js no encontrado${colors.reset}`);
  }
  
  // Verificar dependencias de seguridad
  console.log(`\n${colors.cyan}Verificando dependencias de seguridad:${colors.reset}`);
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const securityDependencies = [
      { name: 'dotenv-vault', purpose: 'Gestión segura de secretos' },
      { name: 'helmet', purpose: 'Cabeceras de seguridad HTTP' },
      { name: 'csurf', purpose: 'Protección CSRF' },
      { name: 'rate-limiter-flexible', purpose: 'Rate limiting' }
    ];
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of securityDependencies) {
      if (dependencies[dep.name]) {
        console.log(`${colors.green}✓ ${dep.name} instalado (${dep.purpose})${colors.reset}`);
      } else {
        console.log(`${colors.yellow}? ${dep.name} no instalado (${dep.purpose})${colors.reset}`);
      }
    }
    
    // Verificar scripts de seguridad
    console.log(`\n${colors.cyan}Verificando scripts de seguridad:${colors.reset}`);
    
    const securityScripts = [
      { name: 'test:db-security', purpose: 'Verificar seguridad de base de datos' },
      { name: 'test:epayco-security', purpose: 'Verificar seguridad de ePayco' },
      { name: 'secrets:setup', purpose: 'Configurar dotenv-vault' },
      { name: 'secrets:push', purpose: 'Subir secretos a dotenv-vault' },
      { name: 'secrets:pull', purpose: 'Descargar secretos de dotenv-vault' }
    ];
    
    for (const script of securityScripts) {
      if (packageJson.scripts && packageJson.scripts[script.name]) {
        console.log(`${colors.green}✓ Script ${script.name} configurado (${script.purpose})${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Script ${script.name} no configurado (${script.purpose})${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ Archivo package.json no encontrado${colors.reset}`);
  }
  
  // Verificar configuración de SSL de la base de datos
  console.log(`\n${colors.cyan}Verificando configuración SSL de la base de datos:${colors.reset}`);
  
  const dbConfigPath = path.join(process.cwd(), 'lib/database.js');
  if (fs.existsSync(dbConfigPath)) {
    const dbConfig = fs.readFileSync(dbConfigPath, 'utf8');
    
    if (/ssl:\s*process\.env\.DB_USE_SSL/i.test(dbConfig)) {
      console.log(`${colors.green}✓ Configuración SSL de base de datos implementada${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Configuración SSL de base de datos no implementada${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Archivo lib/database.js no encontrado${colors.reset}`);
  }
  
  // Verificar archivos de API
  console.log(`\n${colors.cyan}Verificando seguridad de APIs:${colors.reset}`);
  
  const apiDir = path.join(process.cwd(), 'pages/api');
  if (fs.existsSync(apiDir)) {
    // Contar archivos de API
    let apiFiles = [];
    try {
      const findApiFiles = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            findApiFiles(fullPath);
          } else if (file.name.endsWith('.js')) {
            apiFiles.push(fullPath);
          }
        }
      };
      
      findApiFiles(apiDir);
      console.log(`${colors.green}✓ ${apiFiles.length} archivos de API encontrados${colors.reset}`);
      
      // Verificar implementación de seguridad en APIs
      let apisWithValidation = 0;
      let apisWithErrorHandling = 0;
      
      for (const apiFile of apiFiles) {
        const content = fs.readFileSync(apiFile, 'utf8');
        
        // Verificar validación de datos
        if (/validate|validation|schema|joi|yup|zod/i.test(content)) {
          apisWithValidation++;
        }
        
        // Verificar manejo de errores
        if (/try\s*{|catch\s*\(|error|exception/i.test(content)) {
          apisWithErrorHandling++;
        }
      }
      
      const validationPercentage = Math.round((apisWithValidation / apiFiles.length) * 100);
      const errorHandlingPercentage = Math.round((apisWithErrorHandling / apiFiles.length) * 100);
      
      console.log(`${validationPercentage >= 70 ? colors.green : colors.yellow}✓ ${validationPercentage}% de APIs con validación de datos${colors.reset}`);
      console.log(`${errorHandlingPercentage >= 70 ? colors.green : colors.yellow}✓ ${errorHandlingPercentage}% de APIs con manejo de errores${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error al analizar archivos de API: ${error.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Directorio pages/api no encontrado${colors.reset}`);
  }
  
  // Recomendaciones finales
  console.log(`\n${colors.bright}${colors.green}=== Recomendaciones de Seguridad ===${colors.reset}\n`);
  
  console.log(`${colors.yellow}1. Implementa rate limiting para prevenir ataques de fuerza bruta:${colors.reset}`);
  console.log(`   npm install rate-limiter-flexible`);
  
  console.log(`${colors.yellow}2. Configura todas las cabeceras de seguridad en next.config.js:${colors.reset}`);
  console.log(`   - X-Frame-Options: SAMEORIGIN`);
  console.log(`   - X-Content-Type-Options: nosniff`);
  console.log(`   - X-XSS-Protection: 1; mode=block`);
  console.log(`   - Strict-Transport-Security: max-age=31536000; includeSubDomains`);
  console.log(`   - Referrer-Policy: strict-origin-when-cross-origin`);
  console.log(`   - Permissions-Policy: camera=(), microphone=(), geolocation=()`);
  
  console.log(`${colors.yellow}3. Implementa validación de datos en todas las APIs:${colors.reset}`);
  console.log(`   npm install zod`);
  
  console.log(`${colors.yellow}4. Asegúrate de que todas las APIs tengan manejo de errores adecuado${colors.reset}`);
  
  console.log(`${colors.yellow}5. Utiliza dotenv-vault para gestionar secretos:${colors.reset}`);
  console.log(`   npm run secrets:setup`);
  
  console.log(`${colors.yellow}6. Ejecuta verificaciones de seguridad regularmente:${colors.reset}`);
  console.log(`   npm run test:db-security`);
  console.log(`   npm run test:epayco-security`);
  console.log(`   npm run test:site-security`);
}

// Ejecutar la función principal
checkSiteSecurity().catch(error => {
  console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
  process.exit(1);
});