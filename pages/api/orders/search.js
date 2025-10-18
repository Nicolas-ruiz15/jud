// pages/api/orders/search.js - Buscar órdenes por referencia de pago
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({
      success: false,
      message: 'Referencia de pago requerida'
    });
  }

  try {
    console.log('🔍 Searching for order with payment reference:', ref);

    // Buscar orden por referencia de pago
    const orders = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.payment_method,
        o.subtotal,
        o.tax_amount,
        o.shipping_amount,
        o.total_amount,
        o.currency,
        o.customer_email,
        o.customer_first_name,
        o.customer_last_name,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.payment_reference = ?
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [ref]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const order = orders[0];

    // Agregar nombre completo para compatibilidad
    const orderWithFullName = {
      ...order,
      customer_name: `${order.customer_first_name} ${order.customer_last_name}`.trim()
    };

    console.log('✅ Order found:', orderWithFullName.order_number);

    res.status(200).json({
      success: true,
      data: orderWithFullName
    });

  } catch (error) {
    console.error('Error searching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar la orden'
    });
  }
}