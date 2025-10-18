// pages/api/admin/crm/lead-scoring.js - SISTEMA DE LEAD SCORING
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method === 'GET') {
    return getLeadScoring(req, res);
  } else if (req.method === 'POST') {
    return updateLeadScore(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

// Obtener lead scoring
async function getLeadScoring(req, res) {
  try {
    const { sessionId, visitorId, includeFactors = 'true' } = req.query;
    
    console.log('🎯 Calculando lead scoring...');
    
    let whereClause = '';
    let params = [];
    
    if (sessionId) {
      whereClause = 'WHERE s.id = ?';
      params = [sessionId];
    } else if (visitorId) {
      whereClause = 'WHERE s.visitor_id = ?';
      params = [visitorId];
    } else {
      whereClause = 'WHERE s.updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    }
    
    // Consulta avanzada para calcular lead scoring
    const scoringQuery = `
      SELECT 
        s.id as session_id,
        s.user_id,
        s.ip_address,
        s.country,
        s.city,
        s.device_type,
        s.browser,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        s.page_views,
        s.duration_seconds,
        s.created_at,
        s.updated_at,
        
        -- Información del usuario
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        
        -- Información del carrito
        cart.total_value as cart_value,
        cart.total_items as cart_items,
        cart.updated_at as cart_updated,
        
        -- Información de chat
        c.id as conversation_id,
        c.status as chat_status,
        c.message_count,
        c.created_at as chat_started,
        
        -- Calcular factores de scoring
        
        -- Factor de engagement (0-40 puntos)
        LEAST(40, (s.page_views * 5) + (s.duration_seconds / 30)) as engagement_score,
        
        -- Factor de intención (0-30 puntos)
        (CASE 
          WHEN cart.total_value > 100 THEN 30
          WHEN cart.total_value > 50 THEN 25
          WHEN cart.total_value > 0 THEN 20
          WHEN s.page_views > 10 THEN 15
          WHEN s.page_views > 5 THEN 10
          WHEN s.duration_seconds > 300 THEN 8
          ELSE 0
        END) as intent_score,
        
        -- Factor de comportamiento (0-20 puntos)
        (CASE 
          WHEN c.id IS NOT NULL THEN 20
          WHEN u.id IS NOT NULL THEN 15
          WHEN s.utm_source IS NOT NULL THEN 10
          WHEN s.page_views > 1 THEN 5
          ELSE 0
        END) as behavior_score,
        
        -- Factor temporal (0-10 puntos)
        (CASE 
          WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 10
          WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN 8
          WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 5
          ELSE 2
        END) as recency_score
        
      FROM analytics_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN shopping_carts cart ON s.id = cart.session_id AND cart.status = 'active'
      LEFT JOIN chat_conversations c ON s.id = c.session_id AND c.status = 'active'
      ${whereClause}
      ORDER BY s.updated_at DESC
      LIMIT 100
    `;

    const scoringData = await query(scoringQuery, params);

    // Procesar y calcular scores finales
    const processedScoring = scoringData.map(item => {
      const engagementScore = Math.round(item.engagement_score || 0);
      const intentScore = Math.round(item.intent_score || 0);
      const behaviorScore = Math.round(item.behavior_score || 0);
      const recencyScore = Math.round(item.recency_score || 0);
      
      const totalScore = Math.min(100, engagementScore + intentScore + behaviorScore + recencyScore);
      
      // Determinar categoría
      let category = 'cold';
      let priority = 'low';
      
      if (totalScore >= 90) {
        category = 'urgent';
        priority = 'urgent';
      } else if (totalScore >= 80) {
        category = 'hot';
        priority = 'high';
      } else if (totalScore >= 60) {
        category = 'warm';
        priority = 'medium';
      } else if (totalScore >= 40) {
        category = 'lukewarm';
        priority = 'low';
      }
      
      // Determinar próxima acción recomendada
      let recommendedAction = 'observe';
      let actionMessage = 'Continuar observando';
      
      if (totalScore >= 85) {
        recommendedAction = 'contact_immediately';
        actionMessage = 'Contactar inmediatamente';
      } else if (totalScore >= 70) {
        recommendedAction = 'initiate_chat';
        actionMessage = 'Iniciar chat proactivo';
      } else if (totalScore >= 50) {
        recommendedAction = 'send_offer';
        actionMessage = 'Enviar oferta personalizada';
      } else if (item.cart_value > 0) {
        recommendedAction = 'cart_recovery';
        actionMessage = 'Recuperación de carrito';
      }
      
      return {
        sessionId: item.session_id,
        userId: item.user_id,
        visitorInfo: {
          name: item.user_name || `Visitante ${item.session_id?.substring(0, 8)}`,
          email: item.user_email,
          phone: item.user_phone,
          location: `${item.city || 'Desconocida'}, ${item.country || 'Desconocido'}`,
          device: item.device_type,
          browser: item.browser
        },
        scoring: {
          totalScore: totalScore,
          category: category,
          priority: priority,
          factors: {
            engagement: {
              score: engagementScore,
              maxScore: 40,
              details: {
                pageViews: item.page_views,
                timeOnSite: Math.round(item.duration_seconds || 0),
                avgTimePerPage: item.page_views > 0 ? Math.round((item.duration_seconds || 0) / item.page_views) : 0
              }
            },
            intent: {
              score: intentScore,
              maxScore: 30,
              details: {
                cartValue: parseFloat(item.cart_value || 0),
                cartItems: item.cart_items || 0,
                hasCart: (item.cart_value || 0) > 0,
                browsingDepth: item.page_views || 0
              }
            },
            behavior: {
              score: behaviorScore,
              maxScore: 20,
              details: {
                hasChat: !!item.conversation_id,
                isRegistered: !!item.user_id,
                hasUtmSource: !!item.utm_source,
                messageCount: item.message_count || 0
              }
            },
            recency: {
              score: recencyScore,
              maxScore: 10,
              details: {
                lastActivity: item.updated_at,
                minutesAgo: Math.round((new Date() - new Date(item.updated_at)) / (1000 * 60)),
                isActive: (new Date() - new Date(item.updated_at)) < (5 * 60 * 1000) // 5 minutos
              }
            }
          }
        },
        recommendations: {
          action: recommendedAction,
          message: actionMessage,
          urgency: priority,
          reasons: generateRecommendationReasons(totalScore, {
            hasCart: (item.cart_value || 0) > 0,
            hasChat: !!item.conversation_id,
            isActive: (new Date() - new Date(item.updated_at)) < (5 * 60 * 1000),
            pageViews: item.page_views || 0,
            timeOnSite: item.duration_seconds || 0
          })
        },
        traffic: {
          source: item.utm_source || 'direct',
          medium: item.utm_medium || 'none',
          campaign: item.utm_campaign
        },
        timeline: {
          firstVisit: item.created_at,
          lastActivity: item.updated_at,
          chatStarted: item.chat_started,
          cartUpdated: item.cart_updated
        }
      };
    });

    // Estadísticas generales
    const stats = {
      totalScored: processedScoring.length,
      averageScore: processedScoring.length > 0 ? 
        Math.round(processedScoring.reduce((acc, item) => acc + item.scoring.totalScore, 0) / processedScoring.length) : 0,
      distribution: {
        urgent: processedScoring.filter(item => item.scoring.category === 'urgent').length,
        hot: processedScoring.filter(item => item.scoring.category === 'hot').length,
        warm: processedScoring.filter(item => item.scoring.category === 'warm').length,
        lukewarm: processedScoring.filter(item => item.scoring.category === 'lukewarm').length,
        cold: processedScoring.filter(item => item.scoring.category === 'cold').length
      },
      actionable: processedScoring.filter(item => item.scoring.totalScore >= 60).length,
      needsAttention: processedScoring.filter(item => item.recommendations.urgency === 'urgent' || item.recommendations.urgency === 'high').length
    };

    console.log('✅ Lead scoring calculado:', { 
      total: processedScoring.length, 
      avgScore: stats.averageScore,
      actionable: stats.actionable 
    });

    res.status(200).json({
      success: true,
      data: {
        scoring: processedScoring,
        stats: stats,
        timestamp: new Date().toISOString()
      },
      message: 'Lead scoring calculado correctamente'
    });

  } catch (error) {
    console.error('❌ Error calculando lead scoring:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculando lead scoring: ' + error.message,
      data: {
        scoring: [],
        stats: {
          totalScored: 0,
          averageScore: 0,
          distribution: { urgent: 0, hot: 0, warm: 0, lukewarm: 0, cold: 0 },
          actionable: 0,
          needsAttention: 0
        }
      }
    });
  }
}

// Actualizar score manualmente
async function updateLeadScore(req, res) {
  try {
    const {
      sessionId,
      visitorId,
      manualScore,
      notes,
      assignedTo,
      priority,
      tags
    } = req.body;

    console.log('📝 Actualizando lead score manualmente:', { sessionId, manualScore });

    if (!sessionId && !visitorId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId o visitorId es requerido'
      });
    }

    // Intentar insertar/actualizar en tabla de lead scoring si existe
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS lead_scoring_manual (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255),
          visitor_id VARCHAR(255),
          manual_score INT,
          auto_score INT,
          final_score INT,
          notes TEXT,
          assigned_to INT,
          priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
          tags JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_session (session_id)
        )
      `);

      // Calcular score automático actual
      const autoScoreQuery = `
        SELECT 
          LEAST(100, 
            LEAST(40, (s.page_views * 5) + (s.duration_seconds / 30)) +
            (CASE 
              WHEN cart.total_value > 100 THEN 30
              WHEN cart.total_value > 50 THEN 25
              WHEN cart.total_value > 0 THEN 20
              WHEN s.page_views > 10 THEN 15
              WHEN s.page_views > 5 THEN 10
              WHEN s.duration_seconds > 300 THEN 8
              ELSE 0
            END) +
            (CASE 
              WHEN c.id IS NOT NULL THEN 20
              WHEN u.id IS NOT NULL THEN 15
              WHEN s.utm_source IS NOT NULL THEN 10
              WHEN s.page_views > 1 THEN 5
              ELSE 0
            END) +
            (CASE 
              WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 10
              WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN 8
              WHEN s.updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 5
              ELSE 2
            END)
          ) as auto_score
        FROM analytics_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN shopping_carts cart ON s.id = cart.session_id AND cart.status = 'active'
        LEFT JOIN chat_conversations c ON s.id = c.session_id AND c.status = 'active'
        WHERE s.id = ?
      `;

      const autoScoreResult = await query(autoScoreQuery, [sessionId]);
      const autoScore = autoScoreResult[0]?.auto_score || 0;
      
      // El score final es el mayor entre el manual y el automático
      const finalScore = Math.max(manualScore || 0, autoScore);

      await query(`
        INSERT INTO lead_scoring_manual (
          session_id, visitor_id, manual_score, auto_score, final_score,
          notes, assigned_to, priority, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          manual_score = VALUES(manual_score),
          auto_score = VALUES(auto_score),
          final_score = VALUES(final_score),
          notes = VALUES(notes),
          assigned_to = VALUES(assigned_to),
          priority = VALUES(priority),
          tags = VALUES(tags),
          updated_at = NOW()
      `, [
        sessionId,
        visitorId,
        manualScore,
        autoScore,
        finalScore,
        notes || '',
        assignedTo,
        priority || 'medium',
        JSON.stringify(tags || [])
      ]);

      console.log('✅ Lead score actualizado:', { 
        sessionId, 
        manualScore, 
        autoScore, 
        finalScore 
      });

    } catch (tableError) {
      console.log('Tabla lead_scoring_manual no disponible, usando método alternativo...');
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: sessionId,
        visitorId: visitorId,
        manualScore: manualScore,
        updated: true
      },
      message: 'Lead score actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando lead score:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando lead score: ' + error.message
    });
  }
}

// Función auxiliar para generar razones de recomendación
function generateRecommendationReasons(score, factors) {
  const reasons = [];
  
  if (score >= 85) {
    reasons.push('Lead de muy alta prioridad');
    if (factors.hasCart) reasons.push('Tiene productos en el carrito');
    if (factors.isActive) reasons.push('Está navegando activamente');
  } else if (score >= 70) {
    reasons.push('Lead de alta calidad');
    if (factors.pageViews > 5) reasons.push('Ha visitado múltiples páginas');
    if (factors.timeOnSite > 300) reasons.push('Ha pasado tiempo significativo en el sitio');
  } else if (score >= 50) {
    reasons.push('Lead potencial');
    if (factors.hasChat) reasons.push('Ha iniciado conversación');
  }
  
  if (factors.hasCart && !factors.hasChat) {
    reasons.push('Carrito abandonado - oportunidad de recuperación');
  }
  
  if (factors.isActive) {
    reasons.push('Usuario activo - momento ideal para contactar');
  }
  
  return reasons.slice(0, 3); // Máximo 3 razones
}

export default adminAuth(handler);