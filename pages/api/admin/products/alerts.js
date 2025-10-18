// pages/api/admin/products/alerts.js
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const alerts = [];

    // Productos con stock bajo
    const lowStockProducts = await query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE stock_quantity <= 5 
      AND stock_quantity > 0 
      AND manage_stock = true 
      AND status = 'active'
    `);

    if (lowStockProducts[0].count > 0) {
      alerts.push({
        type: 'warning',
        title: 'Stock Bajo',
        message: `${lowStockProducts[0].count} producto(s) con stock bajo`,
        action: {
          label: 'Ver productos',
          url: '/admin/productos?stock_status=low_stock'
        }
      });
    }

    // Productos sin imágenes
    const noImageProducts = await query(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.id IS NULL 
      AND p.status = 'active'
    `);

    if (noImageProducts[0].count > 0) {
      alerts.push({
        type: 'warning',
        title: 'Productos sin Imágenes',
        message: `${noImageProducts[0].count} producto(s) no tienen imágenes`,
        action: {
          label: 'Ver productos',
          url: '/admin/productos?has_images=false'
        }
      });
    }

    // Productos agotados
    const outOfStockProducts = await query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE stock_quantity = 0 
      AND manage_stock = true 
      AND status = 'active'
    `);

    if (outOfStockProducts[0].count > 0) {
      alerts.push({
        type: 'error',
        title: 'Productos Agotados',
        message: `${outOfStockProducts[0].count} producto(s) están agotados`,
        action: {
          label: 'Ver productos',
          url: '/admin/productos?stock_status=out_of_stock'
        }
      });
    }

    // Productos en borrador
    const draftProducts = await query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE status = 'draft'
    `);

    if (draftProducts[0].count > 0) {
      alerts.push({
        type: 'info',
        title: 'Productos en Borrador',
        message: `${draftProducts[0].count} producto(s) están en borrador`,
        action: {
          label: 'Revisar borradores',
          url: '/admin/productos?status=draft'
        }
      });
    }

    // Productos sin categorías
    const noCategoryProducts = await query(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      WHERE pc.product_id IS NULL 
      AND p.status = 'active'
    `);

    if (noCategoryProducts[0].count > 0) {
      alerts.push({
        type: 'warning',
        title: 'Productos sin Categoría',
        message: `${noCategoryProducts[0].count} producto(s) no tienen categoría asignada`,
        action: {
          label: 'Ver productos',
          url: '/admin/productos'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}