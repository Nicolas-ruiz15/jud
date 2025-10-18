// pages/api/analytics/session/start.js - CREAR/ACTUALIZAR SESIÓN
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      sessionId,
      visitorId,
      type,
      browser,
      browserVersion,
      os,
      osVersion,
      isMobile,
      screenResolution,
      viewport,
      language,
      timezone,
      cookieEnabled,
      javaEnabled,
      ip,
      country,
      countryCode,
      region,
      city,
      isp,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      referrer,
      landingPage,
      userAgent,
      startTime
    } = req.body;

    if (!sessionId || !visitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId y visitorId son requeridos' 
      });
    }

    console.log('📊 Iniciando sesión:', { sessionId, visitorId, country, city });

    // Verificar si la sesión ya existe
    const existingSession = await query(
      'SELECT id FROM analytics_sessions WHERE id = ?',
      [sessionId]
    );

    if (existingSession.length > 0) {
      // Actualizar sesión existente
      await query(`
        UPDATE analytics_sessions 
        SET 
          last_activity = NOW(),
          page_views = page_views + 1,
          updated_at = NOW()
        WHERE id = ?
      `, [sessionId]);
      
      console.log('✅ Sesión actualizada:', sessionId);
    } else {
      // Crear nueva sesión
      await query(`
        INSERT INTO analytics_sessions (
          id, visitor_id, user_id, ip_address, country, country_code,
          region, city, timezone, isp, device_type, browser, browser_version,
          os, os_version, is_mobile, screen_resolution, viewport_size,
          language, cookie_enabled, java_enabled, referrer, landing_page,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          user_agent, started_at, last_activity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `, [
        sessionId, visitorId, null, ip, country, countryCode,
        region, city, timezone, isp, type, browser, browserVersion,
        os, osVersion, isMobile ? 1 : 0, screenResolution, viewport,
        language, cookieEnabled ? 1 : 0, javaEnabled ? 1 : 0, referrer, landingPage,
        utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
        userAgent, startTime, new Date().toISOString()
      ]);

      console.log('✅ Nueva sesión creada:', sessionId);
    }

    // Crear/actualizar entrada en analytics_realtime_visitors
    await query(`
      INSERT INTO analytics_realtime_visitors (
        session_id, visitor_id, user_id, current_page_path, current_page_title,
        last_activity, pages_visited, total_clicks, max_scroll_depth,
        time_on_current_page, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), 1, 0, 0, 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        last_activity = NOW(),
        updated_at = NOW()
    `, [sessionId, visitorId, null, landingPage, 'Página de inicio']);

    // Crear entrada en visitor_tracking si no existe
    await query(`
      INSERT INTO visitor_tracking (
        visitor_id, session_id, ip_address, country, city, device_type,
        browser, os, first_visit, last_visit, total_sessions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        session_id = VALUES(session_id),
        last_visit = NOW(),
        total_sessions = total_sessions + 1,
        updated_at = NOW()
    `, [visitorId, sessionId, ip, country, city, type, browser, os]);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        visitorId,
        created: existingSession.length === 0
      },
      message: 'Sesión inicializada correctamente'
    });

  } catch (error) {
    console.error('❌ Error iniciando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}