// scripts/updateSeoData.js - SCRIPT PARA ACTUALIZAR DATOS SEO
// Ejecutar con: node scripts/updateSeoData.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'usr_tienda_judaica_breslov',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Tienda_Judaica_Breslov',
  port: process.env.DB_PORT || 3306,
};

// Utilidades SEO
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateProductMetaTitle = (product, category = null) => {
  if (product.meta_title && product.meta_title.trim() !== '') {
    return product.meta_title;
  }
  
  const parts = [product.name];
  if (category) parts.push(category.name);
  parts.push('Judaica Breslov Colombia');
  
  const title = parts.join(' | ');
  return title.length > 60 ? `${product.name} - Judaica Breslov` : title;
};

const generateProductMetaDescription = (product, category = null) => {
  if (product.meta_description && product.meta_description.trim() !== '' && product.meta_description !== '...') {
    return product.meta_description;
  }
  
  let description = `Compra ${product.name} `;
  
  if (category) {
    description += `en la categoría ${category.name} `;
  }
  
  if (product.sale_price || product.price) {
    const price = product.sale_price || product.price;
    description += `por $${new Intl.NumberFormat('es-CO').format(price)} `;
  }
  
  if (product.short_description && product.short_description.trim() !== '') {
    const shortDesc = product.short_description.replace(/<[^>]*>/g, '').trim();
    if (shortDesc.length > 0) {
      description += `- ${shortDesc.substring(0, 100)} `;
    }
  }
  
  description += 'Envío gratis a toda Colombia. ¡Compra ahora en Judaica Breslov!';
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
};

const generateCategoryMetaTitle = (category) => {
  if (category.meta_title && category.meta_title.trim() !== '') {
    return category.meta_title;
  }
  
  return `${category.name} - Productos Judaicos | Judaica Breslov Colombia`;
};

const generateCategoryMetaDescription = (category, productCount = 0) => {
  if (category.meta_description && category.meta_description.trim() !== '') {
    return category.meta_description;
  }
  
  let description = `Explora nuestra colección de ${category.name.toLowerCase()} `;
  
  if (productCount > 0) {
    description += `con ${productCount} productos disponibles `;
  }
  
  description += 'en Judaica Breslov Colombia. Productos judaicos auténticos con envío gratis a todo el país.';
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
};

async function updateProductsSEO() {
  let connection;
  
  try {
    console.log('🚀 Iniciando actualización de SEO para productos...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener todos los productos activos
    const [products] = await connection.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'active'
      GROUP BY p.id
    `);
    
    console.log(`📦 Encontrados ${products.length} productos para actualizar`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const product of products) {
      try {
        const needsUpdate = 
          !product.meta_title || 
          product.meta_title.trim() === '' ||
          !product.meta_description || 
          product.meta_description.trim() === '' ||
          product.meta_description === '...';
        
        if (!needsUpdate) {
          skipped++;
          continue;
        }
        
        const category = product.category_name ? { name: product.category_name } : null;
        const metaTitle = generateProductMetaTitle(product, category);
        const metaDescription = generateProductMetaDescription(product, category);
        
        await connection.execute(`
          UPDATE products 
          SET meta_title = ?, meta_description = ?, updated_at = NOW()
          WHERE id = ?
        `, [metaTitle, metaDescription, product.id]);
        
        console.log(`✅ Actualizado: ${product.name}`);
        console.log(`   📝 Título: ${metaTitle}`);
        console.log(`   📄 Descripción: ${metaDescription.substring(0, 100)}...`);
        console.log('');
        
        updated++;
        
        // Pausa pequeña para no sobrecargar la DB
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error actualizando producto ${product.name}:`, error.message);
      }
    }
    
    console.log(`✅ Productos actualizados: ${updated}`);
    console.log(`⏭️  Productos omitidos (ya tenían SEO): ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateCategoriesSEO() {
  let connection;
  
  try {
    console.log('🚀 Iniciando actualización de SEO para categorías...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener todas las categorías activas con conteo de productos
    const [categories] = await connection.execute(`
      SELECT c.*, COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id
    `);
    
    console.log(`📂 Encontradas ${categories.length} categorías para actualizar`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const category of categories) {
      try {
        const needsUpdate = 
          !category.meta_title || 
          category.meta_title.trim() === '' ||
          !category.meta_description || 
          category.meta_description.trim() === '' ||
          !category.description ||
          category.description === null;
        
        if (!needsUpdate) {
          skipped++;
          continue;
        }
        
        const metaTitle = generateCategoryMetaTitle(category);
        const metaDescription = generateCategoryMetaDescription(category, category.product_count);
        
        // Generar descripción básica si no existe
        let description = category.description;
        if (!description || description === null) {
          description = `Productos de ${category.name} en Judaica Breslov Colombia. Encuentra artículos judaicos auténticos con la mejor calidad y envío gratis a todo el país.`;
        }
        
        await connection.execute(`
          UPDATE categories 
          SET meta_title = ?, meta_description = ?, description = ?, updated_at = NOW()
          WHERE id = ?
        `, [metaTitle, metaDescription, description, category.id]);
        
        console.log(`✅ Actualizada: ${category.name}`);
        console.log(`   📝 Título: ${metaTitle}`);
        console.log(`   📄 Descripción: ${metaDescription.substring(0, 100)}...`);
        console.log('');
        
        updated++;
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error actualizando categoría ${category.name}:`, error.message);
      }
    }
    
    console.log(`✅ Categorías actualizadas: ${updated}`);
    console.log(`⏭️  Categorías omitidas (ya tenían SEO): ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function updateImageAltTexts() {
  let connection;
  
  try {
    console.log('🚀 Iniciando actualización de Alt Texts para imágenes...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener imágenes sin alt text o con alt text genérico
    const [images] = await connection.execute(`
      SELECT pi.*, p.name as product_name
      FROM product_images pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.alt_text IS NULL 
         OR pi.alt_text = '' 
         OR pi.alt_text = p.name
         OR pi.alt_text LIKE '%sin descripción%'
      ORDER BY pi.product_id, pi.sort_order
    `);
    
    console.log(`🖼️  Encontradas ${images.length} imágenes para actualizar alt text`);
    
    let updated = 0;
    
    for (const image of images) {
      try {
        // Generar alt text descriptivo
        let altText = '';
        
        if (image.is_featured) {
          altText = `${image.product_name} - Imagen principal del producto`;
        } else {
          altText = `${image.product_name} - Vista ${image.sort_order || 'adicional'}`;
        }
        
        await connection.execute(`
          UPDATE product_images 
          SET alt_text = ?
          WHERE id = ?
        `, [altText, image.id]);
        
        console.log(`✅ Alt text actualizado: ${altText}`);
        updated++;
        
        await new Promise(resolve => setTimeout(resolve, 5));
        
      } catch (error) {
        console.error(`❌ Error actualizando imagen ID ${image.id}:`, error.message);
      }
    }
    
    console.log(`✅ Imágenes actualizadas: ${updated}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function fixDuplicateSlugs() {
  let connection;
  
  try {
    console.log('🚀 Verificando y corrigiendo slugs duplicados...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Encontrar productos con slugs duplicados
    const [duplicateProducts] = await connection.execute(`
      SELECT slug, COUNT(*) as count
      FROM products
      WHERE status = 'active'
      GROUP BY slug
      HAVING count > 1
    `);
    
    console.log(`🔍 Encontrados ${duplicateProducts.length} slugs duplicados en productos`);
    
    for (const duplicate of duplicateProducts) {
      const [products] = await connection.execute(`
        SELECT id, name, slug, created_at
        FROM products
        WHERE slug = ? AND status = 'active'
        ORDER BY created_at ASC
      `, [duplicate.slug]);
      
      // Mantener el primero, cambiar los demás
      for (let i = 1; i < products.length; i++) {
        const product = products[i];
        const newSlug = `${product.slug}-${i}`;
        
        await connection.execute(`
          UPDATE products 
          SET slug = ?
          WHERE id = ?
        `, [newSlug, product.id]);
        
        console.log(`✅ Slug corregido: ${product.slug} -> ${newSlug} (${product.name})`);
      }
    }
    
    // Encontrar categorías con slugs duplicados
    const [duplicateCategories] = await connection.execute(`
      SELECT slug, COUNT(*) as count
      FROM categories
      WHERE status = 'active'
      GROUP BY slug
      HAVING count > 1
    `);
    
    console.log(`🔍 Encontrados ${duplicateCategories.length} slugs duplicados en categorías`);
    
    for (const duplicate of duplicateCategories) {
      const [categories] = await connection.execute(`
        SELECT id, name, slug, created_at
        FROM categories
        WHERE slug = ? AND status = 'active'
        ORDER BY created_at ASC
      `, [duplicate.slug]);
      
      for (let i = 1; i < categories.length; i++) {
        const category = categories[i];
        const newSlug = `${category.slug}-${i}`;
        
        await connection.execute(`
          UPDATE categories 
          SET slug = ?
          WHERE id = ?
        `, [newSlug, category.id]);
        
        console.log(`✅ Slug corregido: ${category.slug} -> ${newSlug} (${category.name})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function generateSEOReport() {
  let connection;
  
  try {
    console.log('📊 Generando reporte de SEO...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Estadísticas de productos
    const [productStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN meta_title IS NOT NULL AND meta_title != '' THEN 1 ELSE 0 END) as with_meta_title,
        SUM(CASE WHEN meta_description IS NOT NULL AND meta_description != '' AND meta_description != '...' THEN 1 ELSE 0 END) as with_meta_description,
        SUM(CASE WHEN short_description IS NOT NULL AND short_description != '' THEN 1 ELSE 0 END) as with_short_description,
        SUM(CASE WHEN sku IS NOT NULL AND sku != '' THEN 1 ELSE 0 END) as with_sku
      FROM products 
      WHERE status = 'active'
    `);
    
    // Estadísticas de categorías
    const [categoryStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_categories,
        SUM(CASE WHEN meta_title IS NOT NULL AND meta_title != '' THEN 1 ELSE 0 END) as with_meta_title,
        SUM(CASE WHEN meta_description IS NOT NULL AND meta_description != '' THEN 1 ELSE 0 END) as with_meta_description,
        SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as with_description
      FROM categories 
      WHERE status = 'active'
    `);
    
    // Estadísticas de imágenes
    const [imageStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_images,
        SUM(CASE WHEN alt_text IS NOT NULL AND alt_text != '' THEN 1 ELSE 0 END) as with_alt_text
      FROM product_images pi
      JOIN products p ON pi.product_id = p.id
      WHERE p.status = 'active'
    `);
    
    console.log('\n📊 REPORTE DE SEO - JUDAICA BRESLOV COLOMBIA');
    console.log('='.repeat(50));
    
    console.log('\n📦 PRODUCTOS:');
    console.log(`   Total productos activos: ${productStats[0].total_products}`);
    console.log(`   Con meta title: ${productStats[0].with_meta_title} (${((productStats[0].with_meta_title / productStats[0].total_products) * 100).toFixed(1)}%)`);
    console.log(`   Con meta description: ${productStats[0].with_meta_description} (${((productStats[0].with_meta_description / productStats[0].total_products) * 100).toFixed(1)}%)`);
    console.log(`   Con descripción corta: ${productStats[0].with_short_description} (${((productStats[0].with_short_description / productStats[0].total_products) * 100).toFixed(1)}%)`);
    console.log(`   Con SKU: ${productStats[0].with_sku} (${((productStats[0].with_sku / productStats[0].total_products) * 100).toFixed(1)}%)`);
    
    console.log('\n📂 CATEGORÍAS:');
    console.log(`   Total categorías activas: ${categoryStats[0].total_categories}`);
    console.log(`   Con meta title: ${categoryStats[0].with_meta_title} (${((categoryStats[0].with_meta_title / categoryStats[0].total_categories) * 100).toFixed(1)}%)`);
    console.log(`   Con meta description: ${categoryStats[0].with_meta_description} (${((categoryStats[0].with_meta_description / categoryStats[0].total_categories) * 100).toFixed(1)}%)`);
    console.log(`   Con descripción: ${categoryStats[0].with_description} (${((categoryStats[0].with_description / categoryStats[0].total_categories) * 100).toFixed(1)}%)`);
    
    console.log('\n🖼️  IMÁGENES:');
    console.log(`   Total imágenes: ${imageStats[0].total_images}`);
    console.log(`   Con alt text: ${imageStats[0].with_alt_text} (${((imageStats[0].with_alt_text / imageStats[0].total_images) * 100).toFixed(1)}%)`);
    
    // Productos sin imágenes
    const [productsWithoutImages] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.status = 'active' AND pi.id IS NULL
    `);
    
    console.log(`   Productos sin imágenes: ${productsWithoutImages[0].count}`);
    
    // Top categorías por productos
    const [topCategories] = await connection.execute(`
      SELECT c.name, COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
      LIMIT 5
    `);
    
    console.log('\n🏆 TOP 5 CATEGORÍAS POR PRODUCTOS:');
    topCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}: ${cat.product_count} productos`);
    });
    
    console.log('\n='.repeat(50));
    console.log('✅ Reporte completado');
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🎯 SCRIPT DE OPTIMIZACIÓN SEO - JUDAICA BRESLOV COLOMBIA\n');
  
  switch (command) {
    case 'products':
      await updateProductsSEO();
      break;
      
    case 'categories':
      await updateCategoriesSEO();
      break;
      
    case 'images':
      await updateImageAltTexts();
      break;
      
    case 'slugs':
      await fixDuplicateSlugs();
      break;
      
    case 'report':
      await generateSEOReport();
      break;
      
    case 'all':
      await fixDuplicateSlugs();
      await updateProductsSEO();
      await updateCategoriesSEO();
      await updateImageAltTexts();
      await generateSEOReport();
      break;
      
    default:
      console.log('📖 USO:');
      console.log('   node scripts/updateSeoData.js [comando]');
      console.log('');
      console.log('📋 COMANDOS DISPONIBLES:');
      console.log('   products    - Actualizar meta títulos y descripciones de productos');
      console.log('   categories  - Actualizar meta títulos y descripciones de categorías');
      console.log('   images      - Actualizar alt texts de imágenes');
      console.log('   slugs       - Corregir slugs duplicados');
      console.log('   report      - Generar reporte de estado SEO');
      console.log('   all         - Ejecutar todas las optimizaciones');
      console.log('');
      console.log('📝 EJEMPLOS:');
      console.log('   node scripts/updateSeoData.js products');
      console.log('   node scripts/updateSeoData.js all');
      console.log('   node scripts/updateSeoData.js report');
      break;
  }
  
  console.log('\n🎉 Script finalizado');
  process.exit(0);
}

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Ejecutar
main().catch(console.error);