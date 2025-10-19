// pages/api/chat/start.js - CONECTADA AL MOTOR DE CHATBOT
import { query } from '../../../lib/database';
import { getChatbotInstance } from '../../../lib/chatbot/chatbotInstance';

let cachedEngineInfo = null;
let cachedEngineInfoTimestamp = 0;
const ENGINE_INFO_TTL = 60 * 1000; // 60 segundos

// Inicializar el motor del chatbot
async function getChatbotEngine() {
  try {
    return await getChatbotInstance();
  } catch (error) {
    console.error('❌ No se pudo obtener instancia del motor en Start API:', error);
    throw error;
  }
}

async function getEngineMetadata(engine) {
  if (!engine) {
    return { connected: false, version: 'unknown' };
  }

  const now = Date.now();
  if (cachedEngineInfo && (now - cachedEngineInfoTimestamp) < ENGINE_INFO_TTL) {
    return cachedEngineInfo;
  }

  let version = engine.constructor?.name || 'UltraMasterJudaicaChatbot';
  try {
    const info = typeof engine.getSystemInfo === 'function'
      ? await engine.getSystemInfo()
      : null;

    if (info) {
      version = info.systemName || version;
      cachedEngineInfo = {
        connected: info.isInitialized !== false,
        version,
        health: info.health,
        database: info.database || null,
      };
    } else {
      cachedEngineInfo = {
        connected: true,
        version,
        database: info?.database || null
      };
    }
  } catch (error) {
    console.warn('⚠️ No se pudo obtener metadata del motor:', error.message);
    cachedEngineInfo = {
      connected: true,
      version,
      database: null
    };
  }

  cachedEngineInfoTimestamp = now;
  return cachedEngineInfo;
}

// Función para generar session_id único y seguro
function generateSessionId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${randomPart}`;
}

// Función para obtener IP real del cliente
function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] || // Cloudflare
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         '127.0.0.1';
}

// Función para detectar dispositivo
function detectDevice(userAgent) {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  return 'desktop';
}

// Función para detectar navegador
function detectBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  
  return 'Other';
}

export default async function handler(req, res) {
  console.log('🚀 Chat Start API - CONECTADA AL MOTOR');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      userId = null, 
      visitorName = null, 
      visitorEmail = null,
      visitorPhone = null,
      landingPage = null,
      currentPage = null,
      referrer = null,
      utmSource = null,
      utmMedium = null,
      utmCampaign = null,
      existingSessionId = null
    } = req.body;

    // Información de la request
    const ip = getRealIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);

    console.log('🔍 Iniciando chat conectado:', { 
      existingSessionId: existingSessionId?.substring(0, 20) + '...',
      deviceType, 
      browser,
      ip: ip.substring(0, 8) + '...'
    });

    // BUSCAR CONVERSACIÓN EXISTENTE ACTIVA
    let existingConversation = null;
    
    if (existingSessionId) {
      // Buscar por session_id específico
      const conversations = await query(`
        SELECT id, session_id, created_at, message_count, last_message_at
        FROM chat_conversations 
        WHERE session_id = ? AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [existingSessionId]);
      
      if (conversations.length > 0) {
        existingConversation = conversations[0];
      }
    } else {
      // Buscar conversación reciente para esta IP (últimos 30 minutos)
      const recentConversations = await query(`
        SELECT id, session_id, created_at, message_count, last_message_at
        FROM chat_conversations 
        WHERE ip_address = ? 
          AND status = 'active' 
          AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY created_at DESC 
        LIMIT 1
      `, [ip]);
      
      if (recentConversations.length > 0) {
        const recent = recentConversations[0];
        const timeDiff = Date.now() - new Date(recent.created_at).getTime();
        
        // Si es menos de 10 minutos, reusar la conversación
        if (timeDiff < 10 * 60 * 1000) {
          existingConversation = recent;
        }
      }
    }

    // Si existe conversación activa, reanudarla
    if (existingConversation) {
      console.log('♻️ Reanudando conversación existente:', existingConversation.session_id);
      
      // Actualizar información de la conversación existente
      await query(`
        UPDATE chat_conversations 
        SET current_page = ?, 
            referrer = ?,
            last_message_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [currentPage || landingPage, referrer, existingConversation.id]);

      // MENSAJE DE BIENVENIDA CONECTADO AL MOTOR
      let welcomeMessage = "Shalom. Bienvenido de vuelta a Judaica Breslov Colombia.";
      
      try {
        // Usar el motor para generar mensaje de bienvenida personalizado
        const engine = await getChatbotEngine();
        const welcomeContext = {
          intent: { type: 'greeting', confidence: 1.0 },
          searchResults: [],
          conversationContext: {
            isReturning: true,
            messageCount: existingConversation.message_count,
            deviceType,
            browser
          }
        };
        
        const welcomeResponse = await engine.processMessage(
          'hola', 
          existingConversation.id, 
          existingConversation.session_id, 
          welcomeContext
        );
        
        if (welcomeResponse.success) {
          welcomeMessage = welcomeResponse.response;
        }
      } catch (engineError) {
        console.log('⚠️ Error generando bienvenida con motor:', engineError.message);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          conversationId: existingConversation.id,
          sessionId: existingConversation.session_id,
          welcomeMessage,
          status: 'active',
          existing: true,
          messageCount: existingConversation.message_count,
          lastActivity: existingConversation.last_message_at,
          timestamp: new Date().toISOString()
        },
        message: 'Conversación reanudada con motor conectado'
      });
    }

    // CREAR NUEVA CONVERSACIÓN
    const sessionId = generateSessionId();
    
    console.log('🆕 Creando nueva conversación con motor:', sessionId.substring(0, 20) + '...');

    const conversationResult = await query(`
      INSERT INTO chat_conversations (
        session_id, user_id, visitor_name, visitor_email, visitor_phone,
        ip_address, user_agent, device_type, browser,
        country, city, timezone,
        landing_page, current_page, referrer, 
        utm_source, utm_medium, utm_campaign, 
        status, priority, department, message_count, 
        created_at, updated_at, last_message_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Colombia', 'Bogotá', 'America/Bogota', ?, ?, ?, ?, ?, ?, 'active', 'normal', 'sales', 0, NOW(), NOW(), NOW())
    `, [
      sessionId, userId, visitorName, visitorEmail, visitorPhone,
      ip, userAgent, deviceType, browser,
      landingPage, currentPage, referrer,
      utmSource, utmMedium, utmCampaign
    ]);

    const conversationId = conversationResult.insertId;

    // Registrar visitante en tiempo real si la tabla existe
    try {
      const realtimeTableExists = await query("SHOW TABLES LIKE 'analytics_realtime_visitors'");
      if (realtimeTableExists.length > 0) {
        await query(`
          INSERT INTO analytics_realtime_visitors (
            session_id, user_id, current_page_url, current_page_title,
            current_page_path, device_type, country, city, referrer,
            last_activity, session_start, page_views, pages_visited
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 1)
          ON DUPLICATE KEY UPDATE
            last_activity = NOW(),
            current_page_url = VALUES(current_page_url),
            page_views = page_views + 1
        `, [
          sessionId, userId, currentPage || landingPage || 'https://judaicabreslovcolombia.com/chat', 
          'Chat en Vivo - Judaica Breslov', 
          currentPage || landingPage || '/chat',
          deviceType, 'CO', 'Bogotá', referrer
        ]);
        
        console.log('✅ Visitante registrado en tiempo real');
      }
    } catch (realtimeError) {
      console.warn('⚠️ No se pudo registrar visitante en tiempo real:', realtimeError.message);
    }

    // Crear contexto de conversación para IA
    try {
      const contextTableExists = await query("SHOW TABLES LIKE 'chat_conversation_context'");
      if (contextTableExists.length > 0) {
        await query(`
          INSERT INTO chat_conversation_context (
            conversation_id, session_id, conversation_stage, 
            intent_history, user_preferences, products_mentioned,
            created_at, updated_at
          ) VALUES (?, ?, 'greeting', '[]', '{}', '[]', NOW(), NOW())
        `, [conversationId, sessionId]);
        
        console.log('✅ Contexto IA creado');
      }
    } catch (contextError) {
      console.warn('⚠️ No se pudo crear contexto IA:', contextError.message);
    }

    // GENERAR MENSAJE DE BIENVENIDA CON EL MOTOR
    let welcomeMessage = `Shalom. Bienvenido a Judaica Breslov Colombia.

¿En qué podemos orientarle espiritualmente hoy?

Para consultas rápidas: https://wa.me/573009291156`;
    
    let engine = null;
    try {
      // Usar el motor para generar mensaje de bienvenida inteligente
      engine = await getChatbotEngine();
      const welcomeContext = {
        intent: { type: 'greeting', confidence: 1.0 },
        searchResults: [],
        conversationContext: {
          isNew: true,
          deviceType,
          browser,
          landingPage,
          referrer
        }
      };
      
      console.log('🤖 Generando bienvenida con motor...');
      const welcomeResponse = await engine.processMessage(
        'hola', 
        conversationId, 
        sessionId, 
        welcomeContext
      );
      
      if (welcomeResponse.success && welcomeResponse.response) {
        welcomeMessage = welcomeResponse.response;
        console.log('✅ Bienvenida generada por motor');
      } else {
        console.log('⚠️ Motor no generó bienvenida, usando predeterminada');
      }
    } catch (engineError) {
      console.error('❌ Error generando bienvenida con motor:', engineError.message);
    }

    // CREAR MENSAJE DE BIENVENIDA EN BD
    const messageResult = await query(`
      INSERT INTO chat_messages (
        conversation_id, session_id, sender_type, sender_name, 
        message_type, message_content, metadata, is_automated,
        delivery_status, created_at, updated_at
      ) VALUES (?, ?, 'bot', 'Asistente Judaica Breslov', 'text', ?, ?, 1, 'sent', NOW(), NOW())
    `, [
      conversationId, 
      sessionId, 
      welcomeMessage,
      JSON.stringify({ 
        welcome: true, 
        auto_generated: true,
        generated_by_engine: true,
        device_type: deviceType,
        browser: browser,
        version: 'v2.0-motor-conectado'
      })
    ]);

    // Actualizar contador de mensajes
    await query(
      'UPDATE chat_conversations SET message_count = 1, last_message_at = NOW() WHERE id = ?',
      [conversationId]
    );

    // Registrar en analytics si existe
    try {
      const analyticsExists = await query("SHOW TABLES LIKE 'chat_analytics'");
      if (analyticsExists.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        
        await query(`
          INSERT INTO chat_analytics (
            date, hour, new_conversations, total_messages, 
            mobile_conversations, desktop_conversations, tablet_conversations,
            created_at, updated_at
          ) VALUES (?, ?, 1, 1, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            new_conversations = new_conversations + 1,
            total_messages = total_messages + 1,
            mobile_conversations = mobile_conversations + ?,
            desktop_conversations = desktop_conversations + ?,
            tablet_conversations = tablet_conversations + ?,
            updated_at = NOW()
        `, [
          today, currentHour,
          deviceType === 'mobile' ? 1 : 0,
          deviceType === 'desktop' ? 1 : 0,
          deviceType === 'tablet' ? 1 : 0,
          deviceType === 'mobile' ? 1 : 0,
          deviceType === 'desktop' ? 1 : 0,
          deviceType === 'tablet' ? 1 : 0
        ]);
      }
    } catch (analyticsError) {
      console.warn('⚠️ Chat analytics no disponible');
    }

    console.log('🎉 CONVERSACIÓN CREADA CON MOTOR:', { 
      conversationId, 
      sessionId: sessionId.substring(0, 20) + '...',
      deviceType,
      browser,
      engineConnected: true
    });

    // RESPUESTA EXITOSA
    const engineInfo = await getEngineMetadata(engine);

    res.status(200).json({
      success: true,
      data: {
        conversationId,
        sessionId,
        welcomeMessage,
        status: 'active',
        existing: false,
        messageCount: 1,
        deviceInfo: {
          type: deviceType,
          browser: browser
        },
        location: {
          country: 'Colombia',
          city: 'Bogotá'
        },
        engineInfo: {
          connected: engineInfo.connected,
          version: engineInfo.version,
          health: engineInfo.health || null,
          database: engineInfo.database || null
        },
        timestamp: new Date().toISOString()
      },
      message: 'Conversación iniciada con motor de IA conectado'
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO iniciando chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Por favor, recarga la página.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      fallback: {
        action: 'reload_page',
        contact: 'WhatsApp: +57 300 929 1156',
        engineStatus: 'disconnected'
      }
    });
  }
}