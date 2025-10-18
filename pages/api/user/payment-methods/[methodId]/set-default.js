// pages/api/user/payment-methods/[methodId]/set-default.js - Establecer método predeterminado
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
    const { methodId } = req.query;

    // Verificar que el método de pago pertenece al usuario
    const methodResult = await query(
      'SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?',
      [methodId, userId]
    );

    if (methodResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    // Quitar el estado predeterminado de todos los métodos del usuario
    await query(
      'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?',
      [userId]
    );

    // Establecer el método seleccionado como predeterminado
    await query(
      'UPDATE user_payment_methods SET is_default = 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [methodId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Método de pago predeterminado actualizado correctamente'
    });

  } catch (error) {
    console.error('Error estableciendo método de pago predeterminado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}