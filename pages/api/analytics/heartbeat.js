// pages/api/analytics/heartbeat.js - HEARTBEAT PARA MANTENER SESIÓN ACTIVA
import { query } from '../../../lib/database';

export default async function heartbeatHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      isActive,
      lastActivity,
      currentUrl,
      timestamp
    } = req.body;

    if (!sessionId || !visitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId y visitorId son requeridos' 
      });
    }

    console.log('💓 Heartbeat:', { sessionId, isActive });

    // Actualizar última actividad
    await query(`
      UPDATE analytics_realtime_visitors 
      SET 
        last_activity = ?,
        is_active = ?,
        current_page_path = ?,
        updated_at = NOW()
      WHERE session_id = ?
    `, [lastActivity, isActive ? 1 : 0, new URL(currentUrl).pathname, sessionId]);

    // Limpiar visitantes inactivos (más de 30 minutos sin actividad)
    await query(`
      DELETE FROM analytics_realtime_visitors 
      WHERE last_activity < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `);

    res.status(200).json({
      success: true,
      message: 'Heartbeat procesado correctamente'
    });

  } catch (error) {
    console.error('❌ Error en heartbeat:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
