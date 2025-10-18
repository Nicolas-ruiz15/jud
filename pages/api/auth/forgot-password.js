// pages/api/auth/forgot-password.js - API para solicitar recuperación de contraseña
import crypto from 'crypto';
import { query } from '../../../lib/database';
import { sendPasswordResetEmail } from '../../../lib/emailService'; // Función para enviar emails

// Rate limiting simple (en producción usar Redis)
const resetAttempts = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { email } = req.body;

    // Validaciones básicas
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Rate limiting básico (máximo 3 intentos por email en 15 minutos)
    const clientKey = `${req.headers['x-forwarded-for'] || req.connection.remoteAddress}_${normalizedEmail}`;
    const now = Date.now();
    const attempts = resetAttempts.get(clientKey) || [];
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 15 * 60 * 1000); // 15 minutos

    if (recentAttempts.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos'
      });
    }

    // Registrar intento
    recentAttempts.push(now);
    resetAttempts.set(clientKey, recentAttempts);

    // Buscar usuario por email
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE email = ? AND role = "customer"',
      [normalizedEmail]
    );

    // Por seguridad, siempre devolver éxito (no revelar si el email existe)
    // Esto previene enumeration attacks
    if (userResult.length === 0) {
      // Simular delay para que parezca que se procesó
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      return res.status(200).json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
      });
    }

    const user = userResult[0];

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Hash del token para almacenar en DB (más seguro)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Limpiar tokens anteriores del usuario
    await query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [user.id]
    );

    // Guardar token en base de datos
    await query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [user.id, hashedToken, tokenExpiry]
    );

    // Preparar datos para el email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const emailData = {
      to: user.email,
      name: user.name,
      resetUrl: resetUrl,
      expiryTime: '1 hora'
    };

    try {
      // Enviar email (implementar función según tu proveedor de email)
      await sendPasswordResetEmail(emailData);
      
      // Log para desarrollo (remover en producción)
      console.log(`Password reset email sent to ${user.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      
      // Limpiar token si el email falló
      await query(
        'DELETE FROM password_reset_tokens WHERE user_id = ?',
        [user.id]
      );
      
      return res.status(500).json({
        success: false,
        message: 'Error enviando el email. Inténtalo de nuevo.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Limpiar intentos antiguos cada hora
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of resetAttempts.entries()) {
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 15 * 60 * 1000);
    if (recentAttempts.length === 0) {
      resetAttempts.delete(key);
    } else {
      resetAttempts.set(key, recentAttempts);
    }
  }
}, 60 * 60 * 1000); // 1 hora