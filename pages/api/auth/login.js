// pages/api/auth/login.js - VERSIÓN ARREGLADA CON EMAIL_VERIFIED
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  let connection;

  try {
    const { email, password } = req.body;

    console.log('=== LOGIN INICIADO ===');
    console.log('Email:', email);

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña requeridos',
        errors: {
          email: !email ? 'Email requerido' : '',
          password: !password ? 'Contraseña requerida' : ''
        }
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

    // Buscar usuario (INCLUYE email_verified)
    const [users] = await connection.execute(
      'SELECT id, name, email, password, phone, city, role, email_verified FROM users WHERE email = ? AND role = ?',
      [email.toLowerCase().trim(), 'customer']
    );

    if (users.length === 0) {
      console.log('Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: { email: 'No existe cuenta con este email' }
      });
    }

    const user = users[0];
    console.log('Usuario encontrado:', user.id);

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: { password: 'Contraseña incorrecta' }
      });
    }

    console.log('Contraseña correcta');

    // ======================== VERIFICAR EMAIL ========================
    if (!user.email_verified) {
      console.log('Email no verificado para:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Debes verificar tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        actions: {
          resend_verification: true,
          message: 'Puedes solicitar un nuevo enlace de verificación'
        }
      });
    }
    
    console.log('Email verificado, procediendo con login');
    // ======================== FIN VERIFICACIÓN ========================

    // Crear token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Token creado');

    // Configurar cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    ]);

    console.log('=== LOGIN EXITOSO ===');

    // Respuesta (sin contraseña)
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('=== ERROR LOGIN ===');
    console.error(error);

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