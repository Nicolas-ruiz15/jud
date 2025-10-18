// /pages/api/admin/orders/search-products.js
// API de búsqueda de productos específica para edición de órdenes
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
    const { 
      search = '', 
      limit = 20, 
      page = 1,
      exclude_order_id = null // Para excluir productos ya en una orden específica
    } = req.query;

    if (!search || search.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Ingresa al menos 2 caracteres para buscar'
      });
    }

    const searchTerm = `%${search.trim()}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let products = [];

    try {
      // Intentar buscar en tabla products primero
      const productsQuery = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.description,
          p.short_description,
          p.price,
          p.stock_quantity,
          p.manage_stock,
          p.status,
          COALESCE(pi.image_url, '') as image_url,
          'products_table' as source
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
        WHERE (
          p.name LIKE ? OR 
          p.sku LIKE ? OR 
          p.description LIKE ? OR
          p.short_description LIKE ?
        ) 
        AND p.status IN ('active', 'publish')
        ORDER BY 
          CASE 
            WHEN p.name LIKE ? THEN 1
            WHEN p.sku LIKE ? THEN 2
            ELSE 3
          END,
          p.name ASC
        LIMIT ? OFFSET ?
      `;

      const searchParams = [
        searchTerm, searchTerm, searchTerm, searchTerm, // WHERE conditions
        searchTerm, searchTerm, // ORDER BY conditions
        parseInt(limit), offset
      ];

      products = await query(productsQuery, searchParams);

      // Formatear productos de la tabla products
      products = products.map(product => ({
        id: product.id,
        name: product.name || 'Producto sin nombre',
        sku: product.sku || '',
        description: product.short_description || product.description || '',
        price: parseFloat(product.price || 0),
        stock_quantity: product.manage_stock ? parseInt(product.stock_quantity || 0) : 999,
        status: product.status,
        image_url: product.image_url || '',
        formatted_price: formatCurrency(product.price || 0),
        in_stock: product.manage_stock ? (parseInt(product.stock_quantity || 0) > 0) : true,
        source: 'products_table',
        manage_stock: !!product.manage_stock
      }));

    } catch (productError) {
      console.warn('Tabla products no encontrada o error, usando historial de order_items');
      
      // Fallback: usar historial de order_items
      let excludeClause = '';
      let historyParams = [searchTerm, searchTerm];
      
      if (exclude_order_id) {
        excludeClause = 'AND oi.order_id != ?';
        historyParams.push(exclude_order_id);
      }
      
      historyParams.push(parseInt(limit), offset);

      const historyQuery = `
        SELECT 
          oi.product_id as id,
          oi.product_name as name,
          oi.product_sku as sku,
          CONCAT('Usado en ', COUNT(DISTINCT oi.order_id), ' pedido(s)') as description,
          AVG(oi.price) as avg_price,
          COUNT(DISTINCT oi.order_id) as usage_count,
          MAX(oi.created_at) as last_used,
          'order_history' as source
        FROM order_items oi
        WHERE (
          oi.product_name LIKE ? OR 
          oi.product_sku LIKE ?
        ) ${excludeClause}
        GROUP BY oi.product_id, oi.product_name, oi.product_sku
        HAVING COUNT(DISTINCT oi.order_id) > 0
        ORDER BY usage_count DESC, last_used DESC
        LIMIT ? OFFSET ?
      `;

      const historyResults = await query(historyQuery, historyParams);

      products = historyResults.map(item => ({
        id: item.id,
        name: item.name || 'Producto sin nombre',
        sku: item.sku || '',
        description: item.description,
        price: parseFloat(item.avg_price || 0),
        stock_quantity: 999, // Stock ilimitado para productos históricos
        status: 'active',
        image_url: '',
        formatted_price: formatCurrency(item.avg_price || 0),
        in_stock: true,
        source: 'order_history',
        usage_count: item.usage_count,
        last_used: item.last_used,
        manage_stock: false
      }));
    }

    // Si se especifica exclude_order_id, filtrar productos ya en esa orden
    if (exclude_order_id && products.length > 0) {
      const orderItemsQuery = `
        SELECT DISTINCT product_id 
        FROM order_items 
        WHERE order_id = ?
      `;
      const existingItems = await query(orderItemsQuery, [exclude_order_id]);
      const existingProductIds = existingItems.map(item => item.product_id.toString());
      
      products = products.filter(product => 
        !existingProductIds.includes(product.id.toString())
      );
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length,
        hasMore: products.length === parseInt(limit)
      },
      search_info: {
        term: search,
        results_count: products.length,
        source: products.length > 0 ? products[0].source : 'none'
      }
    });

  } catch (error) {
    console.error('Error en búsqueda de productos para órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Formatear precio a moneda colombiana
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default adminAuth(handler);