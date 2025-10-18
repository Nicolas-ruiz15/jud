// pages/api/admin/automations/trigger.js - EJECUTAR AUTOMATIZACIÓN
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function triggerHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { automationId, visitorId, context = {} } = req.body;

    if (!automationId || !visitorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'automationId y visitorId son requeridos' 
      });
    }

    console.log('🤖 Ejecutando automatización:', { automationId, visitorId });

    // Obtener la automatización
    const automation = await query(
      'SELECT * FROM automation_rules WHERE id = ? AND is_active = 1',
      [automationId]
    );

    if (automation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Automatización no encontrada o inactiva'
      });
    }

    const rule = automation[0];
    const actions = JSON.parse(rule.actions || '{}');

    // Registrar ejecución
    const executionResult = await query(`
      INSERT INTO automation_executions (
        rule_id, visitor_id, context, status, executed_at, created_at
      ) VALUES (?, ?, ?, 'executing', NOW(), NOW())
    `, [automationId, visitorId, JSON.stringify(context)]);

    const executionId = executionResult.insertId;

    // Ejecutar la acción
    let success = false;
    let result = {};

    switch (actions.type) {
      case 'send_message':
        result = await sendAutomaticMessage(visitorId, actions.message, context);
        success = result.success;
        break;
        
      case 'send_notification':
        result = await sendNotification(visitorId, actions.message, context);
        success = result.success;
        break;
        
      case 'assign_agent':
        result = await assignToAgent(visitorId, actions.agentId || null, context);
        success = result.success;
        break;
        
      case 'show_offer':
        result = await showOffer(visitorId, actions.offerId || null, context);
        success = result.success;
        break;
        
      default:
        result = { message: 'Tipo de acción no soportado' };
        success = false;
    }

    // Actualizar estado de ejecución
    await query(`
      UPDATE automation_executions 
      SET status = ?, success = ?, result = ?, completed_at = NOW()
      WHERE id = ?
    `, [success ? 'completed' : 'failed', success ? 1 : 0, JSON.stringify(result), executionId]);

    console.log(success ? '✅' : '❌', 'Automatización ejecutada:', rule.name);

    res.status(200).json({
      success: true,
      data: {
        executionId,
        automationName: rule.name,
        action: actions.type,
        result,
        executed: success
      },
      message: `Automatización ${success ? 'ejecutada correctamente' : 'falló'}`
    });

  } catch (error) {
    console.error('❌ Error ejecutando automatización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Funciones auxiliares para ejecutar acciones
async function sendAutomaticMessage(visitorId, message, context) {
  try {
    // Buscar conversación activa o crear una nueva
    let conversation = await query(
      'SELECT id FROM chat_conversations WHERE session_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [context.sessionId || visitorId]
    );

    let conversationId;
    if (conversation.length > 0) {
      conversationId = conversation[0].id;
    } else {
      // Crear nueva conversación
      const newConv = await query(`
        INSERT INTO chat_conversations (
          session_id, visitor_name, status, department, created_at, updated_at
        ) VALUES (?, 'Visitante Automático', 'active', 'automation', NOW(), NOW())
      `, [context.sessionId || visitorId]);
      conversationId = newConv.insertId;
    }

    // Enviar mensaje automático
    await query(`
      INSERT INTO chat_messages (
        conversation_id, sender_type, sender_name, message_content, 
        is_automated, created_at, updated_at
      ) VALUES (?, 'agent', 'Sistema Automático', ?, 1, NOW(), NOW())
    `, [conversationId, message]);

    return { success: true, conversationId, message: 'Mensaje enviado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendNotification(visitorId, message, context) {
  try {
    await query(`
      INSERT INTO admin_notifications (
        title, message, type, data, created_at
      ) VALUES ('Automatización', ?, 'automation', ?, NOW())
    `, [message, JSON.stringify({ visitorId, context })]);

    return { success: true, message: 'Notificación enviada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function assignToAgent(visitorId, agentId, context) {
  try {
    // Buscar conversación y asignar a agente
    await query(`
      UPDATE chat_conversations 
      SET assigned_to = ?, updated_at = NOW()
      WHERE session_id = ? AND status = 'active'
    `, [agentId || 1, context.sessionId || visitorId]);

    return { success: true, message: 'Asignado a agente' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function showOffer(visitorId, offerId, context) {
  try {
    // Registrar oferta mostrada
    await query(`
      INSERT INTO automation_popups (
        session_id, popup_type, content, shown_at, created_at
      ) VALUES (?, 'offer', ?, NOW(), NOW())
    `, [context.sessionId || visitorId, JSON.stringify({ offerId, message: 'Oferta especial' })]);

    return { success: true, message: 'Oferta mostrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default adminAuth(triggerHandler);