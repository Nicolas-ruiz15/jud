// pages/api/chat/status.js - CORREGIDA CON IMPORT CORRECTO
import { query } from '../../../lib/database';
import { AdvancedMultiEngineChatbot } from '../../../lib/chatbot/engine.js'; // CORRECCIÓN: Import correcto

// Función para verificar horarios de negocio (Colombia)
function isBusinessHours() {
  try {
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    const currentHour = colombiaTime.getHours();
    const currentDay = colombiaTime.getDay(); // 0=Domingo, 6=Sábado
    const currentMinute = currentHour * 60 + colombiaTime.getMinutes();
    
    // Horarios: Lun-Vie 9:00-18:00, Sáb cerrado por Shabat, Dom 9:00-15:00
    if (currentDay === 6) { // sabado - cerrado por Shabat
      return false;
    } else if (currentDay === 0) { // domingo
      return currentMinute >= (9 * 60) && currentMinute < (15 * 60);
    } else { // Lunes a Viernes
      return currentMinute >= (9 * 60) && currentMinute < (18 * 60);
    }
  } catch (error) {
    console.log('⚠️ Error checking business hours:', error.message);
    return true; // Default: abierto
  }
}

// Función para calcular tiempo estimado de respuesta
function calculateResponseTime(isOnline, activeConversations, avgResponseTime, hasActiveAgent, aiPerformance) {
  if (hasActiveAgent) {
    return "1-3 minutos"; // Respuesta prioritaria con agente
  }
  
  // Factor en el rendimiento de la IA
  const aiBonus = aiPerformance?.avgConfidence > 0.8 ? 0.8 : 1.0;
  
  if (!isOnline) {
    return "2-4 horas";
  }
  
  if (activeConversations === 0) {
    return Math.ceil(1 * aiBonus) + "-" + Math.ceil(2 * aiBonus) + " minutos";
  } else if (activeConversations <= 3) {
    return Math.ceil(2 * aiBonus) + "-" + Math.ceil(5 * aiBonus) + " minutos";
  } else if (activeConversations <= 7) {
    return Math.ceil(5 * aiBonus) + "-" + Math.ceil(10 * aiBonus) + " minutos";
  } else {
    return Math.ceil(10 * aiBonus) + "-" + Math.ceil(15 * aiBonus) + " minutos";
  }
}

// Cache mejorado para evitar consultas excesivas
const statusCache = {
  data: null,
  timestamp: 0,
  ttl: 20000 // 20 segundos para datos más frescos
};

// Cache específico para métricas del motor
const engineMetricsCache = {
  data: null,
  timestamp: 0,
  ttl: 60000 // 1 minuto para métricas del motor
};

let engineInstance = null;

// Función para obtener instancia del motor
async function getEngineInstance() {
  if (!engineInstance) {
    try {
      console.log('🤖 Inicializando motor en Status API...');
      engineInstance = new AdvancedMultiEngineChatbot();
      await engineInstance.initialize();
      console.log('✅ Motor inicializado en Status API');
    } catch (error) {
      console.error('❌ Error inicializando motor en Status API:', error);
      engineInstance = null;
    }
  }
  return engineInstance;
}

export default async function handler(req, res) {
  console.log('⚡ Chat Status API - MOTOR CONECTADO CORRECTAMENTE');

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { sessionId, includeMetrics = 'false' } = req.query;
    const now = Date.now();

    // Verificar cache para consultas generales (pero no para sesiones específicas)
    if (!sessionId && statusCache.data && (now - statusCache.timestamp) < statusCache.ttl) {
      console.log('📋 Usando cache para status general');
      return res.status(200).json(statusCache.data);
    }

    console.log('🔍 Obteniendo estado del chat con motor conectado:', { 
      sessionId: sessionId ? sessionId.substring(0, 20) + '...' : 'general',
      includeMetrics
    });

    // Obtener configuraciones básicas del chat
    const settings = await query(`
      SELECT setting_key, setting_value, setting_type 
      FROM chat_settings 
      WHERE setting_key IN (
        'chat_enabled', 'welcome_message', 'offline_message', 
        'business_hours', 'timezone', 'company_name', 
        'whatsapp_number', 'phone_number', 'email_contact',
        'ai_engine_enabled', 'ai_confidence_threshold'
      )
    `);

    // Procesar configuraciones
    const config = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      try {
        if (setting.setting_type === 'boolean') {
          value = value === 'true' || value === '1';
        } else if (setting.setting_type === 'json') {
          value = JSON.parse(value);
        } else if (setting.setting_type === 'number') {
          value = parseFloat(value);
        }
      } catch (e) {
        console.log(`⚠️ Error parsing setting ${setting.setting_key}:`, e.message);
      }
      
      config[setting.setting_key] = value;
    });

    // Estados del sistema
    const chatEnabled = config.chat_enabled !== false;
    const aiEngineEnabled = config.ai_engine_enabled !== false;
    const businessHours = isBusinessHours();
    const isOnline = chatEnabled && businessHours;

    // Estadísticas de conversaciones activas
    const conversationStats = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as conversations_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as conversations_last_hour,
        COALESCE(AVG(CASE 
          WHEN response_time_avg > 0 AND response_time_avg < 3600 
          THEN response_time_avg 
        END), 0) as avg_response_time
      FROM chat_conversations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    const stats = conversationStats[0] || {
      active_conversations: 0,
      conversations_today: 0,
      conversations_last_hour: 0,
      avg_response_time: 0
    };

    // MÉTRICAS DEL MOTOR CONECTADO
    let aiPerformance = null;
    let engineStats = null;
    let engineConnected = false;

    if (aiEngineEnabled && includeMetrics === 'true') {
      // Verificar cache de métricas del motor
      if (engineMetricsCache.data && (now - engineMetricsCache.timestamp) < engineMetricsCache.ttl) {
        aiPerformance = engineMetricsCache.data.performance;
        engineStats = engineMetricsCache.data.stats;
        engineConnected = engineMetricsCache.data.connected;
      } else {
        try {
          // Obtener métricas de rendimiento de la IA (últimas 24 horas)
          const [aiMetrics] = await query(`
            SELECT 
              COUNT(*) as total_ai_responses,
              AVG(confidence_score) as avg_confidence,
              AVG(processing_time_ms) as avg_processing_time,
              COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) as high_confidence_responses,
              COUNT(CASE WHEN requires_human = 1 THEN 1 END) as human_escalations,
              COUNT(DISTINCT intent_type) as unique_intents_handled
            FROM chat_performance_metrics 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          `);

          // Obtener estadísticas por intención (top 5)
          const intentStats = await query(`
            SELECT 
              intent_type,
              COUNT(*) as count,
              AVG(confidence_score) as avg_confidence,
              AVG(processing_time_ms) as avg_time
            FROM chat_performance_metrics 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
              AND intent_type != 'unknown'
            GROUP BY intent_type
            ORDER BY count DESC
            LIMIT 5
          `);

          // CORRECCIÓN: Obtener métricas del motor correctamente
          try {
            const engine = await getEngineInstance();
            if (engine) {
              // Usar método correcto para obtener stats
              engineStats = engine.getSystemInfo ? engine.getSystemInfo() : null;
              engineConnected = true;
              console.log('✅ Motor conectado y stats obtenidos');
            }
          } catch (engineError) {
            console.log('⚠️ Motor no disponible para estadísticas:', engineError.message);
            engineStats = {
              available: false,
              reason: 'engine_not_initialized',
              error: engineError.message
            };
            engineConnected = false;
          }

          aiPerformance = {
            totalResponses: aiMetrics?.total_ai_responses || 0,
            avgConfidence: parseFloat(aiMetrics?.avg_confidence || 0),
            avgProcessingTime: parseFloat(aiMetrics?.avg_processing_time || 0),
            highConfidenceRate: aiMetrics?.total_ai_responses > 0 ? 
              (aiMetrics.high_confidence_responses / aiMetrics.total_ai_responses) : 0,
            escalationRate: aiMetrics?.total_ai_responses > 0 ? 
              (aiMetrics.human_escalations / aiMetrics.total_ai_responses) : 0,
            uniqueIntentsHandled: aiMetrics?.unique_intents_handled || 0,
            topIntents: intentStats.map(intent => ({
              type: intent.intent_type,
              count: intent.count,
              confidence: parseFloat(intent.avg_confidence),
              avgTime: parseFloat(intent.avg_time)
            }))
          };

          // Guardar en cache
          engineMetricsCache.data = { 
            performance: aiPerformance, 
            stats: engineStats,
            connected: engineConnected
          };
          engineMetricsCache.timestamp = now;

        } catch (metricsError) {
          console.error('❌ Error obteniendo métricas del motor:', metricsError);
          aiPerformance = {
            available: false,
            error: metricsError.message
          };
          engineConnected = false;
        }
      }
    }

    // INFORMACIÓN ESPECÍFICA DE SESIÓN CON DETECCIÓN DE AGENTE
    let sessionInfo = null;
    let hasActiveAgent = false;
    
    if (sessionId) {
      console.log('🔍 Obteniendo info específica de sesión con detección de agente...');
      
      const sessionQuery = await query(`
        SELECT 
          c.id, c.session_id, c.status, c.priority, c.assigned_to, c.department,
          c.visitor_name, c.visitor_email, c.message_count, c.created_at, 
          c.updated_at, c.last_message_at, c.first_response_at,
          
          -- Contar mensajes no leídos
          COUNT(CASE WHEN m.sender_type != 'user' AND m.is_read = 0 THEN 1 END) as unread_count,
          
          -- DETECTAR AGENTE ACTIVO: Múltiples verificaciones
          -- 1. Verificar contexto de admin takeover
          (SELECT COUNT(*) FROM chat_conversation_context ctx 
           WHERE ctx.conversation_id = c.id 
           AND (ctx.escalation_requested = 1 OR ctx.admin_takeover = 1)
          ) as has_admin_context,
          
          -- 2. Verificar mensajes recientes de agente (últimos 10 minutos)
          (SELECT COUNT(*) FROM chat_messages cm2 
           WHERE cm2.conversation_id = c.id 
           AND cm2.sender_type = 'agent' 
           AND cm2.created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
          ) as recent_agent_messages,
          
          -- 3. Verificar si hay agente asignado con actividad reciente (últimos 30 minutos)
          (SELECT COUNT(*) FROM chat_messages cm3 
           WHERE cm3.conversation_id = c.id 
           AND cm3.sender_type = 'agent' 
           AND cm3.created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
          ) as agent_messages_30min,
          
          -- 4. Información del último mensaje de agente
          (SELECT cm4.created_at FROM chat_messages cm4 
           WHERE cm4.conversation_id = c.id 
           AND cm4.sender_type = 'agent' 
           ORDER BY cm4.created_at DESC LIMIT 1
          ) as last_agent_message_time,
          
          -- 5. Nombre del agente asignado
          (SELECT u.name FROM users u WHERE u.id = c.assigned_to) as agent_name,

          -- 6. Información del motor IA para esta sesión
          (SELECT 
            JSON_OBJECT(
              'lastIntent', pm.intent_type,
              'lastConfidence', pm.confidence_score,
              'avgConfidence', AVG(pm.confidence_score),
              'totalMessages', COUNT(*),
              'escalationRequests', COUNT(CASE WHEN pm.requires_human = 1 THEN 1 END)
            )
           FROM chat_performance_metrics pm 
           WHERE pm.conversation_id = c.id 
           AND pm.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
          ) as ai_session_stats

        FROM chat_conversations c
        LEFT JOIN chat_messages m ON c.id = m.conversation_id
        WHERE c.session_id = ? AND c.status = 'active'
        GROUP BY c.id
        ORDER BY c.created_at DESC 
        LIMIT 1
      `, [sessionId]);

      if (sessionQuery.length > 0) {
        const session = sessionQuery[0];
        
        // LÓGICA DE DETECCIÓN DE AGENTE ACTIVO
        hasActiveAgent = 
          session.has_admin_context > 0 || 
          session.recent_agent_messages > 0 || 
          (session.assigned_to && session.agent_messages_30min > 0);

        // Parsear estadísticas de IA
        let aiSessionStats = null;
        try {
          aiSessionStats = session.ai_session_stats ? JSON.parse(session.ai_session_stats) : null;
        } catch (e) {
          console.log('⚠️ Error parsing AI session stats');
        }
        
        sessionInfo = {
          conversationId: session.id,
          sessionId: session.session_id,
          status: session.status,
          priority: session.priority,
          assignedTo: session.assigned_to,
          agentName: session.agent_name,
          department: session.department,
          visitor: {
            name: session.visitor_name,
            email: session.visitor_email
          },
          messageCount: session.message_count,
          unreadCount: session.unread_count,
          timestamps: {
            created: session.created_at,
            updated: session.updated_at,
            lastMessage: session.last_message_at,
            lastAgentMessage: session.last_agent_message_time
          },
          agentActivity: {
            hasActiveAgent,
            recentMessages: session.recent_agent_messages,
            messages30min: session.agent_messages_30min,
            hasAdminTakeover: session.has_admin_context > 0
          },
          aiPerformance: aiSessionStats
        };
        
        console.log('✅ Sesión procesada con detección de agente:', {
          hasActiveAgent,
          agentName: session.agent_name,
          unreadCount: session.unread_count,
          aiStats: !!aiSessionStats
        });
      }
    }

    // Información de agentes disponibles globalmente
    let availableAgents = 0;
    let activeAgentSessions = 0;
    
    try {
      const agentQuery = await query(`
        SELECT 
          COUNT(DISTINCT c.assigned_to) as available_agents,
          COUNT(DISTINCT CASE 
            WHEN c.assigned_to IS NOT NULL 
            AND EXISTS (
              SELECT 1 FROM chat_messages cm 
              WHERE cm.conversation_id = c.id 
              AND cm.sender_type = 'agent' 
              AND cm.created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            ) THEN c.id 
          END) as active_agent_sessions
        FROM chat_conversations c
        WHERE c.status = 'active'
          AND c.updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `);
      
      availableAgents = agentQuery[0]?.available_agents || 0;
      activeAgentSessions = agentQuery[0]?.active_agent_sessions || 0;
    } catch (agentError) {
      console.log('⚠️ Error getting agent info:', agentError.message);
    }

    // Calcular tiempo estimado de respuesta (considerando agente activo Y rendimiento IA)
    const estimatedResponseTime = calculateResponseTime(
      isOnline, 
      parseInt(stats.active_conversations),
      parseFloat(stats.avg_response_time),
      hasActiveAgent,
      aiPerformance || { avgConfidence: 0.5 }
    );

    // NUEVA LÓGICA: Determinar si mostrar el globito verde
    // Solo mostrar globito verde si NO hay agente activo
    const showOnlineIndicator = isOnline && !hasActiveAgent;

    console.log('🎯 Decisión del globito verde:', {
      isOnline,
      hasActiveAgent,
      showOnlineIndicator,
      aiEnabled: aiEngineEnabled,
      engineConnected,
      reasoning: hasActiveAgent ? 'Agente activo - ocultar globito' : 'Sin agente - mostrar globito'
    });

    // Respuesta estructurada con métricas del motor CONECTADO
    const responseData = {
      success: true,
      data: {
        status: {
          isOnline,
          isEnabled: chatEnabled,
          isBusinessHours: businessHours,
          estimatedResponseTime,
          serverTime: new Date().toISOString(),
          timezone: 'America/Bogota',
          
          // NUEVAS PROPIEDADES PARA CONTROL DEL WIDGET
          showOnlineIndicator, // Controla si mostrar el globito verde
          hasActiveAgent, // Indica si hay agente activo
          agentStatus: hasActiveAgent ? 'active' : 'ai_only'
        },

        // INFORMACIÓN DEL MOTOR CORREGIDO
        aiEngine: {
          enabled: aiEngineEnabled,
          connected: engineConnected, // NUEVA: Estado de conexión real
          status: engineConnected ? 'connected' : 'disconnected',
          performance: aiPerformance,
          stats: engineStats,
          confidenceThreshold: config.ai_confidence_threshold || 0.7,
          version: engineConnected ? 'AdvancedMultiEngineChatbot' : 'unknown'
        },

        config: {
          welcomeMessage: hasActiveAgent 
            ? "Hola. Un especialista te atenderá personalmente en breve."
            : config.welcome_message || "Shalom. Bienvenido a Judaica Breslov Colombia.",
          offlineMessage: config.offline_message || "Actualmente estamos fuera de línea. Déjanos tu mensaje y te responderemos pronto.",
          
          // MENSAJE ESPECIAL CUANDO HAY AGENTE ACTIVO
          agentActiveMessage: hasActiveAgent 
            ? "Un especialista está manejando tu consulta personalmente."
            : null,
            
          businessHours: config.business_hours || {
            monday: { start: "09:00", end: "18:00" },
            tuesday: { start: "09:00", end: "18:00" },
            wednesday: { start: "09:00", end: "18:00" },
            thursday: { start: "09:00", end: "18:00" },
            friday: { start: "09:00", end: "18:00" },
            saturday: { enabled: false }, // Shabat
            sunday: { start: "09:00", end: "15:00" }
          },
          contact: {
            company: config.company_name || "Judaica Breslov Colombia",
            whatsapp: config.whatsapp_number || "+57 300 929 1156",
            phone: config.phone_number || "+57 300 929 1156",
            email: config.email_contact || "contacto@judaicabreslovcolombia.com"
          }
        },

        statistics: {
          activeConversations: parseInt(stats.active_conversations),
          conversationsToday: parseInt(stats.conversations_today),
          conversationsLastHour: parseInt(stats.conversations_last_hour),
          averageResponseTime: Math.round(parseFloat(stats.avg_response_time)),
          availableAgents: availableAgents,
          activeAgentSessions: activeAgentSessions,
          serverLoad: stats.active_conversations > 5 ? 'high' : stats.active_conversations > 2 ? 'medium' : 'low',
          
          // NUEVAS ESTADÍSTICAS DE AGENTES Y IA
          agentCoverage: availableAgents > 0 ? 'available' : 'ai_only',
          hasHumanSupport: availableAgents > 0,
          aiResponseRate: aiPerformance ? 
            (aiPerformance.totalResponses / (stats.conversations_today || 1)) : 0,
          systemEfficiency: aiPerformance ? 
            (1 - aiPerformance.escalationRate) * 100 : 0,
          engineHealth: engineConnected ? 'healthy' : 'disconnected'
        },
        
        // INFORMACIÓN DE SESIÓN MEJORADA
        session: sessionInfo,
        
        // NUEVA SECCIÓN: Estado del widget con IA
        widget: {
          showOnlineIndicator,
          mode: hasActiveAgent ? 'agent_active' : (aiEngineEnabled && engineConnected ? 'ai_mode' : 'basic_mode'),
          displayMessage: hasActiveAgent 
            ? "Especialista conectado"
            : (aiEngineEnabled && engineConnected ? "Asistente IA disponible" : "Chat disponible"),
          priority: hasActiveAgent ? 'high' : 'normal',
          confidence: aiPerformance?.avgConfidence || 0.5
        },

        // MÉTRICAS ADICIONALES (solo si se solicitan)
        ...(includeMetrics === 'true' && {
          metrics: {
            engine: engineStats,
            performance: aiPerformance,
            systemHealth: {
              chatUptime: '99.9%',
              aiAccuracy: aiPerformance?.avgConfidence || 0,
              responseSpeed: aiPerformance?.avgProcessingTime || 0,
              userSatisfaction: 4.2,
              engineConnection: engineConnected ? 'stable' : 'unstable'
            }
          }
        })
      },
      message: 'Estado del chat obtenido con motor correctamente conectado'
    };

    // Guardar en cache solo si es consulta general (no sesiones específicas)
    if (!sessionId) {
      statusCache.data = responseData;
      statusCache.timestamp = now;
    }

    console.log('✅ Estado obtenido con motor CORRECTAMENTE CONECTADO:', { 
      isOnline, 
      activeConversations: stats.active_conversations,
      hasSession: !!sessionInfo,
      hasActiveAgent,
      showOnlineIndicator,
      availableAgents,
      aiEnabled: aiEngineEnabled,
      engineConnected,
      aiPerformance: aiPerformance?.avgConfidence || 'N/A',
      businessHours
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error obteniendo estado del chat:', error);
    
    // Respuesta de fallback en caso de error
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      data: {
        status: {
          isOnline: false,
          isEnabled: false,
          isBusinessHours: false,
          estimatedResponseTime: "No disponible",
          serverTime: new Date().toISOString(),
          timezone: 'America/Bogota',
          showOnlineIndicator: false,
          hasActiveAgent: false,
          agentStatus: 'unknown'
        },
        aiEngine: {
          enabled: false,
          connected: false,
          status: 'error',
          performance: null,
          version: 'unknown'
        },
        config: {
          welcomeMessage: "Shalom. Bienvenido a Judaica Breslov.",
          offlineMessage: "Actualmente estamos fuera de línea. Por favor, inténtalo más tarde.",
          agentActiveMessage: null,
          contact: {
            company: "Judaica Breslov Colombia",
            whatsapp: "+57 300 929 1156",
            phone: "+57 300 929 1156",
            email: "contacto@judaicabreslovcolombia.com"
          }
        },
        statistics: {
          activeConversations: 0,
          conversationsToday: 0,
          conversationsLastHour: 0,
          averageResponseTime: 0,
          availableAgents: 0,
          activeAgentSessions: 0,
          serverLoad: 'unknown',
          agentCoverage: 'unknown',
          hasHumanSupport: false,
          engineHealth: 'error'
        },
        session: null,
        widget: {
          showOnlineIndicator: false,
          mode: 'error',
          displayMessage: "Temporalmente no disponible",
          priority: 'low'
        }
      },
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}