// Cargar variables de entorno
require('dotenv').config();

console.log('🔍 Probando configuración del proyecto...\n');

// Verificar variables de entorno críticas
const requiredEnvVars = {
  'Base de Datos': {
    'DB_HOST': process.env.DB_HOST,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD ? '***' : undefined,
    'DB_NAME': process.env.DB_NAME
  },
  'WooCommerce': {
    'WOOCOMMERCE_URL': process.env.WOOCOMMERCE_URL,
    'WOOCOMMERCE_CONSUMER_KEY': process.env.WOOCOMMERCE_CONSUMER_KEY ? 'ck_***' : undefined,
    'WOOCOMMERCE_CONSUMER_SECRET': process.env.WOOCOMMERCE_CONSUMER_SECRET ? 'cs_***' : undefined
  },
  'ePayco': {
    'EPAYCO_PUBLIC_KEY': process.env.EPAYCO_PUBLIC_KEY,
    'EPAYCO_PRIVATE_KEY': process.env.EPAYCO_PRIVATE_KEY ? '***' : undefined,
    'EPAYCO_CUSTOMER_ID': process.env.EPAYCO_CUSTOMER_ID
  },
  'JWT': {
    'JWT_SECRET': process.env.JWT_SECRET ? (process.env.JWT_SECRET.length > 20 ? '✅ Configurado' : '⚠️ Muy corto') : '❌ No configurado'
  }
};

let hasErrors = false;

for (const [category, vars] of Object.entries(requiredEnvVars)) {
  console.log(`📋 ${category}:`);
  
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined || value === null || value === '') {
      console.log(`   ❌ ${key}: No configurado`);
      hasErrors = true;
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  }
  console.log('');
}

// Probar conexión a base de datos
async function testDatabase() {
  console.log('🗄️ Probando conexión a base de datos...');
  
  try {
    const { query } = require('../lib/database');
    const result = await query('SELECT 1 as test');
    console.log('   ✅ Conexión a base de datos exitosa');
    return true;
  } catch (error) {
    console.log('   ❌ Error conectando a base de datos:', error.message);
    return false;
  }
}

// Probar conexión a WooCommerce
async function testWooCommerce() {
  console.log('🛒 Probando conexión a WooCommerce...');
  
  if (!process.env.WOOCOMMERCE_URL || !process.env.WOOCOMMERCE_CONSUMER_KEY || !process.env.WOOCOMMERCE_CONSUMER_SECRET) {
    console.log('   ❌ Variables de WooCommerce no configuradas');
    return false;
  }
  
  try {
    const WooCommerceService = require('../services/woocommerce');
    const wooService = new WooCommerceService();
    
    // Intentar obtener una categoría para probar la conexión
    const categories = await wooService.getCategories({ per_page: 1 });
    console.log(`   ✅ Conexión a WooCommerce exitosa - ${categories.length > 0 ? 'Con datos' : 'Sin categorías'}`);
    return true;
  } catch (error) {
    console.log('   ❌ Error conectando a WooCommerce:', error.message);
    return false;
  }
}

// Ejecutar pruebas
async function runTests() {
  if (hasErrors) {
    console.log('❌ Hay variables de entorno faltantes. Por favor configúralas antes de continuar.\n');
    return;
  }
  
  console.log('🧪 Ejecutando pruebas de conectividad...\n');
  
  const dbTest = await testDatabase();
  const wooTest = await testWooCommerce();
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`   Base de datos: ${dbTest ? '✅' : '❌'}`);
  console.log(`   WooCommerce: ${wooTest ? '✅' : '❌'}`);
  
  if (dbTest && wooTest) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El proyecto está listo para sincronizar.');
    console.log('\n📝 Comandos disponibles:');
    console.log('   npm run db:migrate     - Migrar base de datos');
    console.log('   npm run db:seed        - Poblar con datos de ejemplo');
    console.log('   npm run sync:woocommerce - Sincronizar productos');
    console.log('   npm run dev            - Iniciar en desarrollo');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa las configuraciones arriba.');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error en pruebas:', error);
      process.exit(1);
    });
}

module.exports = { runTests };