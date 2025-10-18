// pages/api/user/addresses/[addressId].js - CRUD individual de direcciones
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
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
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (addressResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    const existingAddress = addressResult[0];

    if (req.method === 'PUT') {
      // Actualizar dirección
      const {
        type, name, recipient, phone, address, city, department,
        zipCode, neighborhood, additionalInfo, isDefault
      } = req.body;

      // Validaciones
      const errors = {};
      if (!name?.trim()) errors.name = 'El nombre es requerido';
      if (!recipient?.trim()) errors.recipient = 'El destinatario es requerido';
      if (!phone?.trim()) errors.phone = 'El teléfono es requerido';
      if (!address?.trim()) errors.address = 'La dirección es requerida';
      if (!city?.trim()) errors.city = 'La ciudad es requerida';
      if (!department?.trim()) errors.department = 'El departamento es requerido';

      // Validar teléfono
      if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
        errors.phone = 'Formato de teléfono no válido';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos no válidos',
          errors
        });
      }

      // Si se marca como predeterminada, actualizar otras
      if (isDefault && !existingAddress.is_default) {
        await query(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id != ?',
          [userId, addressId]
        );
      }

      // Actualizar la dirección
      await query(
        `UPDATE user_addresses SET 
          type = ?, name = ?, recipient = ?, phone = ?, address = ?,
          city = ?, department = ?, zip_code = ?, neighborhood = ?,
          additional_info = ?, is_default = ?, updated_at = NOW()
        WHERE id = ? AND user_id = ?`,
        [
          type, name.trim(), recipient.trim(), phone.trim(), address.trim(),
          city.trim(), department.trim(), zipCode?.trim() || null,
          neighborhood?.trim() || null, additionalInfo?.trim() || null,
          isDefault ? 1 : 0, addressId, userId
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Dirección actualizada correctamente'
      });

    } else if (req.method === 'DELETE') {
      // No permitir eliminar si es la única dirección predeterminada
      if (existingAddress.is_default) {
        const otherAddressesCount = await query(
          'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ? AND id != ?',
          [userId, addressId]
        );

        if (otherAddressesCount[0].count > 0) {
          // Si hay otras direcciones, establecer la primera como predeterminada
          await query(
            `UPDATE user_addresses SET is_default = 1 
             WHERE user_id = ? AND id != ? 
             ORDER BY created_at ASC LIMIT 1`,
            [userId, addressId]
          );
        }
      }

      // Eliminar la dirección
      await query(
        'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Dirección eliminada correctamente'
      });

    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API individual de dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}