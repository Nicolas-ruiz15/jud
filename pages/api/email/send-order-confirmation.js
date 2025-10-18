// pages/api/email/send-order-confirmation.js
import { query, queryOne } from '../../../lib/database'; // Importamos query y queryOne
import { sendEmail } from '../../../services/emailService';
import { getOrderConfirmationEmailTemplate } from '../../../lib/emailTemplates';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Se requiere el ID del pedido.' });
  }

  try {
    // 1. Obtener detalles del pedido de la base de datos
    const orderDetails = await queryOne(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.customer_email, o.customer_first_name, o.customer_last_name, 
        o.shipping_address, o.notes, o.status, o.payment_status
      FROM orders o
      WHERE o.id = ?
    `, [orderId]);

    if (!orderDetails) {
      console.warn(`⚠️ Intento de enviar email para pedido no encontrado: ${orderId}`);
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    // Asegurarse de que el pago fue exitoso antes de enviar confirmación
    if (orderDetails.payment_status !== 'paid' && orderDetails.payment_status !== 'processing') {
      console.warn(`⚠️ No se enviará email de confirmación para pedido ${orderId} con estado de pago: ${orderDetails.payment_status}`);
      return res.status(400).json({ success: false, message: 'El pedido no está en un estado elegible para confirmación de pago.' });
    }

    // 2. Obtener los ítems del pedido
    const orderItems = await query(`
      SELECT product_name, quantity, price, total 
      FROM order_items 
      WHERE order_id = ?
    `, [orderId]);

    // Combinar detalles de la orden con sus ítems y parsear JSON
    const fullOrderDetails = {
      ...orderDetails,
      shipping_address: JSON.parse(orderDetails.shipping_address),
      items: orderItems,
    };

    const customerDetails = {
      name: `${orderDetails.customer_first_name} ${orderDetails.customer_last_name}`.trim(),
      email: orderDetails.customer_email,
    };

    // 3. Generar contenido del correo usando la plantilla
   const html = getOrderConfirmationEmailTemplate(fullOrderDetails, customerDetails);
   const subject = `Confirmación de Pedido #${fullOrderDetails.order_number} - ${process.env.SITE_NAME}`;

    // 4. Enviar el correo
    await sendEmail({
      to: customerDetails.email,
      subject: subject,
      html: html,
      // Opcional: puedes añadir un 'text' aquí si tu plantilla HTML es compleja
    });

    console.log(`✅ Email de confirmación enviado para el pedido ${orderId} a ${customerDetails.email}`);
    res.status(200).json({ success: true, message: 'Correo de confirmación enviado.' });

  } catch (error) {
    console.error('💥 Error en /api/email/send-order-confirmation:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al enviar el correo.' });
  }
}