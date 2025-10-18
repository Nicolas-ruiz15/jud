// pages/api/admin/products/stats.js
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Obtener estadísticas generales
    const [
      totalStats,
      statusStats,
      stockStats,
      featuredStats,
      imageStats,
      categoryStats,
      recentStats
    ] = await Promise.all([
      // Total de productos
      query('SELECT COUNT(*) as total FROM products WHERE status != "deleted"'),
      
      // Estadísticas por estado
      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM products 
        WHERE status != "deleted"
        GROUP BY status
      `),
      
      // Estadísticas de stock
      query(`
        SELECT 
          CASE 
            WHEN stock_quantity = 0 OR stock_status = 'out_of_stock' THEN 'out_of_stock'
            WHEN stock_quantity <= 5 AND stock_quantity > 0 THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_category,
          COUNT(*) as count
        FROM products 
        WHERE status != "deleted" AND manage_stock = true
        GROUP BY stock_category
      `),
      
      // Productos destacados
      query(`
        SELECT 
          featured,
          COUNT(*) as count
        FROM products 
        WHERE status != "deleted"
        GROUP BY featured
      `),
      
      // Productos con/sin imágenes
      query(`
        SELECT 
          CASE 
            WHEN pi.product_id IS NOT NULL THEN 'with_images'
            ELSE 'without_images'
          END as image_status,
          COUNT(DISTINCT p.id) as count
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.status != "deleted"
        GROUP BY image_status
      `),
      
      // Top categorías
      query(`
        SELECT 
          c.name,
          COUNT(pc.product_id) as product_count
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        LEFT JOIN products p ON pc.product_id = p.id AND p.status != "deleted"
        GROUP BY c.id, c.name
        ORDER BY product_count DESC
        LIMIT 10
      `),
      
      // Productos recientes
      query(`
        SELECT 
          COUNT(*) as count
        FROM products 
        WHERE status != "deleted" 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `)
    ]);

    // Procesar resultados
    const total = totalStats[0]?.total || 0;
    
    const statusCounts = statusStats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {});

    const stockCounts = stockStats.reduce((acc, stat) => {
      acc[stat.stock_category] = stat.count;
      return acc;
    }, {});

    const featuredCounts = featuredStats.reduce((acc, stat) => {
      acc[stat.featured ? 'featured' : 'normal'] = stat.count;
      return acc;
    }, {});

    const imageCounts = imageStats.reduce((acc, stat) => {
      acc[stat.image_status] = stat.count;
      return acc;
    }, {});

    // Construir respuesta
    const stats = {
      total,
      active: statusCounts.active || 0,
      inactive: statusCounts.inactive || 0,
      draft: statusCounts.draft || 0,
      inStock: stockCounts.in_stock || 0,
      lowStock: stockCounts.low_stock || 0,
      outOfStock: stockCounts.out_of_stock || 0,
      featured: featuredCounts.featured || 0,
      normal: featuredCounts.normal || 0,
      withImages: imageCounts.with_images || 0,
      noImages: imageCounts.without_images || 0,
      recentlyCreated: recentStats[0]?.count || 0,
      topCategories: categoryStats,
      percentages: {
        active: total > 0 ? ((statusCounts.active || 0) / total * 100).toFixed(1) : 0,
        withImages: total > 0 ? ((imageCounts.with_images || 0) / total * 100).toFixed(1) : 0,
        featured: total > 0 ? ((featuredCounts.featured || 0) / total * 100).toFixed(1) : 0,
        inStock: total > 0 ? ((stockCounts.in_stock || 0) / total * 100).toFixed(1) : 0
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}