// pages/api/admin/chat/respond-advanced.js - RESPONDER EN CHAT AVANZADO
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const {
      conversationId,
      message,
      assignToMe = true,
      context,
      messageType = 'text',
      priority = 'normal',
      attachments = []
    } = req.body;

    if (!conversationId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'conversationId y message son requeridos'
      });
    }

    const adminUser = req.user;
    const messageContent = message.trim();

    console.log('💬 Respuesta avanzada:', { conversationId, adminId: adminUser.id, priority });

    // Obtener información de la conversación
    const conversation = await query(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversation.length) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const conv = conversation[0];

    // Asignar conversación al admin si se solicita
    if (assignToMe && conv.assigned_to !== adminUser.id) {
      await query(
        'UPDATE chat_conversations SET assigned_to = ?, updated_at = NOW() WHERE id = ?',
        [adminUser.id, conversationId]
      );
    }

    // Insertar mensaje
    const messageResult = await query(`
      INSERT INTO chat_messages (
        conversation_id, session_id, sender_type, sender_id, sender_name, 
        sender_avatar, message_type, message_content, metadata, 
        is_automated, delivery_status, created_at, updated_at
      ) VALUES (?, ?, 'agent', ?, ?, ?, ?, ?, ?, 0, 'sent', NOW(), NOW())
    `, [
      conversationId,
      conv.session_id,
      adminUser.id,
      adminUser.name,
      null,
      messageType,
      messageContent,
      JSON.stringify({
        admin_response: true,
        priority,
        context,
        attachments,
        response_time: new Date()
      })
    ]);

    const messageId = messageResult.insertId;

    // Calcular tiempo de respuesta si es la primera respuesta
    let responseTime = null;
    let isFirstResponse = false;
    
    if (!conv.first_response_at) {
      const responseTimeResult = await query(`
        SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) as response_seconds
        FROM chat_conversations
        WHERE id = ?
      `, [conversationId]);
      
      responseTime = responseTimeResult?.[0]?.response_seconds || 0;
      isFirstResponse = true;

      await query(`
        UPDATE chat_conversations 
        SET first_response_at = NOW(), 
            response_time_avg = ?
        WHERE id = ?
      `, [responseTime, conversationId]);
    }

    // Actualizar conversación
    await query(`
      UPDATE chat_conversations 
      SET 
        message_count = message_count + 1,
        last_message_at = NOW(),
        priority = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [priority, conversationId]);

    // Marcar mensajes del usuario como leídos
    const readResult = await query(`
      UPDATE chat_messages 
      SET is_read = 1, read_at = NOW() 
      WHERE conversation_id = ? 
        AND sender_type = 'user' 
        AND is_read = 0
    `, [conversationId]);

    // Registrar analytics
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action,
        event_label, metadata, created_at
      ) VALUES (?, 'chat', 'admin_action', 'admin_response', 'advanced_response', ?, NOW())
    `, [
      conv.session_id,
      JSON.stringify({
        conversation_id: conversationId,
        admin_id: adminUser.id,
        response_time: responseTime,
        priority,
        is_first_response: isFirstResponse,
        message_length: messageContent.length
      })
    ]);

    // Crear notificación para el visitante
    await query(`
      INSERT INTO chat_notifications (
        conversation_id, notification_type, channel, recipient,
        subject, message, template_data, status, created_at
      ) VALUES (?, 'new_message', 'push', ?, 'Nuevo mensaje', ?, ?, 'pending', NOW())
    `, [
      conversationId,
      conv.session_id,
      `${adminUser.name}: ${messageContent.substring(0, 100)}`,
      JSON.stringify({
        admin_name: adminUser.name,
        message_preview: messageContent.substring(0, 200),
        priority,
        conversation_id: conversationId
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        messageId,
        conversationId,
        message: {
          id: messageId,
          content: messageContent,
          senderType: 'agent',
          senderName: adminUser.name,
          timestamp: new Date().toISOString(),
          priority,
          isFirstResponse
        },
        responseTime,
        messagesMarkedAsRead: readResult.affectedRows,
        analytics: {
          isFirstResponse,
          responseTimeSeconds: responseTime
        }
      },
      message: 'Respuesta enviada correctamente'
    });

  } catch (error) {
    console.error('❌ Error enviando respuesta avanzada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);