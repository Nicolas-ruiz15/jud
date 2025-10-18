// pages/api/admin/analytics/live-visitors.js - VERSIÓN CORREGIDA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    console.log('🔍 Fetching enhanced live visitors data...');
    
    // CONSULTA MEJORADA - Ahora incluye información de CHAT
    const visitors = await query(`
      SELECT 
        rv.*,
        u.name as user_name,
        u.email as user_email,
        u.created_at as registration_date,
        
        -- Información de sesión detallada
        s.id as session_id,
        s.country,
        s.country_code,
        s.city,
        s.region,
        s.timezone,
        s.ip_address,
        s.isp,
        s.referrer,
        s.landing_page,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        s.utm_term,
        s.utm_content,
        s.device_type,
        s.browser,
        s.browser_version,
        s.os,
        s.os_version,
        s.screen_resolution,
        s.is_mobile,
        s.created_at as session_start,
        
        -- Métricas de comportamiento
        TIMESTAMPDIFF(SECOND, s.created_at, NOW()) as session_duration,
        TIMESTAMPDIFF(MINUTE, rv.last_activity, NOW()) as minutes_since_activity,
        rv.pages_visited,
        rv.total_clicks,
        rv.max_scroll_depth,
        rv.current_page_path,
        rv.current_page_title,
        rv.time_on_current_page,
        
        -- INFORMACIÓN DE CHAT (LO NUEVO)
        c.id as chat_conversation_id,
        c.status as chat_status,
        c.message_count as chat_message_count,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_active_chat,
        
        -- Datos de e-commerce (si aplicable)
        cart.total_value as cart_value,
        cart.total_items as cart_items,
        
        -- Historial del cliente (si está registrado)
        customer.total_orders,
        customer.total_spent,
        customer.last_order_date

      FROM analytics_realtime_visitors rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN analytics_sessions s ON rv.session_id = s.id
      LEFT JOIN chat_conversations c ON rv.session_id = c.session_id AND c.status = 'active'
      LEFT JOIN shopping_carts cart ON rv.session_id = cart.session_id AND cart.status = 'active'
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          MAX(created_at) as last_order_date
        FROM orders 
        WHERE status IN ('completed', 'paid')
        GROUP BY user_id
      ) customer ON u.id = customer.user_id
      
      WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ORDER BY rv.last_activity DESC
      LIMIT 50
    `);

    // OBTENER BÚSQUEDAS INTERNAS DE CADA VISITANTE
    const sessionIds = visitors.map(v => v.session_id).filter(Boolean);
    const searches = sessionIds.length > 0 ? await query(`
      SELECT session_id, search_query, created_at 
      FROM internal_searches 
      WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
      ORDER BY created_at DESC
    `, sessionIds) : [];

    // OBTENER JOURNEY/RUTA DE PÁGINAS VISITADAS
    const pageViews = sessionIds.length > 0 ? await query(`
      SELECT 
        session_id,
        page_url,
        page_title,
        time_spent,
        scroll_depth,
        clicks_count,
        created_at as visit_time
      FROM page_views 
      WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
      ORDER BY session_id, created_at ASC
    `, sessionIds) : [];

    // DETECTAR INTENCIÓN Y ENGAGEMENT
    const enhancedVisitors = visitors.map(visitor => {
      // Buscar datos relacionados
      const visitorSearches = searches.filter(s => s.session_id === visitor.session_id);
      const visitorPageViews = pageViews.filter(pv => pv.session_id === visitor.session_id);

      // DETECTAR INTENCIÓN BASADA EN COMPORTAMIENTO
      let intent = 'browsing';
      if (visitor.cart_value > 0) intent = 'purchase';
      if (visitor.current_page_path?.includes('/contacto') || visitor.current_page_path?.includes('/help')) intent = 'support';
      if (visitor.session_duration < 30 && visitor.pages_visited === 1) intent = 'bouncing';

      // CALCULAR NIVEL DE ENGAGEMENT
      let engagement = 'low';
      const engagementScore = (
        (visitor.pages_visited * 10) +
        (visitor.session_duration / 10) +
        (visitor.total_clicks * 5) +
        (visitor.max_scroll_depth / 2)
      );
      if (engagementScore > 200) engagement = 'high';
      else if (engagementScore > 100) engagement = 'medium';

      // DETECTAR FUENTE DE TRÁFICO
      let trafficSource = 'direct';
      if (visitor.utm_source) {
        trafficSource = visitor.utm_source;
      } else if (visitor.referrer) {
        if (visitor.referrer.includes('google')) trafficSource = 'google';
        else if (visitor.referrer.includes('facebook')) trafficSource = 'facebook';
        else if (visitor.referrer.includes('instagram')) trafficSource = 'instagram';
        else trafficSource = 'referral';
      }

      return {
        id: `visitor_${visitor.session_id}`,
        session_id: visitor.session_id,
        user_id: visitor.user_id,
        isRegistered: !!visitor.user_id,
        
        // Información del usuario
        user: {
          name: visitor.user_name || 'Visitante Anónimo',
          email: visitor.user_email || null,
          avatar: visitor.user_name ? visitor.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'VA',
          registrationDate: visitor.registration_date,
          totalOrders: visitor.total_orders || 0,
          totalSpent: visitor.total_spent || 0,
          lastOrderDate: visitor.last_order_date
        },

        // Ubicación detallada
        location: {
          country: visitor.country,
          countryCode: visitor.country_code,
          city: visitor.city,
          region: visitor.region,
          timezone: visitor.timezone,
          ip: visitor.ip_address,
          isp: visitor.isp
        },

        // Información del dispositivo
        device: {
          type: visitor.device_type,
          browser: `${visitor.browser} ${visitor.browser_version}`,
          os: `${visitor.os} ${visitor.os_version}`,
          screen: visitor.screen_resolution,
          mobile: visitor.is_mobile
        },

        // Información de tráfico
        traffic: {
          source: trafficSource,
          medium: visitor.utm_medium || (visitor.referrer ? 'referral' : 'direct'),
          campaign: visitor.utm_campaign,
          keyword: visitor.utm_term,
          referrer: visitor.referrer,
          landingPage: visitor.landing_page,
          utmSource: visitor.utm_source,
          utmMedium: visitor.utm_medium,
          utmCampaign: visitor.utm_campaign
        },

        // Información de sesión
        session: {
          startTime: new Date(visitor.session_start),
          lastActivity: new Date(visitor.last_activity),
          duration: visitor.session_duration,
          pageViews: visitor.pages_visited,
          pagesVisited: visitorPageViews.map(pv => ({
            url: pv.page_url,
            title: pv.page_title,
            time: new Date(pv.visit_time),
            timeSpent: pv.time_spent || 0,
            scrollDepth: pv.scroll_depth || 0,
            clicks: pv.clicks_count || 0
          })),
          currentPage: visitor.current_page_path,
          currentPageTitle: visitor.current_page_title,
          scrollDepth: visitor.max_scroll_depth,
          clicksCount: visitor.total_clicks,
          timeOnCurrentPage: visitor.time_on_current_page,
          status: visitor.minutes_since_activity < 2 ? 'online' : 
                  visitor.minutes_since_activity < 5 ? 'away' : 'offline'
        },

        // Análisis de comportamiento
        behavior: {
          intent,
          engagement,
          riskLevel: intent === 'bouncing' ? 'high' : engagement === 'low' ? 'medium' : 'low',
          cartValue: visitor.cart_value || 0,
          cartItems: visitor.cart_items || 0,
          searchQueries: visitorSearches.map(s => s.search_query),
          interests: extractInterests(visitorPageViews, visitorSearches)
        },

        // INFORMACIÓN DE CHAT (INTEGRADA CORRECTAMENTE)
        chat: {
          hasActiveChat: !!visitor.has_active_chat,
          conversationId: visitor.chat_conversation_id,
          status: visitor.chat_status,
          messageCount: visitor.chat_message_count || 0,
          lastChatDate: null,
          totalChats: visitor.has_active_chat ? 1 : 0,
          satisfaction: null
        }
      };
    });

    // Estadísticas mejoradas
    const statsQuery = await query(`
      SELECT 
        COUNT(DISTINCT rv.session_id) as activeVisitors,
        COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN rv.session_id END) as registeredVisitors,
        COUNT(DISTINCT CASE WHEN u.id IS NULL THEN rv.session_id END) as anonymousVisitors,
        SUM(rv.pages_visited) as totalPageViews,
        AVG(TIMESTAMPDIFF(SECOND, s.created_at, NOW())) as averageTimeOnSite,
        COUNT(DISTINCT CASE WHEN DATE(s.created_at) = CURDATE() THEN s.id END) as newVisitorsToday,
        COUNT(DISTINCT CASE WHEN cart.total_value > 0 THEN rv.session_id END) as visitorsWithCart,
        AVG(cart.total_value) as averageCartValue,
        COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN rv.session_id END) as visitorsWithActiveChat
      FROM analytics_realtime_visitors rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN analytics_sessions s ON rv.session_id = s.id
      LEFT JOIN shopping_carts cart ON rv.session_id = cart.session_id AND cart.status = 'active'
      LEFT JOIN chat_conversations c ON rv.session_id = c.session_id AND c.status = 'active'
      WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `);

    const stats = statsQuery[0] || {
      activeVisitors: 0,
      registeredVisitors: 0,
      anonymousVisitors: 0,
      totalPageViews: 0,
      averageTimeOnSite: 0,
      newVisitorsToday: 0,
      visitorsWithCart: 0,
      averageCartValue: 0,
      visitorsWithActiveChat: 0
    };

    res.status(200).json({
      success: true,
      data: {
        visitors: enhancedVisitors,
        stats: {
          activeVisitors: stats.activeVisitors || 0,
          registeredVisitors: stats.registeredVisitors || 0,
          anonymousVisitors: stats.anonymousVisitors || 0,
          totalPageViews: stats.totalPageViews || 0,
          averageTimeOnSite: Math.round(stats.averageTimeOnSite || 0),
          newVisitorsToday: stats.newVisitorsToday || 0,
          visitorsWithCart: stats.visitorsWithCart || 0,
          averageCartValue: Math.round(stats.averageCartValue || 0),
          visitorsWithActiveChat: stats.visitorsWithActiveChat || 0
        },
        timestamp: new Date().toISOString(),
        serverInfo: {
          totalActiveSessions: enhancedVisitors.length,
          dataFreshness: '5s',
          lastUpdate: new Date().toLocaleTimeString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en enhanced live-visitors API:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: {
        visitors: [],
        stats: {
          activeVisitors: 0,
          registeredVisitors: 0,
          anonymousVisitors: 0,
          totalPageViews: 0,
          averageTimeOnSite: 0,
          newVisitorsToday: 0,
          visitorsWithCart: 0,
          averageCartValue: 0,
          visitorsWithActiveChat: 0
        }
      }
    });
  }
}

// Función auxiliar para extraer intereses basado en páginas y búsquedas
function extractInterests(pageViews, searches) {
  const interests = new Set();
  
  // Extraer de URLs visitadas
  pageViews.forEach(pv => {
    if (pv.url && pv.url.includes('/productos/')) {
      const category = pv.url.split('/productos/')[1]?.split('/')[0];
      if (category) interests.add(category);
    }
    if (pv.url && pv.url.includes('/categoria/')) {
      const category = pv.url.split('/categoria/')[1]?.split('/')[0];
      if (category) interests.add(category);
    }
  });
  
  // Extraer de búsquedas
  searches.forEach(s => {
    if (s.search_query) {
      const keywords = s.search_query.toLowerCase().split(' ');
      keywords.forEach(keyword => {
        if (keyword.length > 3) interests.add(keyword);
      });
    }
  });

  return Array.from(interests).slice(0, 5); // Máximo 5 intereses
}

export default adminAuth(handler);