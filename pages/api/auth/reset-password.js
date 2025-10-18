// pages/api/auth/reset-password.js - API para cambiar contraseña con token
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { token, password } = req.body;

    // Validaciones básicas
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña es requerida'
      });
    }

    // Validar contraseña
    const errors = {};
    if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      errors.password = 'La contraseña debe incluir mayúsculas y minúsculas';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña no válida',
        errors
      });
    }

    // Hash del token para buscar en la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token válido en la base de datos
    const tokenResult = await query(
      `SELECT prt.id, prt.user_id, prt.expires_at, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? AND prt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokenResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El enlace ha expirado o no es válido. Solicita un nuevo enlace.'
      });
    }

    const tokenRecord = tokenResult[0];

    // Verificar que no sea la misma contraseña actual
    const userResult = await query(
      'SELECT password FROM users WHERE id = ?',
      [tokenRecord.user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const currentPasswordHash = userResult[0].password;
    const isSamePassword = await bcrypt.compare(password, currentPasswordHash);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual',
        errors: { password: 'Debe ser diferente a la contraseña actual' }
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar contraseña del usuario
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, tokenRecord.user_id]
    );

    // Eliminar token usado y todos los tokens del usuario (por seguridad)
    await query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [tokenRecord.user_id]
    );

    // Log de auditoría (opcional)
    console.log(`Password reset successful for user: ${tokenRecord.email}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}