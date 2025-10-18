// pages/api/auth/resend-verification.js - API para reenviar verificación
import crypto from 'crypto';
import { query, transaction } from '../../../lib/database';
import { sendResendVerification } from '../../../lib/emailService';

// Rate limiting simple para reenvíos
const resendAttempts = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validar formato de email
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    console.log('=== REENVÍO DE VERIFICACIÓN INICIADO ===');
    console.log('Email:', normalizedEmail);

    // Rate limiting (máximo 3 reenvíos por email en 1 hora)
    const clientKey = `${req.headers['x-forwarded-for'] || 'unknown'}_${normalizedEmail}`;
    const now = Date.now();
    const attempts = resendAttempts.get(clientKey) || [];
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 60 * 60 * 1000); // 1 hora

    if (recentAttempts.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Puedes reenviar nuevamente en 1 hora',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Registrar intento
    recentAttempts.push(now);
    resendAttempts.set(clientKey, recentAttempts);

    const result = await transaction(async (conn) => {
      // 1. Buscar usuario por email
      const userResult = await conn.query(
        'SELECT id, name, email, email_verified FROM users WHERE email = ? AND role = "customer"',
        [normalizedEmail]
      );

      if (userResult.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = userResult[0];

      // 2. Verificar si ya está verificado
      if (user.email_verified) {
        throw new Error('ALREADY_VERIFIED');
      }

      // 3. Limpiar tokens de verificación anteriores
      await conn.query(
        'DELETE FROM email_verifications WHERE user_id = ?',
        [user.id]
      );

      // 4. Generar nuevo token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

      // 5. Guardar nuevo token en base de datos
      await conn.query(
        'INSERT INTO email_verifications (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())',
        [user.id, hashedToken, tokenExpiry]
      );

      console.log('Nuevo token de verificación generado');

      return {
        user: user,
        verificationToken: verificationToken
      };
    });

    // 6. Enviar email de reenvío (fuera de transacción)
    let emailResult = null;
    
    try {
      console.log('📧 Enviando email de reenvío...');
      emailResult = await sendResendVerification(result.user, result.verificationToken);
      console.log('✅ Email de reenvío enviado:', emailResult.success);
    } catch (emailError) {
      console.error('❌ Error enviando email de reenvío:', emailError);
      
      // Limpiar token si el email falló
      await query(
        'DELETE FROM email_verifications WHERE user_id = ?',
        [result.user.id]
      );
      
      throw new Error('EMAIL_SEND_FAILED');
    }

    console.log('=== REENVÍO EXITOSO ===');

    return res.status(200).json({
      success: true,
      message: 'Hemos enviado un nuevo enlace de verificación a tu email',
      data: {
        email: result.user.email,
        email_sent: emailResult?.success || false,
        attempts_remaining: 3 - recentAttempts.length
      }
    });

  } catch (error) {
    console.error('=== ERROR EN REENVÍO ===');
    console.error('Error:', error.message);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'No encontramos una cuenta con ese email',
        code: 'USER_NOT_FOUND'
      });
    }

    if (error.message === 'ALREADY_VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Tu email ya está verificado. Puedes iniciar sesión normalmente.',
        code: 'ALREADY_VERIFIED'
      });
    }

    if (error.message === 'EMAIL_SEND_FAILED') {
      return res.status(500).json({
        success: false,
        message: 'Error enviando el email. Inténtalo de nuevo en unos minutos.',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Limpiar intentos antiguos cada hora
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of resendAttempts.entries()) {
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 60 * 60 * 1000);
    if (recentAttempts.length === 0) {
      resendAttempts.delete(key);
    } else {
      resendAttempts.set(key, recentAttempts);
    }
  }
}, 60 * 60 * 1000); // 1 hora