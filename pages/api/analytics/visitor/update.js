// pages/api/analytics/visitor/update.js - ACTUALIZAR DATOS DEL VISITANTE
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      currentUrl,
      currentTitle,
      timeOnCurrentPage,
      scrollDepth,
      clickCount,
      lastActivity,
      isActive,
      timestamp
    } = req.body;

    if (!sessionId || !visitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId y visitorId son requeridos' 
      });
    }

    console.log('🔄 Actualizando visitante:', { sessionId, isActive, timeOnCurrentPage });

    // Actualizar analytics_realtime_visitors
    await query(`
      UPDATE analytics_realtime_visitors 
      SET 
        current_page_path = ?,
        current_page_title = ?,
        time_on_current_page = ?,
        max_scroll_depth = GREATEST(max_scroll_depth, ?),
        total_clicks = ?,
        last_activity = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE session_id = ?
    `, [
      new URL(currentUrl).pathname,
      currentTitle,
      timeOnCurrentPage,
      Math.round(scrollDepth),
      clickCount,
      lastActivity,
      isActive ? 1 : 0,
      sessionId
    ]);

    // Actualizar analytics_sessions
    await query(`
      UPDATE analytics_sessions 
      SET 
        current_page = ?,
        last_activity = ?,
        duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
        updated_at = NOW()
      WHERE id = ?
    `, [new URL(currentUrl).pathname, lastActivity, sessionId]);

    res.status(200).json({
      success: true,
      message: 'Visitante actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando visitante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}