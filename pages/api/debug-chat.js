// pages/api/debug-chat.js - ENDPOINT DE DEBUG PARA PLESK
import { generateIntelligentResponse } from '../../lib/intelligent-chatbot-engine';

export default async function handler(req, res) {
  const { message = 'hola' } = req.query;
  
  const logs = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Capturar todos los logs
  console.log = (...args) => {
    logs.push({ type: 'log', message: args.join(' '), timestamp: new Date().toISOString() });
    originalConsoleLog(...args);
  };
  
  console.error = (...args) => {
    logs.push({ type: 'error', message: args.join(' '), timestamp: new Date().toISOString() });
    originalConsoleError(...args);
  };

  try {
    logs.push({ type: 'info', message: '🚀 INICIANDO DEBUG', timestamp: new Date().toISOString() });
    logs.push({ type: 'info', message: `📝 Procesando mensaje: "${message}"`, timestamp: new Date().toISOString() });
    
    // Usar IDs de prueba
    const testConversationId = 1;
    const testSessionId = 'debug-session-123';
    
    logs.push({ type: 'info', message: `🆔 IDs de prueba: conv=${testConversationId}, session=${testSessionId}`, timestamp: new Date().toISOString() });
    
    // Llamar al motor inteligente
    const response = await generateIntelligentResponse(message, testConversationId, testSessionId);
    
    logs.push({ type: 'success', message: '✅ Motor ejecutado exitosamente', timestamp: new Date().toISOString() });
    logs.push({ type: 'success', message: `🎯 Respuesta generada: intent=${response.intent}, confidence=${response.confidence}`, timestamp: new Date().toISOString() });

    // Restaurar console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    res.status(200).json({
      success: true,
      message: `Debug completado para: "${message}"`,
      response: {
        intent: response.intent,
        confidence: response.confidence,
        responseLength: response.response?.length || 0,
        requiresHuman: response.requiresHuman,
        hasFollowUps: response.followUpQuestions?.length > 0
      },
      fullResponse: response,
      logs: logs,
      totalLogs: logs.length,
      errorLogs: logs.filter(l => l.type === 'error').length
    });

  } catch (error) {
    // Restaurar console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    logs.push({ 
      type: 'critical', 
      message: `❌ ERROR CRÍTICO: ${error.message}`, 
      stack: error.stack,
      timestamp: new Date().toISOString() 
    });

    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      logs: logs,
      totalLogs: logs.length,
      errorLogs: logs.filter(l => l.type === 'error' || l.type === 'critical').length,
      message: `Error procesando: "${message}"`
    });
  }
}