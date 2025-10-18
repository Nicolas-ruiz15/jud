// pages/api/admin/analytics/enhanced-live-visitors.js - VERSIÓN ULTRA MEJORADA
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    console.log('🔍 Fetching ENHANCED live visitors data with exact location...');
    
    // CONSULTA SÚPER MEJORADA CON TODAS LAS TABLAS
    const visitors = await query(`
      SELECT 
        rv.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.created_at as registration_date,
        u.last_login_at,
        u.email_verified_at,
        
        -- Información de sesión COMPLETA
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
        
        -- UBICACIÓN EXACTA (NUEVA)
        vt.exact_latitude,
        vt.exact_longitude,
        vt.location_accuracy,
        vt.full_address,
        vt.neighborhood,
        vt.district,
        vt.postal_code,
        vt.connection_type,
        vt.connection_speed,
        vt.device_memory,
        vt.hardware_concurrency,
        
        -- COMPORTAMIENTO AVANZADO
        vbt.scroll_depth_max,
        vbt.click_count_total,
        vbt.keystroke_count,
        vbt.time_on_site_total,
        vbt.page_views_count,
        vbt.form_interactions,
        vbt.product_views,
        vbt.mouse_movements,
        vbt.engagement_score,
        vbt.detected_intent,
        vbt.bounce_probability,
        
        -- Métricas de comportamiento en tiempo real
        TIMESTAMPDIFF(SECOND, s.created_at, NOW()) as session_duration,
        TIMESTAMPDIFF(MINUTE, rv.last_activity, NOW()) as minutes_since_activity,
        rv.pages_visited,
        rv.total_clicks,
        rv.max_scroll_depth,
        rv.current_page_path,
        rv.current_page_title,
        rv.time_on_current_page,
        
        -- INFORMACIÓN DE CHAT MEJORADA
        c.id as chat_conversation_id,
        c.status as chat_status,
        c.priority as chat_priority,
        c.message_count as chat_message_count,
        c.assigned_to as chat_assigned_agent,
        c.satisfaction_rating as chat_satisfaction,
        c.response_time_avg as chat_avg_response_time,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_active_chat,
        
        -- Datos de e-commerce DETALLADOS
        cart.total_value as cart_value,
        cart.total_items as cart_items,
        cart.created_at as cart_created,
        cart.updated_at as cart_updated,
        cart.abandoned_at as cart_abandoned,
        
        -- HISTORIAL COMPLETO del cliente
        customer.total_orders,
        customer.total_spent,
        customer.last_order_date,
        customer.first_order_date,
        customer.avg_order_value,
        customer.total_sessions,
        customer.lifetime_value,
        customer.preferred_category,
        customer.last_login,
        
        -- LEAD SCORING AVANZADO
        ls.score as lead_score,
        ls.grade as lead_grade,
        ls.last_updated as lead_score_updated,
        ls.factors as lead_factors,
        
        -- SEGMENTACIÓN
        vs.segment_name,
        vs.segment_priority,
        vs.auto_assigned_tags

      FROM analytics_realtime_visitors rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN analytics_sessions s ON rv.session_id = s.id
      
      -- NUEVA: Tabla de tracking avanzado
      LEFT JOIN visitor_tracking vt ON rv.session_id = vt.session_id
      LEFT JOIN visitor_behavior_tracking vbt ON rv.session_id = vbt.session_id
      
      LEFT JOIN chat_conversations c ON rv.session_id = c.session_id AND c.status IN ('active', 'waiting')
      LEFT JOIN shopping_carts cart ON rv.session_id = cart.session_id AND cart.status = 'active'
      LEFT JOIN visitor_lead_scores ls ON rv.session_id = ls.session_id
      LEFT JOIN visitor_segment_assignments vsa ON rv.session_id = vsa.session_id
      LEFT JOIN visitor_segments vs ON vsa.segment_id = vs.id
      
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          MAX(created_at) as last_order_date,
          MIN(created_at) as first_order_date,
          AVG(total_amount) as avg_order_value,
          COUNT(DISTINCT DATE(created_at)) as total_sessions,
          SUM(total_amount) * 1.2 as lifetime_value,
          (SELECT pc.name FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           JOIN product_categories pc ON p.category_id = pc.id 
           WHERE oi.order_id IN (SELECT id FROM orders WHERE user_id = u.id)
           GROUP BY pc.id ORDER BY COUNT(*) DESC LIMIT 1) as preferred_category,
          MAX(updated_at) as last_login
        FROM orders 
        WHERE status IN ('completed', 'paid')
        GROUP BY user_id
      ) customer ON u.id = customer.user_id
      
      WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        AND rv.is_active = 1
      ORDER BY rv.last_activity DESC
      LIMIT 100
    `);

    // OBTENER BÚSQUEDAS INTERNAS DETALLADAS
    const sessionIds = visitors.map(v => v.session_id).filter(Boolean);
    
    const [searches, pageViews, events, heatmapData] = await Promise.all([
      // Búsquedas internas
      sessionIds.length > 0 ? query(`
        SELECT 
          session_id, 
          search_query, 
          results_count,
          clicked_result,
          search_category,
          created_at 
        FROM internal_searches 
        WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
        ORDER BY created_at DESC
      `, sessionIds) : [],
      
      // Journey completo de páginas
      sessionIds.length > 0 ? query(`
        SELECT 
          session_id,
          page_url,
          page_title,
          time_spent,
          scroll_depth,
          clicks_count,
          exit_rate,
          bounce_rate,
          conversion_events,
          created_at as visit_time
        FROM page_views 
        WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
        ORDER BY session_id, created_at ASC
      `, sessionIds) : [],
      
      // Eventos específicos
      sessionIds.length > 0 ? query(`
        SELECT 
          session_id,
          event_type,
          event_category,
          event_action,
          event_label,
          event_value,
          metadata,
          created_at
        FROM analytics_events
        WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
          AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY created_at DESC
      `, sessionIds) : [],
      
      // Datos de heatmap
      sessionIds.length > 0 ? query(`
        SELECT 
          session_id,
          page_url,
          click_x,
          click_y,
          scroll_depth,
          hover_time,
          element_selector,
          created_at
        FROM heatmaps_data
        WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
          AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `, sessionIds) : []
    ]);

    // PROCESAMIENTO AVANZADO DE DATOS
    const enhancedVisitors = visitors.map(visitor => {
      // Buscar datos relacionados
      const visitorSearches = searches.filter(s => s.session_id === visitor.session_id);
      const visitorPageViews = pageViews.filter(pv => pv.session_id === visitor.session_id);
      const visitorEvents = events.filter(e => e.session_id === visitor.session_id);
      const visitorHeatmap = heatmapData.filter(h => h.session_id === visitor.session_id);

      // CALCULAR INTENCIÓN AVANZADA
      let detectedIntent = visitor.detected_intent || calculateAdvancedIntent(visitor, visitorPageViews, visitorEvents);
      
      // CALCULAR ENGAGEMENT SCORE MEJORADO
      let engagementScore = calculateEnhancedEngagement(visitor, visitorPageViews, visitorEvents);
      
      // DETERMINAR RIESGO DE ABANDONO
      let riskLevel = calculateAbandonmentRisk(visitor, visitorPageViews, visitorEvents);

      return {
        id: `visitor_${visitor.session_id}`,
        session_id: visitor.session_id,
        user_id: visitor.user_id,
        isRegistered: !!visitor.user_id,
        
        // INFORMACIÓN COMPLETA DEL USUARIO
        user: {
          name: visitor.user_name || 'Visitante Anónimo',
          email: visitor.user_email || null,
          phone: visitor.user_phone || null,
          avatar: visitor.user_name ? visitor.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'VA',
          registrationDate: visitor.registration_date,
          lastLogin: visitor.last_login_at,
          emailVerified: !!visitor.email_verified_at,
          totalOrders: visitor.total_orders || 0,
          totalSpent: visitor.total_spent || 0,
          avgOrderValue: visitor.avg_order_value || 0,
          firstOrder: visitor.first_order_date,
          lastOrderDate: visitor.last_order_date,
          lifetimeValue: visitor.lifetime_value || 0,
          preferredCategory: visitor.preferred_category
        },

        // UBICACIÓN EXACTA Y DETALLADA
        location: {
          // Ubicación básica por IP
          country: visitor.country,
          countryCode: visitor.country_code,
          city: visitor.city,
          region: visitor.region,
          timezone: visitor.timezone,
          ip: visitor.ip_address,
          isp: visitor.isp,
          
          // UBICACIÓN GPS EXACTA (NUEVA)
          exact: visitor.exact_latitude ? {
            latitude: visitor.exact_latitude,
            longitude: visitor.exact_longitude,
            accuracy: visitor.location_accuracy,
            fullAddress: visitor.full_address,
            neighborhood: visitor.neighborhood,
            district: visitor.district,
            postalCode: visitor.postal_code,
            coordinatesString: `${visitor.exact_latitude}, ${visitor.exact_longitude}`,
            mapsUrl: `https://www.google.com/maps?q=${visitor.exact_latitude},${visitor.exact_longitude}`,
            precisionLevel: visitor.location_accuracy < 100 ? 'alta' : visitor.location_accuracy < 1000 ? 'media' : 'baja'
          } : null
        },

        // INFORMACIÓN TÉCNICA AVANZADA
        device: {
          type: visitor.device_type,
          browser: `${visitor.browser} ${visitor.browser_version}`,
          os: `${visitor.os} ${visitor.os_version}`,
          screen: visitor.screen_resolution,
          mobile: visitor.is_mobile,
          
          // NUEVOS DATOS TÉCNICOS
          memory: visitor.device_memory,
          cores: visitor.hardware_concurrency,
          connection: {
            type: visitor.connection_type,
            speed: visitor.connection_speed,
            quality: visitor.connection_speed > 10 ? 'excelente' : visitor.connection_speed > 5 ? 'buena' : 'lenta'
          }
        },

        // INFORMACIÓN DE TRÁFICO COMPLETA
        traffic: {
          source: visitor.utm_source || getTrafficSource(visitor.referrer),
          medium: visitor.utm_medium || (visitor.referrer ? 'referral' : 'direct'),
          campaign: visitor.utm_campaign,
          term: visitor.utm_term,
          content: visitor.utm_content,
          referrer: visitor.referrer,
          landingPage: visitor.landing_page,
          fullUtm: {
            source: visitor.utm_source,
            medium: visitor.utm_medium,
            campaign: visitor.utm_campaign,
            term: visitor.utm_term,
            content: visitor.utm_content
          }
        },

        // SESIÓN CON DATOS AVANZADOS
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
            clicks: pv.clicks_count || 0,
            exitRate: pv.exit_rate || 0,
            bounceRate: pv.bounce_rate || 0,
            conversions: pv.conversion_events ? JSON.parse(pv.conversion_events) : []
          })),
          currentPage: visitor.current_page_path,
          currentPageTitle: visitor.current_page_title,
          scrollDepth: visitor.max_scroll_depth,
          clicksCount: visitor.total_clicks,
          timeOnCurrentPage: visitor.time_on_current_page,
          status: visitor.minutes_since_activity < 2 ? 'online' : 
                  visitor.minutes_since_activity < 5 ? 'away' : 'offline',
          
          // NUEVOS DATOS DE SESIÓN
          totalTimeOnSite: visitor.time_on_site_total,
          keystrokeCount: visitor.keystroke_count || 0,
          formInteractions: visitor.form_interactions ? JSON.parse(visitor.form_interactions) : [],
          productViews: visitor.product_views ? JSON.parse(visitor.product_views) : []
        },

        // ANÁLISIS DE COMPORTAMIENTO AVANZADO
        behavior: {
          intent: detectedIntent,
          engagement: getEngagementLevel(engagementScore),
          engagementScore: engagementScore,
          riskLevel: riskLevel,
          bounceProb: visitor.bounce_probability || calculateBounceProb(visitor),
          
          // Datos de e-commerce
          cartValue: visitor.cart_value || 0,
          cartItems: visitor.cart_items || 0,
          cartCreated: visitor.cart_created,
          cartAbandoned: visitor.cart_abandoned,
          
          // Intereses y preferencias
          searchQueries: visitorSearches.map(s => ({
            query: s.search_query,
            results: s.results_count,
            clicked: s.clicked_result,
            category: s.search_category,
            time: s.created_at
          })),
          
          interests: extractAdvancedInterests(visitorPageViews, visitorSearches, visitorEvents),
          
          // Eventos de interacción
          recentEvents: visitorEvents.slice(-10).map(e => ({
            type: e.event_type,
            category: e.event_category,
            action: e.event_action,
            label: e.event_label,
            value: e.event_value,
            metadata: e.metadata ? JSON.parse(e.metadata) : {},
            time: e.created_at
          })),
          
          // Datos de heatmap
          heatmapActivity: {
            totalClicks: visitorHeatmap.length,
            avgScrollDepth: visitorHeatmap.reduce((acc, h) => acc + (h.scroll_depth || 0), 0) / Math.max(visitorHeatmap.length, 1),
            mostClickedElements: getMostClickedElements(visitorHeatmap),
            hoverPatterns: getHoverPatterns(visitorHeatmap)
          }
        },

        // INFORMACIÓN DE CHAT MEJORADA
        chat: {
          hasActiveChat: !!visitor.has_active_chat,
          conversationId: visitor.chat_conversation_id,
          status: visitor.chat_status,
          priority: visitor.chat_priority,
          messageCount: visitor.chat_message_count || 0,
          assignedAgent: visitor.chat_assigned_agent,
          satisfaction: visitor.chat_satisfaction,
          avgResponseTime: visitor.chat_avg_response_time,
          lastChatDate: null,
          totalChats: visitor.has_active_chat ? 1 : 0,
          
          // Probabilidad de conversión via chat
          chatConversionProb: calculateChatConversionProb(visitor, visitorEvents)
        },

        // LEAD SCORING Y SEGMENTACIÓN
        leadScoring: {
          score: visitor.lead_score || calculateLeadScore(visitor, visitorPageViews, visitorEvents),
          grade: visitor.lead_grade || getLeadGrade(visitor.lead_score),
          lastUpdated: visitor.lead_score_updated,
          factors: visitor.lead_factors ? JSON.parse(visitor.lead_factors) : [],
          segment: visitor.segment_name,
          segmentPriority: visitor.segment_priority,
          autoTags: visitor.auto_assigned_tags ? JSON.parse(visitor.auto_assigned_tags) : []
        },

        // MÉTRICAS DE CONVERSIÓN
        conversion: {
          likelihood: calculateConversionLikelihood(visitor, visitorPageViews, visitorEvents),
          stage: getConversionStage(visitor, visitorPageViews),
          blockers: identifyConversionBlockers(visitor, visitorPageViews, visitorEvents),
          opportunities: identifyOpportunities(visitor, visitorPageViews, visitorEvents)
        },

        // PERFIL COMPLETO
        profile: {
          customerType: getCustomerType(visitor),
          valueSegment: getValueSegment(visitor),
          loyaltyLevel: getLoyaltyLevel(visitor),
          riskLevel: riskLevel,
          nextBestAction: getNextBestAction(visitor, detectedIntent, riskLevel)
        }
      };
    });

    // ESTADÍSTICAS SÚPER MEJORADAS
    const enhancedStats = await query(`
      SELECT 
        -- Visitantes básicos
        COUNT(DISTINCT rv.session_id) as activeVisitors,
        COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN rv.session_id END) as registeredVisitors,
        COUNT(DISTINCT CASE WHEN u.id IS NULL THEN rv.session_id END) as anonymousVisitors,
        
        -- Engagement
        AVG(vbt.engagement_score) as avgEngagementScore,
        COUNT(DISTINCT CASE WHEN vbt.engagement_score > 80 THEN rv.session_id END) as highEngagementVisitors,
        COUNT(DISTINCT CASE WHEN vbt.bounce_probability > 0.7 THEN rv.session_id END) as highRiskVisitors,
        
        -- Actividad
        SUM(rv.pages_visited) as totalPageViews,
        AVG(TIMESTAMPDIFF(SECOND, s.created_at, NOW())) as averageTimeOnSite,
        AVG(rv.max_scroll_depth) as avgScrollDepth,
        SUM(rv.total_clicks) as totalClicks,
        
        -- Nuevos vs retornando
        COUNT(DISTINCT CASE WHEN DATE(s.created_at) = CURDATE() THEN s.id END) as newVisitorsToday,
        COUNT(DISTINCT CASE WHEN u.id IS NOT NULL AND DATE(u.created_at) != CURDATE() THEN rv.session_id END) as returningCustomers,
        
        -- E-commerce
        COUNT(DISTINCT CASE WHEN cart.total_value > 0 THEN rv.session_id END) as visitorsWithCart,
        AVG(cart.total_value) as averageCartValue,
        SUM(cart.total_value) as totalCartValue,
        COUNT(DISTINCT CASE WHEN cart.abandoned_at IS NOT NULL THEN cart.id END) as abandonedCarts,
        
        -- Chat y soporte
        COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN rv.session_id END) as visitorsWithActiveChat,
        AVG(c.satisfaction_rating) as avgChatSatisfaction,
        COUNT(DISTINCT CASE WHEN c.priority = 'high' THEN c.id END) as highPriorityCases,
        
        -- Ubicación exacta
        COUNT(DISTINCT CASE WHEN vt.exact_latitude IS NOT NULL THEN rv.session_id END) as visitorsWithExactLocation,
        
        -- Dispositivos avanzado
        COUNT(DISTINCT CASE WHEN s.device_type = 'mobile' THEN rv.session_id END) as mobileUsers,
        COUNT(DISTINCT CASE WHEN s.device_type = 'desktop' THEN rv.session_id END) as desktopUsers,
        COUNT(DISTINCT CASE WHEN s.device_type = 'tablet' THEN rv.session_id END) as tabletUsers,
        COUNT(DISTINCT CASE WHEN vt.connection_speed > 10 THEN rv.session_id END) as fastConnectionUsers,
        
        -- Lead scoring
        AVG(ls.score) as avgLeadScore,
        COUNT(DISTINCT CASE WHEN ls.score > 80 THEN rv.session_id END) as hotLeads,
        COUNT(DISTINCT CASE WHEN ls.score BETWEEN 60 AND 80 THEN rv.session_id END) as warmLeads

      FROM analytics_realtime_visitors rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN analytics_sessions s ON rv.session_id = s.id
      LEFT JOIN visitor_tracking vt ON rv.session_id = vt.session_id
      LEFT JOIN visitor_behavior_tracking vbt ON rv.session_id = vbt.session_id
      LEFT JOIN shopping_carts cart ON rv.session_id = cart.session_id AND cart.status = 'active'
      LEFT JOIN chat_conversations c ON rv.session_id = c.session_id AND c.status IN ('active', 'waiting')
      LEFT JOIN visitor_lead_scores ls ON rv.session_id = ls.session_id
      WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        AND rv.is_active = 1
    `);

    const stats = enhancedStats[0] || {};

    // RESPUESTA FINAL MEJORADA
    res.status(200).json({
      success: true,
      data: {
        visitors: enhancedVisitors,
        stats: {
          // Básicas
          activeVisitors: stats.activeVisitors || 0,
          registeredVisitors: stats.registeredVisitors || 0,
          anonymousVisitors: stats.anonymousVisitors || 0,
          
          // Engagement
          avgEngagementScore: Math.round(stats.avgEngagementScore || 0),
          highEngagementVisitors: stats.highEngagementVisitors || 0,
          highRiskVisitors: stats.highRiskVisitors || 0,
          
          // Actividad
          totalPageViews: stats.totalPageViews || 0,
          averageTimeOnSite: Math.round(stats.averageTimeOnSite || 0),
          avgScrollDepth: Math.round(stats.avgScrollDepth || 0),
          totalClicks: stats.totalClicks || 0,
          
          // Nuevos vs retornando
          newVisitorsToday: stats.newVisitorsToday || 0,
          returningCustomers: stats.returningCustomers || 0,
          
          // E-commerce
          visitorsWithCart: stats.visitorsWithCart || 0,
          averageCartValue: Math.round(stats.averageCartValue || 0),
          totalCartValue: Math.round(stats.totalCartValue || 0),
          abandonedCarts: stats.abandonedCarts || 0,
          
          // Chat
          visitorsWithActiveChat: stats.visitorsWithActiveChat || 0,
          avgChatSatisfaction: parseFloat((stats.avgChatSatisfaction || 0).toFixed(1)),
          highPriorityCases: stats.highPriorityCases || 0,
          
          // Técnico
          visitorsWithExactLocation: stats.visitorsWithExactLocation || 0,
          locationAccuracy: stats.visitorsWithExactLocation > 0 ? 
            Math.round((stats.visitorsWithExactLocation / stats.activeVisitors) * 100) : 0,
          
          // Dispositivos
          mobileUsers: stats.mobileUsers || 0,
          desktopUsers: stats.desktopUsers || 0,
          tabletUsers: stats.tabletUsers || 0,
          fastConnectionUsers: stats.fastConnectionUsers || 0,
          
          // Lead scoring
          avgLeadScore: Math.round(stats.avgLeadScore || 0),
          hotLeads: stats.hotLeads || 0,
          warmLeads: stats.warmLeads || 0
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataQuality: 'enhanced',
          locationPrecision: 'gps+ip',
          updateFrequency: '3s',
          totalActiveSessions: enhancedVisitors.length,
          lastUpdate: new Date().toLocaleString('es-ES'),
          serverInfo: {
            processingTime: Date.now() - Date.now(), // Se calcularía real
            dataFreshness: '3s',
            apiVersion: '2.0-enhanced'
          }
        }
      },
      message: 'Datos de visitantes obtenidos con precisión avanzada'
    });

  } catch (error) {
    console.error('❌ Error en enhanced live-visitors API:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: {
        visitors: [],
        stats: {},
        metadata: { error: true, timestamp: new Date().toISOString() }
      }
    });
  }
}

// FUNCIONES AUXILIARES AVANZADAS

function calculateAdvancedIntent(visitor, pageViews, events) {
  const currentUrl = visitor.current_page_path?.toLowerCase() || '';
  const cartValue = visitor.cart_value || 0;
  const timeOnSite = visitor.session_duration || 0;
  const pageCount = visitor.pages_visited || 0;
  
  // Análisis de intención por URL y comportamiento
  if (currentUrl.includes('/checkout') || currentUrl.includes('/payment')) return 'purchase_ready';
  if (cartValue > 0) return 'purchase_intent';
  if (currentUrl.includes('/contact') || currentUrl.includes('/support')) return 'support_needed';
  if (events.some(e => e.event_action === 'search')) return 'product_research';
  if (timeOnSite < 30 && pageCount === 1) return 'bouncing';
  if (pageCount > 5) return 'deep_browsing';
  
  return 'casual_browsing';
}

function calculateEnhancedEngagement(visitor, pageViews, events) {
  const timeWeight = Math.min((visitor.session_duration || 0) / 60 * 10, 30);
  const pageWeight = Math.min((visitor.pages_visited || 0) * 5, 25);
  const scrollWeight = (visitor.max_scroll_depth || 0) / 4;
  const clickWeight = Math.min((visitor.total_clicks || 0) * 2, 20);
  const eventWeight = Math.min(events.length * 3, 15);
  const keystrokeWeight = Math.min((visitor.keystroke_count || 0) / 10, 10);
  
  return Math.round(timeWeight + pageWeight + scrollWeight + clickWeight + eventWeight + keystrokeWeight);
}

function calculateAbandonmentRisk(visitor, pageViews, events) {
  const timeOnPage = visitor.time_on_current_page || 0;
  const scrollDepth = visitor.max_scroll_depth || 0;
  const recentActivity = visitor.minutes_since_activity || 0;
  
  if (recentActivity > 10) return 'high';
  if (timeOnPage < 30 && scrollDepth < 25) return 'high';
  if (visitor.cart_value > 0 && recentActivity > 5) return 'medium';
  return 'low';
}

function getEngagementLevel(score) {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

function extractAdvancedInterests(pageViews, searches, events) {
  const interests = new Set();
  
  // De URLs
  pageViews.forEach(pv => {
    const url = pv.page_url?.toLowerCase() || '';
    if (url.includes('/productos/')) interests.add('productos');
    if (url.includes('/tefilin')) interests.add('tefilin');
    if (url.includes('/tallit')) interests.add('tallit');
    if (url.includes('/shabbat')) interests.add('shabbat');
    if (url.includes('/judaica')) interests.add('judaica');
  });
  
  // De búsquedas
  searches.forEach(s => {
    if (s.search_query) {
      const terms = s.search_query.toLowerCase().split(' ');
      terms.forEach(term => {
        if (term.length > 3) interests.add(term);
      });
    }
  });
  
  // De eventos
  events.forEach(e => {
    if (e.event_category === 'product' && e.event_label) {
      interests.add(e.event_label.toLowerCase());
    }
  });
  
  return Array.from(interests).slice(0, 10);
}

function getTrafficSource(referrer) {
  if (!referrer) return 'direct';
  if (referrer.includes('google')) return 'google';
  if (referrer.includes('facebook')) return 'facebook';
  if (referrer.includes('instagram')) return 'instagram';
  if (referrer.includes('whatsapp')) return 'whatsapp';
  return 'referral';
}

function getMostClickedElements(heatmapData) {
  const elements = {};
  heatmapData.forEach(h => {
    if (h.element_selector) {
      elements[h.element_selector] = (elements[h.element_selector] || 0) + 1;
    }
  });
  
  return Object.entries(elements)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([element, count]) => ({ element, count }));
}

function getHoverPatterns(heatmapData) {
  const totalHoverTime = heatmapData.reduce((acc, h) => acc + (h.hover_time || 0), 0);
  const avgHoverTime = totalHoverTime / Math.max(heatmapData.length, 1);
  
  return {
    totalHoverTime,
    avgHoverTime: Math.round(avgHoverTime),
    hoverPoints: heatmapData.length
  };
}

function calculateBounceProb(visitor) {
  const timeOnSite = visitor.session_duration || 0;
  const pageViews = visitor.pages_visited || 0;
  const scrollDepth = visitor.max_scroll_depth || 0;
  
  if (timeOnSite < 30 && pageViews === 1 && scrollDepth < 25) return 0.9;
  if (timeOnSite < 60 && pageViews === 1) return 0.7;
  if (pageViews === 1) return 0.5;
  return 0.2;
}

function calculateChatConversionProb(visitor, events) {
  const hasCart = visitor.cart_value > 0;
  const timeOnSite = visitor.session_duration || 0;
  const engagement = visitor.engagement_score || 0;
  
  let prob = 0.3; // Base probability
  if (hasCart) prob += 0.4;
  if (timeOnSite > 300) prob += 0.2;
  if (engagement > 70) prob += 0.1;
  
  return Math.min(prob, 1.0);
}

function calculateLeadScore(visitor, pageViews, events) {
  let score = 0;
  
  // Comportamiento base
  score += Math.min((visitor.session_duration || 0) / 60 * 5, 25);
  score += (visitor.pages_visited || 0) * 3;
  score += (visitor.max_scroll_depth || 0) / 4;
  
  // E-commerce
  if (visitor.cart_value > 0) score += 30;
  if (visitor.cart_items > 2) score += 10;
  
  // Usuario registrado
  if (visitor.user_id) score += 20;
  if (visitor.total_orders > 0) score += 15;
  
  // Engagement
  score += Math.min(events.length * 2, 20);
  
  return Math.min(Math.round(score), 100);
}

function getLeadGrade(score) {
  if (score >= 80) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function calculateConversionLikelihood(visitor, pageViews, events) {
  // Implementar algoritmo de conversión basado en datos históricos
  return Math.random() * 100; // Placeholder - implementar lógica real
}

function getConversionStage(visitor, pageViews) {
  if (visitor.cart_value > 0) return 'consideration';
  if (visitor.pages_visited > 3) return 'evaluation';
  if (visitor.session_duration > 60) return 'interest';
  return 'awareness';
}

function identifyConversionBlockers(visitor, pageViews, events) {
  const blockers = [];
  
  if (visitor.cart_value > 0 && visitor.minutes_since_activity > 5) {
    blockers.push('cart_abandonment');
  }
  
  if (visitor.session_duration > 300 && visitor.pages_visited === 1) {
    blockers.push('page_confusion');
  }
  
  return blockers;
}

function identifyOpportunities(visitor, pageViews, events) {
  const opportunities = [];
  
  if (visitor.cart_value > 100) {
    opportunities.push('upsell_opportunity');
  }
  
  if (visitor.engagement_score > 80 && !visitor.user_id) {
    opportunities.push('registration_opportunity');
  }
  
  return opportunities;
}

function getCustomerType(visitor) {
  if (visitor.total_orders > 5) return 'loyal_customer';
  if (visitor.total_orders > 0) return 'returning_customer';
  if (visitor.user_id) return 'registered_prospect';
  return 'anonymous_visitor';
}

function getValueSegment(visitor) {
  const totalSpent = visitor.total_spent || 0;
  if (totalSpent > 1000) return 'high_value';
  if (totalSpent > 500) return 'medium_value';
  if (totalSpent > 100) return 'low_value';
  return 'no_value';
}

function getLoyaltyLevel(visitor) {
  const orders = visitor.total_orders || 0;
  if (orders > 10) return 'champion';
  if (orders > 5) return 'loyal';
  if (orders > 2) return 'potential_loyal';
  if (orders > 0) return 'new_customer';
  return 'prospect';
}

function getNextBestAction(visitor, intent, riskLevel) {
  if (riskLevel === 'high' && visitor.cart_value > 0) return 'send_cart_recovery';
  if (intent === 'purchase_ready') return 'offer_assistance';
  if (visitor.engagement_score > 80 && !visitor.user_id) return 'encourage_registration';
  if (visitor.cart_value === 0 && visitor.session_duration > 120) return 'show_popular_products';
  return 'monitor';
}

export default adminAuth(handler);