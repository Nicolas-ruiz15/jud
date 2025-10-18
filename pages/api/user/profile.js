// pages/api/user/profile.js - Actualizar perfil del usuario
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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
    const { name, phone, address, city, firstName, lastName } = req.body;

    // Validaciones
    const errors = {};
    
    if (!name || !name.trim()) {
      errors.name = 'El nombre es requerido';
    }

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

    // Actualizar datos del usuario
    await query(
      `UPDATE users 
       SET name = ?, phone = ?, address = ?, city = ?, 
           first_name = ?, last_name = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        city ? city.trim() : null,
        firstName ? firstName.trim() : null,
        lastName ? lastName.trim() : null,
        userId
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}