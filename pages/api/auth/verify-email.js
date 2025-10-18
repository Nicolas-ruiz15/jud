// pages/api/auth/verify-email.js - API para verificar email
import crypto from 'crypto';
import { query, transaction } from '../../../lib/database';
import { sendWelcomeEmail } from '../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificación requerido'
      });
    }

    console.log('=== VERIFICACIÓN DE EMAIL INICIADA ===');
    console.log('Token recibido');

    // Hash del token para buscar en la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await transaction(async (conn) => {
      // 1. Buscar token válido en la base de datos
      const tokenResult = await conn.query(
        `SELECT ev.id, ev.user_id, ev.expires_at, u.id as user_id_check, u.email, u.name, u.email_verified
         FROM email_verifications ev
         JOIN users u ON ev.user_id = u.id
         WHERE ev.token_hash = ? AND ev.expires_at > NOW()`,
        [hashedToken]
      );

      if (tokenResult.length === 0) {
        throw new Error('INVALID_TOKEN');
      }

      const verification = tokenResult[0];
      console.log('Token válido encontrado para usuario:', verification.email);

      // 2. Verificar si el email ya está verificado
      if (verification.email_verified) {
        console.log('Email ya estaba verificado');
        return {
          already_verified: true,
          user: {
            id: verification.user_id,
            email: verification.email,
            name: verification.name
          }
        };
      }

      // 3. Marcar email como verificado
      await conn.query(
        'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = ?',
        [verification.user_id]
      );

      console.log('Email marcado como verificado');

      // 4. Eliminar token usado y todos los tokens del usuario (limpieza)
      await conn.query(
        'DELETE FROM email_verifications WHERE user_id = ?',
        [verification.user_id]
      );

      console.log('Tokens de verificación eliminados');

      // 5. Obtener datos actualizados del usuario
      const updatedUser = await conn.queryOne(
        'SELECT id, name, email, email_verified, created_at FROM users WHERE id = ?',
        [verification.user_id]
      );

      return {
        already_verified: false,
        user: updatedUser
      };
    });

    // 6. Enviar email de bienvenida (fuera de transacción)
    let welcomeEmailResult = null;
    
    if (!result.already_verified) {
      try {
        console.log('📧 Enviando email de bienvenida...');
        welcomeEmailResult = await sendWelcomeEmail(result.user);
        console.log('✅ Email de bienvenida enviado:', welcomeEmailResult.success);
      } catch (emailError) {
        console.error('❌ Error enviando email de bienvenida:', emailError);
        // No fallar la verificación si hay problemas con email de bienvenida
        welcomeEmailResult = { success: false, error: emailError.message };
      }
    }

    console.log('=== VERIFICACIÓN EXITOSA ===');

    return res.status(200).json({
      success: true,
      message: result.already_verified 
        ? 'Tu email ya estaba verificado' 
        : '¡Email verificado exitosamente! Bienvenido/a',
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          email_verified: true,
          created_at: result.user.created_at
        },
        already_verified: result.already_verified,
        welcome_email_sent: welcomeEmailResult?.success || false
      }
    });

  } catch (error) {
    console.error('=== ERROR EN VERIFICACIÓN ===');
    console.error('Error:', error.message);

    if (error.message === 'INVALID_TOKEN') {
      return res.status(400).json({
        success: false,
        message: 'El enlace de verificación ha expirado o no es válido. Solicita un nuevo enlace.',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}