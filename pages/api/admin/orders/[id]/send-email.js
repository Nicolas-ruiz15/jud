import { query } from '../../../../../lib/database';
import { adminAuth } from '../../../../../middleware/adminAuth';
import { 
  sendOrderConfirmationEmail,
  sendOrderConfirmationOnlyEmail,
  sendStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendShippedNotificationEmail,
  sendDeliveredNotificationEmail,
  sendCustomEmail
} from '../../../../../lib/emailService';
import { 
  getBankTransferEmailTemplate,
  getOrderConfirmationEmailTemplate,
  getStatusUpdateEmailTemplate,
  getPaymentConfirmationEmailTemplate,
  getShippedEmailTemplate,
  getDeliveredEmailTemplate,
  getCustomEmailTemplate
} from '../../../../../lib/emailTemplates';

// Tipos de email disponibles
const EMAIL_TYPES = {
  bank_transfer_instructions: {
    name: 'Instrucciones de Transferencia',
    description: 'Envía las instrucciones de pago por transferencia bancaria'
  },
  order_confirmation: {
    name: 'Confirmación de Pedido',
    description: 'Confirma que el pedido fue recibido'
  },
  status_update: {
    name: 'Actualización de Estado',
    description: 'Notifica cambios en el estado del pedido'
  },
  payment_confirmation: {
    name: 'Confirmación de Pago',
    description: 'Confirma que el pago fue recibido'
  },
  shipped_notification: {
    name: 'Pedido Enviado',
    description: 'Notifica que el pedido está en camino'
  },
  delivered_notification: {
    name: 'Pedido Entregado',
    description: 'Confirma la entrega del pedido'
  },
  custom: {
    name: 'Email Personalizado',
    description: 'Mensaje personalizado'
  }
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  const { id: orderId } = req.query;
  const { email_type, custom_message, custom_subject } = req.body;

  if (!email_type) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de email requerido',
      available_types: EMAIL_TYPES
    });
  }

  if (!EMAIL_TYPES[email_type]) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de email no válido',
      available_types: Object.keys(EMAIL_TYPES)
    });
  }

  try {
    console.log(`📧 Enviando email tipo '${email_type}' para orden ${orderId}`);

    // 1. Obtener datos completos de la orden
    const orderResult = await query(`
      SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const order = orderResult[0];
    const items = JSON.parse(order.items_json || '[]').filter(item => item.id !== null);
    
    // 2. Preparar datos para el email
    const orderDetails = {
      order_number: order.order_number,
      total_amount: order.total_amount,
      items: items,
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      notes: order.notes
    };

    const customerDetails = {
      name: `${order.customer_first_name} ${order.customer_last_name}`.trim(),
      email: order.customer_email
    };

    if (!customerDetails.email) {
      return res.status(400).json({
        success: false,
        message: 'La orden no tiene email del cliente'
      });
    }

    // 3. Enviar email según el tipo
    let emailResult;
    let emailSubject;

    switch (email_type) {
      case 'bank_transfer_instructions':
        emailResult = await sendOrderConfirmationEmail(orderDetails, customerDetails);
        emailSubject = `Instrucciones de Pago - Pedido #${order.order_number}`;
        break;

      case 'order_confirmation':
        emailResult = await sendOrderConfirmationOnlyEmail(orderDetails, customerDetails);
        emailSubject = `Confirmación de Pedido #${order.order_number}`;
        break;

      case 'status_update':
        emailResult = await sendStatusUpdateEmail(order, custom_message);
        emailSubject = `Actualización de tu pedido #${order.order_number}`;
        break;

      case 'payment_confirmation':
        emailResult = await sendPaymentConfirmationEmail(order);
        emailSubject = `Pago confirmado - Pedido #${order.order_number}`;
        break;

      case 'shipped_notification':
        emailResult = await sendShippedNotificationEmail(order, custom_message);
        emailSubject = `Tu pedido #${order.order_number} está en camino`;
        break;

      case 'delivered_notification':
        emailResult = await sendDeliveredNotificationEmail(order);
        emailSubject = `Tu pedido #${order.order_number} ha sido entregado`;
        break;

      case 'custom':
        if (!custom_message || !custom_subject) {
          return res.status(400).json({
            success: false,
            message: 'Mensaje y asunto personalizados requeridos'
          });
        }
        emailResult = await sendCustomEmail(order, custom_message, custom_subject, customerDetails.name);
        emailSubject = custom_subject;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de email no implementado'
        });
    }

    // 4. Registrar el envío en la base de datos (opcional)
    try {
      await query(`
        INSERT INTO order_email_log (order_id, email_type, recipient, subject, sent_at, status, admin_user)
        VALUES (?, ?, ?, ?, NOW(), 'sent', ?)
      `, [
        orderId,
        email_type,
        customerDetails.email,
        emailSubject,
        req.user?.email || 'admin'
      ]);
    } catch (logError) {
      console.warn('⚠️ Error registrando email log (no crítico):', logError.message);
    }

    console.log('✅ Email enviado exitosamente:', emailSubject);

    res.status(200).json({
      success: true,
      message: 'Email enviado exitosamente',
      data: {
        email_type,
        recipient: customerDetails.email,
        subject: emailSubject,
        order_number: order.order_number,
        sent_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando el email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);