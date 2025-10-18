// pages/api/analytics/page-exit.js - REGISTRAR SALIDA DE PÁGINA
import { query } from '../../../lib/database';

export default async function pageExitHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      timeOnPage,
      scrollDepth,
      clickCount,
      timestamp
    } = req.body;

    console.log('🚪 Página exit:', { sessionId, timeOnPage });

    // Registrar evento de salida
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action, 
        metadata, created_at
      ) VALUES (?, 'page_exit', 'navigation', 'page_exit', ?, NOW())
    `, [sessionId, JSON.stringify({ timeOnPage, scrollDepth, clickCount })]);

    // Actualizar tiempo en página actual
    await query(`
      UPDATE analytics_realtime_visitors 
      SET 
        time_on_current_page = ?,
        max_scroll_depth = GREATEST(max_scroll_depth, ?),
        total_clicks = ?,
        updated_at = NOW()
      WHERE session_id = ?
    `, [timeOnPage, Math.round(scrollDepth), clickCount, sessionId]);

    res.status(200).json({
      success: true,
      message: 'Salida de página registrada correctamente'
    });

  } catch (error) {
    console.error('❌ Error en page exit:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}