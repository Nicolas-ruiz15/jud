// pages/api/user/tickets/index.js
// API para que usuarios autenticados gestionen sus propios tickets

import { query, queryOne, transaction } from '../../../../lib/database';
import { verifyToken } from '../../../../middleware/auth';
import { 
  sendTicketCreatedEmail, 
  sendNewTicketAdminEmail 
} from '../../../../lib/emailService';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await getUserTickets(req, res);
    } else if (req.method === 'POST') {
      return await createUserTicket(req, res);
    } else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }
  } catch (error) {
    console.error('Error en API user tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - Obtener tickets del usuario autenticado
async function getUserTickets(req, res) {
  // Verificar autenticación
  return verifyToken(req, res, async () => {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      type
    } = req.query;

    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir WHERE clause dinámicamente
    let whereConditions = ['st.user_id = ?'];
    let queryParams = [userId];

    if (status) {
      whereConditions.push('st.status = ?');
      queryParams.push(status);
    }

    if (priority) {
      whereConditions.push('st.priority = ?');
      queryParams.push(priority);
    }

    if (type) {
      whereConditions.push('st.type = ?');
      queryParams.push(type);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Query principal
    const ticketsQuery = `
      SELECT 
        st.*,
        tm.first_response_time,
        tm.resolution_time,
        tm.number_of_responses,
        (SELECT COUNT(*) FROM ticket_responses tr WHERE tr.ticket_id = st.id) as total_responses,
        (SELECT tr.created_at FROM ticket_responses tr WHERE tr.ticket_id = st.id ORDER BY tr.created_at DESC LIMIT 1) as last_response_at,
        (SELECT u.name FROM users u WHERE u.id = st.assigned_to) as assigned_to_name
      FROM support_tickets st
      LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);

    const tickets = await query(ticketsQuery, queryParams);

    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM support_tickets st
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remover limit y offset
    const countResult = await query(countQuery, countParams);
    const total = countResult[0].total;

    // Estadísticas del usuario
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
        AVG(CASE WHEN tm.resolution_time IS NOT NULL THEN tm.resolution_time END) as avg_resolution_time,
        AVG(CASE WHEN st.customer_rating IS NOT NULL THEN st.customer_rating END) as avg_rating
      FROM support_tickets st
      LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
      WHERE st.user_id = ?
    `;

    const statsResult = await query(statsQuery, [userId]);
    const stats = statsResult[0];

    // Calcular paginación
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        ...stats,
        avg_resolution_hours: stats.avg_resolution_time ? Math.round(stats.avg_resolution_time / 60 * 10) / 10 : null
      }
    });
  });
}

// POST - Crear nuevo ticket para usuario autenticado
async function createUserTicket(req, res) {
  return verifyToken(req, res, async () => {
    const {
      type = 'general',
      priority = 'medium',
      subject,
      description,
      order_number,
      product_name
    } = req.body;

    const user = req.user;

    // Validaciones
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: subject, description'
      });
    }

    try {
      const result = await transaction(async (conn) => {
        // 1. Crear el ticket con datos del usuario autenticado
        const ticketResult = await conn.query(`
          INSERT INTO support_tickets (
            user_id, type, priority, name, email, subject, description, 
            order_number, product_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [user.id, type, priority, user.name, user.email, subject, description, order_number, product_name]);

        const ticketId = ticketResult.insertId;

        // 2. Obtener el ticket recién creado
        const newTicket = await conn.queryOne(`
          SELECT * FROM support_tickets WHERE id = ?
        `, [ticketId]);

        // 3. Crear entrada inicial en métricas
        await conn.query(`
          INSERT INTO ticket_metrics (ticket_id, number_of_responses, calculated_at)
          VALUES (?, 0, NOW())
        `, [ticketId]);

        // 4. Auto-asignar si es alta prioridad
        let assignedTo = null;
        if (priority === 'high' || type === 'quejas') {
          const availableAdmin = await conn.queryOne(`
            SELECT id FROM users 
            WHERE role = 'admin' 
            ORDER BY (
              SELECT COUNT(*) FROM support_tickets 
              WHERE assigned_to = users.id AND status IN ('open', 'in_progress')
            ) ASC
            LIMIT 1
          `);

          if (availableAdmin) {
            assignedTo = availableAdmin.id;
            await conn.query(`
              UPDATE support_tickets SET assigned_to = ? WHERE id = ?
            `, [assignedTo, ticketId]);
          }
        }

        return {
          ticket: { ...newTicket, assigned_to: assignedTo }
        };
      });

      // 5. Enviar emails de notificación
      const emailResults = {
        customer: null,
        admin: null
      };

      try {
        // Email al cliente
        emailResults.customer = await sendTicketCreatedEmail(result.ticket);
        
        // Email al equipo admin
        emailResults.admin = await sendNewTicketAdminEmail(result.ticket);

      } catch (emailError) {
        console.error('❌ Error enviando emails:', emailError);
        emailResults.error = emailError.message;
      }

      return res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: {
          ticket_number: result.ticket.ticket_number,
          id: result.ticket.id,
          type: result.ticket.type,
          priority: result.ticket.priority,
          status: result.ticket.status,
          created_at: result.ticket.created_at,
          assigned: result.ticket.assigned_to ? true : false,
          email_notifications: emailResults
        }
      });

    } catch (error) {
      console.error('Error creando ticket de usuario:', error);
      throw error;
    }
  });
}