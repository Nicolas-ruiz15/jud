// lib/chatbot-engine.js - MOTOR INTELIGENTE CON DEBUG MEJORADO
import { query } from './database';
import crypto from 'crypto';

// Función para calcular similitud de texto básica
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

// Función para normalizar texto
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Función para crear hash único del mensaje
export function createMessageHash(sessionId, content, timestamp) {
  const hashString = `${sessionId}_${content.trim()}_${Math.floor(timestamp / 10000)}`;
  return crypto.createHash('sha256').update(hashString).digest('hex');
}

// Función para verificar si es mensaje duplicado
export async function isDuplicateMessage(sessionId, messageContent) {
  try {
    const messageHash = createMessageHash(sessionId, messageContent, Date.now());
    
    const existing = await query(
      'SELECT id FROM chat_message_hashes WHERE session_id = ? AND message_hash = ?',
      [sessionId, messageHash]
    );
    
    if (existing.length > 0) {
      return true;
    }
    
    // Guardar hash del mensaje
    await query(
      'INSERT INTO chat_message_hashes (session_id, message_hash, message_content) VALUES (?, ?, ?)',
      [sessionId, messageHash, messageContent]
    );
    
    return false;
  } catch (error) {
    console.log('⚠️ Duplicate check error:', error.message);
    return false; // En caso de error, permitir el mensaje
  }
}

// Función para obtener contexto de conversación
async function getConversationContext(conversationId, sessionId) {
  try {
    let context = await query(
      'SELECT * FROM chat_conversation_context WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (context.length === 0) {
      // Crear contexto inicial
      await query(`
        INSERT INTO chat_conversation_context (
          conversation_id, session_id, conversation_stage, 
          intent_history, user_preferences, products_mentioned
        ) VALUES (?, ?, 'greeting', '[]', '{}', '[]')
      `, [conversationId, sessionId]);
      
      context = [{
        conversation_id: conversationId,
        session_id: sessionId,
        current_intent: null,
        intent_history: '[]',
        user_preferences: '{}',
        conversation_stage: 'greeting',
        products_mentioned: '[]',
        escalation_requested: false
      }];
    }
    
    const ctx = context[0];
    return {
      conversationId: ctx.conversation_id,
      sessionId: ctx.session_id,
      currentIntent: ctx.current_intent,
      intentHistory: JSON.parse(ctx.intent_history || '[]'),
      userPreferences: JSON.parse(ctx.user_preferences || '{}'),
      conversationStage: ctx.conversation_stage,
      productsMentioned: JSON.parse(ctx.products_mentioned || '[]'),
      escalationRequested: ctx.escalation_requested === 1,
      lastBotResponse: ctx.last_bot_response
    };
  } catch (error) {
    console.log('⚠️ Context error:', error.message);
    return {
      conversationId,
      sessionId,
      currentIntent: null,
      intentHistory: [],
      userPreferences: {},
      conversationStage: 'greeting',
      productsMentioned: [],
      escalationRequested: false,
      lastBotResponse: null
    };
  }
}

// Función para actualizar contexto de conversación
async function updateConversationContext(conversationId, updates) {
  try {
    const setClause = [];
    const values = [];
    
    if (updates.currentIntent) {
      setClause.push('current_intent = ?');
      values.push(updates.currentIntent);
    }
    
    if (updates.intentHistory) {
      setClause.push('intent_history = ?');
      values.push(JSON.stringify(updates.intentHistory));
    }
    
    if (updates.userPreferences) {
      setClause.push('user_preferences = ?');
      values.push(JSON.stringify(updates.userPreferences));
    }
    
    if (updates.conversationStage) {
      setClause.push('conversation_stage = ?');
      values.push(updates.conversationStage);
    }
    
    if (updates.productsMentioned) {
      setClause.push('products_mentioned = ?');
      values.push(JSON.stringify(updates.productsMentioned));
    }
    
    if (updates.lastBotResponse) {
      setClause.push('last_bot_response = ?');
      values.push(updates.lastBotResponse);
    }
    
    if (updates.escalationRequested !== undefined) {
      setClause.push('escalation_requested = ?');
      values.push(updates.escalationRequested ? 1 : 0);
    }
    
    if (setClause.length > 0) {
      setClause.push('updated_at = NOW()');
      values.push(conversationId);
      
      await query(
        `UPDATE chat_conversation_context SET ${setClause.join(', ')} WHERE conversation_id = ?`,
        values
      );
    }
  } catch (error) {
    console.log('⚠️ Context update error:', error.message);
  }
}

// **FUNCIÓN PRINCIPAL MEJORADA PARA ENCONTRAR LA MEJOR RESPUESTA**
async function findBestResponse(userMessage, context) {
  try {
    console.log('🔍 Analizando mensaje:', userMessage);
    const normalizedMessage = normalizeText(userMessage);
    console.log('🔍 Mensaje normalizado:', normalizedMessage);
    
    // Obtener todo el conocimiento activo
    const knowledge = await query(`
      SELECT * FROM chat_bot_knowledge_enhanced 
      WHERE is_active = 1 
      ORDER BY priority DESC, confidence_threshold ASC
    `);
    
    console.log('🔍 Registros de conocimiento encontrados:', knowledge.length);
    
    if (knowledge.length === 0) {
      console.log('❌ No hay registros de conocimiento en la base de datos');
      return { bestMatch: null, confidence: 0 };
    }
    
    let bestMatch = null;
    let bestScore = 0;
    let allScores = []; // Para debugging
    
    for (const item of knowledge) {
      let score = 0;
      let scoreDetails = {
        intent: item.intent,
        keywords: 0,
        context: 0,
        priority: 0,
        total: 0
      };
      
      // Verificar keywords principales
      const triggerWords = item.trigger_keywords.toLowerCase().split(',');
      const messageWords = normalizedMessage.split(' ');
      
      let keywordMatches = 0;
      for (const keyword of triggerWords) {
        const cleanKeyword = keyword.trim();
        if (normalizedMessage.includes(cleanKeyword)) {
          keywordMatches++;
          score += 0.3;
          scoreDetails.keywords += 0.3;
          console.log(`✅ Keyword match: "${cleanKeyword}" en "${item.intent}"`);
        }
      }
      
      // Bonus por múltiples keywords
      if (keywordMatches > 1) {
        score += 0.2;
        scoreDetails.keywords += 0.2;
      }
      
      // Verificar contexto si es requerido
      if (item.requires_context && item.context_intents) {
        const requiredIntents = item.context_intents.split(',');
        if (requiredIntents.some(intent => 
          context.intentHistory.includes(intent.trim()) || 
          context.currentIntent === intent.trim()
        )) {
          score += 0.3;
          scoreDetails.context += 0.3;
        } else if (item.requires_context) {
          console.log(`❌ Contexto requerido no encontrado para: ${item.intent}`);
          continue; // Skip if context is required but not met
        }
      }
      
      // Verificar contexto keywords si existen
      if (item.context_keywords) {
        const contextWords = item.context_keywords.toLowerCase().split(',');
        for (const contextWord of contextWords) {
          if (normalizedMessage.includes(contextWord.trim())) {
            score += 0.1;
            scoreDetails.context += 0.1;
          }
        }
      }
      
      // Bonus por prioridad alta
      const priorityBonus = (item.priority / 100);
      score += priorityBonus;
      scoreDetails.priority = priorityBonus;
      
      // Penalización si fue el último intent para evitar repetición
      if (context.currentIntent === item.intent) {
        score *= 0.7;
        scoreDetails.total = score;
        console.log(`⚠️ Penalización por repetición en: ${item.intent}`);
      }
      
      scoreDetails.total = score;
      allScores.push(scoreDetails);
      
      console.log(`📊 Score para "${item.intent}":`, {
        score: score.toFixed(3),
        threshold: item.confidence_threshold,
        passesThreshold: score >= item.confidence_threshold,
        details: scoreDetails
      });
      
      // Solo considerar si supera el threshold Y es mejor que el actual
      if (score >= item.confidence_threshold && score > bestScore) {
        bestMatch = item;
        bestScore = score;
        console.log(`🏆 Nueva mejor coincidencia: ${item.intent} (${score.toFixed(3)})`);
      }
    }
    
    // Log de resumen
    console.log('📋 Resumen de scoring:', {
      totalEvaluated: knowledge.length,
      bestIntent: bestMatch?.intent || 'ninguno',
      bestScore: bestScore.toFixed(3),
      threshold: bestMatch?.confidence_threshold || 'N/A'
    });
    
    if (bestMatch) {
      console.log('✅ Respuesta encontrada:', {
        intent: bestMatch.intent,
        confidence: bestScore.toFixed(3),
        category: bestMatch.category
      });
    } else {
      console.log('❌ No se encontró respuesta adecuada');
      console.log('🔍 Top 3 scores:', allScores
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map(s => `${s.intent}: ${s.total.toFixed(3)}`)
      );
    }
    
    return { bestMatch, confidence: bestScore };
  } catch (error) {
    console.error('❌ Error finding best response:', error);
    return { bestMatch: null, confidence: 0 };
  }
}

// Función para generar respuesta con variaciones
function generateResponseText(knowledgeItem, context) {
  let responseText = knowledgeItem.response_text;
  
  // Usar variaciones si existen y no es la misma respuesta reciente
  if (knowledgeItem.response_variations) {
    try {
      const variations = JSON.parse(knowledgeItem.response_variations);
      if (variations.length > 0 && context.lastBotResponse !== knowledgeItem.response_text) {
        // Seleccionar variación aleatoria
        const randomIndex = Math.floor(Math.random() * (variations.length + 1));
        if (randomIndex < variations.length) {
          responseText = variations[randomIndex];
        }
      }
    } catch (e) {
      console.log('⚠️ Error parsing response variations:', e.message);
    }
  }
  
  return responseText;
}

// **FUNCIÓN PRINCIPAL DEL MOTOR DE CHATBOT MEJORADA**
export async function generateBotResponse(userMessage, conversationId, sessionId) {
  try {
    console.log('🧠 Processing message with INTELLIGENT engine:', { 
      message: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
      conversationId,
      sessionId: sessionId.substring(0, 20) + '...'
    });
    
    // Obtener contexto de conversación
    const context = await getConversationContext(conversationId, sessionId);
    console.log('📝 Context loaded:', {
      currentIntent: context.currentIntent,
      stage: context.conversationStage,
      historyLength: context.intentHistory.length,
      products: context.productsMentioned
    });
    
    // Encontrar la mejor respuesta
    const { bestMatch, confidence } = await findBestResponse(userMessage, context);
    
    let responseData = {
      response: '',
      confidence: confidence,
      intent: 'unknown',
      requiresHuman: false,
      followUpQuestions: []
    };
    
    if (bestMatch && confidence > 0.3) {
      // **RESPUESTA ENCONTRADA EN KNOWLEDGE BASE**
      console.log('🎯 Using knowledge base response');
      
      responseData.response = generateResponseText(bestMatch, context);
      responseData.intent = bestMatch.intent;
      responseData.requiresHuman = bestMatch.escalate_to_human === 1;
      
      // Agregar follow-up questions si existen
      if (bestMatch.follow_up_questions) {
        try {
          responseData.followUpQuestions = JSON.parse(bestMatch.follow_up_questions);
        } catch (e) {
          console.log('⚠️ Error parsing follow-up questions:', e.message);
          responseData.followUpQuestions = [];
        }
      }
      
      // **ACTUALIZAR CONTEXTO**
      const newIntentHistory = [...context.intentHistory, bestMatch.intent].slice(-5);
      const updatedProducts = [...context.productsMentioned];
      
      // Detectar productos mencionados
      if (bestMatch.category === 'products') {
        const productMap = {
          'tefilin_inquiry': 'tefilin',
          'tallit_inquiry': 'tallit', 
          'mezuzah_inquiry': 'mezuzah',
          'books_inquiry': 'books'
        };
        const product = productMap[bestMatch.intent];
        if (product && !updatedProducts.includes(product)) {
          updatedProducts.push(product);
        }
      }
      
      // Determinar stage de conversación
      let newStage = context.conversationStage;
      if (bestMatch.category === 'greeting') newStage = 'greeting';
      else if (bestMatch.category === 'products') newStage = 'interested';
      else if (bestMatch.intent.includes('pricing')) newStage = 'deciding';
      else if (bestMatch.category === 'escalation') newStage = 'closing';
      
      await updateConversationContext(conversationId, {
        currentIntent: bestMatch.intent,
        intentHistory: newIntentHistory,
        conversationStage: newStage,
        productsMentioned: updatedProducts,
        lastBotResponse: responseData.response,
        escalationRequested: responseData.requiresHuman
      });
      
      // Actualizar estadísticas del knowledge item
      await query(
        'UPDATE chat_bot_knowledge_enhanced SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = ?',
        [bestMatch.id]
      );
      
    } else {
      // **NO SE ENCONTRÓ RESPUESTA ADECUADA - FALLBACK INTELIGENTE**
      console.log('🤖 Using intelligent fallback');
      responseData = getFallbackResponse(userMessage, context);
      
      await updateConversationContext(conversationId, {
        currentIntent: 'fallback',
        lastBotResponse: responseData.response,
        escalationRequested: true
      });
    }
    
    console.log('✅ Response generated successfully:', { 
      intent: responseData.intent, 
      confidence: responseData.confidence.toFixed(3),
      requiresHuman: responseData.requiresHuman,
      hasFollowUps: responseData.followUpQuestions.length > 0
    });
    
    return responseData;
    
  } catch (error) {
    console.error('❌ Chatbot engine error:', error);
    return {
      response: '🤖 Disculpa, hubo un pequeño problema técnico. ¿Podrías reformular tu pregunta?\n\nMientras tanto, puedes contactarnos directamente por WhatsApp: +57 300 929 1156',
      confidence: 0.1,
      intent: 'error',
      requiresHuman: true,
      followUpQuestions: []
    };
  }
}

// Función de respuesta de fallback inteligente
function getFallbackResponse(userMessage, context) {
  const messageLength = userMessage.trim().length;
  const lowerMessage = userMessage.toLowerCase();
  
  // Mensaje muy corto
  if (messageLength < 3) {
    return {
      response: '🤔 Tu mensaje es muy corto. ¿Podrías ser más específico?\n\nPuedes preguntarme sobre:\n• 📿 Tefilín, Tallitot, Mezuzot\n• 📚 Libros judaicos\n• 💰 Precios y envíos\n• 📞 Contacto\n\n¿En qué te puedo ayudar?',
      confidence: 0.6,
      intent: 'unclear_short',
      requiresHuman: false,
      followUpQuestions: ['¿Buscas algún producto específico?', '¿Necesitas ayuda con precios?']
    };
  }
  
  // Detectar si parece una pregunta sugerida no reconocida
  if (lowerMessage.includes('urgente') || lowerMessage.includes('consulta')) {
    return {
      response: '⚡ **Veo que tienes una consulta**\n\n¿Es algo urgente? Te puedo ayudar de inmediato o conectarte con nuestro especialista:\n\n📱 **WhatsApp:** +57 300 929 1156\n☎️ **Llamada:** +57 300 929 1156\n\n💬 **O dime aquí:** ¿Qué necesitas específicamente?',
      confidence: 0.7,
      intent: 'urgency_detected',
      requiresHuman: false,
      followUpQuestions: ['¿Es sobre un producto?', '¿Necesitas hablar ahora?']
    };
  }
  
  // Si menciona productos pero no coincidió
  if (lowerMessage.includes('libro') || lowerMessage.includes('tefilin') || 
      lowerMessage.includes('tallit') || lowerMessage.includes('mezuza')) {
    return {
      response: '📿 **Veo que preguntas sobre nuestros productos**\n\n¿Te refieres a:\n• **Tefilín** - Certificados kosher\n• **Tallitot** - Varios tamaños\n• **Mezuzot** - Con pergaminos\n• **Libros** - Más de 200 títulos\n\n¿Cuál te interesa más? O cuéntame exactamente qué necesitas.',
      confidence: 0.6,
      intent: 'product_clarification',
      requiresHuman: false,
      followUpQuestions: ['¿Para qué ocasión?', '¿Tienes algún presupuesto?']
    };
  }
  
  // Si ya tiene productos mencionados, ofrecer ayuda específica
  if (context.productsMentioned.length > 0) {
    const products = context.productsMentioned.join(', ');
    return {
      response: `🤔 No entiendo bien tu última consulta, pero veo que te interesan: **${products}**\n\n¿Quieres saber sobre:\n• 💰 Precios específicos\n• 📦 Disponibilidad y envíos\n• 📞 Hablar con un especialista\n\n¿Cuál de estas opciones te ayuda?`,
      confidence: 0.5,
      intent: 'contextual_fallback',
      requiresHuman: false,
      followUpQuestions: ['¿Necesitas precios específicos?', '¿Quieres hablar con un especialista?']
    };
  }
  
  // Respuesta general inteligente mejorada
  return {
    response: '🤖 **No estoy seguro de entender tu consulta**\n\nSoy especialista en **Judaica Breslov** y puedo ayudarte con:\n\n📿 **Productos religiosos:** Tefilín, Tallitot, Mezuzot\n📚 **Librería judaica:** Más de 200 títulos\n🕯️ **Artículos para Shabat:** Velas, candelabros\n💰 **Información comercial:** Precios, envíos, pagos\n\n**Prueba preguntarme:**\n"¿Qué tefilín tienes?"\n"¿Cuánto cuesta envío?"\n"Quiero hablar con alguien"\n\n¿Con qué te puedo ayudar?',
    confidence: 0.4,
    intent: 'general_fallback',
    requiresHuman: true,
    followUpQuestions: ['¿Buscas productos religiosos?', '¿Necesitas libros judaicos?', '¿Quieres hablar con un especialista?']
  };
}

// Función para limpiar datos antiguos (ejecutar periódicamente)
export async function cleanupOldData() {
  try {
    // Limpiar hashes de mensajes antiguos (más de 24 horas)
    await query(
      'DELETE FROM chat_message_hashes WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    
    // Limpiar contextos de conversaciones cerradas (más de 7 días)
    await query(`
      DELETE ccc FROM chat_conversation_context ccc
      LEFT JOIN chat_conversations cc ON ccc.conversation_id = cc.id
      WHERE cc.status = 'closed' AND cc.closed_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Función para obtener estadísticas del bot
export async function getBotStats() {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_interactions,
        AVG(confidence_threshold) as avg_confidence,
        SUM(usage_count) as total_usage,
        COUNT(CASE WHEN escalate_to_human = 1 THEN 1 END) as escalation_intents
      FROM chat_bot_knowledge_enhanced 
      WHERE is_active = 1
    `);
    
    const recentPerformance = await query(`
      SELECT 
        cm.bot_confidence as confidence,
        cm.requires_human as escalated,
        cm.created_at
      FROM chat_messages cm
      WHERE cm.sender_type = 'bot' 
        AND cm.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND cm.bot_confidence IS NOT NULL
    `);
    
    return {
      totalIntents: stats[0].total_interactions,
      averageConfidence: stats[0].avg_confidence,
      totalUsage: stats[0].total_usage,
      escalationIntents: stats[0].escalation_intents,
      recent24h: recentPerformance.length,
      recentConfidence: recentPerformance.length > 0 
        ? recentPerformance.reduce((sum, item) => sum + item.confidence, 0) / recentPerformance.length
        : 0
    };
  } catch (error) {
    console.error('❌ Stats error:', error);
    return null;
  }
}

// **FUNCIÓN DE DEBUG MEJORADA**
export async function debugBotResponse(userMessage) {
  try {
    console.log('🔍 DEBUG: Analizando mensaje:', userMessage);
    
    const normalizedMessage = normalizeText(userMessage);
    console.log('🔍 DEBUG: Mensaje normalizado:', normalizedMessage);
    
    // Obtener todo el conocimiento activo
    const knowledge = await query(`
      SELECT id, intent, trigger_keywords, confidence_threshold, priority, is_active, category
      FROM chat_bot_knowledge_enhanced 
      WHERE is_active = 1 
      ORDER BY priority DESC
    `);
    
    console.log('🔍 DEBUG: Registros encontrados:', knowledge.length);
    
    if (knowledge.length === 0) {
      return {
        error: 'No knowledge records found',
        suggestion: 'Verificar que los registros se insertaron correctamente en la BD'
      };
    }
    
    // Verificar coincidencias
    const matches = [];
    for (const item of knowledge) {
      const keywords = item.trigger_keywords.toLowerCase().split(',');
      let keywordMatches = 0;
      let matchedKeywords = [];
      
      for (const keyword of keywords) {
        const cleanKeyword = keyword.trim();
        if (normalizedMessage.includes(cleanKeyword)) {
          keywordMatches++;
          matchedKeywords.push(cleanKeyword);
        }
      }
      
      if (keywordMatches > 0) {
        let score = keywordMatches * 0.3 + (item.priority / 100);
        matches.push({
          intent: item.intent,
          category: item.category,
          score: score,
          threshold: item.confidence_threshold,
          passesThreshold: score >= item.confidence_threshold,
          matchedKeywords,
          priority: item.priority
        });
      }
    }
    
    // Ordenar por score
    matches.sort((a, b) => b.score - a.score);
    
    console.log('🔍 DEBUG: Coincidencias encontradas:', matches.length);
    console.log('🔍 DEBUG: Top matches:', matches.slice(0, 3));
    
    const bestMatch = matches.find(m => m.passesThreshold);
    
    return {
      normalizedMessage,
      totalKnowledge: knowledge.length,
      totalMatches: matches.length,
      bestMatch,
      allMatches: matches.slice(0, 10), // Top 10
      recommendation: bestMatch 
        ? `Debería usar: ${bestMatch.intent} (score: ${bestMatch.score.toFixed(3)})` 
        : 'No hay coincidencias que superen el threshold. Revisar keywords o bajar thresholds.'
    };
    
  } catch (error) {
    console.error('❌ DEBUG ERROR:', error);
    return { error: error.message };
  }
}

// **FUNCIÓN DE PRUEBA RÁPIDA**
export async function testGreeting() {
  console.log('🧪 Testing greeting...');
  const result = await debugBotResponse('hola');
  console.log('🧪 TEST RESULT:', result);
  return result;
}

// **FUNCIÓN PARA VERIFICAR BASE DE CONOCIMIENTOS**
export async function verifyKnowledgeBase() {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
        COUNT(CASE WHEN category = 'greeting' THEN 1 END) as greetings,
        COUNT(CASE WHEN category = 'products' THEN 1 END) as products,
        COUNT(CASE WHEN trigger_keywords LIKE '%hola%' THEN 1 END) as hola_responses
      FROM chat_bot_knowledge_enhanced
    `);
    
    const sampleGreetings = await query(`
      SELECT intent, trigger_keywords, confidence_threshold, is_active
      FROM chat_bot_knowledge_enhanced 
      WHERE trigger_keywords LIKE '%hola%' 
      ORDER BY priority DESC
    `);
    
    return {
      stats: stats[0],
      sampleGreetings,
      isHealthy: stats[0].active > 0 && stats[0].hola_responses > 0
    };
  } catch (error) {
    console.error('❌ Knowledge base verification error:', error);
    return { error: error.message, isHealthy: false };
  }
}