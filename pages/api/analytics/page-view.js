// pages/api/analytics/page-view.js - REGISTRAR PÁGINA VISTA
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      url,
      path,
      title,
      referrer,
      timestamp,
      viewportSize,
      screenSize
    } = req.body;

    if (!sessionId || !visitorId || !url) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId, visitorId y url son requeridos' 
      });
    }

    console.log('📄 Registrando página vista:', { sessionId, path, title });

    // Registrar en analytics_page_views
    await query(`
      INSERT INTO analytics_page_views (
        session_id, visitor_id, user_id, page_url, page_path, page_title,
        referrer, viewport_size, screen_size, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [sessionId, visitorId, null, url, path, title, referrer, viewportSize, screenSize]);

    // Actualizar analytics_realtime_visitors
    await query(`
      UPDATE analytics_realtime_visitors 
      SET 
        current_page_path = ?,
        current_page_title = ?,
        pages_visited = pages_visited + 1,
        last_activity = NOW(),
        time_on_current_page = 0,
        updated_at = NOW()
      WHERE session_id = ?
    `, [path, title, sessionId]);

    // Actualizar analytics_sessions
    await query(`
      UPDATE analytics_sessions 
      SET 
        page_views = page_views + 1,
        current_page = ?,
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `, [path, sessionId]);

    // Registrar evento en analytics_events
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action, 
        event_label, page_url, metadata, created_at
      ) VALUES (?, 'page_view', 'navigation', 'page_view', ?, ?, ?, NOW())
    `, [sessionId, title, url, JSON.stringify({ viewport: viewportSize, screen: screenSize })]);

    res.status(200).json({
      success: true,
      message: 'Página vista registrada correctamente'
    });

  } catch (error) {
    console.error('❌ Error registrando página vista:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}