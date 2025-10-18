// pages/api/admin/analytics/live-visitors-optimized.js - ACTUALIZADA CON TU ESTRUCTURA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    console.log('📊 Obteniendo visitantes en tiempo real...');
    
    // CONSULTA USANDO TU ESTRUCTURA REAL
    const visitorsQuery = `
      SELECT 
        s.id as session_id,
        s.id as visitor_id,
        s.user_id,
        s.ip_address,
        s.country,
        s.city,
        s.device_type,
        s.browser,
        s.os,
        s.country_code,
        s.region,
        s.referrer,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        s.landing_page,
        s.page_views,
        s.duration_seconds,
        s.is_mobile,
        s.created_at as session_start,
        s.updated_at as last_activity,
        u.name as user_name,
        u.email as user_email,
        
        -- Calcular métricas
        TIMESTAMPDIFF(MINUTE, s.updated_at, NOW()) as minutes_since_activity,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, s.updated_at, NOW()) < 2 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, s.updated_at, NOW()) < 5 THEN 'away'
          ELSE 'offline'
        END as status
        
      FROM analytics_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.updated_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        AND s.is_bot = 0
      ORDER BY s.updated_at DESC
      LIMIT 50
    `;

    const visitors = await query(visitorsQuery);

    // También obtener datos de analytics_realtime_visitors si existen
    const realtimeQuery = `
      SELECT 
        rv.session_id,
        rv.current_page_path,
        rv.current_page_title,
        rv.pages_visited,
        rv.total_clicks,
        rv.max_scroll_depth,
        rv.time_on_current_page
      FROM analytics_realtime_visitors rv
      WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `;

    const realtimeData = await query(realtimeQuery);
    
    // Crear mapa de datos en tiempo real
    const realtimeMap = {};
    realtimeData.forEach(rt => {
      realtimeMap[rt.session_id] = rt;
    });

    // Estadísticas
    const stats = {
      activeVisitors: visitors.length,
      registeredVisitors: visitors.filter(v => v.user_id).length,
      anonymousVisitors: visitors.filter(v => !v.user_id).length,
      totalPageViews: visitors.reduce((acc, v) => acc + (v.page_views || 0), 0),
      averageSessionDuration: visitors.length > 0 ? 
        Math.round(visitors.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / visitors.length) : 0,
      newVisitorsToday: visitors.filter(v => {
        const today = new Date().toDateString();
        return new Date(v.session_start).toDateString() === today;
      }).length,
      visitorsWithCart: 0,
      averageCartValue: 0,
      visitorsWithActiveChat: 0,
      totalUnreadMessages: 0
    };

    // Formatear visitantes para el frontend
    const formattedVisitors = visitors.map(visitor => {
      const realtimeInfo = realtimeMap[visitor.session_id] || {};
      
      // Calcular engagement score
      const engagementScore = Math.min(100, 
        ((visitor.page_views || 1) * 15) + 
        ((visitor.duration_seconds || 0) / 10) + 
        ((realtimeInfo.total_clicks || 0) * 5) + 
        ((realtimeInfo.max_scroll_depth || 0) / 2)
      );

      // Detectar intención
      let intent = 'browsing';
      if (visitor.landing_page?.includes('/producto')) intent = 'purchase';
      else if (visitor.landing_page?.includes('/contacto')) intent = 'support';
      else if ((visitor.page_views || 0) > 5) intent = 'research';

      return {
        id: `visitor_${visitor.session_id}`,
        sessionId: visitor.session_id,
        visitorId: visitor.visitor_id,
        userId: visitor.user_id,
        isRegistered: !!visitor.user_id,
        
        user: {
          name: visitor.user_name || 'Visitante Anónimo',
          email: visitor.user_email || null,
          avatar: visitor.user_name ? 
            visitor.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
            'VA'
        },

        location: {
          country: visitor.country || 'Desconocido',
          countryCode: visitor.country_code || 'XX',
          city: visitor.city || 'Desconocida',
          region: visitor.region || '',
          ip: visitor.ip_address
        },

        device: {
          type: visitor.device_type || 'desktop',
          browser: visitor.browser || 'Desconocido',
          os: visitor.os || 'Desconocido'
        },

        session: {
          startTime: visitor.session_start,
          lastActivity: visitor.last_activity,
          duration: visitor.duration_seconds || 0,
          pageViews: visitor.page_views || 1,
          currentPage: realtimeInfo.current_page_path || visitor.landing_page || '/',
          currentPageTitle: realtimeInfo.current_page_title || 'Página Principal',
          scrollDepth: realtimeInfo.max_scroll_depth || 0,
          clickCount: realtimeInfo.total_clicks || 0,
          timeOnCurrentPage: realtimeInfo.time_on_current_page || 0,
          status: visitor.status
        },

        behavior: {
          intent: intent,
          engagement: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
          engagementScore: Math.round(engagementScore),
          cartValue: 0,
          cartItems: 0,
          leadScore: Math.round(engagementScore)
        },

        traffic: {
          source: visitor.utm_source || (visitor.referrer ? 'referral' : 'direct'),
          medium: visitor.utm_medium || (visitor.referrer ? 'referral' : 'direct'),
          campaign: visitor.utm_campaign,
          referrer: visitor.referrer,
          landingPage: visitor.landing_page
        },

        chat: {
          hasActiveChat: false,
          conversationId: null,
          status: null,
          messageCount: 0,
          unreadMessages: 0
        },

        isVIP: !!visitor.user_id && (visitor.page_views || 0) > 10,
        needsAttention: visitor.status === 'online' && intent === 'support'
      };
    });

    console.log('✅ Visitantes obtenidos:', { 
      count: formattedVisitors.length,
      stats: stats.activeVisitors
    });

    res.status(200).json({
      success: true,
      data: {
        visitors: formattedVisitors,
        stats: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          query_time: Date.now(),
          total_queries: 2,
          cache_duration: 5,
          next_update: new Date(Date.now() + 5000).toISOString()
        }
      },
      message: 'Visitantes obtenidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo visitantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message,
      data: {
        visitors: [],
        stats: {
          activeVisitors: 0,
          registeredVisitors: 0,
          anonymousVisitors: 0,
          totalPageViews: 0,
          averageSessionDuration: 0,
          newVisitorsToday: 0,
          visitorsWithCart: 0,
          averageCartValue: 0,
          visitorsWithActiveChat: 0,
          totalUnreadMessages: 0
        }
      }
    });
  }
}

export default adminAuth(handler);