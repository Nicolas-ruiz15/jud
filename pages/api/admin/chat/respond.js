// pages/api/admin/chat/respond.js - ADMIN RESPONDE MENSAJE (CORREGIDO Y MEJORADO)
import { query, transaction } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('👨‍💼 Admin Chat Respond API - Versión Mejorada');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      conversationId, 
      sessionId, 
      message, 
      messageType = 'text',
      assignToMe = false,
      closeConversation = false,
      priority = null,
      tags = null,
      visitorContext = null
    } = req.body;

    // VALIDACIÓN MEJORADA - Solo uno de los dos es requerido
    if (!conversationId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId o sessionId es requerido'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message es requerido'
      });
    }

    const adminUser = req.user;
    const messageContent = message.trim();

    console.log('🔄 Admin respondiendo:', { 
      conversationId, 
      sessionId,
      adminId: adminUser.id,
      adminName: adminUser.name,
      messageLength: messageContent.length,
      hasVisitorContext: !!visitorContext
    });

    // USAR TRANSACCIÓN PARA OPERACIONES ATÓMICAS
    const result = await transaction(async (conn) => {
      let finalConversationId = conversationId;
      let finalSessionId = sessionId;
      let conversation = null;

      // PASO 1: Obtener o crear conversación
      if (conversationId) {
        // Verificar conversación existente
        conversation = await conn.queryOne(
          'SELECT * FROM chat_conversations WHERE id = ?',
          [conversationId]
        );

        if (!conversation) {
          throw new Error('Conversación no encontrada');
        }

        finalSessionId = conversation.session_id;
      } else if (sessionId) {
        // Buscar conversación existente por sessionId
        conversation = await conn.queryOne(
          'SELECT * FROM chat_conversations WHERE session_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
          [sessionId]
        );

        if (conversation) {
          finalConversationId = conversation.id;
        } else {
          // CREAR NUEVA CONVERSACIÓN
          console.log('🆕 Creando nueva conversación para sessionId:', sessionId);
          
          // Obtener información del visitante si está disponible
          let visitorInfo = visitorContext || {};
          
          if (!visitorContext) {
            // Intentar obtener info del visitante desde analytics
            try {
              const visitorData = await conn.queryOne(`
                SELECT 
                  rv.user_id,
                  u.name as user_name,
                  u.email as user_email,
                  s.country,
                  s.city,
                  s.device_type,
                  s.browser,
                  s.os,
                  s.ip_address
                FROM analytics_realtime_visitors rv
                LEFT JOIN users u ON rv.user_id = u.id
                LEFT JOIN analytics_sessions s ON rv.session_id = s.id
                WHERE rv.session_id = ?
                ORDER BY rv.last_activity DESC
                LIMIT 1
              `, [sessionId]);

              if (visitorData) {
                visitorInfo = {
                  user_id: visitorData.user_id,
                  visitor_name: visitorData.user_name || 'Visitante Anónimo',
                  visitor_email: visitorData.user_email,
                  country: visitorData.country,
                  city: visitorData.city,
                  device_type: visitorData.device_type,
                  browser: visitorData.browser,
                  os: visitorData.os,
                  ip_address: visitorData.ip_address
                };
              }
            } catch (visitorError) {
              console.log('⚠️ No se pudo obtener info del visitante:', visitorError.message);
            }
          }

          // Crear conversación
          const conversationResult = await conn.query(`
            INSERT INTO chat_conversations (
              session_id, user_id, visitor_name, visitor_email, ip_address,
              device_type, browser, os, country, city, status, priority,
              assigned_to, department, created_at, updated_at, last_message_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'normal', ?, 'sales', NOW(), NOW(), NOW())
          `, [
            sessionId,
            visitorInfo.user_id || null,
            visitorInfo.visitor_name || visitorContext?.user?.name || 'Visitante Anónimo',
            visitorInfo.visitor_email || visitorContext?.user?.email || null,
            visitorInfo.ip_address || visitorContext?.location?.ip || null,
            visitorInfo.device_type || visitorContext?.device?.type || 'desktop',
            visitorInfo.browser || visitorContext?.device?.browser || null,
            visitorInfo.os || visitorContext?.device?.os || null,
            visitorInfo.country || visitorContext?.location?.country || null,
            visitorInfo.city || visitorContext?.location?.city || null,
            assignToMe ? adminUser.id : null
          ]);

          finalConversationId = conversationResult.insertId;
          
          // Obtener la conversación recién creada
          conversation = await conn.queryOne(
            'SELECT * FROM chat_conversations WHERE id = ?',
            [finalConversationId]
          );

          console.log('✅ Nueva conversación creada:', finalConversationId);
        }
      }

      // PASO 2: Auto-asignar conversación si se solicita
      if (assignToMe && (!conversation.assigned_to || conversation.assigned_to !== adminUser.id)) {
        await conn.query(
          'UPDATE chat_conversations SET assigned_to = ?, updated_at = NOW() WHERE id = ?',
          [adminUser.id, finalConversationId]
        );
        
        console.log('👤 Conversación asignada al admin:', adminUser.id);
      }

      // PASO 3: Marcar takeover de admin (desactivar IA automática)
      if (assignToMe) {
        try {
          await conn.query(`
            INSERT INTO chat_conversation_context (
              conversation_id, escalation_requested, conversation_stage,
              admin_takeover, last_admin_interaction, created_at, updated_at
            ) VALUES (?, 1, 'human_takeover', 1, NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE
              escalation_requested = 1,
              conversation_stage = 'human_takeover',
              admin_takeover = 1,
              last_admin_interaction = NOW(),
              updated_at = NOW()
          `, [finalConversationId]);
          
          console.log('✅ Admin takeover marcado en contexto');
        } catch (contextError) {
          console.log('⚠️ Error marcando admin takeover:', contextError.message);
          // No es crítico, continuar
        }
      }

      // PASO 4: Crear mensaje del admin
      const messageResult = await conn.query(`
        INSERT INTO chat_messages (
          conversation_id, session_id, sender_type, sender_id, sender_name, 
          sender_avatar, message_type, message_content, metadata, 
          is_automated, delivery_status, created_at, updated_at
        ) VALUES (?, ?, 'agent', ?, ?, ?, ?, ?, ?, 0, 'sent', NOW(), NOW())
      `, [
        finalConversationId,
        finalSessionId,
        adminUser.id,
        adminUser.name,
        null, // avatar - se puede personalizar después
        messageType,
        messageContent,
        JSON.stringify({
          admin_response: true,
          admin_id: adminUser.id,
          admin_name: adminUser.name,
          response_method: 'manual',
          client_context: visitorContext ? 'with_visitor_context' : 'conversation_only'
        })
      ]);

      const messageId = messageResult.insertId;

      // PASO 5: Calcular tiempo de respuesta si es la primera respuesta
      let responseTime = null;
      let isFirstResponse = false;
      
      if (!conversation.first_response_at) {
        const responseTimeResult = await conn.queryOne(`
          SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) as response_seconds
          FROM chat_conversations
          WHERE id = ?
        `, [finalConversationId]);
        
        responseTime = responseTimeResult?.response_seconds || 0;
        isFirstResponse = true;

        // Actualizar first_response_at
        await conn.query(`
          UPDATE chat_conversations 
          SET first_response_at = NOW(), 
              response_time_avg = ?
          WHERE id = ?
        `, [responseTime, finalConversationId]);
      }

      // PASO 6: Actualizar conversación
      const updateFields = [
        'message_count = message_count + 1',
        'last_message_at = NOW()',
        'updated_at = NOW()'
      ];
      const updateParams = [];

      // Cambiar prioridad si se especifica
      if (priority && priority !== conversation.priority) {
        updateFields.push('priority = ?');
        updateParams.push(priority);
      }

      // Agregar tags si se especifican
      if (tags && Array.isArray(tags)) {
        updateFields.push('tags = ?');
        updateParams.push(JSON.stringify(tags));
      }

      // Cerrar conversación si se solicita
      if (closeConversation) {
        updateFields.push('status = "closed"', 'closed_at = NOW()');
        
        // Calcular duración total
        await conn.query(`
          UPDATE chat_conversations 
          SET duration_minutes = TIMESTAMPDIFF(MINUTE, created_at, NOW())
          WHERE id = ?
        `, [finalConversationId]);
      }

      updateParams.push(finalConversationId);

      await conn.query(`
        UPDATE chat_conversations 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateParams);

      // PASO 7: Marcar mensajes anteriores del usuario como leídos
      const readResult = await conn.query(`
        UPDATE chat_messages 
        SET is_read = 1, read_at = NOW() 
        WHERE conversation_id = ? 
          AND sender_type = 'user' 
          AND is_read = 0
      `, [finalConversationId]);

      console.log(`📖 Marcados ${readResult.affectedRows} mensajes como leídos`);

      // PASO 8: Registrar evento en analytics
      try {
        await conn.query(`
          INSERT INTO analytics_events (
            session_id, event_type, event_category, event_action,
            event_label, metadata, created_at
          ) VALUES (?, 'chat', 'admin_action', 'admin_response', 'agent_message', ?, NOW())
        `, [
          finalSessionId, 
          JSON.stringify({ 
            conversation_id: finalConversationId, 
            admin_id: adminUser.id,
            response_time: responseTime,
            message_length: messageContent.length,
            is_first_response: isFirstResponse,
            has_visitor_context: !!visitorContext
          })
        ]);
      } catch (analyticsError) {
        console.log('⚠️ Analytics error:', analyticsError.message);
      }

      // PASO 9: Crear notificación para el visitante (opcional)
      try {
        await conn.query(`
          INSERT INTO chat_notifications (
            conversation_id, notification_type, channel, recipient,
            subject, message, template_data, status, created_at
          ) VALUES (?, 'new_message', 'push', ?, 'Nuevo mensaje del especialista', ?, ?, 'pending', NOW())
        `, [
          finalConversationId,
          finalSessionId,
          `${adminUser.name}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
          JSON.stringify({
            admin_name: adminUser.name,
            message_preview: messageContent.substring(0, 200),
            conversation_id: finalConversationId,
            notification_type: 'admin_response'
          })
        ]);
      } catch (notificationError) {
        console.log('⚠️ Notification error:', notificationError.message);
      }

      // Retornar datos de la transacción
      return {
        messageId,
        conversationId: finalConversationId,
        sessionId: finalSessionId,
        responseTime,
        isFirstResponse,
        messagesMarkedAsRead: readResult.affectedRows,
        conversationStatus: closeConversation ? 'closed' : conversation.status
      };
    });

    console.log('✅ Admin message sent successfully:', { 
      messageId: result.messageId, 
      conversationId: result.conversationId, 
      responseTime: result.responseTime ? `${result.responseTime}s` : null,
      closed: result.conversationStatus === 'closed',
      isFirstResponse: result.isFirstResponse
    });

    // RESPUESTA EXITOSA MEJORADA
    res.status(200).json({
      success: true,
      data: {
        messageId: result.messageId,
        conversationId: result.conversationId,
        sessionId: result.sessionId,
        message: {
          id: result.messageId,
          content: messageContent,
          senderType: 'agent',
          senderName: adminUser.name,
          timestamp: new Date().toISOString(),
          delivery: 'sent'
        },
        conversation: {
          id: result.conversationId,
          status: result.conversationStatus,
          assignedTo: adminUser.id,
          firstResponse: result.isFirstResponse,
          responseTime: result.responseTime,
          messagesMarkedAsRead: result.messagesMarkedAsRead
        },
        admin: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email
        },
        analytics: {
          isFirstResponse: result.isFirstResponse,
          responseTimeSeconds: result.responseTime,
          totalResponsesSent: 1
        }
      },
      message: result.conversationStatus === 'closed' 
        ? 'Mensaje enviado y conversación cerrada' 
        : 'Mensaje enviado correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending admin message:', error);
    
    // Log detallado para debugging
    const errorId = Math.random().toString(36).substring(7);
    console.error(`Error ID ${errorId}:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      params: { 
        conversationId: req.body.conversationId, 
        sessionId: req.body.sessionId?.substring(0, 10),
        adminId: req.user?.id
      }
    });
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      errorId: errorId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: {
        messageId: null,
        conversationId: req.body.conversationId || null,
        sessionId: req.body.sessionId || null
      }
    });
  }
}

export default adminAuth(handler);