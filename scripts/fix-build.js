// Script para verificar y arreglar problemas de build
require('dotenv').config();

async function checkBuildIssues() {
  console.log('🔍 Verificando problemas de build...\n');

  try {
    // 1. Verificar conexión a base de datos
    console.log('📊 Verificando datos...');
    const { getFeaturedProducts, getCategories } = require('../lib/api');
    
    // Verificar productos destacados
    const products = await getFeaturedProducts(1);
    console.log(`   ✅ Productos destacados: ${products.length}`);
    
    // Verificar categorías
    const categories = await getCategories(1);
    console.log(`   ✅ Categorías: ${categories.length}`);

    // 2. Verificar serialización
    const { serializeData } = require('../lib/serialization');
    const testData = {
      date: new Date(),
      nested: {
        date: new Date(),
        text: 'test'
      }
    };
    
    const serialized = serializeData(testData);
    console.log('   ✅ Serialización funcionando');

    // 3. Verificar que no hay fechas problemáticas
    if (categories.length > 0) {
      const firstCategory = categories[0];
      console.log('   📅 Primer categoría:', {
        id: firstCategory.id,
        name: firstCategory.name,
        created_at: typeof firstCategory.created_at
      });
    }

    console.log('\n✅ Verificación completada. Intentando build...');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    // Sugerencias de solución
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verificar conexión a base de datos');
    console.log('2. Ejecutar: npm run db:seed (para tener datos)');
    console.log('3. Verificar variables de entorno');
  }
}

// Función para crear datos mínimos si no existen
async function createMinimalData() {
  console.log('📝 Creando datos mínimos para build...');
  
  try {
    const { query } = require('../lib/database');
    
    // Verificar si hay al menos una categoría
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
    
    if (categoryCount[0].count === 0) {
      console.log('   📂 Creando categoría mínima...');
      await query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        ['Productos', 'productos', 'Categoría general de productos']
      );
    }
    
    // Verificar si hay al menos un producto
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    
    if (productCount[0].count === 0) {
      console.log('   📦 Creando producto mínimo...');
      await query(
        'INSERT INTO products (name, slug, description, price, status) VALUES (?, ?, ?, ?, ?)',
        ['Producto de Ejemplo', 'producto-ejemplo', 'Producto de ejemplo para el sitio', 10000, 'active']
      );
    }
    
    console.log('   ✅ Datos mínimos creados');
    
  } catch (error) {
    console.error('   ❌ Error creando datos mínimos:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-data')) {
    await createMinimalData();
  }
  
  await checkBuildIssues();
}

main().catch(console.error);