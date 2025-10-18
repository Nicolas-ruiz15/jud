// pages/api/admin/products/recent.js
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { limit = 10 } = req.query;

    const recentProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.status,
        p.created_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_featured = 1 LIMIT 1) as image
      FROM products p
      WHERE p.status != 'deleted'
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.status(200).json({
      success: true,
      data: recentProducts
    });

  } catch (error) {
    console.error('Error obteniendo productos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}