// pages/api/admin/analytics/visitor-intelligence.js - VISITOR INTELLIGENCE ENGINE
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('🧠 Visitor Intelligence API called');

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      sessionId,
      timeframe = '24h',
      includeScoring = 'true',
      includeIntents = 'true',
      includePredictions = 'true'
    } = req.query;

    console.log('🔍 Analyzing visitor intelligence:', { sessionId, timeframe });

    // CONSULTA PRINCIPAL - VISITOR INTELLIGENCE COMPLETO
    const intelligenceQuery = `
      SELECT 
        rv.*,
        s.*,
        u.name as user_name,
        u.email as user_email,
        u.created_at as user_registered,
        
        -- BEHAVIORAL METRICS
        COUNT(DISTINCT pv.id) as total_page_views,
        COUNT(DISTINCT ae.id) as total_events,
        AVG(pv.time_on_page_seconds) as avg_time_per_page,
        MAX(pv.scroll_depth_percentage) as max_scroll_depth,
        
        -- E-COMMERCE SIGNALS
        COUNT(DISTINCT CASE WHEN ae.event_type = 'product_view' THEN ae.id END) as product_views,
        COUNT(DISTINCT CASE WHEN ae.event_type = 'add_to_cart' THEN ae.id END) as cart_additions,
        COUNT(DISTINCT CASE WHEN ae.event_type = 'checkout_start' THEN ae.id END) as checkout_attempts,
        
        -- ENGAGEMENT PATTERNS
        TIMESTAMPDIFF(SECOND, s.created_at, NOW()) as session_duration_seconds,
        COUNT(DISTINCT DATE(ae.created_at)) as active_days,
        
        -- CART & ORDER DATA
        COALESCE(cart.total_value, 0) as current_cart_value,
        COALESCE(cart.total_items, 0) as current_cart_items,
        COALESCE(customer_stats.total_orders, 0) as lifetime_orders,
        COALESCE(customer_stats.total_spent, 0) as lifetime_value,
        COALESCE(customer_stats.avg_order_value, 0) as avg_order_value,
        customer_stats.last_order_date,
        
        -- CHAT ENGAGEMENT
        COALESCE(chat_stats.total_conversations, 0) as chat_conversations,
        COALESCE(chat_stats.avg_response_time, 0) as avg_chat_response_time,
        chat_stats.last_chat_date,
        
        -- CONTENT PREFERENCES
        GROUP_CONCAT(DISTINCT pc.name SEPARATOR ', ') as viewed_categories
        
      FROM analytics_realtime_visitors rv
      LEFT JOIN analytics_sessions s ON rv.session_id = s.id
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN analytics_page_views pv ON s.id = pv.session_id
      LEFT JOIN analytics_events ae ON s.id = ae.session_id
      LEFT JOIN shopping_carts cart ON s.id = cart.session_id AND cart.status = 'active'
      
      -- CUSTOMER LIFETIME STATS
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          AVG(total_amount) as avg_order_value,
          MAX(created_at) as last_order_date
        FROM orders 
        WHERE status IN ('completed', 'paid', 'processing')
        GROUP BY user_id
      ) customer_stats ON u.id = customer_stats.user_id
      
      -- CHAT ENGAGEMENT STATS
      LEFT JOIN (
        SELECT 
          session_id,
          COUNT(*) as total_conversations,
          AVG(response_time_avg) as avg_response_time,
          MAX(created_at) as last_chat_date
        FROM chat_conversations
        GROUP BY session_id
      ) chat_stats ON s.id = chat_stats.session_id
      
      -- PRODUCT CATEGORIES VIEWED
      LEFT JOIN (
        SELECT DISTINCT
          ae.session_id,
          c.name
        FROM analytics_events ae
        JOIN products p ON JSON_EXTRACT(ae.metadata, '$.product_id') = p.id
        JOIN product_categories pc ON p.id = pc.product_id
        JOIN categories c ON pc.category_id = c.id
        WHERE ae.event_type = 'product_view'
      ) pc ON s.id = pc.session_id
      
      ${sessionId ? 'WHERE rv.session_id = ?' : 'WHERE rv.last_activity > DATE_SUB(NOW(), INTERVAL 1 DAY)'}
      GROUP BY rv.session_id
      ORDER BY rv.last_activity DESC
      LIMIT 100
    `;

    const params = sessionId ? [sessionId] : [];
    const visitors = await query(intelligenceQuery, params);

    // PROCESAR INTELLIGENCE PARA CADA VISITANTE
    const processedVisitors = await Promise.all(visitors.map(async (visitor) => {
      // 1. CALCULAR LEAD SCORE
      let leadScore = 0;
      let leadGrade = 'cold';
      
      // Base scoring factors
      leadScore += Math.min(visitor.total_page_views * 2, 20); // Max 20 points
      leadScore += Math.min(visitor.session_duration_seconds / 60, 15); // Max 15 points
      leadScore += visitor.product_views * 3; // 3 points per product view
      leadScore += visitor.cart_additions * 10; // 10 points per cart addition
      leadScore += visitor.checkout_attempts * 15; // 15 points per checkout attempt
      leadScore += visitor.chat_conversations * 8; // 8 points per chat
      
      // Premium scoring for registered users
      if (visitor.user_id) {
        leadScore += 20;
        leadScore += Math.min(visitor.lifetime_orders * 5, 25);
        leadScore += Math.min(visitor.lifetime_value / 1000, 30);
      }
      
      // Determine lead grade
      if (leadScore >= 80) leadGrade = 'hot';
      else if (leadScore >= 40) leadGrade = 'warm';
      
      // 2. DETECTAR INTENCIONES (INTENT DETECTION)
      const intents = [];
      if (visitor.product_views > 3) intents.push('research');
      if (visitor.cart_additions > 0) intents.push('purchase_intent');
      if (visitor.checkout_attempts > 0) intents.push('high_purchase_intent');
      if (visitor.chat_conversations > 0) intents.push('support_seeking');
      if (visitor.current_page_path?.includes('/contact')) intents.push('contact_intent');
      if (visitor.session_duration_seconds > 300) intents.push('engaged');
      
      // 3. RISK ASSESSMENT
      let churnRisk = 'low';
      if (visitor.user_id && visitor.lifetime_orders > 0) {
        const daysSinceLastOrder = visitor.last_order_date ? 
          Math.floor((new Date() - new Date(visitor.last_order_date)) / (1000 * 60 * 60 * 24)) : 999;
        
        if (daysSinceLastOrder > 90) churnRisk = 'high';
        else if (daysSinceLastOrder > 30) churnRisk = 'medium';
      }
      
      // 4. NEXT BEST ACTION RECOMMENDATIONS
      const recommendations = [];
      
      if (leadGrade === 'hot' && visitor.current_cart_value > 0) {
        recommendations.push({
          type: 'urgent_follow_up',
          message: 'Contactar inmediatamente - carrito con valor alto',
          priority: 'high'
        });
      }
      
      if (visitor.checkout_attempts > 0 && visitor.current_cart_value === 0) {
        recommendations.push({
          type: 'cart_abandonment',
          message: 'Ofrecer descuento por abandono de carrito',
          priority: 'medium'
        });
      }
      
      if (visitor.product_views > 5 && visitor.cart_additions === 0) {
        recommendations.push({
          type: 'browsing_assistance',
          message: 'Ofrecer ayuda personalizada',
          priority: 'medium'
        });
      }
      
      if (churnRisk === 'high') {
        recommendations.push({
          type: 'retention',
          message: 'Cliente en riesgo - activar campaña de retención',
          priority: 'high'
        });
      }

      // 5. CALCULAR CONVERSION PROBABILITY
      let conversionProbability = 0;
      if (visitor.cart_additions > 0) conversionProbability += 30;
      if (visitor.checkout_attempts > 0) conversionProbability += 40;
      if (visitor.user_id && visitor.lifetime_orders > 0) conversionProbability += 20;
      if (visitor.session_duration_seconds > 180) conversionProbability += 10;
      
      conversionProbability = Math.min(conversionProbability, 95);

      return {
        // BASIC INFO
        sessionId: visitor.session_id,
        userId: visitor.user_id,
        visitorUuid: visitor.session_id, // Could be enhanced with proper UUID
        
        // USER PROFILE
        user: {
          name: visitor.user_name || 'Visitante Anónimo',
          email: visitor.user_email,
          isRegistered: !!visitor.user_id,
          registrationDate: visitor.user_registered,
          totalOrders: visitor.lifetime_orders,
          lifetimeValue: visitor.lifetime_value,
          avgOrderValue: visitor.avg_order_value,
          lastOrderDate: visitor.last_order_date
        },

        // LOCATION & DEVICE
        location: {
          country: visitor.country,
          city: visitor.city,
          ip: visitor.ip_address
        },
        device: {
          type: visitor.device_type,
          browser: visitor.browser,
          os: visitor.os
        },

        // LEAD SCORING
        scoring: includeScoring === 'true' ? {
          leadScore: Math.round(leadScore),
          leadGrade,
          conversionProbability: Math.round(conversionProbability),
          churnRisk,
          lastUpdated: new Date().toISOString()
        } : null,

        // BEHAVIORAL INTELLIGENCE
        behavior: {
          sessionDuration: visitor.session_duration_seconds,
          pageViews: visitor.total_page_views,
          avgTimePerPage: Math.round(visitor.avg_time_per_page || 0),
          maxScrollDepth: visitor.max_scroll_depth || 0,
          totalEvents: visitor.total_events,
          activeDays: visitor.active_days,
          engagementLevel: leadScore > 60 ? 'high' : leadScore > 30 ? 'medium' : 'low'
        },

        // E-COMMERCE INTELLIGENCE
        ecommerce: {
          productViews: visitor.product_views,
          cartAdditions: visitor.cart_additions,
          checkoutAttempts: visitor.checkout_attempts,
          currentCartValue: visitor.current_cart_value,
          currentCartItems: visitor.current_cart_items,
          viewedCategories: visitor.viewed_categories ? visitor.viewed_categories.split(', ') : []
        },

        // INTENT ANALYSIS
        intents: includeIntents === 'true' ? {
          detectedIntents: intents,
          primaryIntent: intents[0] || 'browsing',
          intentConfidence: intents.length > 0 ? Math.min(intents.length * 25, 100) : 10
        } : null,

        // PREDICTIONS & RECOMMENDATIONS
        predictions: includePredictions === 'true' ? {
          nextBestActions: recommendations,
          recommendedProducts: [], // Would be populated by ML algorithm
          optimalContactTime: 'now', // Would be based on behavior patterns
          preferredChannel: visitor.chat_conversations > 0 ? 'chat' : 'email'
        } : null,

        // CHAT INTELLIGENCE
        chat: {
          totalConversations: visitor.chat_conversations,
          avgResponseTime: visitor.avg_response_time,
          lastChatDate: visitor.last_chat_date,
          prefersChatSupport: visitor.chat_conversations > 1
        },

        // ACTIVITY TIMELINE
        lastActivity: visitor.last_activity,
        currentPage: visitor.current_page_path,
        isOnline: Math.floor((new Date() - new Date(visitor.last_activity)) / 1000) < 300
      };
    }));

    // STATISTICS SUMMARY
    const stats = {
      totalVisitors: processedVisitors.length,
      hotLeads: processedVisitors.filter(v => v.scoring?.leadGrade === 'hot').length,
      warmLeads: processedVisitors.filter(v => v.scoring?.leadGrade === 'warm').length,
      coldLeads: processedVisitors.filter(v => v.scoring?.leadGrade === 'cold').length,
      highChurnRisk: processedVisitors.filter(v => v.scoring?.churnRisk === 'high').length,
      avgLeadScore: Math.round(
        processedVisitors.reduce((sum, v) => sum + (v.scoring?.leadScore || 0), 0) / processedVisitors.length
      ),
      avgConversionProbability: Math.round(
        processedVisitors.reduce((sum, v) => sum + (v.scoring?.conversionProbability || 0), 0) / processedVisitors.length
      )
    };

    console.log('✅ Visitor intelligence processed:', { 
      visitors: processedVisitors.length,
      hotLeads: stats.hotLeads,
      avgScore: stats.avgLeadScore
    });

    res.status(200).json({
      success: true,
      data: {
        visitors: processedVisitors,
        statistics: stats,
        metadata: {
          timeframe,
          includedFeatures: {
            scoring: includeScoring === 'true',
            intents: includeIntents === 'true',
            predictions: includePredictions === 'true'
          },
          generatedAt: new Date().toISOString(),
          processingTime: Date.now()
        }
      },
      message: 'Visitor intelligence generated successfully'
    });

  } catch (error) {
    console.error('❌ Error in visitor intelligence:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);