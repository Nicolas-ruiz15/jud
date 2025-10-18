// pages/api/admin/categories/stats.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Obtener estadísticas generales
    const [
      totalStats,
      statusStats,
      hierarchyStats,
      featuredStats,
      imageStats,
      topCategories,
      recentStats,
      productDistribution
    ] = await Promise.all([
      // Total de categorías
      query('SELECT COUNT(*) as total FROM categories'),
      
      // Estadísticas por estado
      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM categories 
        GROUP BY status
      `),
      
      // Estadísticas de jerarquía
      query(`
        SELECT 
          CASE 
            WHEN parent_id IS NULL THEN 'parent'
            ELSE 'child'
          END as hierarchy_type,
          COUNT(*) as count
        FROM categories 
        GROUP BY hierarchy_type
      `),
      
      // Categorías destacadas
      query(`
        SELECT 
          featured,
          COUNT(*) as count
        FROM categories 
        GROUP BY featured
      `),
      
      // Categorías con/sin imágenes
      query(`
        SELECT 
          CASE 
            WHEN image_url IS NOT NULL AND image_url != '' THEN 'with_images'
            ELSE 'without_images'
          END as image_status,
          COUNT(*) as count
        FROM categories
        GROUP BY image_status
      `),
      
      // Top categorías por productos
      query(`
        SELECT 
          c.id,
          c.name,
          c.slug,
          COUNT(pc.product_id) as product_count,
          AVG(p.price) as avg_product_price,
          SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_products
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        LEFT JOIN products p ON pc.product_id = p.id
        GROUP BY c.id, c.name, c.slug
        ORDER BY product_count DESC
        LIMIT 10
      `),
      
      // Categorías creadas recientemente
      query(`
        SELECT 
          COUNT(*) as count
        FROM categories 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `),

      // Distribución de productos por categoría
      query(`
        SELECT 
          CASE 
            WHEN product_count = 0 THEN 'empty'
            WHEN product_count BETWEEN 1 AND 5 THEN 'low'
            WHEN product_count BETWEEN 6 AND 20 THEN 'medium'
            WHEN product_count BETWEEN 21 AND 50 THEN 'high'
            ELSE 'very_high'
          END as product_range,
          COUNT(*) as category_count
        FROM (
          SELECT 
            c.id,
            COUNT(pc.product_id) as product_count
          FROM categories c
          LEFT JOIN product_categories pc ON c.id = pc.category_id
          LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
          GROUP BY c.id
        ) as category_products
        GROUP BY product_range
      `)
    ]);

    // Procesar resultados
    const total = totalStats[0]?.total || 0;
    
    const statusCounts = statusStats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {});

    const hierarchyCounts = hierarchyStats.reduce((acc, stat) => {
      acc[stat.hierarchy_type] = stat.count;
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

    const distributionCounts = productDistribution.reduce((acc, stat) => {
      acc[stat.product_range] = stat.category_count;
      return acc;
    }, {});

    // Construir respuesta
    const stats = {
      // Estadísticas generales
      total,
      active: statusCounts.active || 0,
      inactive: statusCounts.inactive || 0,
      parent: hierarchyCounts.parent || 0,
      children: hierarchyCounts.child || 0,
      featured: featuredCounts.featured || 0,
      normal: featuredCounts.normal || 0,
      withImages: imageCounts.with_images || 0,
      noImages: imageCounts.without_images || 0,
      recentlyCreated: recentStats[0]?.count || 0,

      // Porcentajes
      percentages: {
        active: total > 0 ? ((statusCounts.active || 0) / total * 100).toFixed(1) : 0,
        withImages: total > 0 ? ((imageCounts.with_images || 0) / total * 100).toFixed(1) : 0,
        featured: total > 0 ? ((featuredCounts.featured || 0) / total * 100).toFixed(1) : 0,
        withProducts: total > 0 ? (((total - (distributionCounts.empty || 0)) / total) * 100).toFixed(1) : 0
      },

      // Top categorías
      topCategories: topCategories.map(cat => ({
        ...cat,
        avg_product_price: parseFloat(cat.avg_product_price) || 0,
        product_count: parseInt(cat.product_count) || 0,
        active_products: parseInt(cat.active_products) || 0
      })),

      // Distribución de productos
      productDistribution: {
        empty: distributionCounts.empty || 0,
        low: distributionCounts.low || 0,
        medium: distributionCounts.medium || 0,
        high: distributionCounts.high || 0,
        very_high: distributionCounts.very_high || 0
      },

      // Datos para gráficos
      charts: {
        statusPie: [
          { label: 'Activas', value: statusCounts.active || 0, color: '#10B981' },
          { label: 'Inactivas', value: statusCounts.inactive || 0, color: '#EF4444' }
        ],
        hierarchyPie: [
          { label: 'Categorías Padre', value: hierarchyCounts.parent || 0, color: '#3B82F6' },
          { label: 'Subcategorías', value: hierarchyCounts.child || 0, color: '#8B5CF6' }
        ],
        productDistributionBar: [
          { label: 'Sin productos', value: distributionCounts.empty || 0 },
          { label: '1-5 productos', value: distributionCounts.low || 0 },
          { label: '6-20 productos', value: distributionCounts.medium || 0 },
          { label: '21-50 productos', value: distributionCounts.high || 0 },
          { label: '50+ productos', value: distributionCounts.very_high || 0 }
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default adminAuth(handler);