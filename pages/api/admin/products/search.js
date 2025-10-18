// /pages/api/admin/products/search.js
// API adaptada para usar tu search existente pero compatible con edición de órdenes
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const { search = '', q = '', limit = 20, page = 1 } = req.query;
    
    // Usar 'search' o 'q' como término de búsqueda
    const searchTerm = search || q;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'Escribe al menos 2 caracteres para buscar'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchPattern = `%${searchTerm}%`;

    try {
      // Intentar usar tu estructura de productos existente
      const productsQuery = `
        SELECT DISTINCT p.*, 
               pi.image_url as featured_image,
               CASE 
                 WHEN p.name LIKE ? THEN 1
                 WHEN p.sku LIKE ? THEN 2
                 WHEN p.description LIKE ? OR p.short_description LIKE ? THEN 3
                 ELSE 4
               END as relevance
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
        WHERE (
          p.name LIKE ? OR 
          p.sku LIKE ? OR 
          p.description LIKE ? OR 
          p.short_description LIKE ?
        ) AND p.status != 'deleted'
        ORDER BY relevance ASC, p.name ASC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        WHERE (
          p.name LIKE ? OR 
          p.sku LIKE ? OR 
          p.description LIKE ? OR 
          p.short_description LIKE ?
        ) AND p.status != 'deleted'
      `;

      const products = await query(productsQuery, [
        searchPattern, searchPattern, searchPattern, searchPattern, // para CASE relevance
        searchPattern, searchPattern, searchPattern, searchPattern, // para WHERE
        parseInt(limit), offset
      ]);

      const countResult = await query(countQuery, [
        searchPattern, searchPattern, searchPattern, searchPattern
      ]);

      const total = countResult[0].total;

      // Obtener categorías para cada producto
      for (let product of products) {
        try {
          const categories = await query(
            `SELECT c.id, c.name, c.slug
             FROM categories c
             INNER JOIN product_categories pc ON c.id = pc.category_id
             WHERE pc.product_id = ?`,
            [product.id]
          );
          product.categories = categories;
        } catch (catError) {
          product.categories = [];
        }
      }

      res.status(200).json({
        success: true,
        data: products.map(product => ({
          id: product.id,
          name: product.name || 'Producto sin nombre',
          sku: product.sku || '',
          description: product.description || product.short_description || '',
          price: parseFloat(product.price || 0),
          stock_quantity: parseInt(product.stock_quantity || 0),
          status: product.status || 'active',
          image_url: product.featured_image || '',
          categories: product.categories || [],
          formatted_price: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(product.price || 0),
          in_stock: product.manage_stock ? parseInt(product.stock_quantity || 0) > 0 : true,
          relevance: product.relevance
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      });

    } catch (productError) {
      // Fallback: usar datos de order_items como en el código original
      console.warn('Usando fallback a order_items:', productError.message);
      
      const itemsQuery = `
        SELECT DISTINCT
          oi.product_id as id,
          oi.product_name as name,
          oi.product_sku as sku,
          AVG(oi.price) as avg_price,
          COUNT(*) as usage_count,
          MAX(oi.created_at) as last_used
        FROM order_items oi
        WHERE (
          oi.product_name LIKE ? OR 
          oi.product_sku LIKE ?
        )
        GROUP BY oi.product_id, oi.product_name, oi.product_sku
        ORDER BY usage_count DESC, last_used DESC
        LIMIT ? OFFSET ?
      `;

      const items = await query(itemsQuery, [searchPattern, searchPattern, parseInt(limit), offset]);

      res.status(200).json({
        success: true,
        data: items.map(item => ({
          id: item.id,
          name: item.name || 'Producto sin nombre',
          sku: item.sku || '',
          description: `Usado ${item.usage_count} vez(es)`,
          price: parseFloat(item.avg_price || 0),
          stock_quantity: 999,
          status: 'active',
          image_url: '',
          categories: [],
          formatted_price: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(item.avg_price || 0),
          in_stock: true,
          usage_count: item.usage_count,
          last_used: item.last_used,
          source: 'order_history'
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        },
        note: 'Productos basados en historial de órdenes'
      });
    }

  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);