// scripts/cleanup-maintenance.js - MANTENIMIENTO AUTOMÁTICO DEL CHAT
import { query } from '../lib/database.js';
import { cleanupOldData, getBotStats } from '../lib/chatbot-engine.js';

// Función principal de limpieza
async function performMaintenance() {
  console.log('🧹 Iniciando mantenimiento del sistema de chat...');
  
  try {
    // 1. Limpiar hashes de mensajes antiguos (más de 24 horas)
    console.log('📋 Limpiando hashes de mensajes antiguos...');
    const hashResult = await query(`
      DELETE FROM chat_message_hashes 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    console.log(`✓ Eliminados ${hashResult.affectedRows} hashes antiguos`);

    // 2. Limpiar contextos de conversaciones cerradas (más de 7 días)
    console.log('🗂️ Limpiando contextos de conversaciones cerradas...');
    const contextResult = await query(`
      DELETE ccc FROM chat_conversation_context ccc
      LEFT JOIN chat_conversations cc ON ccc.conversation_id = cc.id
      WHERE cc.status = 'closed' AND cc.closed_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    console.log(`✓ Eliminados ${contextResult.affectedRows} contextos obsoletos`);

    // 3. Cerrar conversaciones inactivas (más de 2 horas sin actividad)
    console.log('⏰ Cerrando conversaciones inactivas...');
    const inactiveResult = await query(`
      UPDATE chat_conversations 
      SET status = 'closed', 
          closed_at = NOW(),
          duration_minutes = TIMESTAMPDIFF(MINUTE, created_at, last_message_at)
      WHERE status = 'active' 
        AND last_message_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
    `);
    console.log(`✓ Cerradas ${inactiveResult.affectedRows} conversaciones inactivas`);

    // 4. Limpiar mensajes de prueba/spam (opcional)
    console.log('🚫 Limpiando mensajes de prueba...');
    const spamResult = await query(`
      UPDATE chat_messages 
      SET is_deleted = 1, updated_at = NOW()
      WHERE message_content REGEXP '^(test|prueba|hola test|testing|aaa+|111+)$' 
        AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND is_deleted = 0
    `);
    console.log(`✓ Marcados ${spamResult.affectedRows} mensajes de prueba como eliminados`);

    // 5. Optimizar estadísticas del bot
    console.log('📊 Actualizando estadísticas del bot...');
    await updateBotStatistics();

    // 6. Limpiar analytics antiguos (más de 30 días)
    console.log('📈 Limpiando analytics antiguos...');
    try {
      const analyticsResult = await query(`
        DELETE FROM chat_analytics 
        WHERE date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);
      console.log(`✓ Eliminados ${analyticsResult.affectedRows} registros de analytics`);
    } catch (analyticsError) {
      console.log('⚠️ Analytics cleanup skipped:', analyticsError.message);
    }

    // 7. Actualizar métricas de respuesta
    console.log('⚡ Actualizando métricas de respuesta...');
    await updateResponseMetrics();

    // 8. Generar reporte de mantenimiento
    const report = await generateMaintenanceReport();
    console.log('📋 Reporte de mantenimiento generado:', report);

    console.log('✅ Mantenimiento completado exitosamente');
    return { success: true, report };

  } catch (error) {
    console.error('❌ Error durante el mantenimiento:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar estadísticas del conocimiento del bot
async function updateBotStatistics() {
  try {
    // Calcular tasa de éxito por intent
    const intentStats = await query(`
      SELECT 
        JSON_EXTRACT(metadata, '$.intent') as intent,
        COUNT(*) as total_uses,
        AVG(bot_confidence) as avg_confidence,
        COUNT(CASE WHEN requires_human = 0 THEN 1 END) as successful_responses
      FROM chat_messages 
      WHERE sender_type = 'bot' 
        AND bot_confidence IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY JSON_EXTRACT(metadata, '$.intent')
      HAVING intent IS NOT NULL
    `);

    // Actualizar tabla de conocimiento con estadísticas
    for (const stat of intentStats) {
      const intent = stat.intent?.replace(/"/g, ''); // Remover comillas JSON
      if (intent) {
        const successRate = (stat.successful_responses / stat.total_uses) * 100;
        
        await query(`
          UPDATE chat_bot_knowledge_enhanced 
          SET usage_count = usage_count + ?,
              success_rate = ?,
              updated_at = NOW()
          WHERE intent = ?
        `, [stat.total_uses, successRate, intent]);
      }
    }

    console.log(`✓ Actualizadas estadísticas de ${intentStats.length} intents`);
    
  } catch (error) {
    console.log('⚠️ Error actualizando estadísticas del bot:', error.message);
  }
}

// Actualizar métricas de tiempo de respuesta
async function updateResponseMetrics() {
  try {
    // Calcular tiempos de respuesta promedio por conversación
    const responseMetrics = await query(`
      SELECT 
        c.id as conversation_id,
        TIMESTAMPDIFF(SECOND, 
          MIN(CASE WHEN m.sender_type = 'user' THEN m.created_at END),
          MIN(CASE WHEN m.sender_type IN ('bot', 'agent') THEN m.created_at END)
        ) as first_response_time,
        AVG(TIMESTAMPDIFF(SECOND, 
          LAG(m.created_at) OVER (PARTITION BY c.id ORDER BY m.created_at),
          m.created_at
        )) as avg_response_time
      FROM chat_conversations c
      JOIN chat_messages m ON c.id = m.conversation_id
      WHERE c.status = 'closed' 
        AND c.first_response_at IS NULL
        AND c.closed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY c.id
      HAVING first_response_time IS NOT NULL
    `);

    // Actualizar conversaciones con métricas calculadas
    for (const metric of responseMetrics) {
      await query(`
        UPDATE chat_conversations 
        SET first_response_at = DATE_ADD(created_at, INTERVAL ? SECOND),
            response_time_avg = COALESCE(?, response_time_avg),
            updated_at = NOW()
        WHERE id = ?
      `, [
        metric.first_response_time,
        metric.avg_response_time,
        metric.conversation_id
      ]);
    }

    console.log(`✓ Actualizadas métricas de ${responseMetrics.length} conversaciones`);
    
  } catch (error) {
    console.log('⚠️ Error actualizando métricas de respuesta:', error.message);
  }
}

// Generar reporte de mantenimiento
async function generateMaintenanceReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM chat_conversations WHERE DATE(created_at) = ?) as conversations_today,
        (SELECT COUNT(*) FROM chat_conversations WHERE status = 'active') as active_conversations,
        (SELECT COUNT(*) FROM chat_messages WHERE DATE(created_at) = ?) as messages_today,
        (SELECT COUNT(*) FROM chat_bot_knowledge_enhanced WHERE is_active = 1) as active_intents,
        (SELECT AVG(bot_confidence) FROM chat_messages WHERE sender_type = 'bot' AND DATE(created_at) = ?) as avg_bot_confidence
    `, [today, today, today]);

    // Intents más utilizados
    const topIntents = await query(`
      SELECT 
        JSON_EXTRACT(metadata, '$.intent') as intent,
        COUNT(*) as usage_count,
        AVG(bot_confidence) as avg_confidence
      FROM chat_messages 
      WHERE sender_type = 'bot' 
        AND DATE(created_at) = ?
        AND JSON_EXTRACT(metadata, '$.intent') IS NOT NULL
      GROUP BY JSON_EXTRACT(metadata, '$.intent')
      ORDER BY usage_count DESC
      LIMIT 5
    `, [today]);

    // Rendimiento por hora
    const hourlyStats = await query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(DISTINCT conversation_id) as conversations,
        COUNT(*) as messages,
        AVG(CASE WHEN sender_type = 'bot' THEN bot_confidence END) as avg_confidence
      FROM chat_messages 
      WHERE DATE(created_at) = ?
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [today]);

    return {
      date: today,
      timestamp: new Date().toISOString(),
      general: generalStats[0],
      topIntents: topIntents.map(intent => ({
        intent: intent.intent?.replace(/"/g, ''),
        usageCount: intent.usage_count,
        avgConfidence: Math.round(intent.avg_confidence * 100) / 100
      })),
      hourlyActivity: hourlyStats,
      systemHealth: {
        avgBotConfidence: Math.round((generalStats[0].avg_bot_confidence || 0) * 100) / 100,
        conversationCloseRate: generalStats[0].active_conversations > 0 ? 
          Math.round((1 - generalStats[0].active_conversations / generalStats[0].conversations_today) * 100) : 0
      }
    };
    
  } catch (error) {
    console.log('⚠️ Error generando reporte:', error.message);
    return { error: error.message };
  }
}

// Función para ejecutar mantenimiento específico
async function runSpecificMaintenance(task) {
  console.log(`🔧 Ejecutando tarea específica: ${task}`);
  
  switch (task) {
    case 'cleanup-hashes':
      return await query(`DELETE FROM chat_message_hashes WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`);
    
    case 'close-inactive':
      return await query(`
        UPDATE chat_conversations 
        SET status = 'closed', closed_at = NOW(),
            duration_minutes = TIMESTAMPDIFF(MINUTE, created_at, last_message_at)
        WHERE status = 'active' AND last_message_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
      `);
    
    case 'update-stats':
      await updateBotStatistics();
      return { message: 'Estadísticas actualizadas' };
    
    case 'generate-report':
      return await generateMaintenanceReport();
    
    default:
      throw new Error(`Tarea desconocida: ${task}`);
  }
}

// Exportar funciones
export {
  performMaintenance,
  runSpecificMaintenance,
  updateBotStatistics,
  updateResponseMetrics,
  generateMaintenanceReport
};

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  performMaintenance()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}