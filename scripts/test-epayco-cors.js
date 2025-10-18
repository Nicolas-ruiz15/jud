// scripts/test-epayco-cors.js - Script para probar la configuración CORS de ePayco

/**
 * Este script prueba la configuración CORS del proxy de ePayco
 * realizando solicitudes a diferentes endpoints de ePayco a través del proxy.
 */

// En Node.js 18+, fetch es global, pero en versiones anteriores necesitamos importarlo
let fetch;
try {
  // Intentar usar fetch global (Node.js 18+)
  fetch = global.fetch;
} catch (e) {
  // Si no está disponible, usar el módulo node-fetch
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

const https = require('https');

// Configuración
const BASE_URL = process.env.SITE_URL || 'http://localhost:3000';
const PROXY_URL = `${BASE_URL}/api/epayco/proxy`;
const EPAYCO_PUBLIC_KEY = process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY || 'NO_KEY_FOUND';

// Forzar protocolo HTTP para pruebas locales
if (BASE_URL.includes('localhost')) {
  console.log('🔒 Usando HTTP para pruebas locales');
}

// Dominios de ePayco a probar
const EPAYCO_DOMAINS = [
  'secure.epayco.co',
  'checkout.epayco.co',
  'api.secure.epayco.co',
  'api.epayco.co'
];

// Endpoints específicos a probar
const TEST_ENDPOINTS = [
  'https://secure.epayco.co/validation/v1/reference',
  'https://api.secure.epayco.co/payment/process',
  'https://checkout.epayco.co/checkout.js'
];

// Agente HTTPS que ignora errores de certificado (solo para pruebas)
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Función para crear un controlador de timeout para fetch
function createTimeoutController(timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId)
  };
}

/**
 * Prueba una solicitud a través del proxy
 */
async function testProxyRequest(targetUrl) {
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxyUrl = `${PROXY_URL}?target=${encodedUrl}`;
  
  console.log(`\n🔍 Probando: ${targetUrl}`);
  console.log(`🔄 A través de: ${proxyUrl}`);
  
  try {
    // Primero probar OPTIONS (preflight)
    console.log('📤 Enviando solicitud OPTIONS (preflight)...');
    const timeoutController = createTimeoutController(5000); // 5 segundos de timeout
    
    const fetchOptions = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, X-Epayco-Key'
      },
      agent,
      signal: timeoutController.signal
    };
    
    // Usar fetch de manera más robusta
    let optionsResponse;
    if (typeof fetch === 'function') {
      optionsResponse = await fetch(proxyUrl, fetchOptions);
    } else {
      optionsResponse = await import('node-fetch').then(({default: nodeFetch}) => nodeFetch(proxyUrl, fetchOptions));
    }
    
    console.log(`✅ Respuesta OPTIONS: ${optionsResponse.status} ${optionsResponse.statusText}`);
    console.log('📋 Headers de respuesta OPTIONS:');
    optionsResponse.headers.forEach((value, name) => {
      console.log(`   ${name}: ${value}`);
    });
    
    // Luego probar GET
    console.log('\n📤 Enviando solicitud GET...');
    // Limpiar el timeout anterior y crear uno nuevo
    timeoutController.clear();
    const getTimeoutController = createTimeoutController(5000); // 5 segundos de timeout
    
    const getFetchOptions = {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      },
      agent,
      signal: getTimeoutController.signal
    };
    
    // Usar fetch de manera más robusta
    let getResponse;
    if (typeof fetch === 'function') {
      getResponse = await fetch(proxyUrl, getFetchOptions);
    } else {
      getResponse = await import('node-fetch').then(({default: nodeFetch}) => nodeFetch(proxyUrl, getFetchOptions));
    }
    
    console.log(`✅ Respuesta GET: ${getResponse.status} ${getResponse.statusText}`);
    console.log('📋 Headers de respuesta GET:');
    getResponse.headers.forEach((value, name) => {
      console.log(`   ${name}: ${value}`);
    });
    
    // Intentar leer el cuerpo (puede fallar si no es JSON)
    try {
      // Limpiar el timeout
      getTimeoutController.clear();
      
      const contentType = getResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await getResponse.json();
        console.log('📄 Respuesta (primeros 100 caracteres):', 
          JSON.stringify(body).substring(0, 100) + '...');
      } else if (contentType.includes('text/')) {
        const text = await getResponse.text();
        console.log('📄 Respuesta (primeros 100 caracteres):', 
          text.substring(0, 100) + '...');
      } else {
        console.log('📄 Respuesta: [Contenido binario o no legible]');
      }
    } catch (bodyError) {
      console.log('⚠️ No se pudo leer el cuerpo de la respuesta:', bodyError.message);
    } finally {
      // Asegurarse de limpiar los timeouts
      if (timeoutController) timeoutController.clear();
      if (getTimeoutController) getTimeoutController.clear();
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.code) {
      console.error(`   Código de error: ${error.code}`);
    }
    if (error.cause) {
      console.error(`   Causa: ${error.cause}`);
    }
    if (error.stack && process.env.DEBUG) {
      console.error(`   Stack: ${error.stack}`);
    }
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando pruebas de CORS para ePayco');
  console.log(`🔑 Clave pública de ePayco: ${EPAYCO_PUBLIC_KEY.substring(0, 5)}...`);
  console.log(`🌐 URL base: ${BASE_URL}`);
  console.log(`🔄 URL del proxy: ${PROXY_URL}`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Probar endpoints específicos
  console.log('\n==== PROBANDO ENDPOINTS ESPECÍFICOS ====');
  for (const endpoint of TEST_ENDPOINTS) {
    const success = await testProxyRequest(endpoint);
    if (success) successCount++; else failCount++;
  }
  
  // Probar dominios generales
  console.log('\n==== PROBANDO DOMINIOS GENERALES ====');
  for (const domain of EPAYCO_DOMAINS) {
    const success = await testProxyRequest(`https://${domain}/`);
    if (success) successCount++; else failCount++;
  }
  
  // Resumen
  console.log('\n==== RESUMEN DE PRUEBAS ====');
  console.log(`✅ Pruebas exitosas: ${successCount}`);
  console.log(`❌ Pruebas fallidas: ${failCount}`);
  console.log(`📊 Tasa de éxito: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
  
  if (failCount > 0) {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa los logs para más detalles.');
    process.exit(1);
  } else {
    console.log('\n🎉 Todas las pruebas fueron exitosas!');
    process.exit(0);
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});