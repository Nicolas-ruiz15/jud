// pages/api/admin/chat/assign.js - ASIGNAR CONVERSACIÓN A ADMIN
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('👤 Admin Chat Assign API called');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      conversationId, 
      assignToUserId = null, // Si es null, se asigna al admin actual
      priority = null,
      department = null,
      tags = null,
      addNote = null
    } = req.body;

    // Validar datos requeridos
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId es requerido'
      });
    }

    const adminUser = req.user; // Viene del middleware adminAuth
    const targetUserId = assignToUserId || adminUser.id;

    console.log('📝 Assigning conversation:', { 
      conversationId, 
      fromAdmin: adminUser.id,
      toAdmin: targetUserId
    });

    // Verificar que la conversación existe
    const conversation = await query(
      'SELECT id, session_id, status, assigned_to, visitor_name FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (conversation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const conv = conversation[0];

    // Verificar que el usuario al que se asigna existe y es admin
    if (assignToUserId) {
      const targetUser = await query(
        'SELECT id, name, email FROM users WHERE id = ? AND role = "admin"',
        [assignToUserId]
      );

      if (targetUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario administrador no encontrado'
        });
      }
    }

    // Preparar campos a actualizar
    const updateFields = ['assigned_to = ?', 'updated_at = NOW()'];
    const updateParams = [targetUserId];

    // Agregar prioridad si se especifica
    if (priority) {
      updateFields.push('priority = ?');
      updateParams.push(priority);
    }

    // Agregar departamento si se especifica
    if (department) {
      updateFields.push('department = ?');
      updateParams.push(department);
    }

    // Agregar tags si se especifican
    if (tags) {
      updateFields.push('tags = ?');
      updateParams.push(JSON.stringify(tags));
    }

    updateParams.push(conversationId);

    // Actualizar conversación
    await query(`
      UPDATE chat_conversations 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    // Agregar nota del sistema si se proporciona
    if (addNote) {
      await query(`
        INSERT INTO chat_messages (
          conversation_id, session_id, sender_type, sender_name, 
          message_type, message_content, metadata, is_automated,
          delivery_status, created_at, updated_at
        ) VALUES (?, ?, 'system', 'Sistema', 'system', ?, ?, 1, 'sent', NOW(), NOW())
      `, [
        conversationId,
        conv.session_id,
        addNote,
        JSON.stringify({
          system_action: 'assignment',
          assigned_by: adminUser.id,
          assigned_to: targetUserId,
          assigned_by_name: adminUser.name
        })
      ]);

      // Actualizar contador de mensajes
      await query(
        'UPDATE chat_conversations SET message_count = message_count + 1 WHERE id = ?',
        [conversationId]
      );
    }

    // Obtener información del usuario asignado para la respuesta
    const assignedUser = await query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [targetUserId]
    );

    // Registrar evento en analytics
    try {
      await query(`
        INSERT INTO analytics_events (
          session_id, event_type, event_category, event_action,
          event_label, metadata, created_at
        ) VALUES (?, 'chat', 'admin_action', 'conversation_assigned', 'assignment', ?, NOW())
      `, [
        conv.session_id,
        JSON.stringify({ 
          conversation_id: conversationId, 
          assigned_by: adminUser.id,
          assigned_to: targetUserId,
          previous_assigned_to: conv.assigned_to
        })
      ]);
    } catch (analyticsError) {
      console.log('⚠️ Analytics error:', analyticsError.message);
    }

    // Crear notificación para el admin asignado (si es diferente al actual)
    if (assignToUserId && assignToUserId !== adminUser.id) {
      try {
        await query(`
          INSERT INTO chat_notifications (
            conversation_id, notification_type, channel, recipient,
            subject, message, template_data, status, created_at
          ) VALUES (?, 'assignment', 'email', ?, 'Nueva conversación asignada', ?, ?, 'pending', NOW())
        `, [
          conversationId,
          assignedUser[0].email,
          `Se te ha asignado una nueva conversación de chat con ${conv.visitor_name || 'un visitante'}.`,
          JSON.stringify({
            assigned_by: adminUser.name,
            conversation_id: conversationId,
            visitor_name: conv.visitor_name
          })
        ]);
      } catch (notificationError) {
        console.log('⚠️ Notification error:', notificationError.message);
      }
    }

    console.log('✅ Conversation assigned successfully:', { 
      conversationId, 
      assignedTo: targetUserId,
      assignedBy: adminUser.id 
    });

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        conversationId,
        assignment: {
          assignedTo: {
            id: assignedUser[0].id,
            name: assignedUser[0].name,
            email: assignedUser[0].email
          },
          assignedBy: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email
          },
          timestamp: new Date().toISOString()
        },
        updates: {
          priority: priority || conv.priority,
          department: department || conv.department,
          tags: tags ? JSON.parse(JSON.stringify(tags)) : null
        }
      },
      message: assignToUserId === adminUser.id ? 
        'Conversación asignada a ti' : 
        `Conversación asignada a ${assignedUser[0].name}`
    });

  } catch (error) {
    console.error('❌ Error assigning conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);