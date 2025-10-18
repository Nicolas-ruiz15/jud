// middleware/auth.js - MIDDLEWARE CORREGIDO Y LIMPIO
import jwt from 'jsonwebtoken';
import { query } from '../lib/database';

// Middleware opcional - no requiere autenticación pero la usa si existe
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Obtener datos del usuario
        const userResult = await query(
          'SELECT id, email, name, role FROM users WHERE id = ?',
          [decoded.userId]
        );

        if (userResult.length > 0) {
          req.user = userResult[0];
        }
      } catch (jwtError) {
        // Token inválido, pero no es error porque es opcional
        console.log('Token inválido en optionalAuth:', jwtError.message);
      }
    }

    // Continuar con el handler
    return next();
  } catch (error) {
    console.error('Error en optionalAuth:', error);
    return next();
  }
};

// Middleware requerido - sí requiere autenticación
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar que el usuario existe
    const userResult = await query(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = userResult[0];
    return next();
  } catch (error) {
    console.error('Error en verifyToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar token JWT
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};