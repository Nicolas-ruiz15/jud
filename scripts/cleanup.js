const { query } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class CleanupManager {
  constructor() {
    this.optimizedDir = path.join(process.cwd(), 'public', 'optimized');
    this.stats = {
      orphanedImages: 0,
      emptyCategories: 0,
      duplicateProducts: 0,
      freedSpace: 0
    };
  }

  async runCleanup() {
    console.log('🧹 Iniciando limpieza y mantenimiento...\n');

    try {
      // 1. Limpiar imágenes huérfanas
      await this.cleanOrphanedImages();
      
      // 2. Limpiar categorías vacías
      await this.cleanEmptyCategories();
      
      // 3. Detectar productos duplicados
      await this.findDuplicateProducts();
      
      // 4. Optimizar base de datos
      await this.optimizeDatabase();
      
      // 5. Mostrar estadísticas
      this.showStats();
      
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
      throw error;
    }
  }

  // Limpiar imágenes que ya no están referenciadas
  async cleanOrphanedImages() {
    console.log('🖼️ Limpiando imágenes huérfanas...');
    
    try {
      // Obtener todas las imágenes de la base de datos
      const dbImages = await query(`
        SELECT DISTINCT image_url as url FROM product_images 
        WHERE image_url IS NOT NULL
        UNION
        SELECT DISTINCT image as url FROM categories 
        WHERE image IS NOT NULL
      `);
      
      const dbImagePaths = new Set(
        dbImages
          .map(img => img.url)
          .filter(url => url && url.startsWith('/optimized/'))
          .map(url => url.replace('/optimized/', ''))
      );
      
      // Escanear directorio de imágenes
      const imageFiles = await this.getAllImageFiles(this.optimizedDir);
      
      let freedSpace = 0;
      
      for (const filePath of imageFiles) {
        const relativePath = path.relative(this.optimizedDir, filePath);
        
        if (!dbImagePaths.has(relativePath)) {
          try {
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            freedSpace += stats.size;
            this.stats.orphanedImages++;
            console.log(`   🗑️ Eliminada: ${relativePath}`);
          } catch (error) {
            console.log(`   ⚠️ Error eliminando ${relativePath}:`, error.message);
          }
        }
      }
      
      this.stats.freedSpace = freedSpace;
      console.log(`   ✅ ${this.stats.orphanedImages} imágenes huérfanas eliminadas`);
      console.log(`   💾 ${this.formatBytes(freedSpace)} liberados`);
      
    } catch (error) {
      console.error('Error limpiando imágenes:', error);
    }
  }

  // Obtener todos los archivos de imagen recursivamente
  async getAllImageFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllImageFiles(fullPath);
          files.push(...subFiles);
        } else if (this.isImageFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directorio no existe o no accesible
      console.log(`   ⚠️ No se puede acceder a ${dir}`);
    }
    
    return files;
  }

  // Verificar si es un archivo de imagen
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Limpiar categorías que no tienen productos
  async cleanEmptyCategories() {
    console.log('\n📂 Limpiando categorías vacías...');
    
    try {
      const emptyCategories = await query(`
        SELECT c.id, c.name 
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.category_id IS NULL
        AND c.parent_id IS NOT NULL
      `);
      
      for (const category of emptyCategories) {
        await query('DELETE FROM categories WHERE id = ?', [category.id]);
        this.stats.emptyCategories++;
        console.log(`   🗑️ Eliminada categoría vacía: ${category.name}`);
      }
      
      console.log(`   ✅ ${this.stats.emptyCategories} categorías vacías eliminadas`);
      
    } catch (error) {
      console.error('Error limpiando categorías:', error);
    }
  }

  // Encontrar productos duplicados (mismo nombre o SKU)
  async findDuplicateProducts() {
    console.log('\n📦 Detectando productos duplicados...');
    
    try {
      // Duplicados por nombre
      const duplicatesByName = await query(`
        SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM products 
        WHERE status = 'active'
        GROUP BY name 
        HAVING count > 1
      `);
      
      // Duplicados por SKU
      const duplicatesBySKU = await query(`
        SELECT sku, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM products 
        WHERE status = 'active' AND sku IS NOT NULL AND sku != ''
        GROUP BY sku 
        HAVING count > 1
      `);
      
      if (duplicatesByName.length > 0) {
        console.log('   ⚠️ Productos duplicados por nombre:');
        duplicatesByName.forEach(dup => {
          console.log(`     - "${dup.name}" (IDs: ${dup.ids})`);
        });
        this.stats.duplicateProducts += duplicatesByName.length;
      }
      
      if (duplicatesBySKU.length > 0) {
        console.log('   ⚠️ Productos duplicados por SKU:');
        duplicatesBySKU.forEach(dup => {
          console.log(`     - SKU "${dup.sku}" (IDs: ${dup.ids})`);
        });
        this.stats.duplicateProducts += duplicatesBySKU.length;
      }
      
      if (duplicatesByName.length === 0 && duplicatesBySKU.length === 0) {
        console.log('   ✅ No se encontraron productos duplicados');
      }
      
    } catch (error) {
      console.error('Error detectando duplicados:', error);
    }
  }

  // Optimizar tablas de la base de datos
  async optimizeDatabase() {
    console.log('\n🗄️ Optimizando base de datos...');
    
    try {
      const tables = [
        'products', 'categories', 'product_categories', 
        'product_images', 'orders', 'order_items', 
        'users', 'reviews', 'settings'
      ];
      
      for (const table of tables) {
        try {
          await query(`OPTIMIZE TABLE ${table}`);
          console.log(`   ✅ Optimizada tabla: ${table}`);
        } catch (error) {
          console.log(`   ⚠️ Error optimizando ${table}:`, error.message);
        }
      }
      
      // Estadísticas de la base de datos
      const dbStats = await query(`
        SELECT 
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
      `);
      
      console.log('\n   📊 Tamaño de tablas:');
      dbStats.forEach(stat => {
        console.log(`     ${stat.table_name}: ${stat.size_mb} MB`);
      });
      
    } catch (error) {
      console.error('Error optimizando base de datos:', error);
    }
  }

  // Formatear bytes en formato legible
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Mostrar estadísticas finales
  showStats() {
    console.log('\n📊 Estadísticas de Limpieza:');
    console.log('============================');
    console.log(`🖼️ Imágenes huérfanas eliminadas: ${this.stats.orphanedImages}`);
    console.log(`📂 Categorías vacías eliminadas: ${this.stats.emptyCategories}`);
    console.log(`📦 Productos duplicados detectados: ${this.stats.duplicateProducts}`);
    console.log(`💾 Espacio liberado: ${this.formatBytes(this.stats.freedSpace)}`);
    console.log('\n🎉 Limpieza completada!');
  }

  // Reparar índices de la base de datos
  async repairDatabase() {
    console.log('\n🔧 Reparando índices de base de datos...');
    
    try {
      const tables = [
        'products', 'categories', 'product_categories', 
        'product_images', 'orders', 'order_items'
      ];
      
      for (const table of tables) {
        try {
          await query(`REPAIR TABLE ${table}`);
          console.log(`   ✅ Reparada tabla: ${table}`);
        } catch (error) {
          console.log(`   ⚠️ Error reparando ${table}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Error reparando base de datos:', error);
    }
  }

  // Limpiar logs antiguos
  async cleanLogs() {
    console.log('\n📄 Limpiando logs antiguos...');
    
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
      const now = Date.now();
      
      try {
        const logFiles = await fs.readdir(logsDir);
        let cleanedFiles = 0;
        
        for (const file of logFiles) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            cleanedFiles++;
            console.log(`   🗑️ Eliminado log antiguo: ${file}`);
          }
        }
        
        console.log(`   ✅ ${cleanedFiles} archivos de log eliminados`);
        
      } catch (error) {
        console.log(`   ⚠️ Directorio de logs no encontrado: ${logsDir}`);
      }
      
    } catch (error) {
      console.error('Error limpiando logs:', error);
    }
  }

  // Generar reporte de salud del sistema
  async generateHealthReport() {
    console.log('\n🏥 Generando reporte de salud...');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        database: {},
        storage: {},
        performance: {}
      };
      
      // Estadísticas de base de datos
      const productCount = await query('SELECT COUNT(*) as count FROM products WHERE status = "active"');
      const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
      const orderCount = await query('SELECT COUNT(*) as count FROM orders');
      const imageCount = await query('SELECT COUNT(*) as count FROM product_images');
      
      report.database = {
        products: productCount[0].count,
        categories: categoryCount[0].count,
        orders: orderCount[0].count,
        images: imageCount[0].count
      };
      
      // Estadísticas de almacenamiento
      const imageFiles = await this.getAllImageFiles(this.optimizedDir);
      let totalImageSize = 0;
      
      for (const filePath of imageFiles) {
        try {
          const stats = await fs.stat(filePath);
          totalImageSize += stats.size;
        } catch (error) {
          // Archivo no accesible
        }
      }
      
      report.storage = {
        imageFiles: imageFiles.length,
        totalImageSize: this.formatBytes(totalImageSize),
        optimizedDir: this.optimizedDir
      };
      
      // Productos sin imágenes
      const productsWithoutImages = await query(`
        SELECT COUNT(*) as count 
        FROM products p 
        LEFT JOIN product_images pi ON p.id = pi.product_id 
        WHERE pi.product_id IS NULL AND p.status = 'active'
      `);
      
      // Productos con bajo stock
      const lowStockProducts = await query(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE status = 'active' AND manage_stock = true AND stock_quantity <= 5
      `);
      
      report.performance = {
        productsWithoutImages: productsWithoutImages[0].count,
        lowStockProducts: lowStockProducts[0].count
      };
      
      // Guardar reporte
      const reportPath = path.join(process.cwd(), 'logs', `health-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`   ✅ Reporte guardado en: ${reportPath}`);
      console.log('\n   📊 Resumen del sistema:');
      console.log(`     • Productos activos: ${report.database.products}`);
      console.log(`     • Categorías: ${report.database.categories}`);
      console.log(`     • Órdenes: ${report.database.orders}`);
      console.log(`     • Imágenes: ${report.database.images} (${report.storage.totalImageSize})`);
      console.log(`     • Productos sin imágenes: ${report.performance.productsWithoutImages}`);
      console.log(`     • Productos con bajo stock: ${report.performance.lowStockProducts}`);
      
    } catch (error) {
      console.error('Error generando reporte de salud:', error);
    }
  }
}

// Función principal
async function runCleanup(options = {}) {
  const cleanup = new CleanupManager();
  
  try {
    if (options.repair) {
      await cleanup.repairDatabase();
    }
    
    if (options.logs) {
      await cleanup.cleanLogs();
    }
    
    if (options.report) {
      await cleanup.generateHealthReport();
    }
    
    if (!options.repair && !options.logs && !options.report) {
      await cleanup.runCleanup();
    }
    
  } catch (error) {
    console.error('Error en limpieza:', error);
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    repair: args.includes('--repair'),
    logs: args.includes('--logs'),
    report: args.includes('--report')
  };
  
  console.log('🧹 Iniciando limpieza del sistema...');
  runCleanup(options)
    .then(() => {
      console.log('✅ Limpieza completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en limpieza:', error);
      process.exit(1);
    });
}

module.exports = { runCleanup, CleanupManager };