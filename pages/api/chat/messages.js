// pages/api/chat/messages.js - VERSIÓN CORREGIDA
import { query } from '../../../lib/database';

// Cache para evitar requests duplicados
const requestCache = new Map();
const CACHE_TTL = 2000; // 2 segundos

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      sessionId, 
      conversationId, 
      since, 
      limit = 50
    } = req.query;

    // Validar parámetros
    if (!sessionId && !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId o conversationId es requerido'
      });
    }

    // Generar clave única para esta request
    const requestKey = `${sessionId || conversationId}_${since || 'all'}_${limit}`;
    const now = Date.now();

    // Verificar cache para evitar duplicados
    if (requestCache.has(requestKey)) {
      const cached = requestCache.get(requestKey);
      if (now - cached.timestamp < CACHE_TTL) {
        console.log('📋 Request duplicado evitado:', requestKey);
        return res.status(200).json(cached.data);
      } else {
        requestCache.delete(requestKey);
      }
    }

    console.log('📄 Cargando mensajes únicos:', { 
      sessionId: sessionId?.substring(0, 20) + '...', 
      conversationId, 
      since: since ? 'incremental' : 'completo',
      requestKey
    });

    // Construir consulta base
    let whereClause = 'WHERE m.is_deleted = 0';
    const params = [];

    if (conversationId) {
      whereClause += ' AND m.conversation_id = ?';
      params.push(conversationId);
    } else if (sessionId) {
      whereClause += ' AND m.session_id = ?';
      params.push(sessionId);
    }

    // Filtro por fecha si se especifica (para polling)
    if (since) {
      whereClause += ' AND m.created_at > ?';
      params.push(since);
    }

    // Agregar límite
    const messageLimit = Math.min(parseInt(limit) || 50, 100);
    params.push(messageLimit);

    // Consulta optimizada - SOLO CAMPOS NECESARIOS
    const messages = await query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.session_id,
        m.sender_type,
        m.sender_name,
        m.message_content,
        m.metadata,
        m.is_read,
        m.delivery_status,
        m.is_automated,
        m.bot_confidence,
        m.requires_human,
        m.created_at,
        m.updated_at,
        
        -- Información mínima de conversación
        c.visitor_name,
        c.device_type,
        c.city,
        c.country
        
      FROM chat_messages m
      LEFT JOIN chat_conversations c ON m.conversation_id = c.id
      ${whereClause}
      ORDER BY m.created_at ASC
      LIMIT ?
    `, params);

    // Formatear mensajes con mejor parsing de metadata
    const formattedMessages = messages.map(message => {
      let parsedMetadata = {};
      try {
        parsedMetadata = message.metadata ? JSON.parse(message.metadata) : {};
      } catch (e) {
        console.warn('Error parsing metadata:', e.message);
        parsedMetadata = {};
      }

      const baseMessage = {
        id: message.id,
        conversationId: message.conversation_id,
        sessionId: message.session_id,
        sender: {
          type: message.sender_type,
          name: message.sender_name || getSenderDisplayName(message.sender_type, message.visitor_name),
          avatar: getSenderAvatar(message.sender_type)
        },
        message: {
          type: 'text',
          content: message.message_content
        },
        status: {
          isRead: message.is_read === 1,
          delivery: message.delivery_status,
          isAutomated: message.is_automated === 1
        },
        timestamps: {
          created: message.created_at,
          updated: message.updated_at
        }
      };

      // Información de IA solo si es bot - CON MEJOR PARSING
      if (message.sender_type === 'bot') {
        baseMessage.ai = {
          // Convertir confidence a número si viene como string
          confidence: parseFloat(message.bot_confidence) || 0,
          requiresHuman: message.requires_human === 1,
          
          // Parsear campos de metadata de forma más robusta
          intent: parsedMetadata.intent || parsedMetadata.intentType || null,
          products: Array.isArray(parsedMetadata.products) ? parsedMetadata.products : [],
          suggestions: Array.isArray(parsedMetadata.suggestions) ? parsedMetadata.suggestions : [],
          
          // Información de calidad mejorada
          quality: {
            isEmergencyResponse: parsedMetadata.fallback === true || parsedMetadata.isEmergency === true,
            isErrorResponse: parsedMetadata.intent === 'system_error' || parsedMetadata.error === true,
            engineVersion: parsedMetadata.engineVersion || parsedMetadata.engine || null,
            processingTime: parsedMetadata.processingTime || null
          },
          
          // Debug info si está disponible
          debug: process.env.NODE_ENV === 'development' ? {
            originalIntent: parsedMetadata.originalIntent,
            entityCount: parsedMetadata.entityCount,
            keywordCount: parsedMetadata.keywordCount,
            sentimentScore: parsedMetadata.sentimentScore
          } : undefined
        };
      }

      return baseMessage;
    });

    // IMPORTANTE: Marcar como leídos SOLO si no es polling (incremental)
    if (messages.length > 0 && !since) {
      try {
        const unreadIds = messages
          .filter(m => m.sender_type !== 'user' && m.is_read === 0)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          // Usar Promise sin await para no bloquear la respuesta
          query(`
            UPDATE chat_messages 
            SET is_read = 1, read_at = NOW() 
            WHERE id IN (${unreadIds.map(() => '?').join(',')})
          `, unreadIds).catch(error => {
            console.log('⚠️ Error actualizando lectura:', error.message);
          });
          
          console.log(`✅ Marcando ${unreadIds.length} mensajes como leídos (async)`);
        }
      } catch (readError) {
        console.log('⚠️ Error en marcado de lectura:', readError.message);
      }
    }

    // Estadísticas mejoradas
    const botMessages = formattedMessages.filter(m => m.sender.type === 'bot');
    const userMessages = formattedMessages.filter(m => m.sender.type === 'user');
    
    // Detectar patrones problemáticos
    const duplicateResponses = botMessages.reduce((acc, msg, index, arr) => {
      if (index > 0 && arr[index-1].message.content === msg.message.content) {
        acc++;
      }
      return acc;
    }, 0);

    const lowConfidenceMessages = botMessages.filter(m => 
      m.ai && m.ai.confidence < 0.3
    ).length;

    const queryStats = {
      totalMessages: formattedMessages.length,
      newMessages: since ? formattedMessages.length : 0,
      hasMore: formattedMessages.length >= messageLimit,
      botMessages: botMessages.length,
      userMessages: userMessages.length,
      
      // Estadísticas de calidad
      quality: {
        duplicateResponses,
        lowConfidenceMessages,
        avgBotConfidence: botMessages.length > 0 ? 
          (botMessages.reduce((sum, m) => sum + (m.ai?.confidence || 0), 0) / botMessages.length).toFixed(2) : 0,
        humanEscalationRate: botMessages.filter(m => m.ai?.requiresHuman).length
      }
    };

    // Respuesta exitosa
    const responseData = {
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          count: formattedMessages.length,
          limit: messageLimit,
          hasMore: queryStats.hasMore,
          since: since || null
        },
        stats: queryStats,
        serverTime: new Date().toISOString()
      },
      message: 'Mensajes obtenidos correctamente'
    };

    // Guardar en cache para evitar duplicados
    requestCache.set(requestKey, {
      data: responseData,
      timestamp: now
    });

    // Limpiar cache viejo
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 5) {
        requestCache.delete(key);
      }
    }

    // Log de advertencias si hay problemas de calidad
    if (duplicateResponses > 0) {
      console.warn(`⚠️ Se detectaron ${duplicateResponses} respuestas duplicadas del bot`);
    }
    
    if (lowConfidenceMessages > 0) {
      console.warn(`⚠️ Se detectaron ${lowConfidenceMessages} mensajes con baja confianza`);
    }

    console.log('✅ Mensajes únicos entregados:', { 
      count: formattedMessages.length,
      isIncremental: !!since,
      qualityIssues: duplicateResponses > 0 || lowConfidenceMessages > 0,
      cached: true
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      data: {
        messages: [],
        pagination: {
          count: 0,
          limit: 0,
          hasMore: false,
          since: null
        },
        stats: {
          totalMessages: 0,
          botMessages: 0,
          userMessages: 0,
          quality: {
            duplicateResponses: 0,
            lowConfidenceMessages: 0,
            avgBotConfidence: 0,
            humanEscalationRate: 0
          }
        }
      },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Funciones auxiliares simplificadas
function getSenderDisplayName(senderType, visitorName = null) {
  switch (senderType) {
    case 'bot':
      return 'Asistente Judaica Breslov';
    case 'agent':
      return 'Especialista';
    case 'user':
      return visitorName || 'Usuario';
    case 'system':
      return 'Sistema';
    default:
      return 'Desconocido';
  }
}

function getSenderAvatar(senderType) {
  switch (senderType) {
    case 'bot':
      return '🕎';
    case 'agent':
      return '👨‍💼';
    case 'user':
      return '👤';
    case 'system':
      return '⚙️';
    default:
      return '❓';
  }
}