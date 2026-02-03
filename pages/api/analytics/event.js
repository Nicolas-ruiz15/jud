// pages/api/analytics/event.js - REGISTRAR EVENTOS
import jwt from 'jsonwebtoken';
import { query } from '../../../lib/database';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://judaicabreslovcolombia.com',
  'https://www.judaicabreslovcolombia.com'
];

const cut = (value, max) => (value ? String(value).slice(0, max) : null);

const sanitizePagePath = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const url = new URL(String(rawUrl));
    return url.pathname || '/';
  } catch {
    return '/';
  }
};

const getAuthUserId = (req) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token || !process.env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded?.userId;
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const body = req.body || {};
    const sessionId = cut(body.sessionId, 128);
    if (!sessionId) {
      return res.status(200).json({ success: false, message: 'sessionId requerido' });
    }

    const visitorId = cut(body.visitorId || req.headers['x-visitor-id'] || null, 36);
    const parsedUserId = Number.isFinite(+body.userId) ? +body.userId : null;
    const userId = parsedUserId ?? getAuthUserId(req);

    const eventType = cut(body.eventType || 'event', 64);
    const eventCategory = cut(body.eventCategory || 'interaction', 64);
    const eventAction = cut(body.eventAction || eventType || 'event', 64);
    const eventLabel = cut(body.eventLabel || null, 255);

    const pageUrl = body.pageUrl || body.currentPageUrl || body.currentUrl || null;
    const safeUrl = pageUrl ? cut(String(pageUrl), 1000) : null;
    const safePath = cut(
      body.pagePath || (safeUrl ? sanitizePagePath(safeUrl) : null),
      500
    );

    const value = body.value === 0 || body.value ? body.value : null;
    const metadata = body.metadata || null;

    await query(
      `INSERT INTO analytics_events (
        session_id, user_id, event_type, event_category, event_action,
        event_label, page_url, page_path, \`value\`, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        sessionId,
        userId,
        eventType,
        eventCategory,
        eventAction,
        eventLabel,
        safeUrl,
        safePath,
        value,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    await query(
      `UPDATE analytics_sessions
       SET user_id = COALESCE(user_id, ?),
           visitor_id = COALESCE(visitor_id, ?),
           last_activity = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [userId, visitorId, sessionId]
    );

    if (eventType === 'click') {
      await query(
        `UPDATE analytics_realtime_visitors
         SET total_clicks = total_clicks + 1,
             last_activity = NOW(),
             user_id = COALESCE(user_id, ?)
         WHERE session_id = ?`,
        [userId, sessionId]
      );
    } else if (eventType === 'scroll' && Number.isFinite(+body.scrollDepth)) {
      await query(
        `UPDATE analytics_realtime_visitors
         SET max_scroll_depth = GREATEST(max_scroll_depth, ?),
             last_activity = NOW(),
             user_id = COALESCE(user_id, ?)
         WHERE session_id = ?`,
        [Math.round(+body.scrollDepth), userId, sessionId]
      );
    } else {
      await query(
        `UPDATE analytics_realtime_visitors
         SET last_activity = NOW(),
             user_id = COALESCE(user_id, ?)
         WHERE session_id = ?`,
        [userId, sessionId]
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[api/analytics/event] ERROR:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
