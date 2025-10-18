// pages/api/analytics/event.js - REGISTRAR EVENTOS
export async function handleEvent(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      eventType,
      eventData,
      url,
      timestamp
    } = req.body;

    if (!sessionId || !visitorId || !eventType) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId, visitorId y eventType son requeridos' 
      });
    }

    console.log('🎯 Registrando evento:', { sessionId, eventType, eventData });

    // Registrar en analytics_events
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action, 
        event_label, page_url, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      sessionId, 
      eventType, 
      eventData.category || 'interaction',
      eventData.action || eventType,
      eventData.label || '',
      url,
      JSON.stringify(eventData)
    ]);

    // Actualizar última actividad
    await query(`
      UPDATE analytics_realtime_visitors 
      SET 
        last_activity = NOW(),
        total_clicks = CASE WHEN ? = 'click' THEN total_clicks + 1 ELSE total_clicks END,
        max_scroll_depth = CASE WHEN ? = 'scroll' THEN GREATEST(max_scroll_depth, ?) ELSE max_scroll_depth END,
        updated_at = NOW()
      WHERE session_id = ?
    `, [eventType, eventType, eventData.depth || 0, sessionId]);

    res.status(200).json({
      success: true,
      message: 'Evento registrado correctamente'
    });

  } catch (error) {
    console.error('❌ Error registrando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}