import jwt from 'jsonwebtoken';
import { query } from '../lib/database';

export const adminAuth = (handler) => {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.cookies.adminToken;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido',
          redirectTo: '/admin/login'
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          redirectTo: '/admin/login'
        });
      }

      // ✅ Verificar que el usuario existe y es admin (solo columnas que existen)
      const user = await query(
        'SELECT id, email, role, name FROM users WHERE id = ? AND role = "admin"',
        [decoded.userId]
      );

      if (user.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado',
          redirectTo: '/admin/login'
        });
      }

      // Agregar usuario a la request
      req.user = user[0];
      
      return handler(req, res);
    } catch (error) {
      console.error('Error en autenticación admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};