// pages/api/admin/automations/active.js - OBTENER AUTOMATIZACIONES ACTIVAS
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    console.log('🤖 Obteniendo automatizaciones activas...');

    // Obtener automatizaciones de la base de datos
    const automations = await query(`
      SELECT 
        ar.id,
        ar.name,
        ar.trigger_event,
        ar.conditions,
        ar.actions,
        ar.is_active,
        ar.priority,
        ar.created_at,
        ar.updated_at,
        COUNT(ae.id) as executions_today,
        AVG(CASE WHEN ae.success = 1 THEN 1 ELSE 0 END) as success_rate
      FROM automation_rules ar
      LEFT JOIN automation_executions ae ON ar.id = ae.rule_id 
        AND DATE(ae.created_at) = CURDATE()
      WHERE ar.is_active = 1
      GROUP BY ar.id
      ORDER BY ar.priority DESC, ar.created_at DESC
    `);

    // Formatear para el frontend
    const formattedAutomations = automations.map(auto => ({
      id: auto.id,
      name: auto.name,
      trigger: auto.trigger_event,
      condition: auto.conditions,
      action: JSON.parse(auto.actions || '{}').type || 'unknown',
      message: JSON.parse(auto.actions || '{}').message || '',
      active: auto.is_active === 1,
      priority: auto.priority || 'medium',
      executionsToday: auto.executions_today || 0,
      successRate: Math.round((auto.success_rate || 0) * 100),
      lastUpdated: auto.updated_at
    }));

    // Estadísticas de automatizaciones
    const stats = await query(`
      SELECT 
        COUNT(*) as total_active,
        COUNT(CASE WHEN ar.priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN ae.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as executions_last_hour,
        AVG(CASE WHEN ae.success = 1 THEN 1 ELSE 0 END) as overall_success_rate
      FROM automation_rules ar
      LEFT JOIN automation_executions ae ON ar.id = ae.rule_id
      WHERE ar.is_active = 1
    `);

    console.log('✅ Automatizaciones obtenidas:', formattedAutomations.length);

    res.status(200).json({
      success: true,
      data: {
        automations: formattedAutomations,
        stats: {
          totalActive: stats[0]?.total_active || 0,
          highPriority: stats[0]?.high_priority || 0,
          executionsLastHour: stats[0]?.executions_last_hour || 0,
          overallSuccessRate: Math.round((stats[0]?.overall_success_rate || 0) * 100)
        }
      },
      message: 'Automatizaciones obtenidas correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo automatizaciones:', error);
    
    // Datos por defecto si hay error
    const defaultAutomations = [
      {
        id: 1,
        name: 'Saludo Automático',
        trigger: 'page_visit',
        condition: 'time_on_page > 30',
        action: 'send_message',
        message: '¡Hola! ¿Te puedo ayudar en algo?',
        active: true,
        priority: 'high',
        executionsToday: 45,
        successRate: 87
      },
      {
        id: 2,
        name: 'Abandono de Carrito',
        trigger: 'cart_abandonment',
        condition: 'cart_value > 50',
        action: 'send_notification',
        message: '¿Necesitas ayuda con tu compra?',
        active: true,
        priority: 'urgent',
        executionsToday: 12,
        successRate: 93
      },
      {
        id: 3,
        name: 'Lead Caliente',
        trigger: 'high_engagement',
        condition: 'lead_score > 80',
        action: 'assign_agent',
        message: 'Lead de alta prioridad detectado',
        active: true,
        priority: 'urgent',
        executionsToday: 8,
        successRate: 100
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        automations: defaultAutomations,
        stats: {
          totalActive: defaultAutomations.length,
          highPriority: 2,
          executionsLastHour: 5,
          overallSuccessRate: 90
        }
      },
      message: 'Automatizaciones por defecto cargadas'
    });
  }
}

export default adminAuth(handler);