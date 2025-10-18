// pages/api/admin/crm/leads.js - GESTIÓN DE LEADS
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method === 'GET') {
    return getLeads(req, res);
  } else if (req.method === 'POST') {
    return createLead(req, res);
  } else if (req.method === 'PUT') {
    return updateLead(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }
}

// Obtener leads
async function getLeads(req, res) {
  try {
    const { status = 'all', limit = 50, page = 1 } = req.query;
    
    console.log('📊 Obteniendo leads...');
    
    // Consulta para obtener leads desde visitantes con alto scoring
    const leadsQuery = `
      SELECT 
        s.id as session_id,
        s.user_id,
        u.name as lead_name,
        u.email as lead_email,
        u.phone as lead_phone,
        s.ip_address,
        s.country,
        s.city,
        s.utm_source as source,
        s.utm_campaign as campaign,
        s.page_views,
        s.duration_seconds,
        s.created_at as first_visit,
        s.updated_at as last_activity,
        
        -- Carrito si existe
        cart.total_value as cart_value,
        cart.total_items as cart_items,
        
        -- Chat si existe
        c.id as conversation_id,
        c.status as chat_status,
        c.message_count,
        
        -- Calcular lead score
        LEAST(100, (
          (s.page_views * 8) +
          (s.duration_seconds / 10) +
          (CASE WHEN cart.total_value > 0 THEN 30 ELSE 0 END) +
          (CASE WHEN c.id IS NOT NULL THEN 20 ELSE 0 END) +
          (CASE WHEN u.id IS NOT NULL THEN 15 ELSE 0 END)
        )) as lead_score,
        
        -- Determinar status basado en score
        CASE 
          WHEN LEAST(100, (
            (s.page_views * 8) +
            (s.duration_seconds / 10) +
            (CASE WHEN cart.total_value > 0 THEN 30 ELSE 0 END) +
            (CASE WHEN c.id IS NOT NULL THEN 20 ELSE 0 END) +
            (CASE WHEN u.id IS NOT NULL THEN 15 ELSE 0 END)
          )) >= 90 THEN 'urgent'
          WHEN LEAST(100, (
            (s.page_views * 8) +
            (s.duration_seconds / 10) +
            (CASE WHEN cart.total_value > 0 THEN 30 ELSE 0 END) +
            (CASE WHEN c.id IS NOT NULL THEN 20 ELSE 0 END) +
            (CASE WHEN u.id IS NOT NULL THEN 15 ELSE 0 END)
          )) >= 80 THEN 'hot'
          WHEN LEAST(100, (
            (s.page_views * 8) +
            (s.duration_seconds / 10) +
            (CASE WHEN cart.total_value > 0 THEN 30 ELSE 0 END) +
            (CASE WHEN c.id IS NOT NULL THEN 20 ELSE 0 END) +
            (CASE WHEN u.id IS NOT NULL THEN 15 ELSE 0 END)
          )) >= 60 THEN 'warm'
          ELSE 'cold'
        END as lead_status

      FROM analytics_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN shopping_carts cart ON s.id = cart.session_id AND cart.status = 'active'
      LEFT JOIN chat_conversations c ON s.id = c.session_id AND c.status = 'active'
      WHERE s.updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND (
          s.page_views > 3 OR 
          s.duration_seconds > 120 OR 
          cart.total_value > 0 OR 
          c.id IS NOT NULL
        )
      HAVING lead_score >= 40
      ORDER BY lead_score DESC, s.updated_at DESC
      LIMIT ?
    `;

    const leads = await query(leadsQuery, [parseInt(limit)]);

    // Formatear leads para el frontend
    const formattedLeads = leads.map(lead => ({
      id: lead.session_id,
      name: lead.lead_name || `Visitante ${lead.session_id.substring(0, 8)}`,
      email: lead.lead_email,
      phone: lead.lead_phone,
      score: Math.round(lead.lead_score),
      status: lead.lead_status,
      source: lead.source || 'direct',
      campaign: lead.campaign,
      value: parseFloat(lead.cart_value || 0),
      cartItems: lead.cart_items || 0,
      pageViews: lead.page_views,
      timeOnSite: lead.duration_seconds,
      location: {
        country: lead.country,
        city: lead.city,
        ip: lead.ip_address
      },
      conversationId: lead.conversation_id,
      chatStatus: lead.chat_status,
      messageCount: lead.message_count || 0,
      firstVisit: lead.first_visit,
      lastActivity: lead.last_activity,
      tags: [], // Se puede expandir después
      notes: '', // Se puede expandir después
      assignedTo: null // Se puede expandir después
    }));

    // Estadísticas de leads
    const stats = {
      totalLeads: formattedLeads.length,
      hotLeads: formattedLeads.filter(l => l.status === 'hot' || l.status === 'urgent').length,
      warmLeads: formattedLeads.filter(l => l.status === 'warm').length,
      coldLeads: formattedLeads.filter(l => l.status === 'cold').length,
      averageScore: formattedLeads.length > 0 ? 
        Math.round(formattedLeads.reduce((acc, l) => acc + l.score, 0) / formattedLeads.length) : 0,
      totalValue: formattedLeads.reduce((acc, l) => acc + l.value, 0),
      withEmail: formattedLeads.filter(l => l.email).length,
      withCart: formattedLeads.filter(l => l.value > 0).length,
      withChat: formattedLeads.filter(l => l.conversationId).length
    };

    console.log('✅ Leads obtenidos:', { count: formattedLeads.length, hotLeads: stats.hotLeads });

    res.status(200).json({
      success: true,
      data: {
        leads: formattedLeads,
        stats: stats,
        pagination: {
          currentPage: parseInt(page),
          totalItems: formattedLeads.length,
          itemsPerPage: parseInt(limit)
        }
      },
      message: 'Leads obtenidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message,
      data: {
        leads: [],
        stats: {
          totalLeads: 0,
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
          averageScore: 0,
          totalValue: 0
        }
      }
    });
  }
}

// Crear nuevo lead
async function createLead(req, res) {
  try {
    const {
      sessionId,
      name,
      email,
      phone,
      source,
      score,
      notes,
      tags
    } = req.body;

    console.log('📝 Creando nuevo lead:', { sessionId, name, email });

    // Crear usuario si no existe
    let userId = null;
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
      } else {
        const userResult = await query(`
          INSERT INTO users (name, email, phone, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `, [name, email, phone]);
        
        userId = userResult.insertId;
      }
    }

    // Actualizar sesión con user_id
    if (userId && sessionId) {
      await query(`
        UPDATE analytics_sessions 
        SET user_id = ?, updated_at = NOW()
        WHERE id = ?
      `, [userId, sessionId]);
    }

    // Registrar en lead_scoring si la tabla existe
    try {
      await query(`
        INSERT INTO lead_scoring (
          session_id, user_id, score, factors, notes, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          score = VALUES(score),
          notes = VALUES(notes),
          tags = VALUES(tags),
          updated_at = NOW()
      `, [
        sessionId,
        userId,
        score || 50,
        JSON.stringify({ manual: true }),
        notes || '',
        JSON.stringify(tags || [])
      ]);
    } catch (leadError) {
      console.log('Tabla lead_scoring no existe, continuando...');
    }

    res.status(200).json({
      success: true,
      data: {
        leadId: sessionId,
        userId: userId,
        name: name,
        email: email
      },
      message: 'Lead creado correctamente'
    });

  } catch (error) {
    console.error('❌ Error creando lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando lead: ' + error.message
    });
  }
}

// Actualizar lead existente
async function updateLead(req, res) {
  try {
    const {
      leadId,
      name,
      email,
      phone,
      score,
      status,
      notes,
      tags,
      assignedTo
    } = req.body;

    console.log('📝 Actualizando lead:', { leadId, name, score });

    // Actualizar usuario si existe
    if (email) {
      await query(`
        UPDATE users 
        SET name = ?, phone = ?, updated_at = NOW()
        WHERE email = ?
      `, [name, phone, email]);
    }

    // Actualizar lead_scoring si la tabla existe
    try {
      await query(`
        INSERT INTO lead_scoring (
          session_id, score, status, notes, tags, assigned_to, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          score = VALUES(score),
          status = VALUES(status),
          notes = VALUES(notes),
          tags = VALUES(tags),
          assigned_to = VALUES(assigned_to),
          updated_at = NOW()
      `, [
        leadId,
        score,
        status,
        notes || '',
        JSON.stringify(tags || []),
        assignedTo
      ]);
    } catch (leadError) {
      console.log('Tabla lead_scoring no existe, usando analytics_sessions...');
    }

    res.status(200).json({
      success: true,
      data: {
        leadId: leadId,
        updated: true
      },
      message: 'Lead actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando lead: ' + error.message
    });
  }
}

export default adminAuth(handler);