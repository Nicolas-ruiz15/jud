// pages/api/auth/me.js - API para obtener usuario autenticado
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  let connection;

  try {
    // Obtener token de cookies o headers
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
        user: null
      });
    }

    // Verificar token JWT
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no configurado');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('Token inválido:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        user: null
      });
    }

    // Crear conexión a BD
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    // Buscar usuario en la base de datos
    const [users] = await connection.execute(
      'SELECT id, name, email, phone, city, role, email_verified, created_at FROM users WHERE id = ? AND role = ?',
      [decoded.userId, 'customer']
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        user: null
      });
    }

    const user = users[0];

    // Respuesta exitosa
   res.status(200).json({
  success: true,
  message: 'Usuario autenticado',
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    email_verified: user.email_verified, // AGREGADO
    createdAt: user.created_at
  }
});

  } catch (error) {
    console.error('=== ERROR EN /api/auth/me ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      user: null,
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}