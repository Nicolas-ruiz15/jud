// pages/api/admin/analytics/overview.js - ULTRA SIMPLIFICADA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('📊 Overview API called');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Datos de ejemplo hasta que el tracking funcione
    const mockData = {
      overview: {
        total_sessions: 0,
        unique_users: 0,
        total_page_views: 0,
        avg_session_duration: 0,
        pages_per_session: 0,
        bounce_rate: 0,
        growth: { sessions: 0, users: 0, pageViews: 0 }
      },
      dailyStats: [],
      topPages: [],
      topEvents: [],
      deviceStats: [
        { device_type: 'desktop', sessions: 0, percentage: 0 },
        { device_type: 'mobile', sessions: 0, percentage: 0 },
        { device_type: 'tablet', sessions: 0, percentage: 0 }
      ],
      browserStats: [],
      period: req.query.period || '30d',
      generatedAt: new Date().toISOString()
    };

    // Intentar obtener datos reales
    try {
      const sessionCount = await query('SELECT COUNT(*) as count FROM analytics_sessions');
      const eventCount = await query('SELECT COUNT(*) as count FROM analytics_events');
      const pageViewCount = await query('SELECT COUNT(*) as count FROM analytics_page_views');
      
      if (sessionCount && sessionCount[0]) {
        mockData.overview.total_sessions = sessionCount[0].count;
      }
      if (eventCount && eventCount[0]) {
        mockData.overview.total_events = eventCount[0].count;
      }
      if (pageViewCount && pageViewCount[0]) {
        mockData.overview.total_page_views = pageViewCount[0].count;
      }

      console.log('✅ Real data loaded:', {
        sessions: mockData.overview.total_sessions,
        events: mockData.overview.total_events,
        pageViews: mockData.overview.total_page_views
      });

    } catch (dbError) {
      console.log('⚠️ Using mock data due to DB error:', dbError.message);
    }

    res.status(200).json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('❌ Error en overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);