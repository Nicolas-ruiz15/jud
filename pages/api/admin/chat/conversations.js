// pages/api/admin/chat/conversations.js - LISTAR CONVERSACIONES PARA ADMIN
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('💼 Admin Chat Conversations API called');

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { 
      status = 'active', 
      priority = null,
      assigned_to = null,
      department = null,
      limit = 50,
      page = 1
    } = req.query;

    console.log('🔍 Fetching conversations:', { status, priority, limit, page });

    // Construir filtros dinámicos
    let whereConditions = ['c.status != "closed"']; // No mostrar cerradas por defecto
    let params = [];

    if (status && status !== 'all') {
      whereConditions.push('c.status = ?');
      params.push(status);
    }

    if (priority) {
      whereConditions.push('c.priority = ?');
      params.push(priority);
    }

    if (assigned_to) {
      if (assigned_to === 'unassigned') {
        whereConditions.push('c.assigned_to IS NULL');
      } else {
        whereConditions.push('c.assigned_to = ?');
        params.push(assigned_to);
      }
    }

    if (department) {
      whereConditions.push('c.department = ?');
      params.push(department);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    // Consulta principal de conversaciones
    const conversations = await query(`
      SELECT 
        c.id,
        c.session_id,
        c.user_id,
        c.visitor_name,
        c.visitor_email,
        c.visitor_phone,
        c.ip_address,
        c.device_type,
        c.browser,
        c.os,
        c.country,
        c.country_code,
        c.city,
        c.region,
        c.landing_page,
        c.current_page,
        c.referrer,
        c.utm_source,
        c.utm_medium,
        c.utm_campaign,
        c.status,
        c.priority,
        c.assigned_to,
        c.department,
        c.tags,
        c.message_count,
        c.response_time_avg,
        c.satisfaction_rating,
        c.conversion_value,
        c.created_at,
        c.updated_at,
        c.first_response_at,
        c.last_message_at,
        c.closed_at,
        c.duration_minutes,
        
        -- Información del usuario asignado
        u.name as assigned_user_name,
        u.email as assigned_user_email,
        
        -- Información del último mensaje
        lm.message_content as last_message_content,
        lm.sender_type as last_message_sender,
        lm.created_at as last_message_time,
        
        -- Contar mensajes no leídos del visitante
        (SELECT COUNT(*) 
         FROM chat_messages cm 
         WHERE cm.conversation_id = c.id 
           AND cm.sender_type = 'user' 
           AND cm.is_read = 0
        ) as unread_messages,
        
        -- Tiempo desde última actividad
        TIMESTAMPDIFF(MINUTE, c.last_message_at, NOW()) as minutes_since_last_message,
        
        -- Verificar si el visitante está online (activo en últimos 5 minutos)
        (SELECT COUNT(*) 
         FROM analytics_realtime_visitors rv 
         WHERE rv.session_id = c.session_id 
           AND rv.last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ) > 0 as visitor_is_online

      FROM chat_conversations c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN (
        SELECT DISTINCT
          conversation_id,
          message_content,
          sender_type,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM chat_messages
        WHERE is_deleted = 0
      ) lm ON c.id = lm.conversation_id AND lm.rn = 1
      
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN c.priority = 'urgent' THEN 1
          WHEN c.priority = 'high' THEN 2
          WHEN c.priority = 'normal' THEN 3
          ELSE 4
        END,
        c.last_message_at DESC
      LIMIT ? OFFSET ?
    `, params);

    // Contar total de conversaciones para paginación
    const countParams = params.slice(0, -2); // Remover limit y offset
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM chat_conversations c
      ${whereClause}
    `, countParams);

    const total = totalResult[0]?.total || 0;

    // Obtener estadísticas generales
    const stats = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_conversations,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_conversations,
        COUNT(CASE WHEN assigned_to IS NULL AND status = 'active' THEN 1 END) as unassigned_conversations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_conversations,
        
        -- Mensajes no leídos totales
        (SELECT COUNT(*) 
         FROM chat_messages cm 
         JOIN chat_conversations cc ON cm.conversation_id = cc.id
         WHERE cm.sender_type = 'user' 
           AND cm.is_read = 0 
           AND cc.status = 'active'
        ) as total_unread_messages,
        
        -- Promedio de tiempo de respuesta hoy
        COALESCE(AVG(CASE 
          WHEN response_time_avg > 0 AND DATE(created_at) = CURDATE() 
          THEN response_time_avg 
        END), 0) as avg_response_time_today

      FROM chat_conversations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Formatear conversaciones para el frontend
    const formattedConversations = conversations.map(conv => {
      // Parsear tags si existen
      let tags = [];
      try {
        tags = conv.tags ? JSON.parse(conv.tags) : [];
      } catch (e) {
        tags = [];
      }

      return {
        id: conv.id,
        sessionId: conv.session_id,
        userId: conv.user_id,
        visitor: {
          name: conv.visitor_name,
          email: conv.visitor_email,
          phone: conv.visitor_phone,
          isOnline: conv.visitor_is_online === 1
        },
        location: {
          ip: conv.ip_address,
          country: conv.country,
          countryCode: conv.country_code,
          city: conv.city,
          region: conv.region
        },
        device: {
          type: conv.device_type,
          browser: conv.browser,
          os: conv.os
        },
        source: {
          landingPage: conv.landing_page,
          currentPage: conv.current_page,
          referrer: conv.referrer,
          utmSource: conv.utm_source,
          utmMedium: conv.utm_medium,
          utmCampaign: conv.utm_campaign
        },
        status: conv.status,
        priority: conv.priority,
        department: conv.department,
        tags,
        assignedTo: conv.assigned_to ? {
          id: conv.assigned_to,
          name: conv.assigned_user_name,
          email: conv.assigned_user_email
        } : null,
        metrics: {
          messageCount: conv.message_count,
          unreadMessages: conv.unread_messages,
          averageResponseTime: conv.response_time_avg,
          satisfactionRating: conv.satisfaction_rating,
          conversionValue: parseFloat(conv.conversion_value || 0),
          durationMinutes: conv.duration_minutes,
          minutesSinceLastMessage: conv.minutes_since_last_message
        },
        lastMessage: conv.last_message_content ? {
          content: conv.last_message_content.substring(0, 100) + 
                  (conv.last_message_content.length > 100 ? '...' : ''),
          senderType: conv.last_message_sender,
          timestamp: conv.last_message_time
        } : null,
        timestamps: {
          created: conv.created_at,
          updated: conv.updated_at,
          lastMessage: conv.last_message_at,
          firstResponse: conv.first_response_at,
          closed: conv.closed_at
        }
      };
    });

    const dashboardStats = stats[0] || {
      active_conversations: 0,
      urgent_conversations: 0,
      high_priority_conversations: 0,
      unassigned_conversations: 0,
      pending_conversations: 0,
      total_unread_messages: 0,
      avg_response_time_today: 0
    };

    console.log('✅ Conversations loaded:', { 
      count: formattedConversations.length, 
      total,
      activeConversations: dashboardStats.active_conversations 
    });

    res.status(200).json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: (parseInt(page) * parseInt(limit)) < total,
          hasPrevPage: parseInt(page) > 1
        },
        statistics: {
          activeConversations: parseInt(dashboardStats.active_conversations),
          urgentConversations: parseInt(dashboardStats.urgent_conversations),
          highPriorityConversations: parseInt(dashboardStats.high_priority_conversations),
          unassignedConversations: parseInt(dashboardStats.unassigned_conversations),
          pendingConversations: parseInt(dashboardStats.pending_conversations),
          totalUnreadMessages: parseInt(dashboardStats.total_unread_messages),
          averageResponseTimeToday: Math.round(dashboardStats.avg_response_time_today)
        },
        filters: {
          status,
          priority,
          assignedTo: assigned_to,
          department
        },
        serverTime: new Date().toISOString()
      },
      message: 'Conversaciones obtenidas correctamente'
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);