// pages/api/admin/chat/close.js - CERRAR CONVERSACIÓN DE CHAT
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('🔒 Admin Chat Close API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      conversationId, 
      closeReason = 'closed_by_admin',
      finalMessage = null,
      satisfactionRating = null,
      tags = null,
      addToKnowledgeBase = false
    } = req.body;

    // Validar datos requeridos
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId es requerido'
      });
    }

    const adminUser = req.user; // Viene del middleware adminAuth

    console.log('🔒 Closing conversation:', { 
      conversationId, 
      closedBy: adminUser.id,
      reason: closeReason
    });

    // Verificar que la conversación existe y está activa
    const conversation = await query(
      'SELECT id, session_id, status, visitor_name, created_at, message_count FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (conversation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const conv = conversation[0];

    if (conv.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'La conversación ya está cerrada'
      });
    }

    // Calcular duración de la conversación
    const durationResult = await query(`
      SELECT TIMESTAMPDIFF(MINUTE, created_at, NOW()) as duration_minutes
      FROM chat_conversations WHERE id = ?
    `, [conversationId]);

    const durationMinutes = durationResult[0]?.duration_minutes || 0;

    // Enviar mensaje final si se proporciona
    let finalMessageId = null;
    if (finalMessage) {
      const messageResult = await query(`
        INSERT INTO chat_messages (
          conversation_id, session_id, sender_type, sender_id, sender_name, 
          message_type, message_content, metadata, is_automated,
          delivery_status, created_at, updated_at
        ) VALUES (?, ?, 'agent', ?, ?, 'text', ?, ?, 0, 'sent', NOW(), NOW())
      `, [
        conversationId,
        conv.session_id,
        adminUser.id,
        adminUser.name,
        finalMessage,
        JSON.stringify({
          final_message: true,
          admin_id: adminUser.id,
          close_reason: closeReason
        })
      ]);

      finalMessageId = messageResult.insertId;
    }

    // Mensaje del sistema indicando cierre
    await query(`
      INSERT INTO chat_messages (
        conversation_id, session_id, sender_type, sender_name, 
        message_type, message_content, metadata, is_automated,
        delivery_status, created_at, updated_at
      ) VALUES (?, ?, 'system', 'Sistema', 'system', ?, ?, 1, 'sent', NOW(), NOW())
    `, [
      conversationId,
      conv.session_id,
      '🔒 Conversación cerrada por el administrador.',
      JSON.stringify({
        system_action: 'conversation_closed',
        closed_by: adminUser.id,
        closed_by_name: adminUser.name,
        close_reason: closeReason,
        duration_minutes: durationMinutes
      })
    ]);

    // Preparar campos para actualizar
    const updateFields = [
      'status = "closed"',
      'closed_at = NOW()',
      'updated_at = NOW()',
      'duration_minutes = ?'
    ];
    const updateParams = [durationMinutes];

    // Actualizar contador de mensajes
    const messageIncrement = finalMessage ? 2 : 1; // +1 por sistema, +1 por mensaje final si existe
    updateFields.push('message_count = message_count + ?');
    updateParams.push(messageIncrement);

    // Agregar rating de satisfacción si se proporciona
    if (satisfactionRating !== null) {
      updateFields.push('satisfaction_rating = ?');
      updateParams.push(satisfactionRating);
    }

    // Agregar tags si se especifican
    if (tags) {
      updateFields.push('tags = ?');
      updateParams.push(JSON.stringify(tags));
    }

    // Agregar metadata de cierre
    updateFields.push('metadata = ?');
    updateParams.push(JSON.stringify({
      close_reason: closeReason,
      closed_by: adminUser.id,
      closed_by_name: adminUser.name,
      final_message_id: finalMessageId,
      satisfaction_rating: satisfactionRating
    }));

    updateParams.push(conversationId);

    // Cerrar conversación
    await query(`
      UPDATE chat_conversations 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    // Marcar todos los mensajes como leídos
    await query(`
      UPDATE chat_messages 
      SET is_read = 1, read_at = NOW() 
      WHERE conversation_id = ? AND is_read = 0
    `, [conversationId]);

    // Eliminar de visitantes en tiempo real (opcional)
    await query(`
      DELETE FROM analytics_realtime_visitors 
      WHERE session_id = ?
    `, [conv.session_id]);

    // Agregar al knowledge base si se solicita
    if (addToKnowledgeBase && conv.message_count > 2) {
      try {
        // Obtener resumen de la conversación
        const messages = await query(`
          SELECT sender_type, message_content, created_at
          FROM chat_messages 
          WHERE conversation_id = ? 
            AND sender_type IN ('user', 'agent') 
            AND message_type = 'text'
          ORDER BY created_at ASC
        `, [conversationId]);

        if (messages.length > 0) {
          const conversationSummary = messages.map(m => 
            `${m.sender_type === 'user' ? 'Cliente' : 'Agente'}: ${m.message_content}`
          ).join('\n');

          await query(`
            INSERT INTO chat_bot_knowledge (
              category, question, answer, metadata, confidence_score, 
              is_active, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 0.8, 1, ?, NOW(), NOW())
          `, [
            'conversation_summary',
            `Conversación sobre: ${conv.visitor_name || 'consulta general'}`,
            conversationSummary,
            JSON.stringify({
              source_conversation_id: conversationId,
              visitor_name: conv.visitor_name,
              message_count: conv.message_count,
              duration_minutes: durationMinutes,
              satisfaction_rating: satisfactionRating
            }),
            adminUser.id
          ]);
        }
      } catch (knowledgeError) {
        console.log('⚠️ Knowledge base error:', knowledgeError.message);
      }
    }

    // Registrar evento en analytics
    try {
      await query(`
        INSERT INTO analytics_events (
          session_id, event_type, event_category, event_action,
          event_label, value, metadata, created_at
        ) VALUES (?, 'chat', 'admin_action', 'conversation_closed', ?, ?, ?, NOW())
      `, [
        conv.session_id,
        closeReason,
        durationMinutes,
        JSON.stringify({ 
          conversation_id: conversationId, 
          closed_by: adminUser.id,
          duration_minutes: durationMinutes,
          message_count: conv.message_count,
          satisfaction_rating: satisfactionRating
        })
      ]);

      // Registrar conversión si la conversación fue exitosa
      if (satisfactionRating >= 4) {
        await query(`
          INSERT INTO analytics_conversions (
            session_id, conversion_type, conversion_value, metadata, created_at
          ) VALUES (?, 'chat_satisfaction', ?, ?, NOW())
        `, [
          conv.session_id,
          satisfactionRating,
          JSON.stringify({
            conversation_id: conversationId,
            satisfaction_rating: satisfactionRating,
            duration_minutes: durationMinutes
          })
        ]);
      }
    } catch (analyticsError) {
      console.log('⚠️ Analytics error:', analyticsError.message);
    }

    // Crear resumen de conversación
    try {
      await query(`
        INSERT INTO chat_conversations_summary (
          conversation_id, total_messages, duration_minutes, 
          satisfaction_rating, close_reason, summary_text, 
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        conversationId,
        conv.message_count + messageIncrement,
        durationMinutes,
        satisfactionRating,
        closeReason,
        `Conversación con ${conv.visitor_name || 'visitante anónimo'} cerrada por ${adminUser.name}. Duración: ${durationMinutes} minutos.`,
        adminUser.id
      ]);
    } catch (summaryError) {
      console.log('⚠️ Summary error:', summaryError.message);
    }

    console.log('✅ Conversation closed successfully:', { 
      conversationId, 
      durationMinutes,
      messageCount: conv.message_count + messageIncrement,
      satisfactionRating 
    });

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        conversationId,
        closure: {
          closedBy: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email
          },
          reason: closeReason,
          timestamp: new Date().toISOString(),
          durationMinutes,
          finalMessageId
        },
        summary: {
          totalMessages: conv.message_count + messageIncrement,
          durationMinutes,
          satisfactionRating,
          addedToKnowledgeBase: addToKnowledgeBase
        }
      },
      message: 'Conversación cerrada correctamente'
    });

  } catch (error) {
    console.error('❌ Error closing conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);