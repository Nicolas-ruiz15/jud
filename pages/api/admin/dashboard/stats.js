// pages/api/admin/dashboard/stats.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Obtener estadísticas en paralelo
    const [
      productsResult,
      ordersResult, 
      usersResult,
      revenueResult,
      pendingOrdersResult,
      lowStockResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as total FROM products WHERE status != "deleted"'),
      query('SELECT COUNT(*) as total FROM orders'),
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "completed"'),
      query('SELECT COUNT(*) as total FROM orders WHERE status = "pending"'),
      query('SELECT COUNT(*) as total FROM products WHERE manage_stock = true AND stock_quantity <= 5 AND status = "active"')
    ]);

    const stats = {
      totalProducts: productsResult[0].total,
      totalOrders: ordersResult[0].total,
      totalUsers: usersResult[0].total,
      totalRevenue: parseFloat(revenueResult[0].total),
      pendingOrders: pendingOrdersResult[0].total,
      lowStockProducts: lowStockResult[0].total
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

export default adminAuth(handler);