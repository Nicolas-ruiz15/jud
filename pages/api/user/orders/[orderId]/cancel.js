// pages/api/user/orders/[orderId]/cancel.js - Cancelar pedido del usuario
import { query } from '../../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar que el usuario existe y es customer
    const userResult = await query(
      'SELECT id FROM users WHERE id = ? AND role = "customer"',
      [decoded.userId]
    );

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userId = decoded.userId;
    const { orderId } = req.query;

    // Verificar que el pedido existe y pertenece al usuario
    const orderResult = await query(
      'SELECT id, status, total FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const order = orderResult[0];

    // Verificar que el pedido se puede cancelar
    const cancelableStatuses = ['pending', 'processing'];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido con estado: ${order.status}`,
        currentStatus: order.status
      });
    }

    // Actualizar el estado del pedido a cancelado
    await query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', orderId]
    );

    // TODO: En una implementación real, aquí podrías:
    // 1. Notificar al sistema de inventario para restaurar stock
    // 2. Procesar reembolso si ya se había procesado el pago
    // 3. Enviar notificación por email al cliente
    // 4. Notificar al equipo de fulfillment

    // Ejemplo de lógica de reembolso (comentado)
    /*
    if (order.payment_status === 'paid') {
      // Procesar reembolso
      const refundResult = await processRefund({
        orderId: orderId,
        amount: order.total,
        reason: 'customer_cancellation'
      });
      
      if (refundResult.success) {
        await query(
          'UPDATE orders SET payment_status = ? WHERE id = ?',
          ['refunded', orderId]
        );
      }
    }
    */

    res.status(200).json({
      success: true,
      message: 'Pedido cancelado correctamente',
      data: {
        orderId: orderId,
        newStatus: 'cancelled'
      }
    });

  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}