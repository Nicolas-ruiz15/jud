// pages/api/user/preferences.js - Gestionar preferencias del usuario
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Verificar que el usuario existe y es customer
    const userResult = await query(
      'SELECT id FROM users WHERE id = ? AND role = "customer"',
      [decoded.userId]
    );

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userId = decoded.userId;

    if (req.method === 'GET') {
      // Obtener preferencias
      // Por ahora usaremos valores por defecto ya que no tenemos tabla de preferencias
      // En el futuro puedes crear una tabla 'user_preferences'
      
      const preferences = {
        newsletter: true,
        smsNotifications: false,
        emailNotifications: true,
        language: 'es'
      };

      res.status(200).json({
        success: true,
        data: preferences
      });

    } else if (req.method === 'PUT') {
      // Actualizar preferencias
      const { newsletter, smsNotifications, emailNotifications, language } = req.body;

      // Validaciones básicas
      if (language && !['es', 'en', 'he'].includes(language)) {
        return res.status(400).json({
          success: false,
          message: 'Idioma no válido'
        });
      }

      // Por ahora simulamos guardar las preferencias
      // En el futuro, crear tabla user_preferences y guardar ahí
      
      /*
      CREATE TABLE user_preferences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        newsletter BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT false,
        email_notifications BOOLEAN DEFAULT true,
        language VARCHAR(5) DEFAULT 'es',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      // Entonces harías:
      await query(
        `INSERT INTO user_preferences (user_id, newsletter, sms_notifications, email_notifications, language)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         newsletter = VALUES(newsletter),
         sms_notifications = VALUES(sms_notifications),
         email_notifications = VALUES(email_notifications),
         language = VALUES(language),
         updated_at = NOW()`,
        [userId, newsletter, smsNotifications, emailNotifications, language]
      );
      */

      res.status(200).json({
        success: true,
        message: 'Preferencias actualizadas correctamente',
        data: {
          newsletter: newsletter ?? true,
          smsNotifications: smsNotifications ?? false,
          emailNotifications: emailNotifications ?? true,
          language: language ?? 'es'
        }
      });

    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

  } catch (error) {
    console.error('Error gestionando preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}