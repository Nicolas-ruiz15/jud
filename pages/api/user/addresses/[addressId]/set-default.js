// pages/api/user/addresses/[addressId]/set-default.js - Establecer dirección predeterminada
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
    const { addressId } = req.query;

    // Verificar que la dirección pertenece al usuario
    const addressResult = await query(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (addressResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    // Quitar el estado predeterminado de todas las direcciones del usuario
    await query(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );

    // Establecer la dirección seleccionada como predeterminada
    await query(
      'UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Dirección predeterminada actualizada correctamente'
    });

  } catch (error) {
    console.error('Error estableciendo dirección predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}