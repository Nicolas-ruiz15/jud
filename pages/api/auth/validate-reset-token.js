// pages/api/auth/validate-reset-token.js - Validar token de reset
import crypto from 'crypto';
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }

    // Hash del token para buscar en la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token en la base de datos y verificar si no ha expirado
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
        message: 'El enlace ha expirado o no es válido'
      });
    }

    // Token válido
    res.status(200).json({
      success: true,
      message: 'Token válido'
    });

  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}