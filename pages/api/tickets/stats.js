// pages/api/tickets/stats.js - VERSIÓN SIMPLIFICADA QUE FUNCIONA
import { query } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const {
      period = '30' // días por defecto
    } = req.query;

    // 1. Estadísticas básicas de tickets en el período
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'pending_customer' THEN 1 ELSE 0 END) as pending_customer_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
        
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_tickets,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority_tickets,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority_tickets,
        
        AVG(CASE WHEN customer_rating IS NOT NULL THEN customer_rating END) as avg_customer_rating
      FROM support_tickets 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const basicStats = await query(basicStatsQuery, [parseInt(period)]);
    const stats = basicStats[0];

    // 2. Calcular tasa de resolución
    const resolvedCount = (stats.resolved_tickets || 0) + (stats.closed_tickets || 0);
    const resolutionRate = stats.total_tickets > 0 ? 
      (resolvedCount / stats.total_tickets * 100) : 0;

    // 3. Performance por tipo
    const performanceByTypeQuery = `
      SELECT 
        type,
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_count,
        AVG(CASE WHEN customer_rating IS NOT NULL THEN customer_rating END) as avg_rating
      FROM support_tickets 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY type
      ORDER BY total_tickets DESC
    `;

    const performanceByType = await query(performanceByTypeQuery, [parseInt(period)]);

    // Calcular resolution_rate para cada tipo
    const performanceWithRates = performanceByType.map(type => ({
      ...type,
      resolution_rate: type.total_tickets > 0 ? 
        (type.resolved_count / type.total_tickets * 100) : 0,
      avg_first_response: null, // No calculamos por ahora
      avg_resolution_time: null // No calculamos por ahora
    }));

    // 4. Tickets urgentes (alta prioridad o tickets abiertos hace más de X tiempo)
    const urgentTicketsQuery = `
      SELECT 
        id,
        ticket_number,
        type,
        priority,
        status,
        subject,
        name,
        email,
        created_at,
        TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_open
      FROM support_tickets 
      WHERE status IN ('open', 'in_progress') 
        AND (
          priority = 'high' 
          OR (priority = 'medium' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > 24)
          OR (priority = 'low' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > 48)
        )
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        created_at ASC
      LIMIT 20
    `;

    const urgentTickets = await query(urgentTicketsQuery);

    // 5. Tendencias básicas (últimos 7 días)
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tickets_created,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as tickets_resolved
      FROM support_tickets 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const trends = await query(trendsQuery);

    // 6. Generar recomendaciones simples
    const recommendations = generateSimpleRecommendations(stats, urgentTickets);

    // 7. Respuesta final
    const responseData = {
      summary: {
        total_tickets: stats.total_tickets || 0,
        open_tickets: stats.open_tickets || 0,
        in_progress_tickets: stats.in_progress_tickets || 0,
        pending_customer_tickets: stats.pending_customer_tickets || 0,
        resolved_tickets: stats.resolved_tickets || 0,
        closed_tickets: stats.closed_tickets || 0,
        
        high_priority_tickets: stats.high_priority_tickets || 0,
        medium_priority_tickets: stats.medium_priority_tickets || 0,
        low_priority_tickets: stats.low_priority_tickets || 0,
        
        resolution_rate: Math.round(resolutionRate * 10) / 10,
        avg_customer_rating: stats.avg_customer_rating ? 
          Math.round(stats.avg_customer_rating * 10) / 10 : null,
        
        // Valores por defecto para campos que no calculamos aún
        avg_first_response_hours: null,
        avg_resolution_hours: null,
        response_rate: null,
        period_days: parseInt(period)
      },
      trends: trends.reverse(),
      performance_by_type: performanceWithRates,
      urgent_tickets: urgentTickets,
      recommendations: recommendations
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Función para generar recomendaciones simples
function generateSimpleRecommendations(stats, urgentTickets) {
  const recommendations = [];

  // Recomendaciones basadas en tickets urgentes
  if (urgentTickets.length > 5) {
    recommendations.push({
      type: 'urgent',
      priority: 'high',
      title: 'Tickets Urgentes Acumulados',
      description: `Hay ${urgentTickets.length} tickets que requieren atención inmediata`,
      action: 'Revisar y asignar tickets urgentes a agentes disponibles',
      icon: '🚨'
    });
  }

  // Recomendaciones basadas en satisfacción del cliente
  if (stats.avg_customer_rating && stats.avg_customer_rating < 3.5) {
    recommendations.push({
      type: 'satisfaction',
      priority: 'high',
      title: 'Satisfacción del Cliente Baja',
      description: `Promedio de ${stats.avg_customer_rating.toFixed(1)}/5 estrellas`,
      action: 'Revisar procesos de atención y capacitar al equipo',
      icon: '⭐'
    });
  }

  // Recomendaciones basadas en tasa de resolución
  const resolutionRate = stats.total_tickets > 0 ? 
    ((stats.resolved_tickets + stats.closed_tickets) / stats.total_tickets * 100) : 0;
  
  if (resolutionRate < 80) {
    recommendations.push({
      type: 'resolution',
      priority: 'medium',
      title: 'Tasa de Resolución Baja',
      description: `Solo ${resolutionRate.toFixed(1)}% de tickets resueltos`,
      action: 'Analizar tickets pendientes y optimizar procesos de resolución',
      icon: '📈'
    });
  }

  // Recomendaciones positivas
  if (stats.avg_customer_rating && stats.avg_customer_rating >= 4.5) {
    recommendations.push({
      type: 'positive',
      priority: 'info',
      title: 'Excelente Satisfacción del Cliente',
      description: `Promedio de ${stats.avg_customer_rating.toFixed(1)}/5 estrellas`,
      action: 'Mantener el nivel de calidad y documentar mejores prácticas',
      icon: '🌟'
    });
  }

  if (urgentTickets.length === 0) {
    recommendations.push({
      type: 'positive',
      priority: 'info',
      title: 'No Hay Tickets Urgentes',
      description: 'Todos los tickets están siendo atendidos en tiempo',
      action: 'Excelente trabajo del equipo de soporte',
      icon: '✅'
    });
  }

  // Ordenar por prioridad
  const priorityOrder = { 'high': 1, 'medium': 2, 'info': 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}