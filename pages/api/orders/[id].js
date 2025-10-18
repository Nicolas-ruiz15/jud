// pages/api/orders/[id].js - OBTENER DETALLE DE PEDIDO CORREGIDO
import { query } from '../../../lib/database';

const SESSION_COOKIE_NAME = 'judaica_session_id';

// Helper para obtener session ID mejorado (igual que en las otras APIs)
const getSessionId = (req) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
  return cookies[SESSION_COOKIE_NAME];
};

// GET - Obtener detalle de un pedido específico
async function getOrderDetail(req, res) {
  const { id } = req.query;

  console.log('Getting order detail for ID:', id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID de pedido requerido'
    });
  }

  try {
    // Determinar parámetros de búsqueda
    let whereClause = 'WHERE o.id = ?';
    let params = [id];

    // Por simplicidad, usar solo session_id por ahora
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(404).json({
        success: false,
        message: 'Sesión requerida para ver el pedido'
      });
    }

    whereClause += ' AND o.session_id = ?';
    params.push(sessionId);

    console.log('Searching order with params:', params);

    // Obtener datos del pedido
    const orderQuery = `
      SELECT 
        o.*,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
    `;

    const orderResult = await query(orderQuery, params);

    console.log('Order query result:', orderResult.length);

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const order = orderResult[0];

    console.log('Found order:', order.order_number);

    // Obtener items del pedido
    const itemsQuery = `
      SELECT 
        oi.*,
        pi.image_url as product_image,
        pi.alt_text as image_alt
      FROM order_items oi
      LEFT JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_featured = 1
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;

    const items = await query(itemsQuery, [order.id]);

    console.log('Found items:', items.length);

    // Parsear JSON fields y construir response
    const orderData = {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      subtotal: parseFloat(order.subtotal || 0),
      tax_amount: parseFloat(order.tax_amount || 0),
      shipping_amount: parseFloat(order.shipping_amount || 0),
      total_amount: parseFloat(order.total_amount || 0),
      currency: order.currency || 'COP',
      customer_email: order.customer_email,
      customer_name: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim(),
      customer_first_name: order.customer_first_name,
      customer_last_name: order.customer_last_name,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items_count: order.items_count,
      items: items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
        product_image: item.product_image || '',
        image_alt: item.image_alt || item.product_name
      }))
    };

    console.log('Returning order data:', orderData.order_number);

    res.status(200).json({
      success: true,
      data: orderData
    });

  } catch (error) {
    console.error('Error obteniendo detalle del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle del pedido',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// PUT - Actualizar estado del pedido (solo para admin/testing)
async function updateOrderStatus(req, res) {
  const { id } = req.query;
  const { status, payment_status, notes } = req.body;

  console.log('Updating order:', id, { status, payment_status, notes });

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID de pedido requerido'
    });
  }

  try {
    const updateFields = [];
    const params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (payment_status) {
      updateFields.push('payment_status = ?');
      params.push(payment_status);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    console.log('Update query:', updateQuery, params);

    const result = await query(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    console.log('Order updated successfully');

    res.status(200).json({
      success: true,
      message: 'Pedido actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el pedido',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default async function handler(req, res) {
  // Agregar CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`${req.method} request to /api/orders/${req.query.id}`);

  try {
    switch (req.method) {
      case 'GET':
        return await getOrderDetail(req, res);
      case 'PUT':
        return await updateOrderStatus(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({
          success: false,
          message: `Método ${req.method} no permitido`
        });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}