// pages/api/admin/dashboard/top-products.js
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const topProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.slug,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'completed'
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      data: topProducts
    });

  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export default adminAuth(handler);