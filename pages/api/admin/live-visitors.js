import { adminAuth } from '../../../middleware/adminAuth';
import { query } from '../../../lib/database';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Obtener visitantes activos (últimos 30 minutos)
    const activeVisitors = await query(`
      SELECT 
        arv.*,
        vp.name,
        vp.email,
        vp.phone,
        vp.avatar,
        vp.tags,
        vp.notes,
        vi.lead_score,
        vi.engagement_score,
        vi.intent_prediction,
        vi.behavior_summary,
        vi.technology_info,
        vi.last_page_viewed,
        vi.time_on_current_page,
        vi.total_page_views,
        vi.scroll_depth,
        vi.click_count,
        vi.cart_value,
        vi.cart_items_count,
        vi.previous_purchases,
        vi.total_spent,
        vi.customer_since,
        vi.last_purchase_date,
        vi.preferred_contact_method
      FROM analytics_realtime_visitors arv
      LEFT JOIN visitor_profiles vp ON arv.session_id = vp.session_id
      LEFT JOIN visitor_intelligence vi ON arv.session_id = vi.session_id
      WHERE arv.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        AND arv.is_active = 1
      ORDER BY arv.last_activity DESC
      LIMIT 100
    `);

    // Obtener estadísticas en tiempo real
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT arv.session_id) as active_visitors,
        COUNT(DISTINCT CASE WHEN arv.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN arv.session_id END) as very_active_visitors,
        SUM(arv.page_views) as total_page_views,
        AVG(arv.session_duration) as avg_session_duration,
        COUNT(DISTINCT CASE WHEN arv.device_type = 'mobile' THEN arv.session_id END) as mobile_users,
        COUNT(DISTINCT CASE WHEN arv.device_type = 'desktop' THEN arv.session_id END) as desktop_users,
        COUNT(DISTINCT CASE WHEN arv.device_type = 'tablet' THEN arv.session_id END) as tablet_users,
        COUNT(DISTINCT CASE WHEN arv.is_returning = 1 THEN arv.session_id END) as returning_visitors,
        COUNT(DISTINCT CASE WHEN arv.is_returning = 0 THEN arv.session_id END) as new_visitors
      FROM analytics_realtime_visitors arv
      WHERE arv.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        AND arv.is_active = 1
    `);

    // Obtener estadísticas de conversaciones activas
    const chatStats = await query(`
      SELECT 
        COUNT(DISTINCT cc.id) as active_chats,
        COUNT(DISTINCT CASE WHEN cc.status = 'waiting' THEN cc.id END) as waiting_chats,
        SUM(CASE WHEN cm.is_read = 0 AND cm.sender_type = 'visitor' THEN 1 ELSE 0 END) as unread_messages,
        AVG(CASE WHEN cc.response_time IS NOT NULL THEN cc.response_time END) as avg_response_time
      FROM chat_conversations cc
      LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
      WHERE cc.status IN ('active', 'waiting')
        AND cc.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Obtener ingresos del día
    const revenueToday = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COUNT(*) as total_orders
      FROM orders
      WHERE DATE(created_at) = CURDATE()
        AND status = 'completed'
    `);

    // Formatear datos de visitantes
    const formattedVisitors = activeVisitors.map(visitor => ({
      id: visitor.id,
      sessionId: visitor.session_id,
      name: visitor.name || 'Visitante Anónimo',
      email: visitor.email || null,
      avatar: visitor.avatar || visitor.name?.charAt(0).toUpperCase() || 'V',
      status: getVisitorStatus(visitor.last_activity),
      location: {
        country: visitor.country || 'Desconocido',
        countryCode: visitor.country_code || 'XX',
        city: visitor.city || 'Desconocida',
        region: visitor.region || 'Desconocida',
        coordinates: {
          lat: visitor.latitude || 0,
          lng: visitor.longitude || 0
        }
      },
      device: {
        type: visitor.device_type || 'desktop',
        os: visitor.operating_system || 'Desconocido',
        browser: visitor.browser || 'Desconocido',
        screenResolution: visitor.screen_resolution || '1920x1080',
        mobile: visitor.device_type === 'mobile'
      },
      session: {
        startTime: visitor.session_start,
        lastActivity: visitor.last_activity,
        pageViews: visitor.page_views || 0,
        duration: visitor.session_duration || 0,
        isReturning: visitor.is_returning === 1,
        visitCount: visitor.visit_count || 1,
        source: visitor.traffic_source || 'direct',
        campaign: visitor.campaign || null,
        referrer: visitor.referrer || null
      },
      behavior: {
        currentPage: visitor.last_page_viewed || visitor.current_page || '/',
        timeOnPage: visitor.time_on_current_page || 0,
        scrollDepth: visitor.scroll_depth || 0,
        clickCount: visitor.click_count || 0,
        engagementScore: visitor.engagement_score || 0,
        intent: visitor.intent_prediction || 'browsing',
        cartValue: visitor.cart_value || 0,
        cartItems: visitor.cart_items_count || 0,
        wishlistItems: 0,
        previousPurchases: visitor.previous_purchases || 0,
        totalSpent: visitor.total_spent || 0
      },
      technology: {
        ip: visitor.ip_address || 'No disponible',
        userAgent: visitor.user_agent || 'No disponible',
        language: visitor.language || 'es',
        timezone: visitor.timezone || 'UTC',
        cookiesEnabled: true,
        javascriptEnabled: true
      },
      tags: visitor.tags ? JSON.parse(visitor.tags) : [],
      leadScore: visitor.lead_score || 0,
      lastPurchase: visitor.last_purchase_date,
      totalOrders: visitor.previous_purchases || 0,
      customerSince: visitor.customer_since,
      preferredContact: visitor.preferred_contact_method || 'email',
      notes: visitor.notes || ''
    }));

    // Formatear estadísticas
    const formattedStats = {
      activeVisitors: stats[0]?.active_visitors || 0,
      veryActiveVisitors: stats[0]?.very_active_visitors || 0,
      totalPageViews: stats[0]?.total_page_views || 0,
      avgSessionDuration: Math.round(stats[0]?.avg_session_duration || 0),
      mobileUsers: stats[0]?.mobile_users || 0,
      desktopUsers: stats[0]?.desktop_users || 0,
      tabletUsers: stats[0]?.tablet_users || 0,
      newVisitors: stats[0]?.new_visitors || 0,
      returningVisitors: stats[0]?.returning_visitors || 0,
      activeChats: chatStats[0]?.active_chats || 0,
      waitingChats: chatStats[0]?.waiting_chats || 0,
      unreadMessages: chatStats[0]?.unread_messages || 0,
      avgResponseTime: Math.round(chatStats[0]?.avg_response_time || 0),
      totalRevenue: revenueToday[0]?.total_revenue || 0,
      avgOrderValue: Math.round(revenueToday[0]?.avg_order_value || 0),
      totalOrders: revenueToday[0]?.total_orders || 0,
      conversionRate: calculateConversionRate(stats[0]?.active_visitors, revenueToday[0]?.total_orders)
    };

    res.status(200).json({
      success: true,
      data: {
        visitors: formattedVisitors,
        stats: formattedStats
      }
    });

  } catch (error) {
    console.error('Error obteniendo visitantes en vivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

function getVisitorStatus(lastActivity) {
  const now = new Date();
  const lastActivityDate = new Date(lastActivity);
  const diffMinutes = (now - lastActivityDate) / (1000 * 60);
  
  if (diffMinutes <= 2) return 'online';
  if (diffMinutes <= 10) return 'away';
  return 'offline';
}

function calculateConversionRate(visitors, orders) {
  if (!visitors || visitors === 0) return 0;
  return ((orders / visitors) * 100).toFixed(1);
}

export default adminAuth(handler);