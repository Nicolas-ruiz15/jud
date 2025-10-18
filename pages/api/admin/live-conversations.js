import { adminAuth } from '../../../middleware/adminAuth';
import { query } from '../../../lib/database';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    // Obtener conversaciones activas
    const conversations = await query(`
      SELECT 
        cc.*,
        vp.name as visitor_name,
        vp.email as visitor_email,
        vp.avatar as visitor_avatar,
        arv.country,
        arv.country_code,
        arv.city,
        arv.device_type,
        vi.lead_score,
        vi.engagement_score,
        (SELECT content FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
        (SELECT created_at FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT sender_type FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id) as message_count,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id AND is_read = 0 AND sender_type = 'visitor') as unread_count,
        u.name as agent_name,
        u.email as agent_email
      FROM chat_conversations cc
      LEFT JOIN visitor_profiles vp ON cc.session_id = vp.session_id
      LEFT JOIN analytics_realtime_visitors arv ON cc.session_id = arv.session_id
      LEFT JOIN visitor_intelligence vi ON cc.session_id = vi.session_id
      LEFT JOIN users u ON cc.assigned_agent_id = u.id
      WHERE cc.status IN ('active', 'waiting', 'pending')
        AND cc.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY 
        CASE 
          WHEN cc.priority = 'high' THEN 1
          WHEN cc.priority = 'medium' THEN 2
          ELSE 3
        END,
        cc.updated_at DESC
    `);

    // Formatear conversaciones
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      sessionId: conv.session_id,
      visitor: {
        name: conv.visitor_name || 'Visitante Anónimo',
        email: conv.visitor_email || null,
        avatar: conv.visitor_avatar || conv.visitor_name?.charAt(0).toUpperCase() || 'V',
        location: {
          country: conv.country || 'Desconocido',
          countryCode: conv.country_code || 'XX',
          city: conv.city || 'Desconocida'
        }
      },
      status: conv.status,
      priority: conv.priority || 'medium',
      assignedAgent: conv.assigned_agent_id ? {
        id: conv.assigned_agent_id,
        name: conv.agent_name || 'Agente',
        avatar: conv.agent_name?.charAt(0).toUpperCase() || 'A',
        status: 'online'
      } : null,
      startTime: conv.created_at,
      lastMessage: conv.last_message_content ? {
        content: conv.last_message_content,
        timestamp: conv.last_message_time,
        sender: conv.last_message_sender === 'visitor' ? 'visitor' : 'agent'
      } : null,
      messageCount: conv.message_count || 0,
      unreadCount: conv.unread_count || 0,
      tags: conv.tags ? JSON.parse(conv.tags) : [],
      sentiment: conv.sentiment || 'neutral',
      satisfaction: conv.satisfaction_rating,
      leadScore: conv.lead_score || 0,
      estimatedValue: conv.estimated_value || 0,
      metrics: {
        responseTime: conv.avg_response_time,
        messageCount: conv.message_count || 0,
        unreadMessages: conv.unread_count || 0
      },
      timestamps: {
        created: conv.created_at,
        updated: conv.updated_at,
        lastMessage: conv.last_message_time
      },
      location: {
        city: conv.city,
        country: conv.country,
        countryCode: conv.country_code
      }
    }));

    // Obtener estadísticas de conversaciones
    const chatStatistics = await query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as activeConversations,
        COUNT(DISTINCT CASE WHEN status = 'waiting' THEN id END) as waitingConversations,
        COUNT(DISTINCT CASE WHEN status = 'pending' THEN id END) as pendingConversations,
        SUM(CASE WHEN cm.is_read = 0 AND cm.sender_type = 'visitor' THEN 1 ELSE 0 END) as totalUnreadMessages,
        AVG(response_time) as avgResponseTime,
        AVG(satisfaction_rating) as avgSatisfaction
      FROM chat_conversations cc
      LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
      WHERE cc.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    res.status(200).json({
      success: true,
      data: {
        conversations: formattedConversations,
        statistics: {
          activeConversations: chatStatistics[0]?.activeConversations || 0,
          waitingConversations: chatStatistics[0]?.waitingConversations || 0,
          pendingConversations: chatStatistics[0]?.pendingConversations || 0,
          totalUnreadMessages: chatStatistics[0]?.totalUnreadMessages || 0,
          avgResponseTime: Math.round(chatStatistics[0]?.avgResponseTime || 0),
          avgSatisfaction: parseFloat(chatStatistics[0]?.avgSatisfaction || 0).toFixed(1)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export default adminAuth(handler);