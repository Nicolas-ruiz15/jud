// pages/api/analytics/track.js - VERSION QUE FUNCIONA
import { query, transaction } from '../../../lib/database';
import crypto from 'crypto';

// Función para generar ID único
function generateId() {
  return 'sess_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

// Función para detectar dispositivo
function detectDevice(userAgent) {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

// Función para obtener IP
function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         '127.0.0.1';
}

export default async function handler(req, res) {
  console.log('🎯 Analytics Track API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { sessionId, userId, type, data } = req.body;
    
    console.log('📊 Processing:', { type, sessionId: sessionId?.substring(0, 10) + '...' });

    // Información básica
    const ip = getRealIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDevice(userAgent);

    let currentSessionId = sessionId || generateId();

    // Procesar según el tipo
    switch (type) {
      case 'session_start':
      case 'pageview':
        await handlePageView(currentSessionId, userId, data, { ip, userAgent, deviceType });
        break;
        
      case 'event':
        await handleEvent(currentSessionId, userId, data);
        break;
        
      case 'batch':
        if (data.events && Array.isArray(data.events)) {
          for (const event of data.events) {
            try {
              if (event.type === 'event') {
                await handleEvent(currentSessionId, userId, event.data);
              }
            } catch (err) {
              console.log('⚠️ Error in batch event:', err.message);
            }
          }
        }
        break;
    }

    console.log('✅ Event processed successfully');

    res.status(200).json({
      success: true,
      sessionId: currentSessionId,
      message: 'Evento procesado correctamente'
    });

  } catch (error) {
    console.error('❌ Error en tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function handlePageView(sessionId, userId, data, metadata) {
  try {
    console.log('📄 Handling page view');
    
    // Crear/actualizar sesión
    await query(`
      INSERT INTO analytics_sessions (
        id, user_id, ip_address, user_agent, device_type, 
        landing_page, referrer, created_at, updated_at, page_views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE
        updated_at = NOW(),
        page_views = page_views + 1
    `, [
      sessionId, userId, metadata.ip, metadata.userAgent, metadata.deviceType,
      data.pageUrl || data.landingPage, data.referrer
    ]);

    // Crear page view
    if (data.pageUrl) {
      const pagePath = new URL(data.pageUrl).pathname;
      
      await query(`
        INSERT INTO analytics_page_views (
          session_id, user_id, page_url, page_title, page_path,
          referrer, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        sessionId, userId, data.pageUrl, data.pageTitle, pagePath, data.referrer
      ]);
    }

    // Actualizar visitantes en tiempo real
    if (data.pageUrl && data.pageTitle) {
      const pagePath = new URL(data.pageUrl).pathname;
      
      await query(`
        INSERT INTO analytics_realtime_visitors (
          session_id, user_id, current_page_url, current_page_title,
          current_page_path, device_type, last_activity, session_start, page_views
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
        ON DUPLICATE KEY UPDATE
          current_page_url = VALUES(current_page_url),
          current_page_title = VALUES(current_page_title),
          current_page_path = VALUES(current_page_path),
          last_activity = NOW(),
          page_views = page_views + 1
      `, [
        sessionId, userId, data.pageUrl, data.pageTitle, pagePath, metadata.deviceType
      ]);
    }

    console.log('✅ Page view handled');
  } catch (error) {
    console.error('❌ Error in handlePageView:', error);
    throw error;
  }
}

async function handleEvent(sessionId, userId, data) {
  try {
    console.log('🎯 Handling event:', data.eventType);
    
    const pagePath = data.pageUrl ? new URL(data.pageUrl).pathname : null;

    await query(`
      INSERT INTO analytics_events (
        session_id, user_id, event_type, event_category, event_action,
        event_label, page_url, page_path, value, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      sessionId, userId, data.eventType, data.eventCategory, data.eventAction,
      data.eventLabel, data.pageUrl, pagePath, data.value,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);

    // Si es una conversión, registrarla también
    if (data.eventType === 'conversion') {
      await query(`
        INSERT INTO analytics_conversions (
          session_id, user_id, conversion_type, conversion_value,
          page_url, page_path, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        sessionId, userId, data.eventCategory, data.value,
        data.pageUrl, pagePath, JSON.stringify(data.metadata)
      ]);
    }

    // Actualizar última actividad
    await query(`
      UPDATE analytics_realtime_visitors
      SET last_activity = NOW()
      WHERE session_id = ?
    `, [sessionId]);

    console.log('✅ Event handled');
  } catch (error) {
    console.error('❌ Error in handleEvent:', error);
    throw error;
  }
}