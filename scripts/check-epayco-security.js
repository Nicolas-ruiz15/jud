// scripts/check-epayco-security.js - Verificar la seguridad de la integración con ePayco
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
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

async function checkEpaycoSecurity() {
  console.log(`\n${colors.bright}${colors.green}=== Verificación de Seguridad de ePayco ===${colors.reset}\n`);
  
  // Verificar variables de entorno
  const publicKey = process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY;
  const privateKey = process.env.EPAYCO_PRIVATE_KEY;
  const customerId = process.env.EPAYCO_P_CUST_ID_CLIENTE;
  const pKey = process.env.EPAYCO_P_KEY;
  
  console.log(`${colors.cyan}Verificando variables de entorno:${colors.reset}`);
  
  // Verificar clave pública
  if (publicKey) {
    console.log(`${colors.green}✓ NEXT_PUBLIC_EPAYCO_PUBLIC_KEY está configurada${colors.reset}`);
    
    // Verificar si la clave pública está en el archivo correcto
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envLocalPath)) {
      const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
      if (envLocalContent.includes('NEXT_PUBLIC_EPAYCO_PUBLIC_KEY')) {
        console.log(`${colors.green}✓ NEXT_PUBLIC_EPAYCO_PUBLIC_KEY está en .env.local (correcto)${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ NEXT_PUBLIC_EPAYCO_PUBLIC_KEY no está en .env.local${colors.reset}`);
        console.log(`${colors.yellow}Recomendación: Mueve NEXT_PUBLIC_EPAYCO_PUBLIC_KEY a .env.local${colors.reset}`);
      }
    }
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('NEXT_PUBLIC_EPAYCO_PUBLIC_KEY')) {
        console.log(`${colors.red}✗ NEXT_PUBLIC_EPAYCO_PUBLIC_KEY está en .env (incorrecto)${colors.reset}`);
        console.log(`${colors.yellow}Recomendación: Mueve NEXT_PUBLIC_EPAYCO_PUBLIC_KEY a .env.local${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ NEXT_PUBLIC_EPAYCO_PUBLIC_KEY no está configurada${colors.reset}`);
  }
  
  // Verificar clave privada
  if (privateKey) {
    console.log(`${colors.green}✓ EPAYCO_PRIVATE_KEY está configurada${colors.reset}`);
    
    // Verificar si la clave privada está en el archivo correcto
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envLocalPath)) {
      const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
      if (envLocalContent.includes('EPAYCO_PRIVATE_KEY')) {
        console.log(`${colors.red}✗ EPAYCO_PRIVATE_KEY está en .env.local (incorrecto)${colors.reset}`);
        console.log(`${colors.yellow}Recomendación: Mueve EPAYCO_PRIVATE_KEY a .env${colors.reset}`);
      }
    }
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('EPAYCO_PRIVATE_KEY')) {
        console.log(`${colors.green}✓ EPAYCO_PRIVATE_KEY está en .env (correcto)${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ EPAYCO_PRIVATE_KEY no está en .env${colors.reset}`);
        console.log(`${colors.yellow}Recomendación: Mueve EPAYCO_PRIVATE_KEY a .env${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.red}✗ EPAYCO_PRIVATE_KEY no está configurada${colors.reset}`);
  }
  
  // Verificar ID de cliente
  if (customerId) {
    console.log(`${colors.green}✓ EPAYCO_P_CUST_ID_CLIENTE está configurada${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ EPAYCO_P_CUST_ID_CLIENTE no está configurada${colors.reset}`);
  }
  
  // Verificar P_KEY
  if (pKey) {
    console.log(`${colors.green}✓ EPAYCO_P_KEY está configurada${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ EPAYCO_P_KEY no está configurada${colors.reset}`);
  }
  
  // Verificar archivos de integración
  console.log(`\n${colors.cyan}Verificando archivos de integración:${colors.reset}`);
  
  const filesToCheck = [
    { path: 'services/epayco.js', name: 'Servicio ePayco' },
    { path: 'components/EpaycoPayment.js', name: 'Componente de pago' },
    { path: 'pages/api/epayco/proxy.js', name: 'Proxy API' },
    { path: 'pages/api/payment/epayco/confirmation.js', name: 'Webhook de confirmación' }
  ];
  
  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ ${file.name} encontrado${colors.reset}`);
      
      // Verificar contenido del archivo
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Verificar validación de firma en el webhook
      if (file.path === 'pages/api/payment/epayco/confirmation.js') {
        if (content.includes('validateSignature') && content.includes('epaycoService.validateSignature')) {
          console.log(`  ${colors.green}✓ Validación de firma implementada${colors.reset}`);
        } else {
          console.log(`  ${colors.red}✗ No se encontró validación de firma${colors.reset}`);
          console.log(`  ${colors.yellow}Recomendación: Implementa validación de firma en el webhook${colors.reset}`);
        }
      }
      
      // Verificar validación de dominio en el proxy
      if (file.path === 'pages/api/epayco/proxy.js') {
        if (content.includes('allowedDomains') && content.includes('hostname')) {
          console.log(`  ${colors.green}✓ Validación de dominio implementada${colors.reset}`);
        } else {
          console.log(`  ${colors.red}✗ No se encontró validación de dominio${colors.reset}`);
          console.log(`  ${colors.yellow}Recomendación: Implementa validación de dominio en el proxy${colors.reset}`);
        }
      }
    } else {
      console.log(`${colors.red}✗ ${file.name} no encontrado${colors.reset}`);
    }
  }
  
  // Verificar configuración de Next.js
  console.log(`\n${colors.cyan}Verificando configuración de Next.js:${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Verificar cabeceras de seguridad
    if (nextConfig.includes('X-Frame-Options') && nextConfig.includes('X-Content-Type-Options')) {
      console.log(`${colors.green}✓ Cabeceras de seguridad configuradas${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Cabeceras de seguridad no configuradas${colors.reset}`);
      console.log(`${colors.yellow}Recomendación: Configura cabeceras de seguridad en next.config.js${colors.reset}`);
    }
    
    // Verificar CORS para APIs
    if (nextConfig.includes('Access-Control-Allow-Origin') && nextConfig.includes('Access-Control-Allow-Methods')) {
      console.log(`${colors.green}✓ Configuración CORS implementada${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Configuración CORS no implementada${colors.reset}`);
      console.log(`${colors.yellow}Recomendación: Configura CORS en next.config.js${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Archivo next.config.js no encontrado${colors.reset}`);
  }
  
  // Recomendaciones finales
  console.log(`\n${colors.bright}${colors.green}=== Recomendaciones de Seguridad ===${colors.reset}\n`);
  
  console.log(`${colors.yellow}1. Utiliza dotenv-vault para gestionar secretos:${colors.reset}`);
  console.log(`   npm run secrets:setup`);
  
  console.log(`${colors.yellow}2. Asegúrate de que las claves privadas estén solo en .env y las públicas en .env.local${colors.reset}`);
  
  console.log(`${colors.yellow}3. Implementa validación de firma en todos los webhooks de ePayco${colors.reset}`);
  
  console.log(`${colors.yellow}4. Configura cabeceras de seguridad estrictas en next.config.js${colors.reset}`);
  
  console.log(`${colors.yellow}5. Limita los dominios permitidos en el proxy de ePayco${colors.reset}`);
  
  console.log(`${colors.yellow}6. Implementa rate limiting para prevenir ataques de fuerza bruta${colors.reset}`);
}

// Ejecutar la función principal
checkEpaycoSecurity().catch(error => {
  console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
  process.exit(1);
});