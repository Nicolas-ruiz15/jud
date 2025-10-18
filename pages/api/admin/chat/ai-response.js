import { generateIntelligentResponse } from '../../../../lib/intelligent-chatbot-engine-v3';
import { adminAuth } from '../../../../middleware/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { message, visitorContext, chatHistory, conversationId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mensaje requerido'
      });
    }

    console.log('🤖 Admin solicitando sugerencia IA:', {
      message: message.substring(0, 50),
      conversationId,
      hasVisitorContext: !!visitorContext
    });

    // Usar el motor V3 con contexto del visitante
    const aiResponse = await generateIntelligentResponse(
      message, 
      conversationId, 
      visitorContext?.session_id || 'admin_session'
    );

    console.log('✅ Sugerencia IA generada para admin:', {
      intent: aiResponse.intent,
      confidence: aiResponse.confidence
    });

    res.status(200).json({
      success: true,
      response: aiResponse.response,
      data: {
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        requiresHuman: aiResponse.requiresHuman,
        followUpQuestions: aiResponse.followUpQuestions || [],
        engine: 'admin_assisted_v3'
      }
    });

  } catch (error) {
    console.error('❌ Error en AI suggestion para admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando sugerencia',
      response: 'No pude generar una sugerencia en este momento. Intenta responder manualmente.'
    });
  }
}

export default adminAuth(handler);