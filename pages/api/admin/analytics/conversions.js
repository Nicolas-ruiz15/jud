// pages/api/admin/analytics/conversions.js - API DE CONVERSIONES
import { query } from '../../../../lib/database';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { period = '7d' } = req.query;
    
    // Determinar el rango de fechas
    let dateFilter = '';
    switch (period) {
      case '1d':
        dateFilter = 'DATE(c.created_at) = CURDATE()';
        break;
      case '7d':
        dateFilter = 'c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateFilter = 'c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90d':
        dateFilter = 'c.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      default:
        dateFilter = 'c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    // Obtener conversiones con información detallada
    const conversions = await query(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        s.device_type,
        s.city,
        s.country,
        s.referrer,
        
        -- Información adicional de la sesión
        TIMESTAMPDIFF(SECOND, s.created_at, c.created_at) as time_to_conversion,
        
        -- Última página antes de la conversión
        (SELECT page_path FROM analytics_page_views 
         WHERE session_id = c.session_id 
           AND created_at <= c.created_at 
         ORDER BY created_at DESC 
         LIMIT 1) as conversion_page_path
         
      FROM analytics_conversions c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN analytics_sessions s ON c.session_id = s.id
      WHERE ${dateFilter}
      ORDER BY c.created_at DESC
      LIMIT 100
    `);

    // Obtener estadísticas de conversiones
    const statsQuery = await query(`
      SELECT 
        COUNT(*) as totalConversions,
        COALESCE(SUM(c.conversion_value), 0) as totalValue,
        COALESCE(AVG(c.conversion_value), 0) as averageValue,
        
        -- Calcular tasa de conversión
        (COUNT(DISTINCT c.session_id) * 100.0 / 
         NULLIF((SELECT COUNT(DISTINCT s.id) 
                 FROM analytics_sessions s 
                 WHERE ${dateFilter.replace('c.created_at', 's.created_at')}), 0)
        ) as conversionRate,
        
        -- Conversiones por tipo
        COUNT(CASE WHEN c.conversion_type = 'purchase' THEN 1 END) as purchases,
        COUNT(CASE WHEN c.conversion_type = 'add_to_cart' THEN 1 END) as addToCarts,
        COUNT(CASE WHEN c.conversion_type = 'contact_form' THEN 1 END) as contactForms,
        COUNT(CASE WHEN c.conversion_type = 'chat_started' THEN 1 END) as chatStarts,
        
        -- Valor por tipo
        COALESCE(SUM(CASE WHEN c.conversion_type = 'purchase' THEN c.conversion_value END), 0) as purchaseValue,
        COALESCE(SUM(CASE WHEN c.conversion_type = 'add_to_cart' THEN c.conversion_value END), 0) as cartValue

      FROM analytics_conversions c
      WHERE ${dateFilter}
    `);

    // Obtener conversiones por día para gráfico
    const dailyConversions = await query(`
      SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as conversions,
        COALESCE(SUM(c.conversion_value), 0) as value,
        COUNT(DISTINCT c.conversion_type) as uniqueTypes
      FROM analytics_conversions c
      WHERE ${dateFilter}
      GROUP BY DATE(c.created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Obtener top páginas que generan conversiones
    const topConversionPages = await query(`
      SELECT 
        c.page_path,
        COUNT(*) as conversions,
        COALESCE(SUM(c.conversion_value), 0) as totalValue,
        COUNT(DISTINCT c.conversion_type) as conversionTypes
      FROM analytics_conversions c
      WHERE ${dateFilter}
        AND c.page_path IS NOT NULL
        AND c.page_path != ''
      GROUP BY c.page_path
      ORDER BY conversions DESC
      LIMIT 10
    `);

    // Obtener fuentes de tráfico que convierten mejor
    const topConvertingSources = await query(`
      SELECT 
        CASE 
          WHEN s.referrer IS NULL OR s.referrer = '' THEN 'Direct'
          WHEN s.referrer LIKE '%google%' THEN 'Google'
          WHEN s.referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN s.referrer LIKE '%instagram%' THEN 'Instagram'
          ELSE 'Other'
        END as source,
        COUNT(DISTINCT c.id) as conversions,
        COALESCE(SUM(c.conversion_value), 0) as totalValue,
        COUNT(DISTINCT c.session_id) as convertingSessions
      FROM analytics_conversions c
      LEFT JOIN analytics_sessions s ON c.session_id = s.id
      WHERE ${dateFilter}
      GROUP BY source
      ORDER BY conversions DESC
    `);

    // Preparar respuesta
    const stats = statsQuery[0] || {
      totalConversions: 0,
      totalValue: 0,
      averageValue: 0,
      conversionRate: 0,
      purchases: 0,
      addToCarts: 0,
      contactForms: 0,
      chatStarts: 0,
      purchaseValue: 0,
      cartValue: 0
    };

    res.status(200).json({
      success: true,
      data: {
        conversions: conversions.map(conversion => ({
          ...conversion,
          // Parsear metadata si existe
          metadata: conversion.metadata ? 
            (typeof conversion.metadata === 'string' ? 
              JSON.parse(conversion.metadata) : conversion.metadata
            ) : null,
          
          // Formatear tiempo hasta conversión
          timeToConversion: conversion.time_to_conversion ? 
            Math.floor(conversion.time_to_conversion / 60) + ' min' : null
        })),
        
        stats: {
          ...stats,
          conversionRate: parseFloat(stats.conversionRate || 0)
        },
        
        dailyConversions,
        topConversionPages,
        topConvertingSources,
        
        period,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en conversions API:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default adminAuth(handler);