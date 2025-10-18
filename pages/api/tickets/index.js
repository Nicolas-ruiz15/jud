// pages/api/tickets/index.js
// API de tickets actualizada para usar el nuevo servicio de email

import { query, queryOne, transaction } from '../../../lib/database';
import { 
  sendTicketCreatedEmail, 
  sendNewTicketAdminEmail 
} from '../../../lib/emailService';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await getTickets(req, res);
    } else if (req.method === 'POST') {
      return await createTicket(req, res);
    } else {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }
  } catch (error) {
    console.error('Error en API tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - Obtener lista de tickets (principalmente para admin)
async function getTickets(req, res) {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    type,
    assigned_to,
    email,
    search,
    start_date,
    end_date
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir WHERE clause dinámicamente
  let whereConditions = [];
  let queryParams = [];

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

  if (assigned_to) {
    whereConditions.push('st.assigned_to = ?');
    queryParams.push(parseInt(assigned_to));
  }

  if (email) {
    whereConditions.push('st.email LIKE ?');
    queryParams.push(`%${email}%`);
  }

  if (search) {
    whereConditions.push('(st.subject LIKE ? OR st.description LIKE ? OR st.ticket_number LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (start_date) {
    whereConditions.push('DATE(st.created_at) >= ?');
    queryParams.push(start_date);
  }

  if (end_date) {
    whereConditions.push('DATE(st.created_at) <= ?');
    queryParams.push(end_date);
  }

  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Query principal con información adicional
  const ticketsQuery = `
    SELECT 
      st.*,
      tm.first_response_time,
      tm.resolution_time,
      tm.customer_satisfaction,
      tm.number_of_responses,
      (SELECT COUNT(*) FROM ticket_responses tr WHERE tr.ticket_id = st.id) as total_responses,
      (SELECT tr.created_at FROM ticket_responses tr WHERE tr.ticket_id = st.id ORDER BY tr.created_at DESC LIMIT 1) as last_response_at,
      (SELECT u.name FROM users u WHERE u.id = st.assigned_to) as assigned_to_name
    FROM support_tickets st
    LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
    ${whereClause}
    ORDER BY 
      CASE st.priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      st.created_at DESC
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

  // Obtener estadísticas generales
  const statsQuery = `
    SELECT 
      COUNT(*) as total_tickets,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
      SUM(CASE WHEN status = 'pending_customer' THEN 1 ELSE 0 END) as pending_customer_tickets,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_tickets,
      AVG(CASE WHEN tm.resolution_time IS NOT NULL THEN tm.resolution_time END) as avg_resolution_time
    FROM support_tickets st
    LEFT JOIN ticket_metrics tm ON st.id = tm.ticket_id
    ${whereClause.replace(/st\./g, 'st.')}
  `;

  const statsResult = await query(statsQuery, countParams);
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
}

// POST - Crear nuevo ticket
async function createTicket(req, res) {
  const {
    type = 'general',
    priority = 'medium',
    name,
    email,
    phone,
    subject,
    description,
    order_number,
    product_name,
    source = 'web' // web, whatsapp, email, phone
  } = req.body;

  // Validaciones
  if (!name || !email || !subject || !description) {
    return res.status(400).json({
      success: false,
      message: 'Campos requeridos: name, email, subject, description'
    });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email no válido'
    });
  }

  try {
    const result = await transaction(async (conn) => {
      // 1. Crear el ticket
      const ticketResult = await conn.query(`
        INSERT INTO support_tickets (
          type, priority, name, email, phone, subject, description, 
          order_number, product_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [type, priority, name, email, phone, subject, description, order_number, product_name]);

      const ticketId = ticketResult.insertId;

      // 2. Obtener el ticket recién creado (con número generado automáticamente)
      const newTicket = await conn.queryOne(`
        SELECT * FROM support_tickets WHERE id = ?
      `, [ticketId]);

      // 3. Crear entrada inicial en métricas
      await conn.query(`
        INSERT INTO ticket_metrics (ticket_id, number_of_responses, calculated_at)
        VALUES (?, 0, NOW())
      `, [ticketId]);

      // 4. Auto-clasificar y sugerir respuesta basada en keywords
      const categoriesResult = await conn.query(`
        SELECT * FROM ticket_categories 
        WHERE type = ? AND is_active = TRUE
      `, [type]);

      let suggestedCategory = null;
      let autoResponse = null;

      for (const category of categoriesResult) {
        if (category.keywords) {
          const keywords = category.keywords.split(',');
          const content = (subject + ' ' + description).toLowerCase();
          
          const matchingKeywords = keywords.filter(keyword => 
            content.includes(keyword.trim().toLowerCase())
          );

          if (matchingKeywords.length > 0) {
            suggestedCategory = category;
            autoResponse = category.auto_response;
            break;
          }
        }
      }

      // 5. Si es alta prioridad o tipo queja, asignar automáticamente
      let assignedTo = null;
      if (priority === 'high' || type === 'quejas') {
        // Buscar admin disponible (este query podría mejorarse según tu lógica de asignación)
        const availableAdmin = await conn.queryOne(`
          SELECT id FROM users 
          WHERE role = 'admin' AND is_active = TRUE 
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
        ticket: { ...newTicket, assigned_to: assignedTo },
        suggestedCategory,
        autoResponse,
        assignedTo
      };
    });

    // 6. Enviar emails de notificación (fuera de la transacción)
    const emailResults = {
      customer: null,
      admin: null
    };

    try {
      // Email al cliente
      console.log('📧 Enviando email de confirmación al cliente...');
      emailResults.customer = await sendTicketCreatedEmail(result.ticket, result.autoResponse);
      console.log('✅ Email al cliente enviado:', emailResults.customer.success);

      // Email al equipo admin
      console.log('📧 Enviando notificación al equipo admin...');
      emailResults.admin = await sendNewTicketAdminEmail(result.ticket);
      console.log('✅ Email al admin enviado:', emailResults.admin.success);

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError);
      // No fallar la creación del ticket si hay problemas con email
      // Solo registrar el error
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
        auto_response: result.autoResponse,
        assigned: result.assignedTo ? true : false,
        email_notifications: emailResults
      }
    });

  } catch (error) {
    console.error('Error creando ticket:', error);
    throw error;
  }
}