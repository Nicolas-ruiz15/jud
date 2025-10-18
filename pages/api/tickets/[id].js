// pages/api/tickets/[id].js
// API de ticket individual actualizada con nuevo servicio de email

import { query, queryOne, transaction } from '../../../lib/database';
import { 
  sendTicketResponseEmail, 
  sendTicketResolvedEmail 
} from '../../../lib/emailService';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      return await getTicket(req, res, id);
    } else if (req.method === 'PUT') {
      return await updateTicket(req, res, id);
    } else if (req.method === 'DELETE') {
      return await deleteTicket(req, res, id);
    } else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }
  } catch (error) {
    console.error('Error en API ticket individual:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - Obtener ticket específico con historial completo
async function getTicket(req, res, ticketId) {
  try {
    // Obtener información del ticket
    const ticket = await query(`
      SELECT 
        st.*,
        tm.first_response_time,
        tm.resolution_time,
        tm.customer_satisfaction,
        tm.number_of_responses,
        tm.number_of_escalations,
        tm.was_reopened,
        u.name as assigned_to_name,
        u.email as assigned_to_email
      FROM support_tickets st
      LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
      LEFT JOIN users u ON st.assigned_to = u.id
      WHERE st.id = ? OR st.ticket_number = ?
    `, [ticketId, ticketId]);

    if (ticket.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    const ticketData = ticket[0];

    // Obtener historial de respuestas
    const responses = await query(`
      SELECT 
        tr.*,
        CASE 
          WHEN tr.user_type = 'admin' THEN 
            (SELECT u.name FROM users u WHERE u.email = tr.user_email LIMIT 1)
          ELSE tr.user_name
        END as display_name
      FROM ticket_responses tr
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [ticketData.id]);

    // Obtener escalaciones si existen
    const escalations = await query(`
      SELECT 
        te.*,
        u1.name as escalated_from_name,
        u2.name as escalated_to_name
      FROM ticket_escalations te
      LEFT JOIN users u1 ON te.escalated_from_user = u1.id
      LEFT JOIN users u2 ON te.escalated_to_user = u2.id
      WHERE te.ticket_id = ?
      ORDER BY te.created_at DESC
    `, [ticketData.id]);

    // Obtener plantillas sugeridas para respuesta rápida
    const templates = await query(`
      SELECT id, name, subject_template, message_template, use_case
      FROM response_templates
      WHERE type = ? AND is_active = TRUE
      ORDER BY name
    `, [ticketData.type]);

    return res.status(200).json({
      success: true,
      data: {
        ticket: ticketData,
        responses: responses,
        escalations: escalations,
        suggested_templates: templates,
        timeline: generateTimeline(ticketData, responses, escalations)
      }
    });

  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    throw error;
  }
}

// PUT - Actualizar ticket (estado, asignación, respuesta)
async function updateTicket(req, res, ticketId) {
  const {
    status,
    priority,
    assigned_to,
    internal_notes,
    resolution,
    response_message,
    response_is_internal = false,
    customer_rating,
    customer_feedback,
    estimated_resolution_date,
    admin_user_id,
    admin_user_name,
    admin_user_email
  } = req.body;

  try {
    const result = await transaction(async (conn) => {
      // 1. Verificar que el ticket existe
      const existingTicket = await conn.queryOne(`
        SELECT * FROM support_tickets WHERE id = ?
      `, [ticketId]);

      if (!existingTicket) {
        throw new Error('Ticket no encontrado');
      }

      // 2. Preparar campos a actualizar
      let updateFields = [];
      let updateValues = [];

      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
        
        // Si se está resolviendo, marcar timestamp
        if (status === 'resolved' && existingTicket.status !== 'resolved') {
          updateFields.push('resolved_at = NOW()');
        }
        
        // Si se está cerrando, marcar timestamp
        if (status === 'closed' && existingTicket.status !== 'closed') {
          updateFields.push('closed_at = NOW()');
        }
      }

      if (priority !== undefined) {
        updateFields.push('priority = ?');
        updateValues.push(priority);
      }

      if (assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        updateValues.push(assigned_to);
      }

      if (internal_notes !== undefined) {
        updateFields.push('internal_notes = ?');
        updateValues.push(internal_notes);
      }

      if (resolution !== undefined) {
        updateFields.push('resolution = ?');
        updateValues.push(resolution);
      }

      if (customer_rating !== undefined) {
        updateFields.push('customer_rating = ?');
        updateValues.push(customer_rating);
      }

      if (customer_feedback !== undefined) {
        updateFields.push('customer_feedback = ?');
        updateValues.push(customer_feedback);
      }

      if (estimated_resolution_date !== undefined) {
        updateFields.push('estimated_resolution_date = ?');
        updateValues.push(estimated_resolution_date);
      }

      // 3. Actualizar el ticket si hay cambios
      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(ticketId);

        await conn.query(`
          UPDATE support_tickets 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
      }

      // 4. Agregar respuesta si se proporciona
      let responseId = null;
      if (response_message && response_message.trim()) {
        const responseResult = await conn.query(`
          INSERT INTO ticket_responses (
            ticket_id, user_type, user_name, user_email, message, is_internal, created_at
          ) VALUES (?, 'admin', ?, ?, ?, ?, NOW())
        `, [
          ticketId,
          admin_user_name || 'Admin',
          admin_user_email || process.env.ADMIN_EMAIL,
          response_message,
          response_is_internal
        ]);

        responseId = responseResult.insertId;

        // Actualizar contador de respuestas
        await conn.query(`
          UPDATE ticket_metrics 
          SET number_of_responses = number_of_responses + 1,
              calculated_at = NOW()
          WHERE ticket_id = ?
        `, [ticketId]);

        // Si es la primera respuesta de admin, calcular tiempo de primera respuesta
        const firstAdminResponse = await conn.queryOne(`
          SELECT COUNT(*) as count
          FROM ticket_responses
          WHERE ticket_id = ? AND user_type = 'admin'
        `, [ticketId]);

        if (firstAdminResponse.count === 1) {
          const firstResponseTime = await conn.queryOne(`
            SELECT TIMESTAMPDIFF(MINUTE, st.created_at, tr.created_at) as minutes
            FROM support_tickets st
            INNER JOIN ticket_responses tr ON st.id = tr.ticket_id
            WHERE st.id = ? AND tr.id = ?
          `, [ticketId, responseId]);

          await conn.query(`
            UPDATE ticket_metrics 
            SET first_response_time = ?,
                calculated_at = NOW()
            WHERE ticket_id = ?
          `, [firstResponseTime.minutes, ticketId]);
        }
      }

      // 5. Crear escalación si se asigna a diferente persona
      if (assigned_to !== undefined && assigned_to !== existingTicket.assigned_to) {
        await conn.query(`
          INSERT INTO ticket_escalations (
            ticket_id, escalated_from_user, escalated_to_user, 
            escalation_reason, escalation_notes, created_at
          ) VALUES (?, ?, ?, 'manual', 'Reasignado manualmente', NOW())
        `, [ticketId, existingTicket.assigned_to, assigned_to]);

        await conn.query(`
          UPDATE ticket_metrics 
          SET number_of_escalations = number_of_escalations + 1,
              calculated_at = NOW()
          WHERE ticket_id = ?
        `, [ticketId]);
      }

      // 6. Obtener ticket actualizado
      const updatedTicket = await conn.queryOne(`
        SELECT st.*, u.name as assigned_to_name
        FROM support_tickets st
        LEFT JOIN users u ON st.assigned_to = u.id
        WHERE st.id = ?
      `, [ticketId]);

      return {
        ticket: updatedTicket,
        response_added: responseId ? true : false,
        response_id: responseId
      };
    });

    // 7. Enviar notificaciones por email (fuera de transacción)
    const emailResults = {
      response: null,
      resolution: null
    };

    try {
      // Enviar email de respuesta si no es interno
      if (response_message && !response_is_internal) {
        console.log('📧 Enviando email de respuesta al cliente...');
        emailResults.response = await sendTicketResponseEmail(
          result.ticket, 
          response_message, 
          admin_user_name || 'Equipo de Soporte'
        );
        console.log('✅ Email de respuesta enviado:', emailResults.response.success);
      }

      // Enviar email de resolución/cierre
      if (status && ['resolved', 'closed'].includes(status)) {
        console.log('📧 Enviando email de resolución/cierre...');
        emailResults.resolution = await sendTicketResolvedEmail(result.ticket, resolution);
        console.log('✅ Email de resolución enviado:', emailResults.resolution.success);
      }

    } catch (emailError) {
      console.error('❌ Error enviando notificaciones:', emailError);
      // No fallar la actualización si hay problemas con email
      emailResults.error = emailError.message;
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket actualizado exitosamente',
      data: {
        ...result,
        email_notifications: emailResults
      }
    });

  } catch (error) {
    console.error('Error actualizando ticket:', error);
    throw error;
  }
}

// DELETE - Eliminar ticket (solo admin, casos excepcionales)
async function deleteTicket(req, res, ticketId) {
  try {
    // Verificar que el ticket existe
    const existingTicket = await query(`
      SELECT * FROM support_tickets WHERE id = ?
    `, [ticketId]);

    if (existingTicket.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    // Solo permitir eliminar tickets en estado 'closed' o muy antiguos
    const ticket = existingTicket[0];
    const daysSinceCreation = (new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24);

    if (ticket.status !== 'closed' && daysSinceCreation < 30) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar tickets cerrados o con más de 30 días'
      });
    }

    // Eliminar ticket (CASCADE eliminará respuestas, escalaciones, métricas)
    await query(`DELETE FROM support_tickets WHERE id = ?`, [ticketId]);

    return res.status(200).json({
      success: true,
      message: 'Ticket eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando ticket:', error);
    throw error;
  }
}

// Función auxiliar para generar timeline del ticket
function generateTimeline(ticket, responses, escalations) {
  let timeline = [];

  // Evento de creación
  timeline.push({
    type: 'created',
    timestamp: ticket.created_at,
    description: 'Ticket creado',
    details: {
      type: ticket.type,
      priority: ticket.priority,
      subject: ticket.subject
    }
  });

  // Agregar respuestas
  responses.forEach(response => {
    timeline.push({
      type: response.user_type === 'admin' ? 'admin_response' : 'customer_response',
      timestamp: response.created_at,
      description: response.user_type === 'admin' 
        ? `Respuesta de ${response.display_name}` 
        : `Respuesta del cliente`,
      details: {
        message: response.message,
        is_internal: response.is_internal,
        user: response.display_name
      }
    });
  });

  // Agregar escalaciones
  escalations.forEach(escalation => {
    timeline.push({
      type: 'escalation',
      timestamp: escalation.created_at,
      description: 'Ticket escalado',
      details: {
        reason: escalation.escalation_reason,
        from: escalation.escalated_from_name,
        to: escalation.escalated_to_name,
        notes: escalation.escalation_notes
      }
    });
  });

  // Eventos de cambio de estado
  if (ticket.resolved_at) {
    timeline.push({
      type: 'resolved',
      timestamp: ticket.resolved_at,
      description: 'Ticket resuelto',
      details: {
        resolution: ticket.resolution
      }
    });
  }

  if (ticket.closed_at) {
    timeline.push({
      type: 'closed',
      timestamp: ticket.closed_at,
      description: 'Ticket cerrado',
      details: {
        customer_rating: ticket.customer_rating,
        customer_feedback: ticket.customer_feedback
      }
    });
  }

  // Ordenar por timestamp
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}