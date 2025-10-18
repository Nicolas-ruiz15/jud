// scripts/sync-woocommerce-incremental.js
require('dotenv').config();

const WooCommerceService = require('../services/woocommerce');
const { query, transaction } = require('../lib/database');
const SEOService = require('../services/seo');

class IncrementalSyncManager {
  constructor() {
    this.wooService = new WooCommerceService();
    this.seoService = new SEOService();
    this.stats = {
      categories: { created: 0, updated: 0, skipped: 0, errors: 0 },
      products: { created: 0, updated: 0, skipped: 0, errors: 0 },
      images: { downloaded: 0, errors: 0 }
    };
  }

  // Sincronización incremental principal
  async incrementalSync() {
    console.log('🔄 Iniciando sincronización incremental...\n');
    
    try {
      // 1. Verificar conectividad
      await this.checkConnection();
      
      // 2. Sincronizar solo categorías nuevas/modificadas
      console.log('📂 Sincronización incremental de categorías...');
      await this.syncCategoriesIncremental();
      
      // 3. Sincronizar solo productos nuevos/modificados
      console.log('\n📦 Sincronización incremental de productos...');
      await this.syncProductsIncremental();
      
      // 4. Buscar productos huérfanos (sin imágenes)
      console.log('\n🖼️ Sincronizando imágenes faltantes...');
      await this.syncMissingImages();
      
      this.showStats();
      
    } catch (error) {
      console.error('❌ Error en sincronización incremental:', error);
      this.showStats();
      throw error;
    }
  }

  async checkConnection() {
    try {
      console.log('🔍 Verificando conectividad...');
      await this.wooService.getCategories({ page: 1, per_page: 1 });
      console.log('✅ Conexión OK');
    } catch (error) {
      throw new Error('No se pudo conectar a WooCommerce');
    }
  }

  // Sincronizar solo categorías que no existen o han cambiado
  async syncCategoriesIncremental() {
    try {
      // Obtener todas las categorías de WooCommerce de una vez
      const allWooCategories = await this.getAllWooCategories();
      console.log(`   📊 Total categorías en WooCommerce: ${allWooCategories.length}`);
      
      // Obtener IDs de categorías existentes en BD
      const existingCategories = await query(
        'SELECT woocommerce_id, updated_at FROM categories WHERE woocommerce_id IS NOT NULL'
      );
      
      const existingIds = new Set(existingCategories.map(cat => cat.woocommerce_id));
      console.log(`   📊 Categorías existentes en BD: ${existingIds.size}`);
      
      for (const wooCategory of allWooCategories) {
        try {
          if (existingIds.has(wooCategory.id)) {
            // Ya existe, verificar si necesita actualización
            const existing = existingCategories.find(cat => cat.woocommerce_id === wooCategory.id);
            const wooUpdated = new Date(wooCategory.date_modified);
            const dbUpdated = new Date(existing.updated_at);
            
            if (wooUpdated > dbUpdated) {
              await this.syncSingleCategory(wooCategory, true); // true = actualizar
            } else {
              this.stats.categories.skipped++;
              console.log(`   ⏭️  Omitida (sin cambios): ${wooCategory.name}`);
            }
          } else {
            // Nueva categoría
            await this.syncSingleCategory(wooCategory, false); // false = crear
          }
        } catch (error) {
          console.error(`   ❌ Error con categoría ${wooCategory.name}:`, error.message);
          this.stats.categories.errors++;
        }
      }
      
      console.log(`   ✅ Categorías procesadas: ${this.stats.categories.created} nuevas, ${this.stats.categories.updated} actualizadas, ${this.stats.categories.skipped} omitidas`);
      
    } catch (error) {
      console.error('Error en sincronización incremental de categorías:', error);
      throw error;
    }
  }

  // Sincronizar solo productos nuevos o modificados
  async syncProductsIncremental() {
    try {
      // Obtener fecha de última sincronización
      const lastSync = await this.getLastSyncDate();
      console.log(`   📅 Última sincronización: ${lastSync ? lastSync.toISOString() : 'Primera vez'}`);
      
      let page = 1;
      let totalProcessed = 0;
      
      while (true) {
        console.log(`   📄 Obteniendo página ${page}...`);
        
        const products = await this.wooService.getProducts({
          page,
          per_page: 50,
          status: 'publish',
          // Solo productos modificados después de la última sincronización
          modified_after: lastSync ? lastSync.toISOString() : undefined
        });
        
        if (products.length === 0) {
          console.log(`   ℹ️  No hay más productos nuevos/modificados`);
          break;
        }
        
        // Obtener productos existentes en esta página
        const wooIds = products.map(p => p.id);
        const existingProducts = await query(
          `SELECT woocommerce_id, updated_at FROM products WHERE woocommerce_id IN (${wooIds.map(() => '?').join(',')})`,
          wooIds
        );
        
        const existingMap = new Map(
          existingProducts.map(p => [p.woocommerce_id, new Date(p.updated_at)])
        );
        
        for (const wooProduct of products) {
          try {
            const existingDate = existingMap.get(wooProduct.id);
            const wooModified = new Date(wooProduct.date_modified);
            
            if (!existingDate) {
              // Producto nuevo
              await this.syncSingleProduct(wooProduct, false);
              totalProcessed++;
            } else if (wooModified > existingDate) {
              // Producto modificado
              await this.syncSingleProduct(wooProduct, true);
              totalProcessed++;
            } else {
              // Sin cambios
              this.stats.products.skipped++;
              console.log(`   ⏭️  Omitido (sin cambios): ${wooProduct.name}`);
            }
          } catch (error) {
            console.error(`   ❌ Error con producto ${wooProduct.name}:`, error.message);
            this.stats.products.errors++;
          }
        }
        
        console.log(`   📊 Página ${page}: ${totalProcessed} procesados de ${products.length} obtenidos`);
        page++;
        
        // Pausa corta entre páginas
        await this.sleep(1000);
      }
      
      // Actualizar fecha de última sincronización
      await this.updateLastSyncDate();
      
      console.log(`   ✅ Total procesado: ${totalProcessed} productos`);
      
    } catch (error) {
      console.error('Error en sincronización incremental de productos:', error);
      throw error;
    }
  }

  // Buscar productos que no tienen imágenes y descargarlas
  async syncMissingImages() {
    try {
      // Productos sin imágenes
      const productsWithoutImages = await query(`
        SELECT p.id, p.woocommerce_id, p.name 
        FROM products p 
        LEFT JOIN product_images pi ON p.id = pi.product_id 
        WHERE p.woocommerce_id IS NOT NULL 
        AND pi.id IS NULL
        LIMIT 20
      `);
      
      console.log(`   📊 Productos sin imágenes: ${productsWithoutImages.length}`);
      
      for (const product of productsWithoutImages) {
        try {
          console.log(`   🖼️  Descargando imágenes para: ${product.name}`);
          
          // Obtener producto completo de WooCommerce
          const wooProduct = await this.wooService.getProduct(product.woocommerce_id);
          
          if (wooProduct.images && wooProduct.images.length > 0) {
            await this.syncProductImages(product.id, wooProduct.images, product.name);
          }
        } catch (error) {
          console.error(`   ❌ Error descargando imágenes para ${product.name}:`, error.message);
          this.stats.images.errors++;
        }
        
        // Pausa entre descargas
        await this.sleep(2000);
      }
      
    } catch (error) {
      console.error('Error sincronizando imágenes faltantes:', error);
    }
  }

  // Obtener todas las categorías de WooCommerce
  async getAllWooCategories() {
    const allCategories = [];
    let page = 1;
    
    while (true) {
      const categories = await this.wooService.getCategories({
        page,
        per_page: 100
      });
      
      if (categories.length === 0) break;
      
      allCategories.push(...categories);
      page++;
    }
    
    return allCategories;
  }

  // Obtener fecha de última sincronización
  async getLastSyncDate() {
    try {
      const result = await query(
        "SELECT value FROM settings WHERE key_name = 'last_full_sync'"
      );
      
      if (result.length > 0 && result[0].value) {
        return new Date(result[0].value);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Actualizar fecha de última sincronización
  async updateLastSyncDate() {
    try {
      const now = new Date().toISOString();
      await query(`
        INSERT INTO settings (key_name, value, type) 
        VALUES ('last_full_sync', ?, 'string') 
        ON DUPLICATE KEY UPDATE value = ?, updated_at = CURRENT_TIMESTAMP
      `, [now, now]);
    } catch (error) {
      console.error('Error actualizando fecha de sincronización:', error);
    }
  }

  // Sincronizar categoría individual (reutilizar del script original)
  async syncSingleCategory(wooCategory, isUpdate = false) {
    // ... mismo código del script original pero con logging mejorado
    try {
      const existingCategory = await query(
        'SELECT id FROM categories WHERE woocommerce_id = ?',
        [wooCategory.id]
      );
      
      let slug = this.seoService.generateSlug(wooCategory.name);
      
      const slugExists = await query(
        'SELECT id FROM categories WHERE slug = ? AND woocommerce_id != ?',
        [slug, wooCategory.id]
      );
      
      if (slugExists.length > 0) {
        slug = `${slug}-${wooCategory.id}`;
      }
      
      const categoryData = {
        name: wooCategory.name,
        slug: slug,
        description: wooCategory.description || '',
        image: null, // Por ahora sin imágenes de categorías para velocidad
        parent_id: null,
        meta_title: this.seoService.optimizeTitle(`${wooCategory.name} - Judaica Breslov Colombia`),
        meta_description: this.seoService.optimizeDescription(
          wooCategory.description || `Encuentra productos de ${wooCategory.name} en nuestra tienda online. Envío a toda Colombia.`
        ),
        woocommerce_id: wooCategory.id
      };
      
      if (existingCategory.length > 0) {
        await query(
          `UPDATE categories SET 
           name = ?, slug = ?, description = ?, 
           meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE woocommerce_id = ?`,
          [
            categoryData.name, categoryData.slug, categoryData.description,
            categoryData.meta_title, categoryData.meta_description,
            wooCategory.id
          ]
        );
        this.stats.categories.updated++;
        console.log(`   📝 Actualizada: ${wooCategory.name}`);
      } else {
        await query(
          `INSERT INTO categories (
            name, slug, description, parent_id, 
            meta_title, meta_description, woocommerce_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryData.name, categoryData.slug, categoryData.description,
            categoryData.parent_id, categoryData.meta_title,
            categoryData.meta_description, categoryData.woocommerce_id
          ]
        );
        this.stats.categories.created++;
        console.log(`   ✅ Creada: ${wooCategory.name}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Sincronizar producto individual (versión ligera)
  async syncSingleProduct(wooProduct, isUpdate = false) {
    return await transaction(async (conn) => {
      try {
        const existingProduct = await conn.query(
          'SELECT id FROM products WHERE woocommerce_id = ?',
          [wooProduct.id]
        );
        
        let slug = this.seoService.generateSlug(wooProduct.name);
        
        const slugExists = await conn.query(
          'SELECT id FROM products WHERE slug = ? AND woocommerce_id != ?',
          [slug, wooProduct.id]
        );
        
        if (slugExists.length > 0) {
          slug = `${slug}-${wooProduct.id}`;
        }
        
        const description = this.cleanHtml(wooProduct.description);
        const shortDescription = this.cleanHtml(wooProduct.short_description);
        
        const productData = {
          name: wooProduct.name,
          slug: slug,
          description: description,
          short_description: shortDescription,
          price: parseFloat(wooProduct.price) || 0,
          sale_price: wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null,
          sku: wooProduct.sku || `WOO-${wooProduct.id}`,
          stock_quantity: parseInt(wooProduct.stock_quantity) || 0,
          manage_stock: wooProduct.manage_stock || false,
          stock_status: wooProduct.stock_status === 'instock' ? 'in_stock' : 'out_of_stock',
          weight: wooProduct.weight ? parseFloat(wooProduct.weight) : null,
          dimensions: wooProduct.dimensions ? 
            `${wooProduct.dimensions.length}x${wooProduct.dimensions.width}x${wooProduct.dimensions.height}` : null,
          featured: wooProduct.featured || false,
          status: wooProduct.status === 'publish' ? 'active' : 'inactive',
          meta_title: this.seoService.optimizeTitle(`${wooProduct.name} - Judaica Breslov Colombia`),
          meta_description: this.seoService.optimizeDescription(shortDescription || description),
          woocommerce_id: wooProduct.id
        };
        
        let productId;
        
        if (existingProduct.length > 0) {
          await conn.query(
            `UPDATE products SET 
             name = ?, slug = ?, description = ?, short_description = ?,
             price = ?, sale_price = ?, sku = ?, stock_quantity = ?,
             manage_stock = ?, stock_status = ?, weight = ?, dimensions = ?,
             featured = ?, status = ?, meta_title = ?, meta_description = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE woocommerce_id = ?`,
            [
              productData.name, productData.slug, productData.description,
              productData.short_description, productData.price, productData.sale_price,
              productData.sku, productData.stock_quantity, productData.manage_stock,
              productData.stock_status, productData.weight, productData.dimensions,
              productData.featured, productData.status, productData.meta_title,
              productData.meta_description, wooProduct.id
            ]
          );
          productId = existingProduct[0].id;
          this.stats.products.updated++;
          console.log(`   📝 Actualizado: ${wooProduct.name}`);
        } else {
          const result = await conn.query(
            `INSERT INTO products (
              name, slug, description, short_description, price, sale_price,
              sku, stock_quantity, manage_stock, stock_status, weight,
              dimensions, featured, status, meta_title, meta_description, woocommerce_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productData.name, productData.slug, productData.description,
              productData.short_description, productData.price, productData.sale_price,
              productData.sku, productData.stock_quantity, productData.manage_stock,
              productData.stock_status, productData.weight, productData.dimensions,
              productData.featured, productData.status, productData.meta_title,
              productData.meta_description, productData.woocommerce_id
            ]
          );
          productId = result.insertId;
          this.stats.products.created++;
          console.log(`   ✅ Creado: ${wooProduct.name}`);
        }
        
        // Sincronizar categorías
        await this.syncProductCategories(conn, productId, wooProduct.categories);
        
        // Solo sincronizar imágenes si es producto nuevo
        if (!isUpdate && wooProduct.images && wooProduct.images.length > 0) {
          await this.syncProductImages(productId, wooProduct.images, wooProduct.name);
        }
        
      } catch (error) {
        throw error;
      }
    });
  }

  // Métodos auxiliares (reutilizar del script original)
  async syncProductCategories(conn, productId, wooCategories) {
    try {
      await conn.query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
      
      for (const wooCategory of wooCategories) {
        const categoryResult = await conn.query(
          'SELECT id FROM categories WHERE woocommerce_id = ?',
          [wooCategory.id]
        );
        
        if (categoryResult.length > 0) {
          await conn.query(
            'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
            [productId, categoryResult[0].id]
          );
        }
      }
    } catch (error) {
      console.error('Error sincronizando categorías del producto:', error);
    }
  }

  async syncProductImages(productId, wooImages, productName) {
    try {
      const ImageOptimizationService = require('../services/imageOptimization');
      const imageService = new ImageOptimizationService();
      const axios = require('axios');
      const path = require('path');
      
      // Eliminar imágenes existentes
      await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      
      for (let i = 0; i < wooImages.length; i++) {
        const wooImage = wooImages[i];
        
        try {
          const response = await axios({
            method: 'GET',
            url: wooImage.src,
            responseType: 'arraybuffer',
            timeout: 30000
          });
          
          const buffer = Buffer.from(response.data);
          const extension = path.extname(new URL(wooImage.src).pathname) || '.jpg';
          
          const fileObject = {
            buffer: buffer,
            originalname: `product-${productId}-${i}${extension}`,
            mimetype: response.headers['content-type'] || 'image/jpeg',
            size: buffer.length
          };
          
          const result = await imageService.saveImage(fileObject);
          
          if (result.success) {
            await query(
              'INSERT INTO product_images (product_id, image_url, alt_text, is_featured, sort_order) VALUES (?, ?, ?, ?, ?)',
              [productId, result.files.original.url, wooImage.alt || productName, i === 0, i]
            );
            this.stats.images.downloaded++;
          }
        } catch (error) {
          console.error(`Error descargando imagen ${wooImage.src}:`, error.message);
          this.stats.images.errors++;
        }
      }
    } catch (error) {
      console.error('Error sincronizando imágenes del producto:', error);
    }
  }

  cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showStats() {
    console.log('\n📊 Estadísticas de Sincronización Incremental:');
    console.log('============================================');
    console.log(`📂 Categorías:`);
    console.log(`   ✅ Creadas: ${this.stats.categories.created}`);
    console.log(`   📝 Actualizadas: ${this.stats.categories.updated}`);
    console.log(`   ⏭️  Omitidas: ${this.stats.categories.skipped}`);
    console.log(`   ❌ Errores: ${this.stats.categories.errors}`);
    console.log(`\n📦 Productos:`);
    console.log(`   ✅ Creados: ${this.stats.products.created}`);
    console.log(`   📝 Actualizados: ${this.stats.products.updated}`);
    console.log(`   ⏭️  Omitidos: ${this.stats.products.skipped}`);
    console.log(`   ❌ Errores: ${this.stats.products.errors}`);
    console.log(`\n🖼️ Imágenes:`);
    console.log(`   ✅ Descargadas: ${this.stats.images.downloaded}`);
    console.log(`   ❌ Errores: ${this.stats.images.errors}`);
    console.log('\n🎉 Sincronización incremental completada!');
  }
}

// Función principal
async function incrementalSync() {
  const syncManager = new IncrementalSyncManager();
  
  try {
    await syncManager.incrementalSync();
  } catch (error) {
    console.error('Error en sincronización incremental:', error);
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  console.log('🔄 Iniciando sincronización incremental...');
  incrementalSync()
    .then(() => {
      console.log('✅ Sincronización incremental completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en sincronización incremental:', error);
      process.exit(1);
    });
}

module.exports = { incrementalSync, IncrementalSyncManager };