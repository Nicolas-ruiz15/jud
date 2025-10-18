// pages/api/epayco/confirmation.js - Webhook de confirmación MODIFICADO para ACTUALIZAR
import EpaycoService from '../../../services/epayco';
import { query } from '../../../lib/database'; // Necesitamos la conexión a la BD aquí

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  console.log('🎯 ePayco confirmation received:', req.body);

  try {
    const epaycoService = new EpaycoService();
    
    // Validar configuración
    epaycoService.validateConfig();
    
    // Validar webhook
    const validation = epaycoService.validateWebhook(req.body);
    
    if (!validation.valid) {
      console.error('❌ Webhook inválido:', validation.reason);
      return res.status(400).json({ 
        success: false, 
        message: validation.reason
      });
    }

    const {
      x_ref_payco,
      x_id_invoice,       // Número de factura (order_number)
      x_id_payment,
      x_amount,
      x_tax,
      x_amount_base,
      x_currency_code,
      x_bank_name,
      x_approval_code,
      x_transaction_id,
      x_fecha_transaccion,
      x_response,         // Mensaje de respuesta de ePayco
      x_extra1,           // order_number (de create-payment.js)
      x_extra2,           // order_id (de create-payment.js)
      x_extra3,           // store identifier
      x_cod_response,
      x_cod_transaction_state,
      x_transaction_state, // Estado de la transacción: 1 (Aprobada), 2 (Rechazada), 3 (Pendiente), 4 (Fallida)
      x_customer_email,
      x_customer_name
    } = req.body;

    // Validar que viene de nuestra tienda
    if (x_extra3 !== 'judaica_breslov') {
      console.error('❌ Confirmación no pertenece a nuestra tienda');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid source' 
      });
    }

    // Procesar confirmación para obtener estados internos
    const processingResult = epaycoService.processConfirmation(req.body);
    
    console.log(`💰 Payment status: ${processingResult.paymentStatus}, Order status: ${processingResult.orderStatus}`);
    console.log(`🔎 Buscando orden con ID: ${x_extra2} y Número de Orden: ${x_extra1}`);

    // Buscar la orden en la base de datos usando x_extra2 (orderId) o x_extra1 (orderNumber)
    let orderToUpdate;
    if (x_extra2) {
        const orderResult = await query(`SELECT * FROM orders WHERE id = ?`, [parseInt(x_extra2)]);
        orderToUpdate = orderResult[0];
    } else if (x_extra1) { // Fallback por si x_extra2 no estuviera
        const orderResult = await query(`SELECT * FROM orders WHERE order_number = ?`, [x_extra1]);
        orderToUpdate = orderResult[0];
    }

    if (!orderToUpdate) {
        console.error(`❌ Orden no encontrada en la BD para orderId: ${x_extra2} o orderNumber: ${x_extra1}`);
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Actualizar el estado de la orden existente
    await query(`
      UPDATE orders
      SET 
        status = ?,
        payment_status = ?,
        epayco_transaction_id = ?,
        payment_reference = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      processingResult.orderStatus,
      processingResult.paymentStatus,
      x_id_payment || x_transaction_id,
      x_ref_payco,
      orderToUpdate.id
    ]);
    console.log(`✅ Orden ${orderToUpdate.order_number} actualizada a estado: ${processingResult.orderStatus}`);

    // Guardar detalles de la transacción (opcional, pero recomendado)
    // Primero, verifica si la transacción ya existe para evitar duplicados en reintentos de webhook
    const existingTransaction = await query(
        `SELECT id FROM payment_transactions WHERE transaction_id = ? AND epayco_ref = ? LIMIT 1`,
        [x_transaction_id, x_ref_payco]
    );

    if (existingTransaction.length === 0) {
        await query(`
            INSERT INTO payment_transactions (
                order_id,
                payment_method,
                transaction_id,
                epayco_ref,
                amount,
                currency,
                status,
                gateway_response,
                bank_name,
                approval_code,
                transaction_date,
                raw_response,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            orderToUpdate.id,
            'epayco',
            x_id_payment || x_transaction_id,
            x_ref_payco,
            parseFloat(x_amount || 0),
            x_currency_code,
            processingResult.paymentStatus,
            x_response,
            x_bank_name,
            x_approval_code,
            x_fecha_transaccion,
            JSON.stringify(req.body) // Guarda el RAW completo de la respuesta de ePayco
        ]);
        console.log(`💾 Detalles de transacción guardados para la orden ${orderToUpdate.order_number}`);
    } else {
        console.log(`ℹ️ Transacción ${x_transaction_id} ya existe, omitiendo inserción.`);
    }

    // Limpiar carrito si el pago fue exitoso (solo si el user_id o session_id coincide con la orden)
    // Esto asume que tienes una función de limpiar carrito en el lado del servidor que puede ser llamada aquí.
    if (processingResult.isSuccessful) {
        if (orderToUpdate.user_id) {
            await serverClearCart({ userId: orderToUpdate.user_id });
            console.log(`🛒 Carrito del usuario ${orderToUpdate.user_id} limpiado.`);
        } else if (orderToUpdate.session_id) {
            await serverClearCart({ sessionId: orderToUpdate.session_id });
            console.log(`🛒 Carrito de la sesión ${orderToUpdate.session_id} limpiado.`);
        }
    }

    // Enviar email de confirmación (opcional y fuera del alcance de este snippet)
    if (processingResult.isSuccessful) {
        // await sendOrderConfirmationEmail(orderToUpdate); 
        console.log(`📧 Se enviaría email de confirmación para orden ${orderToUpdate.order_number}`);
    }

    console.log(`🎉 Confirmación de pago procesada exitosamente. Estado: ${processingResult.paymentStatus}`);

    // Siempre responder OK a ePayco para evitar reintentos, incluso si hubo errores internos después de la validación inicial.
    // ePayco solo se preocupa por recibir un 200 OK. El estado de tu aplicación lo manejas tú.
    res.status(200).send('OK');

  } catch (error) {
    console.error('💥 Error procesando confirmación de ePayco:', error);
    
    // Aún así responder OK para evitar reintentos infinitos por parte de ePayco
    res.status(200).send('ERROR_LOGGED'); // Puedes enviar un mensaje más descriptivo si quieres
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true, // Esto es importante para que Next.js no espere una respuesta directa del handler
  },
};