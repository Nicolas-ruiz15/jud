// pages/api/chat/send.js - COMPATIBLE CON ULTRA MASTER JUDAICA ENGINE

import { getChatbotInstance } from '../../../lib/chatbot/chatbotInstance';
import { query } from '../../../lib/database';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido',
      success: false 
    });
  }

  const startTime = Date.now();
  let chatbotInstance = null;

  try {
    console.log('🔨 Nueva solicitud de chat con Ultra Master Engine');

    const { 
      message, 
      sessionId, 
      conversationId,
      userInfo = {},
      context = {}
    } = req.body;

    // Validaciones básicas
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Mensaje requerido',
        success: false
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Mensaje demasiado largo (máximo 1000 caracteres)',
        success: false
      });
    }

    const finalSessionId = sessionId || `session_${uuidv4()}`;
    const finalConversationId = conversationId || `conv_${uuidv4()}`;

    console.log(`💬 Procesando: "${message.substring(0, 50)}..." (Sesión: ${finalSessionId.substring(0, 20)})`);

    // Obtener instancia del Ultra Master Chatbot
    try {
      chatbotInstance = await getChatbotInstance();
      console.log('✅ Ultra Master Engine obtenido');
      
      // Verificar que la instancia tiene el método correcto
      if (!chatbotInstance || typeof chatbotInstance.processMessage !== 'function') {
        throw new Error('Instancia del chatbot no válida o sin método processMessage');
      }
      
    } catch (chatbotError) {
      console.error('❌ Error obteniendo Ultra Master Engine:', chatbotError);
      return res.status(503).json({
        error: 'Ultra Master Engine no disponible temporalmente',
        success: false,
        fallbackResponse: {
          text: `Disculpa, nuestro Ultra Master Engine está inicializando.

**Para asistencia inmediata:**
📱 WhatsApp: https://wa.me/573009291156
🌐 Tienda: https://www.judaicabreslovcolombia.com

Por favor intenta nuevamente en unos segundos.`,
          suggestions: ['Reintentar', 'WhatsApp directo', 'Ver tienda'],
          requiresHuman: true
        }
      });
    }

    // Preparar contexto enriquecido para Ultra Master Engine
    const enhancedUserContext = {
      ...userInfo,
      sessionId: finalSessionId,
      conversationId: finalConversationId,
      requestContext: {
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
        ...context
      }
    };

    console.log('🚀 Enviando al Ultra Master Engine...');

    // Procesar mensaje con Ultra Master Engine
    let ultraResponse;
    try {
      // Llamada al método processMessage del Ultra Master Engine
      ultraResponse = await chatbotInstance.processMessage(
        message.trim(),
        finalConversationId,
        finalSessionId,
        enhancedUserContext
      );

      console.log('🤖 Ultra Master Engine respondió exitosamente');
      console.log(`📊 Intent: ${ultraResponse.intent}, Confianza: ${ultraResponse.confidence}`);

    } catch (processingError) {
      console.error('❌ Error en Ultra Master Engine:', processingError);
      
      // Respuesta de fallback manteniendo el formato esperado
      ultraResponse = {
        success: false,
        response: `Disculpa, hay un problema temporal en el Ultra Master Engine.

**Asistencia directa:**
📱 WhatsApp: https://wa.me/573009291156
🌐 https://www.judaicabreslovcolombia.com

¿Puedes reformular tu consulta?`,
        intent: 'processing_error',
        confidence: 0,
        requiresHuman: true,
        suggestions: ['Reformular pregunta', 'WhatsApp directo', 'Ver tienda'],
        products: [],
        metadata: {
          fallback: true,
          error: processingError.message,
          engineStatus: 'error'
        }
      };
    }

    // Validar y normalizar respuesta del Ultra Master Engine
    const normalizedResponse = normalizeUltraResponse(ultraResponse);
    const sessionStats = typeof chatbotInstance.getSessionStats === 'function'
      ? chatbotInstance.getSessionStats(finalSessionId)
      : null;

    if (sessionStats?.databaseStatus && !normalizedResponse.metadata?.databaseStatus) {
      normalizedResponse.metadata = {
        ...(normalizedResponse.metadata || {}),
        databaseStatus: sessionStats.databaseStatus
      };
    }

    const processingTime = Date.now() - startTime;

    console.log(`✅ Solicitud completada en ${processingTime}ms`);

    // Respuesta en el formato esperado por el frontend
    return res.status(200).json({
      success: normalizedResponse.success,
      response: {
        text: normalizedResponse.response || normalizedResponse.text,
        intent: normalizedResponse.intent || 'unknown',
        confidence: normalizedResponse.confidence || 0,
        requiresHuman: normalizedResponse.requiresHuman || false,
        suggestions: normalizedResponse.suggestions || [],
        products: normalizedResponse.products || [],
        metadata: {
          ...(normalizedResponse.metadata || {}),
          processingTime,
          sessionId: finalSessionId,
          conversationId: finalConversationId,
          timestamp: new Date().toISOString(),
          ultraMasterEngine: true,
          engineVersion: 'ultra-master-v2.0'
        }
      },
      context: {
        sessionId: finalSessionId,
        conversationId: finalConversationId,
        lastIntent: normalizedResponse.intent,
        messageCount: sessionStats?.messageCount || normalizedResponse.metadata?.messageCount || 1
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error crítico en API con Ultra Master Engine:', error);

    // Log del error crítico
    try {
      await logCriticalError(error, req.body, processingTime);
    } catch (logError) {
      console.error('❌ No se pudo guardar el error en BD:', logError);
    }

    return res.status(500).json({
      error: 'Error interno del Ultra Master Engine',
      success: false,
      fallbackResponse: {
        text: `Error crítico del Ultra Master Engine.

**Contacto directo:**
📱 WhatsApp: https://wa.me/573009291156
🌐 Tienda: https://www.judaicabreslovcolombia.com

Nuestros especialistas te ayudarán inmediatamente.`,
        suggestions: ['WhatsApp directo', 'Ver tienda', 'Reintentar'],
        requiresHuman: true
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        errorType: error.name || 'UnknownError',
        ultraMasterEngineError: true
      }
    });
  }
}

// Función para normalizar la respuesta del Ultra Master Engine
function normalizeUltraResponse(ultraResponse) {
  // Si ya viene en el formato correcto
  if (ultraResponse && typeof ultraResponse === 'object') {
    
    // El Ultra Master Engine devuelve en este formato según engine (15).js:
    // {
    //   success: true,
    //   response: response.text,
    //   intent: intent.type,
    //   confidence: intent.confidence,
    //   requiresHuman: response.requiresHuman || false,
    //   suggestions: response.suggestions || [],
    //   products: searchResults || [],
    //   metadata: { ... }
    // }
    
    return {
      success: ultraResponse.success !== false,
      response: ultraResponse.response || ultraResponse.text,
      text: ultraResponse.response || ultraResponse.text,
      intent: ultraResponse.intent || 'unknown',
      confidence: ultraResponse.confidence || 0,
      requiresHuman: ultraResponse.requiresHuman || false,
      suggestions: Array.isArray(ultraResponse.suggestions) ? ultraResponse.suggestions : [],
      products: Array.isArray(ultraResponse.products) ? ultraResponse.products : [],
      metadata: ultraResponse.metadata || {}
    };
  }

  // Fallback si la respuesta no es válida
  console.warn('⚠️ Respuesta del Ultra Master Engine no válida:', ultraResponse);
  
  return {
    success: false,
    response: `Error en la respuesta del Ultra Master Engine.

**Asistencia directa:**
📱 WhatsApp: https://wa.me/573009291156
🌐 https://www.judaicabreslovcolombia.com`,
    text: 'Error del sistema',
    intent: 'system_error',
    confidence: 0,
    requiresHuman: true,
    suggestions: ['WhatsApp directo', 'Ver tienda'],
    products: [],
    metadata: {
      normalizationError: true,
      originalResponse: ultraResponse
    }
  };
}

// Función para log de errores críticos (mantenida de tu versión original)
async function logCriticalError(error, requestData, processingTime) {
  try {
    const tableExists = await query("SHOW TABLES LIKE 'chat_critical_errors'");
    if (tableExists.length === 0) {
      console.warn('⚠️ Tabla chat_critical_errors no existe');
      return;
    }

    await query(`
      INSERT INTO chat_critical_errors 
      (error_message, error_stack, request_data, processing_time, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, [
      error.message,
      error.stack,
      JSON.stringify(requestData),
      processingTime
    ]);
  } catch (logError) {
    console.error('❌ Error guardando log crítico:', logError);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};