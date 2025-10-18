// pages/api/admin/analytics/realtime.js - ULTRA SIMPLIFICADA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('🔴 Realtime API called');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Datos de ejemplo
    const mockData = {
      activeVisitors: [],
      metrics: {
        active_visitors: 0,
        very_active_visitors: 0,
        active_pages: 0,
        logged_in_users: 0,
        mobile_visitors: 0,
        desktop_visitors: 0,
        tablet_visitors: 0
      },
      topPages: [],
      trafficSources: [],
      recentEvents: [],
      timestamp: new Date().toISOString()
    };

    // Intentar obtener datos reales de visitantes en tiempo real
    try {
      const activeVisitors = await query(`
        SELECT COUNT(*) as count 
        FROM analytics_realtime_visitors 
        WHERE last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `);
      
      if (activeVisitors && activeVisitors[0]) {
        mockData.metrics.active_visitors = activeVisitors[0].count;
      }

      // Obtener eventos recientes
      const recentEvents = await query(`
        SELECT 
          event_type, event_category, event_action, created_at
        FROM analytics_events 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      if (recentEvents) {
        mockData.recentEvents = recentEvents;
      }

      console.log('✅ Realtime data loaded:', {
        activeVisitors: mockData.metrics.active_visitors,
        recentEvents: mockData.recentEvents.length
      });

    } catch (dbError) {
      console.log('⚠️ Using mock realtime data due to DB error:', dbError.message);
    }

    res.status(200).json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('❌ Error en realtime:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);