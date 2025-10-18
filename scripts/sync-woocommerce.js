// Cargar variables de entorno al inicio
require('dotenv').config();

const WooCommerceService = require('../services/woocommerce');
const { query, transaction } = require('../lib/database');
const SEOService = require('../services/seo');

class WooCommerceSyncManager {
  constructor() {
    this.wooService = new WooCommerceService();
    this.seoService = new SEOService();
    this.stats = {
      categories: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      images: { downloaded: 0, errors: 0 }
    };
    
    // Configuración mejorada para manejar errores de conexión
    this.maxRetries = parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.SYNC_DELAY_BETWEEN_PAGES) || 5000;
    this.requestTimeout = parseInt(process.env.SYNC_TIMEOUT) || 30000;
    this.batchSize = parseInt(process.env.SYNC_BATCH_SIZE) || 25;
  }

  // Método mejorado para retry con backoff exponencial
  async retryOperation(operation, maxRetries = this.maxRetries, baseDelay = this.retryDelay) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isConnectionError = error.code === 'ECONNRESET' || 
                                 error.code === 'ECONNABORTED' ||
                                 error.code === 'ETIMEDOUT' ||
                                 error.code === 'ENOTFOUND' ||
                                 error.message.includes('socket hang up') ||
                                 error.message.includes('timeout') ||
                                 error.message.includes('ECONNRESET');

        if (isConnectionError && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Backoff exponencial
          console.log(`   ⚠️  Error de conexión (intento ${attempt}/${maxRetries}). Reintentando en ${delay/1000}s...`);
          console.log(`   📝 Error: ${error.message}`);
          await this.sleep(delay);
          continue;
        }
        
        // Si no es error de conexión o se agotaron los reintentos
        throw error;
      }
    }
  }

  // Método para verificar conectividad antes de sincronizar
  async checkConnection() {
    try {
      console.log('🔍 Verificando conectividad con WooCommerce...');
      
      // Hacer una petición simple para verificar la conexión
      const testCategories = await this.retryOperation(async () => {
        return await this.wooService.getCategories({
          page: 1,
          per_page: 1
        });
      }, 2, 3000);
      
      console.log('✅ Conexión establecida correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error de conectividad:', error.message);
      return false;
    }
  }

  // Sincronización completa mejorada
  async fullSync() {
    console.log('🚀 Iniciando sincronización completa de WooCommerce...\n');
    
    try {
      // Verificar conectividad primero
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('No se pudo establecer conexión con WooCommerce');
      }

      // 1. Sincronizar categorías primero
      console.log('📂 Sincronizando categorías...');
      await this.syncCategories();
      
      // 2. Pausa entre categorías y productos
      console.log('\n⏳ Pausa de 5 segundos antes de sincronizar productos...');
      await this.sleep(5000);
      
      // 3. Sincronizar productos con el método mejorado
      console.log('\n📦 Sincronizando productos...');
      await this.syncProductsRobust();
      
      // 4. Mostrar estadísticas finales
      this.showStats();
      
    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      this.showStats(); // Mostrar estadísticas parciales
      throw error;
    }
  }

  // Sincronizar solo categorías
  async syncCategories() {
    try {
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`   Obteniendo página ${page} de categorías...`);
        
        const categories = await this.retryOperation(async () => {
          return await this.wooService.getCategories({
            page,
            per_page: 100
          });
        });
        
        if (categories.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const wooCategory of categories) {
          try {
            await this.syncSingleCategory(wooCategory);
          } catch (error) {
            console.error(`   ❌ Error sincronizando categoría ${wooCategory.name}:`, error.message);
            this.stats.categories.errors++;
          }
        }
        
        page++;
        hasMore = categories.length === 100;
        
        // Pausa para no sobrecargar el servidor
        if (hasMore) {
          await this.sleep(1000);
        }
      }
      
      console.log(`   ✅ Categorías: ${this.stats.categories.created} creadas, ${this.stats.categories.updated} actualizadas`);
      
    } catch (error) {
      console.error('Error sincronizando categorías:', error);
      throw error;
    }
  }

  // Sincronizar una categoría individual
  async syncSingleCategory(wooCategory) {
    try {
      // Verificar si la categoría ya existe
      const existingCategory = await query(
        'SELECT id FROM categories WHERE woocommerce_id = ?',
        [wooCategory.id]
      );
      
      // Generar slug único
      let slug = this.seoService.generateSlug(wooCategory.name);
      
      // Verificar que el slug sea único
      const slugExists = await query(
        'SELECT id FROM categories WHERE slug = ? AND woocommerce_id != ?',
        [slug, wooCategory.id]
      );
      
      if (slugExists.length > 0) {
        slug = `${slug}-${wooCategory.id}`;
      }
      
      // Procesar imagen de categoría
      let imageUrl = null;
      if (wooCategory.image && wooCategory.image.src) {
        imageUrl = await this.downloadImage(wooCategory.image.src, `category-${wooCategory.id}`);
      }
      
      const categoryData = {
        name: wooCategory.name,
        slug: slug,
        description: wooCategory.description || '',
        image: imageUrl,
        parent_id: null, // Manejar jerarquías después si es necesario
        meta_title: this.seoService.optimizeTitle(`${wooCategory.name} - Judaica Breslov Colombia`),
        meta_description: this.seoService.optimizeDescription(
          wooCategory.description || `Encuentra productos de ${wooCategory.name} en nuestra tienda online. Envío a toda Colombia.`
        ),
        woocommerce_id: wooCategory.id
      };
      
      if (existingCategory.length > 0) {
        // Actualizar categoría existente
        await query(
          `UPDATE categories SET 
           name = ?, slug = ?, description = ?, image = ?, 
           meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE woocommerce_id = ?`,
          [
            categoryData.name, categoryData.slug, categoryData.description,
            categoryData.image, categoryData.meta_title, categoryData.meta_description,
            wooCategory.id
          ]
        );
        this.stats.categories.updated++;
        console.log(`   📝 Actualizada: ${wooCategory.name}`);
      } else {
        // Crear nueva categoría
        await query(
          `INSERT INTO categories (
            name, slug, description, image, parent_id, 
            meta_title, meta_description, woocommerce_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryData.name, categoryData.slug, categoryData.description,
            categoryData.image, categoryData.parent_id, categoryData.meta_title,
            categoryData.meta_description, categoryData.woocommerce_id
          ]
        );
        this.stats.categories.created++;
        console.log(`   ✅ Creada: ${wooCategory.name}`);
      }
      
    } catch (error) {
      console.error(`Error procesando categoría ${wooCategory.name}:`, error);
      throw error;
    }
  }

  // Sincronizar productos con manejo robusto de errores
  async syncProductsRobust() {
    try {
      let page = 1;
      let totalProcessed = 0;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;
      
      while (true) {
        console.log(`   📄 Obteniendo página ${page} de productos...`);
        
        try {
          // Usar retry para cada página
          const products = await this.retryOperation(async () => {
            return await this.wooService.getProducts({
              page,
              per_page: this.batchSize,
              status: 'publish'
            });
          });
          
          // Reset contador de errores si la página se obtuvo exitosamente
          consecutiveErrors = 0;
          
          if (products.length === 0) {
            console.log(`   ℹ️  No se encontraron más productos en la página ${page}`);
            break;
          }
          
          // Procesar productos con manejo individual de errores
          let pageProcessed = 0;
          for (const wooProduct of products) {
            try {
              await this.syncSingleProductWithTimeout(wooProduct);
              pageProcessed++;
              totalProcessed++;
            } catch (error) {
              console.error(`   ❌ Error sincronizando producto ${wooProduct.name}:`, error.message);
              this.stats.products.errors++;
              
              // Continuar con el siguiente producto en lugar de fallar toda la sincronización
              continue;
            }
          }
          
          console.log(`   📊 Página ${page}: ${pageProcessed}/${products.length} productos procesados`);
          
          page++;
          
          // Determinar si hay más páginas
          const hasMore = products.length === this.batchSize;
          if (!hasMore) {
            break;
          }
          
          // Pausa más larga entre páginas para no sobrecargar el servidor
          console.log(`   ⏳ Esperando ${this.retryDelay/1000} segundos antes de la siguiente página...`);
          await this.sleep(this.retryDelay);
          
        } catch (pageError) {
          consecutiveErrors++;
          console.error(`   ❌ Error obteniendo página ${page}:`, pageError.message);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(`   🚫 Demasiados errores consecutivos (${consecutiveErrors}). Deteniendo sincronización.`);
            break;
          }
          
          // Esperar más tiempo antes del siguiente intento
          console.log(`   ⏳ Esperando 15 segundos antes de continuar...`);
          await this.sleep(15000);
          
          // No incrementar la página si hubo error, intentar la misma página
          continue;
        }
      }
      
      console.log(`   ✅ Total procesado: ${totalProcessed} productos`);
      console.log(`   ✅ Productos: ${this.stats.products.created} creados, ${this.stats.products.updated} actualizados`);
      if (this.stats.products.errors > 0) {
        console.log(`   ⚠️  Errores en productos: ${this.stats.products.errors}`);
      }
      
    } catch (error) {
      console.error('Error sincronizando productos:', error);
      throw error;
    }
  }

  // Sincronizar un producto individual con timeout
  async syncSingleProductWithTimeout(wooProduct) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout en sincronización de producto')), 120000); // 2 minutos
    });

    const syncPromise = this.syncSingleProduct(wooProduct);

    return Promise.race([syncPromise, timeoutPromise]);
  }

  // Sincronizar un producto individual
  async syncSingleProduct(wooProduct) {
    return await transaction(async (conn) => {
      try {
        // Verificar si el producto ya existe
        const existingProduct = await conn.query(
          'SELECT id FROM products WHERE woocommerce_id = ?',
          [wooProduct.id]
        );
        
        // Generar slug único
        let slug = this.seoService.generateSlug(wooProduct.name);
        
        // Verificar que el slug sea único
        const slugExists = await conn.query(
          'SELECT id FROM products WHERE slug = ? AND woocommerce_id != ?',
          [slug, wooProduct.id]
        );
        
        if (slugExists.length > 0) {
          slug = `${slug}-${wooProduct.id}`;
        }
        
        // Limpiar y procesar descripción
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
          // Actualizar producto existente
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
          // Crear nuevo producto
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
        
        // Sincronizar categorías del producto
        await this.syncProductCategories(conn, productId, wooProduct.categories);
        
        // Sincronizar imágenes del producto
        await this.syncProductImages(conn, productId, wooProduct.images, wooProduct.name);
        
      } catch (error) {
        console.error(`Error procesando producto ${wooProduct.name}:`, error);
        throw error;
      }
    });
  }

  // Sincronizar categorías del producto
  async syncProductCategories(conn, productId, wooCategories) {
    try {
      // Eliminar asociaciones existentes
      await conn.query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
      
      // Crear nuevas asociaciones
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

  // Sincronizar imágenes del producto
  async syncProductImages(conn, productId, wooImages, productName) {
    try {
      // Eliminar imágenes existentes
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      
      // Procesar nuevas imágenes
      for (let i = 0; i < wooImages.length; i++) {
        const wooImage = wooImages[i];
        
        try {
          const imageUrl = await this.downloadImage(wooImage.src, `product-${productId}-${i}`);
          
          if (imageUrl) {
            await conn.query(
              'INSERT INTO product_images (product_id, image_url, alt_text, is_featured, sort_order) VALUES (?, ?, ?, ?, ?)',
              [productId, imageUrl, wooImage.alt || productName, i === 0, i]
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

  // Descargar y optimizar imagen con retry mejorado
  async downloadImage(imageUrl, filename) {
    try {
      return await this.retryOperation(async () => {
        const ImageOptimizationService = require('../services/imageOptimization');
        const imageService = new ImageOptimizationService();
        const axios = require('axios');
        const path = require('path');
        
        // Descargar imagen con timeout y configuración mejorada
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: this.requestTimeout,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WooCommerce-Sync/1.0)'
          }
        });
        
        // Crear objeto File-like para el servicio de imágenes
        const buffer = Buffer.from(response.data);
        const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
        
        const fileObject = {
          buffer: buffer,
          originalname: `${filename}${extension}`,
          mimetype: response.headers['content-type'] || 'image/jpeg',
          size: buffer.length
        };
        
        // Optimizar y guardar imagen
        const result = await imageService.saveImage(fileObject);
        
        if (result.success) {
          return result.files.original.url;
        } else {
          throw new Error(result.error);
        }
      }, 2, 3000); // Máximo 2 reintentos para imágenes, 3 segundos de delay
      
    } catch (error) {
      console.error(`Error descargando imagen ${imageUrl}:`, error.message);
      return null;
    }
  }

  // Limpiar HTML de descripción
  cleanHtml(html) {
    if (!html) return '';
    
    // Remover tags HTML pero mantener contenido
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limitar longitud
  }

  // Pausa entre requests
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mostrar estadísticas finales
  showStats() {
    console.log('\n📊 Estadísticas de Sincronización:');
    console.log('================================');
    console.log(`📂 Categorías:`);
    console.log(`   ✅ Creadas: ${this.stats.categories.created}`);
    console.log(`   📝 Actualizadas: ${this.stats.categories.updated}`);
    console.log(`   ❌ Errores: ${this.stats.categories.errors}`);
    console.log(`\n📦 Productos:`);
    console.log(`   ✅ Creados: ${this.stats.products.created}`);
    console.log(`   📝 Actualizados: ${this.stats.products.updated}`);
    console.log(`   ❌ Errores: ${this.stats.products.errors}`);
    console.log(`\n🖼️ Imágenes:`);
    console.log(`   ✅ Descargadas: ${this.stats.images.downloaded}`);
    console.log(`   ❌ Errores: ${this.stats.images.errors}`);
    console.log('\n🎉 Sincronización completada!');
  }

  // Método para sincronizar solo productos (útil para debugging)
  async syncProducts() {
    console.log('📦 Sincronizando solo productos...');
    await this.syncProductsRobust();
  }
}

// Función principal
async function syncWooCommerce(options = {}) {
  const syncManager = new WooCommerceSyncManager();
  
  try {
    if (options.categoriesOnly) {
      await syncManager.syncCategories();
    } else if (options.productsOnly) {
      await syncManager.syncProducts();
    } else {
      await syncManager.fullSync();
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--categories-only')) {
    options.categoriesOnly = true;
  } else if (args.includes('--products-only')) {
    options.productsOnly = true;
  }
  
  console.log('🔄 Iniciando sincronización con WooCommerce...');
  syncWooCommerce(options)
    .then(() => {
      console.log('✅ Sincronización completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en sincronización:', error);
      process.exit(1);
    });
}

module.exports = { syncWooCommerce, WooCommerceSyncManager };