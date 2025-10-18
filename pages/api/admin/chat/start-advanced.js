// pages/api/admin/chat/start-advanced.js - INICIAR CHAT AVANZADO
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { 
      sessionId, 
      visitorId, 
      visitorName, 
      visitorEmail,
      leadScore,
      pageContext,
      deviceInfo,
      locationInfo
    } = req.body;

    if (!sessionId || !visitorId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId y visitorId son requeridos'
      });
    }

    const adminUser = req.user;
    
    console.log('🚀 Iniciando chat avanzado:', { sessionId, visitorId, leadScore });

    // Verificar si ya existe una conversación activa
    let conversation = await query(
      'SELECT * FROM chat_conversations WHERE session_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    let conversationId;

    if (conversation.length > 0) {
      conversationId = conversation[0].id;
      
      // Actualizar con información adicional
      await query(`
        UPDATE chat_conversations 
        SET 
          assigned_to = ?,
          priority = ?,
          tags = ?,
          metadata = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        adminUser.id,
        leadScore > 80 ? 'high' : leadScore > 60 ? 'medium' : 'normal',
        JSON.stringify(['chat_iniciado_admin', leadScore > 80 ? 'lead_caliente' : 'lead_normal']),
        JSON.stringify({
          leadScore,
          pageContext,
          deviceInfo,
          locationInfo,
          startedBy: 'admin'
        }),
        conversationId
      ]);
    } else {
      // Crear nueva conversación
      const result = await query(`
        INSERT INTO chat_conversations (
          session_id, user_id, visitor_name, visitor_email, ip_address,
          device_type, browser, os, country, city, status, priority,
          assigned_to, department, tags, metadata, created_at, updated_at, last_message_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'sales', ?, ?, NOW(), NOW(), NOW())
      `, [
        sessionId,
        null, // user_id - visitante anónimo
        visitorName,
        visitorEmail,
        locationInfo?.ip || 'unknown',
        deviceInfo?.type || 'desktop',
        deviceInfo?.browser || 'unknown',
        deviceInfo?.os || 'unknown',
        locationInfo?.country || 'unknown',
        locationInfo?.city || 'unknown',
        leadScore > 80 ? 'high' : leadScore > 60 ? 'medium' : 'normal',
        adminUser.id,
        JSON.stringify(['chat_iniciado_admin', leadScore > 80 ? 'lead_caliente' : 'lead_normal']),
        JSON.stringify({
          leadScore,
          pageContext,
          deviceInfo,
          locationInfo,
          startedBy: 'admin'
        })
      ]);

      conversationId = result.insertId;
    }

    // Registrar contexto de conversación
    await query(`
      INSERT INTO chat_conversation_context (
        conversation_id, escalation_requested, conversation_stage,
        admin_takeover, last_admin_interaction, created_at, updated_at
      ) VALUES (?, 0, 'admin_initiated', 1, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        escalation_requested = 0,
        conversation_stage = 'admin_initiated',
        admin_takeover = 1,
        last_admin_interaction = NOW(),
        updated_at = NOW()
    `, [conversationId]);

    // Mensaje de bienvenida automático
    const welcomeMessage = leadScore > 80 
      ? `¡Hola ${visitorName}! Veo que estás muy interesado en nuestros productos. ¿Te puedo ayudar con algo específico?`
      : `¡Hola ${visitorName}! ¿En qué te puedo ayudar hoy?`;

    await query(`
      INSERT INTO chat_messages (
        conversation_id, session_id, sender_type, sender_id, sender_name, 
        message_type, message_content, metadata, is_automated, 
        delivery_status, created_at, updated_at
      ) VALUES (?, ?, 'agent', ?, ?, 'text', ?, ?, 1, 'sent', NOW(), NOW())
    `, [
      conversationId,
      sessionId,
      adminUser.id,
      adminUser.name,
      welcomeMessage,
      JSON.stringify({
        admin_initiated: true,
        lead_score: leadScore,
        context: pageContext
      })
    ]);

    // Registrar evento en analytics
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action,
        event_label, metadata, created_at
      ) VALUES (?, 'chat', 'admin_action', 'chat_started', 'admin_initiated_chat', ?, NOW())
    `, [
      sessionId,
      JSON.stringify({
        conversation_id: conversationId,
        admin_id: adminUser.id,
        lead_score: leadScore,
        page_context: pageContext
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        conversationId,
        sessionId,
        message: 'Chat iniciado correctamente',
        welcomeMessage,
        leadScore,
        priority: leadScore > 80 ? 'high' : leadScore > 60 ? 'medium' : 'normal'
      },
      message: 'Chat avanzado iniciado correctamente'
    });

  } catch (error) {
    console.error('❌ Error iniciando chat avanzado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);