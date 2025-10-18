// pages/api/test-bot.js - ENDPOINT DE PRUEBA PARA EL MOTOR DEL BOT
import { debugBotResponse, testGreeting, verifyKnowledgeBase } from '../../lib/chatbot-engine';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { test, message } = req.query;

  try {
    let result;

    switch (test) {
      case 'greeting':
        result = await testGreeting();
        break;
        
      case 'debug':
        if (!message) {
          return res.status(400).json({ error: 'Parameter "message" is required for debug test' });
        }
        result = await debugBotResponse(message);
        break;
        
      case 'verify':
        result = await verifyKnowledgeBase();
        break;
        
      default:
        // Prueba por defecto - verificar conocimiento
        const verification = await verifyKnowledgeBase();
        const greetingTest = await testGreeting();
        const debugTest = await debugBotResponse('hola que tal');
        
        result = {
          verification,
          greetingTest,
          debugTest,
          instructions: {
            'Test específico de saludo': '/api/test-bot?test=greeting',
            'Debug de mensaje': '/api/test-bot?test=debug&message=hola',
            'Verificar base conocimiento': '/api/test-bot?test=verify'
          }
        };
    }

    res.status(200).json({
      success: true,
      test,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}