// pages/api/admin/products/analytics.js
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { period = '30d' } = req.query;
    
    // Calcular fechas según el período
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = periodDays[period] || 30;
    
    // Datos de ventas por día
    const salesData = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sales,
        SUM(price) as revenue
      FROM products p
      WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND p.status = 'active'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Productos más vendidos (simulado por ahora)
    const topProducts = await query(`
      SELECT 
        p.name,
        p.price,
        ps.sales,
        ps.revenue
      FROM products p
      LEFT JOIN product_stats ps ON p.id = ps.product_id
      WHERE p.status = 'active'
      ORDER BY ps.sales DESC
      LIMIT 5
    `);

    // Datos por categoría
    const categoryData = await query(`
      SELECT 
        c.name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(p.price) as total_value
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
      LIMIT 10
    `);

    // Formatear datos para gráficos
    const chartData = {
      sales: {
        labels: salesData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        data: salesData.map(item => parseInt(item.sales) || 0)
      },
      topProducts: {
        labels: topProducts.map(item => item.name.substring(0, 20) + '...'),
        data: topProducts.map(item => parseInt(item.sales) || 0)
      },
      categories: {
        labels: categoryData.map(item => item.name),
        data: categoryData.map(item => parseInt(item.product_count) || 0)
      }
    };

    res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}