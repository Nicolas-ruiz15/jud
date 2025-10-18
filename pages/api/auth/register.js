// pages/api/auth/register.js - VERSIÓN ARREGLADA SIN DUPLICADOS
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { sendEmailVerification } from '../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  let connection;

  try {
    const { name, email, password, phone, city } = req.body;

    console.log('=== REGISTRO INICIADO ===');
    console.log('Datos:', { name, email, phone, city });

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos faltantes',
        errors: {
          name: !name ? 'Nombre requerido' : '',
          email: !email ? 'Email requerido' : '',
          password: !password ? 'Contraseña requerida' : ''
        }
      });
    }

    // Validar email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
        errors: { email: 'Formato de email inválido' }
      });
    }

    // Validar contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña muy corta',
        errors: { password: 'Mínimo 6 caracteres' }
      });
    }

    // Crear conexión directa
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('Conexión a BD establecida');

    // Verificar si usuario existe
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      console.log('Usuario ya existe');
      return res.status(409).json({
        success: false,
        message: 'Email ya registrado',
        errors: { email: 'Ya existe una cuenta con este email' }
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Contraseña encriptada');

    // Insertar usuario (SIN email_verified por defecto será FALSE)
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, phone, city, role, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW(), NOW())',
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        phone?.trim() || null,
        city?.trim() || null,
        'customer'
      ]
    );

    const userId = result.insertId;
    console.log('Usuario creado con ID:', userId);

    // ======================== VERIFICACIÓN DE EMAIL ========================
    let emailVerificationResult = null;
    
    try {
      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      
      // Guardar token en base de datos
      await connection.execute(
        'INSERT INTO email_verifications (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())',
        [userId, hashedToken, tokenExpiry]
      );
      
      console.log('Token de verificación creado');
      
      // Enviar email de verificación
      const userData = {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim()
      };
      
      emailVerificationResult = await sendEmailVerification(userData, verificationToken);
      console.log('✅ Email de verificación enviado:', emailVerificationResult.success);
      
    } catch (emailError) {
      console.error('❌ Error con email de verificación:', emailError);
      // No fallar el registro si hay problemas con email
      emailVerificationResult = { success: false, error: emailError.message };
    }

    console.log('=== REGISTRO EXITOSO ===');

    // ======================== RESPUESTA ÚNICA ========================
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        role: 'customer',
        email_verified: false
      },
      verification_email_sent: emailVerificationResult?.success || false,
      next_step: 'verify_email'
    });

  } catch (error) {
    console.error('=== ERROR REGISTRO ===');
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email ya registrado',
        errors: { email: 'Ya existe una cuenta con este email' }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}