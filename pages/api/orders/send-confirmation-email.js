// pages/api/orders/send-confirmation-email.js
import { query } from '../../../lib/database';
import { sendEmail } from '../../../lib/emailService';
import { getOrderConfirmationEmailTemplate } from '../../../lib/emailTemplates';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({
      success: false,
      message: 'ID de pedido requerido'
    });
  }

  try {
    // Obtener datos del pedido
    const orderData = await query(`
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [order_id]);

    if (orderData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const order = orderData[0];
    
    // Preparar datos para email
    const orderDetails = {
      order_number: order.order_number,
      total_amount: order.total_amount,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      notes: order.notes
    };

    const customerDetails = {
      name: `${order.customer_first_name} ${order.customer_last_name}`.trim(),
      email: order.customer_email
    };

    // Enviar email
    const emailHtml = getOrderConfirmationEmailTemplate(orderDetails, customerDetails);
    
    await sendEmail({
      to: order.customer_email,
      subject: `Confirmación de Pedido #${order.order_number}`,
      html: emailHtml
    });

    console.log('✅ Email de confirmación enviado:', order.order_number);

    res.status(200).json({
      success: true,
      message: 'Email enviado exitosamente'
    });

  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar email de confirmación',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}