// pages/api/user/tickets/[id].js
// API para que usuarios vean y respondan a un ticket específico

import { query, queryOne, transaction } from '../../../../lib/database';
import { verifyToken } from '../../../../middleware/auth';
import { sendTicketResponseEmail } from '../../../../lib/emailService';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      return await getUserTicketDetail(req, res, id);
    } else if (req.method === 'POST') {
      return await addUserResponse(req, res, id);
    } else if (req.method === 'PUT') {
      return await updateUserTicket(req, res, id);
    } else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }
  } catch (error) {
    console.error('Error en API user ticket detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - Obtener detalle del ticket del usuario
async function getUserTicketDetail(req, res, ticketId) {
  return verifyToken(req, res, async () => {
    const userId = req.user.id;

    try {
      // Verificar que el ticket pertenece al usuario
      const ticket = await queryOne(`
        SELECT 
          st.*,
          tm.first_response_time,
          tm.resolution_time,
          tm.number_of_responses,
          tm.customer_satisfaction,
          (SELECT u.name FROM users u WHERE u.id = st.assigned_to) as assigned_to_name,
          (SELECT u.email FROM users u WHERE u.id = st.assigned_to) as assigned_to_email
        FROM support_tickets st
        LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
        WHERE st.id = ? AND st.user_id = ?
      `, [ticketId, userId]);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado o no tienes permisos para verlo'
        });
      }

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
      `, [ticket.id]);

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
      `, [ticket.id]);

      // Generar timeline
      const timeline = generateUserTimeline(ticket, responses, escalations);

      return res.status(200).json({
        success: true,
        data: {
          ticket: ticket,
          responses: responses,
          escalations: escalations,
          timeline: timeline,
          can_respond: ['open', 'in_progress', 'pending_customer'].includes(ticket.status),
          can_rate: ticket.status === 'resolved' && !ticket.customer_rating
        }
      });

    } catch (error) {
      console.error('Error obteniendo detalle de ticket:', error);
      throw error;
    }
  });
}

// POST - Agregar respuesta del usuario
async function addUserResponse(req, res, ticketId) {
  return verifyToken(req, res, async () => {
    const { message } = req.body;
    const user = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje es requerido'
      });
    }

    try {
      const result = await transaction(async (conn) => {
        // 1. Verificar que el ticket pertenece al usuario y puede responder
        const ticket = await conn.queryOne(`
          SELECT * FROM support_tickets 
          WHERE id = ? AND user_id = ? AND status IN ('open', 'in_progress', 'pending_customer')
        `, [ticketId, user.id]);

        if (!ticket) {
          throw new Error('Ticket no encontrado o no se puede responder');
        }

        // 2. Agregar la respuesta
        const responseResult = await conn.query(`
          INSERT INTO ticket_responses (
            ticket_id, user_type, user_name, user_email, message, is_internal, created_at
          ) VALUES (?, 'customer', ?, ?, ?, 0, NOW())
        `, [ticketId, user.name, user.email, message.trim()]);

        // 3. Actualizar métricas
        await conn.query(`
          UPDATE ticket_metrics 
          SET number_of_responses = number_of_responses + 1,
              calculated_at = NOW()
          WHERE ticket_id = ?
        `, [ticketId]);

        // 4. Cambiar estado si estaba pending_customer
        if (ticket.status === 'pending_customer') {
          await conn.query(`
            UPDATE support_tickets 
            SET status = 'in_progress', updated_at = NOW()
            WHERE id = ?
          `, [ticketId]);
        }

        // 5. Obtener ticket actualizado
        const updatedTicket = await conn.queryOne(`
          SELECT st.*, u.name as assigned_to_name
          FROM support_tickets st
          LEFT JOIN users u ON st.assigned_to = u.id
          WHERE st.id = ?
        `, [ticketId]);

        return {
          ticket: updatedTicket,
          response_id: responseResult.insertId
        };
      });

      // 6. Enviar email de notificación al equipo admin
      try {
        console.log('📧 Enviando notificación de respuesta del cliente...');
        
        // Email personalizado para respuesta de cliente
        const adminEmailResult = await sendTicketResponseEmail(
          result.ticket, 
          `El cliente ${user.name} ha respondido:\n\n${message}`,
          user.name
        );
        
        console.log('✅ Email al admin enviado:', adminEmailResult?.success);
      } catch (emailError) {
        console.error('❌ Error enviando email al admin:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Respuesta agregada exitosamente',
        data: {
          response_id: result.response_id,
          ticket_status: result.ticket.status
        }
      });

    } catch (error) {
      console.error('Error agregando respuesta:', error);
      throw error;
    }
  });
}

// PUT - Actualizar ticket (calificación, etc.)
async function updateUserTicket(req, res, ticketId) {
  return verifyToken(req, res, async () => {
    const { customer_rating, customer_feedback } = req.body;
    const userId = req.user.id;

    try {
      // Verificar que el ticket pertenece al usuario
      const ticket = await queryOne(`
        SELECT * FROM support_tickets 
        WHERE id = ? AND user_id = ?
      `, [ticketId, userId]);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Solo permitir calificación si está resuelto
      if (customer_rating && ticket.status !== 'resolved') {
        return res.status(400).json({
          success: false,
          message: 'Solo se puede calificar tickets resueltos'
        });
      }

      // Actualizar ticket
      let updateFields = [];
      let updateValues = [];

      if (customer_rating !== undefined) {
        updateFields.push('customer_rating = ?');
        updateValues.push(customer_rating);
      }

      if (customer_feedback !== undefined) {
        updateFields.push('customer_feedback = ?');
        updateValues.push(customer_feedback);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(ticketId);

        await query(`
          UPDATE support_tickets 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);

        // Si se califica, cambiar a closed
        if (customer_rating) {
          await query(`
            UPDATE support_tickets 
            SET status = 'closed', closed_at = NOW()
            WHERE id = ?
          `, [ticketId]);
        }
      }

      return res.status(200).json({
        success: true,
        message: customer_rating ? 'Calificación guardada exitosamente' : 'Ticket actualizado',
        data: {
          rating: customer_rating,
          feedback: customer_feedback
        }
      });

    } catch (error) {
      console.error('Error actualizando ticket:', error);
      throw error;
    }
  });
}

// Función auxiliar para generar timeline del usuario
function generateUserTimeline(ticket, responses, escalations) {
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
    },
    icon: '🎫',
    color: 'blue'
  });

  // Agregar respuestas
  responses.forEach(response => {
    timeline.push({
      type: response.user_type === 'admin' ? 'admin_response' : 'customer_response',
      timestamp: response.created_at,
      description: response.user_type === 'admin' 
        ? `Respuesta del equipo de soporte` 
        : `Tu respuesta`,
      details: {
        message: response.message,
        user: response.display_name,
        is_internal: response.is_internal
      },
      icon: response.user_type === 'admin' ? '👨‍💼' : '🙋‍♂️',
      color: response.user_type === 'admin' ? 'green' : 'purple'
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
        to: escalation.escalated_to_name,
        notes: escalation.escalation_notes
      },
      icon: '⬆️',
      color: 'yellow'
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
      },
      icon: '✅',
      color: 'green'
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
      },
      icon: '🔒',
      color: 'gray'
    });
  }

  // Ordenar por timestamp
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}