// scripts/setup-cache.js - Script para configurar el sistema de caché
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando sistema de caché para tu proyecto...\n');

// 1. Instalar dependencias necesarias
console.log('📦 Instalando dependencias...');
try {
  execSync('npm install node-cache', { stdio: 'inherit' });
  console.log('✅ node-cache instalado\n');
} catch (error) {
  console.error('❌ Error instalando dependencias:', error.message);
  process.exit(1);
}

// 2. Crear estructura de carpetas
console.log('📁 Creando estructura de carpetas...');
const directories = [
  'lib/cache',
  'hooks',
  'scripts'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Creado: ${dir}`);
  } else {
    console.log(`⏭️  Ya existe: ${dir}`);
  }
});

// 3. Crear archivo de variables de entorno si no existe
console.log('\n📝 Configurando variables de entorno...');
const envPath = path.join(process.cwd(), '.env.local');
const envContent = `
# Configuración de Caché (opcional)
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_MAX_ENTRIES=1000
CACHE_MEMORY_CHECK_PERIOD=600

# Redis (solo si decides usarlo después)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
`;

if (!fs.existsSync(envPath)) {
  fs.appendFileSync(envPath, envContent);
  console.log('✅ Variables de entorno agregadas a .env.local');
} else {
  console.log('⏭️  .env.local ya existe (verifica si necesitas agregar las variables de caché)');
}

// 4. Actualizar package.json con nuevos scripts
console.log('\n📋 Agregando scripts al package.json...');
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const newScripts = {
  'cache:stats': 'node scripts/cache-stats.js',
  'cache:clear': 'node scripts/cache-clear.js',
  'cache:test': 'node scripts/test-cache.js'
};

let scriptsAdded = false;
Object.keys(newScripts).forEach(key => {
  if (!packageJson.scripts[key]) {
    packageJson.scripts[key] = newScripts[key];
    scriptsAdded = true;
    console.log(`✅ Script agregado: ${key}`);
  }
});

if (scriptsAdded) {
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

// 5. Crear script de estadísticas de caché
console.log('\n📊 Creando scripts de utilidad...');

const cacheStatsScript = `// scripts/cache-stats.js
import cache from '../lib/cache/memory-cache.js';

async function showCacheStats() {
  const stats = cache.getStats();
  
  console.log('📊 === ESTADÍSTICAS DE CACHÉ ===');
  console.log('Hit Rate:', stats.hitRate);
  console.log('Total Keys:', stats.totalKeys);
  console.log('Memory Usage:', \`\${stats.memoryUsage.toFixed(2)} MB\`);
  console.log('Hits:', stats.hits);
  console.log('Misses:', stats.misses);
  console.log('Sets:', stats.sets);
  console.log('Deletes:', stats.deletes);
  console.log('================================');
}

showCacheStats();
`;

fs.writeFileSync(
  path.join(process.cwd(), 'scripts/cache-stats.js'),
  cacheStatsScript
);
console.log('✅ Script cache-stats.js creado');

// 6. Crear script para limpiar caché
const cacheClearScript = `// scripts/cache-clear.js
import cache from '../lib/cache/memory-cache.js';

async function clearCache() {
  const pattern = process.argv[2];
  
  if (pattern) {
    const deleted = await cache.delPattern(pattern);
    console.log(\`🗑️ Eliminadas \${deleted} entradas que coinciden con: \${pattern}\`);
  } else {
    await cache.flush();
    console.log('🗑️ Todo el caché ha sido limpiado');
  }
}

clearCache();
`;

fs.writeFileSync(
  path.join(process.cwd(), 'scripts/cache-clear.js'),
  cacheClearScript
);
console.log('✅ Script cache-clear.js creado');

// 7. Crear script de prueba de caché
const testCacheScript = `// scripts/test-cache.js
import cache from '../lib/cache/memory-cache.js';
import { CACHE_CONFIG } from '../lib/cache/config.js';

async function testCache() {
  console.log('🧪 Iniciando prueba de caché...\n');
  
  // Test 1: Set y Get básico
  console.log('Test 1: Set/Get básico');
  await cache.set('test:key1', { data: 'test value' }, 10);
  const value1 = await cache.get('test:key1');
  console.log('✅ Valor recuperado:', value1);
  
  // Test 2: TTL
  console.log('\\nTest 2: TTL (espera 2 segundos)');
  await cache.set('test:ttl', 'expires soon', 1);
  setTimeout(async () => {
    const expired = await cache.get('test:ttl');
    console.log(expired ? '❌ TTL no funcionó' : '✅ TTL funcionó correctamente');
  }, 2000);
  
  // Test 3: Patrón de eliminación
  console.log('\\nTest 3: Eliminación por patrón');
  await cache.set('product:1', { id: 1 });
  await cache.set('product:2', { id: 2 });
  await cache.set('category:1', { id: 1 });
  
  const deleted = await cache.delPattern('product:.*');
  console.log(\`✅ Eliminadas \${deleted} entradas de productos\`);
  
  // Test 4: Cacheable wrapper
  console.log('\\nTest 4: Cacheable wrapper');
  let callCount = 0;
  const expensiveFunction = async () => {
    callCount++;
    console.log(\`  Llamada #\${callCount} a función costosa\`);
    return { result: 'expensive data' };
  };
  
  const result1 = await cache.cacheable('test:expensive', expensiveFunction, 60);
  const result2 = await cache.cacheable('test:expensive', expensiveFunction, 60);
  console.log(\`✅ Función llamada \${callCount} vez(ces) (debería ser 1)\`);
  
  // Mostrar estadísticas finales
  console.log('\\n📊 Estadísticas finales:');
  const stats = cache.getStats();
  console.log(stats);
  
  // Limpiar después de las pruebas
  await cache.flush();
  console.log('\\n✅ Pruebas completadas y caché limpiado');
}

testCache().catch(console.error);
`;

fs.writeFileSync(
  path.join(process.cwd(), 'scripts/test-cache.js'),
  testCacheScript
);
console.log('✅ Script test-cache.js creado');

// 8. Instrucciones finales
console.log('\n');
console.log('========================================');
console.log('✅ CONFIGURACIÓN COMPLETADA');
console.log('========================================\n');
console.log('📚 PRÓXIMOS PASOS:\n');
console.log('1. Copia los archivos de caché a tu proyecto:');
console.log('   - lib/cache/config.js');
console.log('   - lib/cache/memory-cache.js');
console.log('   - lib/cache/middleware.js');
console.log('   - hooks/useCache.js\n');
console.log('2. Actualiza tus APIs para usar el caché:');
console.log('   - Mira el ejemplo en pages/api/products/index.js\n');
console.log('3. Actualiza next.config.js con los headers optimizados\n');
console.log('4. Prueba el caché:');
console.log('   npm run cache:test\n');
console.log('5. Monitorea el rendimiento:');
console.log('   npm run cache:stats\n');
console.log('6. Si necesitas limpiar el caché:');
console.log('   npm run cache:clear\n');
console.log('========================================');
console.log('💡 TIPS DE OPTIMIZACIÓN:');
console.log('========================================\n');
console.log('• Activa compresión gzip en tu VPS/Plesk');
console.log('• Considera usar un CDN como Cloudflare (gratis)');
console.log('• Optimiza las imágenes antes de subirlas');
console.log('• Usa lazy loading para imágenes');
console.log('• Minimiza el JavaScript y CSS');
console.log('• Habilita HTTP/2 en tu servidor\n');
console.log('========================================');