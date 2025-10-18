// pages/api/user/addresses.js - CRUD de direcciones del usuario
import { query } from '../../../lib/database';

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

    if (req.method === 'GET') {
      // Obtener direcciones del usuario
      const addresses = await query(
        `SELECT 
          id, type, name, recipient, phone, address, city, department,
          zip_code as zipCode, neighborhood, additional_info as additionalInfo,
          is_default as isDefault, created_at, updated_at
        FROM user_addresses 
        WHERE user_id = ? 
        ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      // Convertir is_default de tinyint a boolean
      const formattedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: Boolean(addr.isDefault)
      }));

      res.status(200).json({
        success: true,
        data: formattedAddresses
      });

    } else if (req.method === 'POST') {
      // Crear nueva dirección
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

      // Si es la primera dirección o se marca como predeterminada, actualizar otras
      if (isDefault) {
        await query(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      // Verificar si es la primera dirección (automáticamente predeterminada)
      const existingCount = await query(
        'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
        [userId]
      );
      const shouldBeDefault = isDefault || existingCount[0].count === 0;

      // Insertar nueva dirección
      const result = await query(
        `INSERT INTO user_addresses (
          user_id, type, name, recipient, phone, address, city, department,
          zip_code, neighborhood, additional_info, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId, type, name.trim(), recipient.trim(), phone.trim(),
          address.trim(), city.trim(), department.trim(),
          zipCode?.trim() || null, neighborhood?.trim() || null,
          additionalInfo?.trim() || null, shouldBeDefault ? 1 : 0
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Dirección agregada correctamente',
        data: { id: result.insertId }
      });

    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error en API de direcciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}