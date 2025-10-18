// pages/api/admin/analytics/heatmaps.js - HEATMAPS Y ANALYTICS AVANZADOS
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { timeRange = '24h', pageUrl = null } = req.query;
    
    console.log('🔥 Obteniendo datos de heatmaps...');

    // Configurar rango de tiempo
    let timeFilter = 'DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    switch (timeRange) {
      case '1h': timeFilter = 'DATE_SUB(NOW(), INTERVAL 1 HOUR)'; break;
      case '6h': timeFilter = 'DATE_SUB(NOW(), INTERVAL 6 HOUR)'; break;
      case '24h': timeFilter = 'DATE_SUB(NOW(), INTERVAL 24 HOUR)'; break;
      case '7d': timeFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)'; break;
      case '30d': timeFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)'; break;
    }

    // Páginas más visitadas con métricas de engagement
    const topPages = await query(`
      SELECT 
        pv.page_path,
        pv.page_title,
        COUNT(*) as total_views,
        COUNT(DISTINCT pv.session_id) as unique_visitors,
        AVG(pv.time_spent) as avg_time_spent,
        AVG(pv.scroll_depth) as avg_scroll_depth,
        AVG(pv.clicks_count) as avg_clicks,
        
        -- Bounce rate por página
        COUNT(CASE WHEN s.page_views = 1 AND s.duration_seconds < 30 THEN 1 END) as bounces,
        ROUND(
          COUNT(CASE WHEN s.page_views = 1 AND s.duration_seconds < 30 THEN 1 END) / 
          COUNT(DISTINCT pv.session_id) * 100, 2
        ) as bounce_rate,
        
        -- Conversiones por página (visitantes que compraron)
        COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'paid') THEN s.user_id END) as conversions,
        ROUND(
          COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'paid') THEN s.user_id END) /
          COUNT(DISTINCT pv.session_id) * 100, 2
        ) as conversion_rate
        
      FROM analytics_page_views pv
      INNER JOIN analytics_sessions s ON pv.session_id = s.id
      LEFT JOIN orders o ON s.user_id = o.user_id AND DATE(pv.created_at) = DATE(o.created_at)
      WHERE pv.created_at > ${timeFilter}
        ${pageUrl ? 'AND pv.page_path = ?' : ''}
      GROUP BY pv.page_path, pv.page_title
      ORDER BY total_views DESC
      LIMIT 20
    `, pageUrl ? [pageUrl] : []);

    // Datos de heatmaps (clics y scroll)
    const heatmapEvents = await query(`
      SELECT 
        e.page_url,
        e.event_type,
        e.metadata,
        COUNT(*) as event_count,
        e.created_at
      FROM analytics_events e
      WHERE e.created_at > ${timeFilter}
        AND e.event_type IN ('click', 'scroll', 'mouse_move')
        ${pageUrl ? 'AND e.page_url LIKE ?' : ''}
      GROUP BY e.page_url, e.event_type, DATE(e.created_at)
      ORDER BY e.created_at DESC
      LIMIT 1000
    `, pageUrl ? [`%${pageUrl}%`] : []);

    // Rutas de usuario (customer journey)
    const customerJourney = await query(`
      SELECT 
        s.id as session_id,
        s.user_id,
        s.landing_page,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        
        -- Secuencia de páginas visitadas
        GROUP_CONCAT(
          CONCAT(pv.page_path, ':', pv.time_spent) 
          ORDER BY pv.created_at 
          SEPARATOR ' -> '
        ) as page_sequence,
        
        -- Resultado final
        CASE 
          WHEN o.status IN ('completed', 'paid') THEN 'conversion'
          WHEN cart.total_value > 0 THEN 'cart_abandonment'
          WHEN c.id IS NOT NULL THEN 'chat_initiated'
          WHEN s.page_views = 1 THEN 'bounce'
          ELSE 'browsing'
        END as outcome,
        
        s.duration_seconds,
        s.page_views
        
      FROM analytics_sessions s
      INNER JOIN analytics_page_views pv ON s.id = pv.session_id
      LEFT JOIN orders o ON s.user_id = o.user_id AND DATE(s.created_at) = DATE(o.created_at)
      LEFT JOIN shopping_carts cart ON s.id = cart.session_id
      LEFT JOIN chat_conversations c ON s.id = c.session_id
      WHERE s.created_at > ${timeFilter}
        AND s.is_bot = 0
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);

    // Análisis de dispositivos y ubicaciones
    const deviceAnalytics = await query(`
      SELECT 
        s.device_type,
        s.browser,
        s.os,
        s.country,
        s.city,
        COUNT(DISTINCT s.id) as sessions,
        AVG(s.duration_seconds) as avg_duration,
        AVG(s.page_views) as avg_page_views,
        
        -- Tasa de conversión por dispositivo
        COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'paid') THEN s.user_id END) as conversions,
        ROUND(
          COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'paid') THEN s.user_id END) /
          COUNT(DISTINCT s.id) * 100, 2
        ) as conversion_rate
        
      FROM analytics_sessions s
      LEFT JOIN orders o ON s.user_id = o.user_id AND DATE(s.created_at) = DATE(o.created_at)
      WHERE s.created_at > ${timeFilter}
        AND s.is_bot = 0
      GROUP BY s.device_type, s.browser, s.os, s.country, s.city
      ORDER BY sessions DESC
      LIMIT 50
    `);

    // Funnel de conversión
    const conversionFunnel = await query(`
      SELECT 
        'landing' as step,
        COUNT(DISTINCT s.id) as visitors,
        'Página de aterrizaje' as description
      FROM analytics_sessions s
      WHERE s.created_at > ${timeFilter}
      
      UNION ALL
      
      SELECT 
        'product_view' as step,
        COUNT(DISTINCT pv.session_id) as visitors,
        'Vio productos' as description
      FROM analytics_page_views pv
      WHERE pv.created_at > ${timeFilter}
        AND pv.page_path LIKE '/producto%'
      
      UNION ALL
      
      SELECT 
        'cart_add' as step,
        COUNT(DISTINCT cart.session_id) as visitors,
        'Añadió al carrito' as description
      FROM shopping_carts cart
      WHERE cart.created_at > ${timeFilter}
      
      UNION ALL
      
      SELECT 
        'checkout' as step,
        COUNT(DISTINCT o.user_id) as visitors,
        'Inició checkout' as description
      FROM orders o
      WHERE o.created_at > ${timeFilter}
        AND o.status != 'cancelled'
      
      UNION ALL
      
      SELECT 
        'conversion' as step,
        COUNT(DISTINCT o.user_id) as visitors,
        'Compró' as description
      FROM orders o
      WHERE o.created_at > ${timeFilter}
        AND o.status IN ('completed', 'paid')
        
      ORDER BY 
        CASE step 
          WHEN 'landing' THEN 1
          WHEN 'product_view' THEN 2
          WHEN 'cart_add' THEN 3
          WHEN 'checkout' THEN 4
          WHEN 'conversion' THEN 5
        END
    `);

    // Procesar datos de heatmaps para el frontend
    const processedHeatmaps = {};
    heatmapEvents.forEach(event => {
      if (!processedHeatmaps[event.page_url]) {
        processedHeatmaps[event.page_url] = {
          clicks: [],
          scrollDepth: [],
          mouseMovements: []
        };
      }
      
      try {
        const metadata = JSON.parse(event.metadata || '{}');
        
        if (event.event_type === 'click' && metadata.x && metadata.y) {
          processedHeatmaps[event.page_url].clicks.push({
            x: metadata.x,
            y: metadata.y,
            count: event.event_count,
            element: metadata.element
          });
        } else if (event.event_type === 'scroll' && metadata.depth) {
          processedHeatmaps[event.page_url].scrollDepth.push({
            depth: metadata.depth,
            count: event.event_count
          });
        }
      } catch (e) {
        // Ignorar errores de parsing de JSON
      }
    });

    const result = {
      topPages: topPages,
      heatmaps: processedHeatmaps,
      customerJourney: customerJourney.slice(0, 20), // Limitar para rendimiento
      deviceAnalytics: deviceAnalytics,
      conversionFunnel: conversionFunnel,
      summary: {
        totalSessions: customerJourney.length,
        avgSessionDuration: Math.round(
          customerJourney.reduce((acc, session) => acc + (session.duration_seconds || 0), 0) / 
          Math.max(customerJourney.length, 1)
        ),
        topLandingPage: topPages[0]?.page_path || '/',
        topExitPage: topPages[topPages.length - 1]?.page_path || '/',
        conversionRate: conversionFunnel.find(step => step.step === 'conversion')?.visitors || 0
      }
    };

    console.log('✅ Heatmaps obtenidos:', { 
      topPages: topPages.length, 
      heatmapEvents: Object.keys(processedHeatmaps).length,
      journeySteps: customerJourney.length
    });

    res.status(200).json({
      success: true,
      data: result,
      metadata: {
        timeRange: timeRange,
        pageUrl: pageUrl,
        timestamp: new Date().toISOString(),
        dataPoints: heatmapEvents.length
      },
      message: 'Datos de heatmaps obtenidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo heatmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message,
      data: {
        topPages: [],
        heatmaps: {},
        customerJourney: [],
        deviceAnalytics: [],
        conversionFunnel: [],
        summary: {
          totalSessions: 0,
          avgSessionDuration: 0,
          topLandingPage: '/',
          topExitPage: '/',
          conversionRate: 0
        }
      }
    });
  }
}

export default adminAuth(handler);