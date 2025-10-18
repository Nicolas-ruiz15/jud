// lib/intelligent-chatbot-engine.js - PARTE 1/4
import { query } from './database';
import redis from './redis';
import crypto from 'crypto';

const SYNONYMS = {
  'tefilin': ['tefilín', 'tefillin', 'phylacteries', 'filacterias', 'cajas de rezo', 'correas de tefilin', 'retzuot'],
  'tallit': ['talit', 'tallitot', 'manto de oracion', 'prayer shawl', 'talit gadol', 'talit katan', 'manto de rezo'],
  'tzitzit': ['tzitzit', 'flecos', 'hilos de tzitzit'],
  'mezuzah': ['mezuza', 'mezuzot', 'pergamino', 'klaf', 'estuche de mezuza', 'caja para mezuza'],
  'libros': [
    'libro', 'libros', 'sefer', 'sfarim', 'texto', 'lectura', 'escritos', 'literatura judia',
    'tehilim', 'salmos', 'sidur', 'sidurim', 'jumash', 'chumash', 'tanaj', 'biblia hebrea',
    'zohar', 'talmud', 'guemara', 'mishna', 'halaja', 'halajot', 'cabala', 'kabbalah'
  ],
  'kipa': ['kipá', 'kipot', 'yarmulke', 'solideo', 'gorro judio', 'kipá tejida', 'kipá de satén'],
  'shofar': ['shofar', 'shofarot', 'cuerno de carnero', 'cuerno'],
  'menorah': ['menora', 'menorá', 'candelabro de 7 brazos', 'janukia', 'hanukia', 'candelabro de januca'],
  'velas': ['vela', 'velas', 'candela', 'luz', 'nerot', 'velas de shabat', 'velas de havdala', 'veladora'],
  'joyeria': ['joyas', 'joyeria', 'collar', 'dije', 'anillo', 'pulsera', 'maguen david', 'estrella de david', 'jai', 'chai'],
  'vino': ['vino', 'vino kosher', 'vino para kidush', 'vinos'],
  'matza': ['matza', 'matzá', 'pan azimo', 'matzot'],
  'hamsa': ['hamsa', 'jamsa', 'mano de fatima', 'mano de miriam', 'amuleto de protección'],
  'comprar': ['comprar', 'adquirir', 'obtener', 'conseguir', 'necesito', 'quiero', 'quisiera', 'busco', 'estoy buscando', 'me interesa', 'venden', 'tienen', 'dónde consigo', 'cómo compro'],
  'precio': ['precio', 'costo', 'valor', 'cuanto cuesta', 'cuánto cuesta', 'cuanto vale', 'cuánto vale', 'cuanto sale', 'cuánto sale', 'tarifa', 'cotizar', 'presupuesto', 'precios'],
  'envio': [
    'envio', 'envío', 'entrega', 'delivery', 'domicilio', 'shipping', 'mandar a', 'despacho', 
    'cuanto tarda en llegar', 'cuánto tarda', 'tiempo de entrega', 'seguimiento', 'rastreo', 
    'costo de envio', 'valor del envio', 'transporte', 'llega a mi ciudad'
  ],
  'disponible': ['disponible', 'disponibilidad', 'stock', 'en existencia', 'hay', 'tienen', 'inventario', 'agotado', 'cuando llega', 'cuando tendrán'],
  'pago': [
    'pago', 'pagar', 'medios de pago', 'formas de pago', 'tarjeta de credito', 'tarjeta', 'efectivo', 
    'contraentrega', 'cuotas', 'financiacion', 'financiamiento', 'pse', 'nequi', 'daviplata'
  ],
  'devolucion': ['devolucion', 'devolver', 'cambio', 'cambiar', 'garantia', 'producto defectuoso', 'no me sirvio', 'no me quedo'],
  'informacion': ['info', 'informacion', 'datos', 'detalles', 'caracteristicas', 'especificaciones', 'de que material es', 'más detalles', 'explicame'],
  'ayuda': ['ayuda', 'help', 'asistencia', 'soporte', 'apoyo', 'problema', 'ayudame', 'estoy perdido', 'no entiendo'],
  'contacto': ['contacto', 'contactar', 'hablar con', 'comunicar', 'telefono', 'teléfono', 'whatsapp', 'correo', 'email', 'agente', 'humano', 'persona', 'especialista', 'asesor'],
  'tienda': ['tienda', 'local', 'ubicacion', 'dirección', 'donde estan', 'dónde están', 'puedo recoger', 'ir a la tienda'],
  'kosher': ['kosher', 'kasher', 'kashrut', 'certificado', 'certificacion', 'rabino', 'supervision', 'hechsher', 'apto para consumo'],
  'calidad': ['buena calidad', 'excelente', 'premium', 'alta gama', 'original', 'autentico', 'auténtico', 'hecho en israel', 'importado'],
  'tamaño': ['talla', 'medida', 'size', 'dimension', 'dimensiones', 'medidas'],
  'pequeño': ['pequeño', 'chico', 'mini', 'small', 's'],
  'mediano': ['mediano', 'medio', 'regular', 'medium', 'm'],
  'grande': ['grande', 'big', 'large', 'xl', 'grande'],
  'bar mitzvah': ['bar mitzva', 'barmitzvah', '13 años', 'regalo para bar mitzva'],
  'bat mitzvah': ['bat mitzva', 'batmitzvah', 'niña', '12 años'],
  'boda': ['boda', 'matrimonio', 'casamiento', 'wedding', 'ketuba', 'regalo de bodas'],
  'regalo': ['regalo', 'obsequio', 'presente', 'para regalar', 'es para un regalo'],
  'festividades': [
    'fiesta', 'festividad', 'jag', 'moed', 'rosh hashana', 'rosh hashana', 'yom kipur', 'yom kippur', 'sucot', 'cabañas',
    'pesaj', 'pesach', 'pascua judia', 'januca', 'hanukkah', 'januka', 'fiesta de las luces', 'purim'
  ],
  'saludo': ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'shalom', 'hey', 'que tal', 'cómo estás'],
  'despedida': ['gracias', 'muy amable', 'perfecto', 'ok', 'listo', 'chao', 'adios', 'hasta luego', 'te agradezco', 'muchas gracias']
};

const STOP_WORDS = new Set([
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 
  'su', 'por', 'son', 'con', 'para', 'mi', 'está', 'tiene', 'me', 'si', 'bien', 'puede',
  'este', 'esta', 'eso', 'ser', 'todo', 'una', 'sobre', 'más', 'muy', 'hacer', 'como',
  'the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of'
]);

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

function extractKeywords(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(word => 
    word.length > 2 && !STOP_WORDS.has(word)
  );
  
  const expandedWords = new Set(words);
  words.forEach(word => {
    Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
      if (synonyms.includes(word) || key === word) {
        expandedWords.add(key);
        synonyms.forEach(syn => expandedWords.add(syn));
      }
    });
  });
  
  return Array.from(expandedWords);
}

function calculateSimilarity(text1, text2) {
  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

async function getConversationContext(conversationId, sessionId) {
  try {
    let context = await query(
      'SELECT * FROM chat_conversation_context WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (context.length === 0) {
      await query(`
        INSERT INTO chat_conversation_context (
          conversation_id, session_id, conversation_stage, 
          intent_history, user_preferences, products_mentioned
        ) VALUES (?, ?, 'greeting', '[]', '{}', '[]')
      `, [conversationId, sessionId]);
      
      return {
        conversationId, sessionId,
        currentIntent: null, intentHistory: [],
        userPreferences: {}, conversationStage: 'greeting',
        productsMentioned: '[]', escalationRequested: false,
        lastBotResponse: null
      };
    }
    
    const ctx = context[0];
    return {
      conversationId: ctx.conversation_id,
      sessionId: ctx.session_id,
      currentIntent: ctx.current_intent,
      intentHistory: JSON.parse(ctx.intent_history || '[]'),
      userPreferences: JSON.parse(ctx.user_preferences || '{}'),
      conversationStage: ctx.conversation_stage,
      productsMentioned: ctx.products_mentioned || '[]',
      escalationRequested: ctx.escalation_requested === 1,
      lastBotResponse: ctx.last_bot_response
    };
  } catch (error) {
    console.log('⚠️ Context error:', error.message);
    return {
      conversationId, sessionId, currentIntent: null, intentHistory: [],
      userPreferences: {}, conversationStage: 'greeting',
      productsMentioned: '[]', escalationRequested: false, lastBotResponse: null
    };
  }
}

async function updateConversationContext(conversationId, updates) {
  try {
    console.log('🔄 Guardando contexto:', { conversationId, updates });
    
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
    
    if (updates.lastBotResponse) {
      setClause.push('last_bot_response = ?');
      values.push(updates.lastBotResponse);
    }
    
    if (updates.escalationRequested !== undefined) {
      setClause.push('escalation_requested = ?');
      values.push(updates.escalationRequested ? 1 : 0);
    }
    
    if (updates.productsMentioned) {
      setClause.push('products_mentioned = ?');
      values.push(updates.productsMentioned);
    }
    
    if (setClause.length > 0) {
      setClause.push('updated_at = NOW()');
      values.push(conversationId);
      
      await query(
        `UPDATE chat_conversation_context SET ${setClause.join(', ')} WHERE conversation_id = ?`,
        values
      );
      console.log('✅ Contexto guardado exitosamente');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️ Error guardando contexto:', error.message);
    return false;
  }
}

class IntelligentChatbot {
  constructor() {
    this.productCache = null;
    this.categoryCache = null;
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 300000;
  }

  async refreshCache() {
    const now = Date.now();
    if (this.productCache && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return;
    }

    console.log('🔄 Actualizando cache de productos...');
    
    try {
      const productsQuery = `
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.description,
          p.short_description,
          p.price,
          p.sale_price,
          p.sku,
          p.stock_quantity,
          p.manage_stock,
          p.stock_status,
          p.weight,
          p.dimensions,
          p.featured,
          p.status,
          p.meta_title,
          p.meta_description,
          p.woocommerce_id,
          p.created_at,
          p.updated_at,
          
          CASE 
            WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 THEN p.sale_price
            ELSE p.price 
          END as display_price,
          
          CASE 
            WHEN p.stock_status = 'in_stock' AND p.stock_quantity > 0 THEN 1
            ELSE 0 
          END as in_stock,
          
          CONCAT_WS(' ',
            p.name,
            p.short_description,
            p.description,
            p.meta_title,
            p.sku
          ) as searchable_text

        FROM products p
        WHERE p.status = 'active'
        ORDER BY 
          p.featured DESC,
          p.created_at DESC
        LIMIT 1000
      `;

      console.log('🔍 Ejecutando consulta optimizada...');
      this.productCache = await query(productsQuery);

      this.categoryCache = [
        { id: 1, name: 'Tefilín', description: 'Tefilín certificados kosher', product_count: 0 },
        { id: 2, name: 'Tallitot', description: 'Mantos de oración auténticos', product_count: 0 },
        { id: 3, name: 'Libros Judaicos', description: 'Literatura y textos sagrados', product_count: 0 },
        { id: 4, name: 'Mezuzot', description: 'Mezuzot con pergaminos kosher', product_count: 0 },
        { id: 5, name: 'Artículos Shabat', description: 'Velas, copas y candelabros', product_count: 0 },
        { id: 6, name: 'Kipot', description: 'Kipot de diferentes materiales', product_count: 0 },
        { id: 7, name: 'Joyería Judaica', description: 'Collares, anillos y amuletos', product_count: 0 }
      ];

      this.categoryCache.forEach(category => {
        const categoryKeywords = category.name.toLowerCase().split(' ');
        category.product_count = this.productCache.filter(product => {
          const productText = product.searchable_text.toLowerCase();
          return categoryKeywords.some(keyword => productText.includes(keyword));
        }).length;
      });
      
      this.lastCacheUpdate = now;
      console.log(`✅ Cache actualizado: ${this.productCache.length} productos, ${this.categoryCache.length} categorías`);
      
    } catch (error) {
      console.error('❌ Error crítico actualizando cache:', error);
      this.productCache = []; 
      this.categoryCache = [];
    }
  }

  async searchProducts(query, options = {}) {
    await this.refreshCache();
    
    const keywords = extractKeywords(query);
    const results = [];

    console.log('🔍 Buscando productos con keywords:', keywords);

    for (const product of this.productCache) {
      let score = 0;
      
      const searchableText = `
        ${product.name || ''} 
        ${product.description || ''} 
        ${product.short_description || ''} 
        ${product.meta_title || ''} 
        ${product.searchable_text || ''}
      `.toLowerCase();
      
      keywords.forEach(keyword => {
        if (searchableText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      keywords.forEach(keyword => {
        if (product.name.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
      });

      if (product.short_description) {
        keywords.forEach(keyword => {
          if (product.short_description.toLowerCase().includes(keyword.toLowerCase())) {
            score += 0.5;
          }
        });
      }

      if (product.featured === 1) {
        score += 0.3;
      }

      if (product.stock_status === 'in_stock' && product.stock_quantity > 0) {
        score += 0.2;
      }

      if (product.stock_status === 'out_of_stock') {
        score -= 0.5;
      }

      if (score > 0) {
        results.push({
          ...product,
          searchScore: score,
          matchedKeywords: keywords.filter(k => 
            searchableText.includes(k.toLowerCase())
          ),
          displayPrice: product.sale_price || product.price,
          stockInfo: {
            status: product.stock_status,
            quantity: product.stock_quantity || 0,
            available: product.stock_status === 'in_stock' && (product.stock_quantity || 0) > 0
          }
        });
      }
    }

    const sortedResults = results
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }
        return (b.featured || 0) - (a.featured || 0);
      })
      .slice(0, options.limit || 10);

    console.log(`📊 Encontrados ${sortedResults.length} productos relevantes de ${this.productCache.length} total`);
    
    return sortedResults;
  }

  async analyzeIntent(message) {
    try {
      console.log('🧠 Analizando intención del mensaje:', message);
      
      const keywords = extractKeywords(message);
      const lowercaseMsg = message.toLowerCase();
      
      const selectionMatch = lowercaseMsg.match(/^\s*(\d+)\.?\s*$/);
      if (selectionMatch) {
        const productIndex = parseInt(selectionMatch[1], 10) - 1;
        if (productIndex >= 0) {
          return { intent: 'product_selection', confidence: 0.95, entities: { productIndex }, keywords: [], originalMessage: message };
        }
      }

      let intent = 'general';
      let confidence = 0;
      let entities = {};

      if (keywords.some(k => ['shabat', 'kidush', 'havdala', 'jalá'].includes(k))) {
        intent = 'shabbat_inquiry';
        confidence = 0.9;
      }
      else if (keywords.some(k => ['tefilin', 'tallit', 'mezuzah', 'libros', 'kipa', 'velas', 'shofar', 'joyeria', 'vino', 'matza', 'hamsa'].includes(k))) {
        intent = 'product_search';
        confidence = 0.8;
        entities.products = [];
        Object.keys(SYNONYMS).forEach(product => {
          if (keywords.some(k => k === product || SYNONYMS[product].includes(k))) {
            if (['tefilin', 'tallit', 'mezuzah', 'libros', 'kipa', 'velas', 'shofar', 'joyeria', 'vino', 'matza', 'hamsa'].includes(product)) {
              entities.products.push(product);
            }
          }
        });
      }
      else if (keywords.some(k => ['precio', 'costo', 'cuanto', 'valor'].includes(k))) {
        intent = 'price_inquiry';
        confidence = 0.8;
      }
      else if (keywords.some(k => ['envio', 'entrega', 'shipping'].includes(k))) {
        intent = 'shipping_info';
        confidence = 0.8;
      }
      else if (keywords.some(k => ['disponible', 'stock', 'hay', 'tienen'].includes(k))) {
        intent = 'stock_inquiry';
        confidence = 0.8;
      }
      else if (keywords.some(k => ['contacto', 'hablar', 'whatsapp', 'telefono'].includes(k))) {
        intent = 'contact_request';
        confidence = 0.9;
      }
      else if (['hola', 'hello', 'shalom', 'buenos', 'buenas'].some(w => lowercaseMsg.includes(w))) {
        intent = 'greeting';
        confidence = 0.9;
      }

      console.log('🏷️ Extrayendo entidades...');
      
      const numbers = message.match(/\d+/g);
      if (numbers) {
        entities.numbers = numbers.map(n => parseInt(n));
        console.log('🔢 Números encontrados:', entities.numbers);
      }
      
      if (['bar mitzvah', 'boda', 'regalo', 'cumpleanos'].some(o => lowercaseMsg.includes(o))) {
        entities.occasion = 'special_event';
        console.log('🎉 Ocasión especial detectada');
      }
      
      if (['pequeño', 'mediano', 'grande', 'xl', 'chico'].some(s => keywords.includes(s))) {
        entities.size = keywords.find(k => ['pequeño', 'mediano', 'grande', 'xl', 'chico'].includes(k));
        console.log('📏 Tamaño detectado:', entities.size);
      }

      const result = { intent, confidence, entities, keywords, originalMessage: message };
      console.log('🎯 Análisis completado:', result);
      return result;

    } catch (error) {
      console.error('❌ Error en analyzeIntent:', error);
      throw error;
    }
  }

  async generateResponse(analysis, conversationContext = {}) {
    try {
      console.log('📝 Generando respuesta para:', analysis.intent);
      const conversationId = conversationContext.conversationId;
      let response;
      
      switch (analysis.intent) {
        case 'greeting':
          response = this.generateGreeting(conversationContext);
          break;
        case 'product_search':
          response = await this.generateProductSearchResponse(analysis, conversationId);
          break;
        case 'price_inquiry':
          response = await this.generatePriceResponse(analysis);
          break;
        case 'shipping_info':
          response = this.generateShippingResponse(analysis);
          break;
        case 'stock_inquiry':
          response = await this.generateStockResponse(analysis, conversationId);
          break;
        case 'contact_request':
          response = this.generateContactResponse();
          break;
        case 'shabbat_inquiry':
          response = await this.generateShabbatResponse(analysis, conversationId);
          break;
        case 'product_selection':
          response = await this.generateProductSelectionResponse(analysis, conversationContext);
          break;
        default:
          response = await this.generateFallbackResponse(analysis, conversationId);
      }

      console.log('✅ Respuesta generada exitosamente.');
      return response;

    } catch (error) {
      console.error('❌ Error en generateResponse:', error);
      throw error;
    }
  }

  generateGreeting(context) {
    const hour = new Date().getHours();
    let timeGreeting = hour < 12 ? '¡Buenos días!' : hour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
    
    const greetings = [
      `${timeGreeting} ¡Shalom! 👋 Soy tu asistente especializado en productos judaicos.`,
      `${timeGreeting} 🌟 ¡Bienvenido a Judaica Breslov Colombia!`,
      `${timeGreeting} ✨ Me da mucho gusto saludarte. ¿En qué puedo ayudarte?`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return {
      response: `${greeting}\n\n🏪 **Especialistas en:**\n📿 Tefilín certificados kosher\n🕊️ Tallitot auténticos\n🏠 Mezuzot con pergaminos\n📚 Libros judaicos (200+ títulos)\n🕯️ Artículos para Shabat\n\n¿Qué producto te interesa o en qué puedo ayudarte?`,
      confidence: 0.9,
      intent: 'greeting',
      requiresHuman: false,
      followUpQuestions: [
        '¿Buscas algún producto específico?',
        '¿Necesitas información de precios?',
        '¿Es para una ocasión especial?'
      ]
    };
  }

  generateContactResponse() {
    return {
      response: `📞 **¡Perfecto! Aquí tienes nuestros canales de contacto:**\n\n📱 **WhatsApp inmediato:** +57 300 929 1156\n☎️ **Llamada directa:** +57 300 929 1156\n📧 **Email:** contacto@judaicabreslovcolombia.com\n\n**Horarios de atención:**\n🕘 Lunes a Viernes: 9:00 AM - 6:00 PM\n🕘 Sábados: 9:00 AM - 3:00 PM\n🕘 Domingos: Cerrado (Shabat)\n\n**¿Prefieres que te conecte directamente con WhatsApp?**`,
      confidence: 0.95,
      intent: 'contact_request',
      requiresHuman: false,
      followUpQuestions: [
        '📱 Abrir WhatsApp',
        '☎️ Llamar ahora',
        '📧 Enviar email'
      ]
    };
  }
 async generateShabbatResponse(analysis, conversationId) {
    const shabbatProducts = await this.searchProducts('shabat candelabro copa kidush jalá havdala velas', { limit: 5 });

    let response = `🕯️ ¡Claro! Para **Shabat** tenemos artículos preciosos para embellecer tu mesa:\n\n`;

    if (shabbatProducts.length > 0) {
      shabbatProducts.forEach((product, index) => {
        const price = product.sale_price || product.price;
        response += `${index + 1}. **${product.name}** - $${new Intl.NumberFormat('es-CO').format(price)}\n`;
      });
      response += `\nDime el número del que te interesa para darte más detalles.`;
    } else {
      response += `En este momento no encuentro productos específicos de Shabat, pero puedo ayudarte a buscar velas, copas de kidush o cubre jalot por separado.`;
    }

    return {
      response,
      confidence: 0.95,
      intent: 'shabbat_inquiry',
      requiresHuman: false,
      followUpQuestions: ['Ver copas de Kidush', 'Mostrar candelabros', '¿Tienen velas?']
    };
  }

  async generateProductSearchResponse(analysis) {
    if (!analysis.entities.products || analysis.entities.products.length === 0) {
      const products = await this.searchProducts(analysis.originalMessage, { limit: 5 });
      
      if (products.length > 0) {
        let response = '🔍 **Productos encontrados:**\n\n';
        
        products.slice(0, 3).forEach((product, index) => {
          const price = product.displayPrice;
          const stock = product.stockInfo;
          
          response += `${index + 1}. **${product.name}**\n`;
          response += `💰 $${new Intl.NumberFormat('es-CO').format(price)}`;
          
          if (product.sale_price && product.price > product.sale_price) {
            const discount = Math.round(((product.price - product.sale_price) / product.price) * 100);
            response += ` (${discount}% OFF)`;
          }
          response += '\n';
          
          if (stock.available) {
            response += `✅ Disponible`;
            if (stock.quantity > 0) {
              response += ` (${stock.quantity} unidades)`;
            }
          } else {
            response += `⚠️ ${stock.status === 'out_of_stock' ? 'Agotado' : 'Consultar disponibilidad'}`;
          }
          response += '\n';
          
          const description = product.short_description || product.description || 'Sin descripción';
          response += `📝 ${description.substring(0, 100)}...\n\n`;
        });
        
        response += '¿Te interesa alguno de estos productos? Dime el número para más detalles.';
        
        return {
          response,
          confidence: 0.8,
          intent: 'product_search',
          requiresHuman: false,
          followUpQuestions: products.slice(0, 3).map((p, i) => `Detalles del ${i + 1}`)
        };
      }
    } else {
      const productType = analysis.entities.products[0];
      return await this.generateSpecificProductResponse(productType, analysis);
    }

    return await this.generateFallbackResponse(analysis);
  }

  async generateSpecificProductResponse(productType, analysis, conversationId) {
    const products = await this.searchProducts(productType, { limit: 5 });
    
    if (products.length === 0) {
      return {
        response: `😔 No encontré productos específicos para "${productType}" en este momento.\n\n📞 Para una consulta más detallada, puedes hablar con un especialista.\n\n📱 WhatsApp: +57 300 929 1156`,
        confidence: 0.6,
        intent: 'product_not_found',
        requiresHuman: true,
        followUpQuestions: ['¿Buscas otro producto?', 'Hablar con especialista']
      };
    }

    let emoji = '📦';
    switch(productType) {
      case 'tefilin': emoji = '📿'; break;
      case 'libros': emoji = '📚'; break;
      case 'tallit': emoji = '🕊️'; break;
      case 'mezuzah': emoji = '🏠'; break;
      case 'kipa': emoji = '👑'; break;
      case 'velas': emoji = '🕯️'; break;
    }
    
    let response = `${emoji} ¡Claro! Encontré estas opciones de **${productType}** para ti:\n\n`;

    const topProducts = products.slice(0, 3);

    topProducts.forEach((product, index) => {
      const price = product.displayPrice;
      response += `${index + 1}. **${product.name}** - $${new Intl.NumberFormat('es-CO').format(price)}`;
      
      if (product.sale_price && product.price > product.sale_price) {
        response += ` 🏷️ ¡OFERTA!`;
      }
      
      if (product.featured) {
        response += ` ⭐ DESTACADO`;
      }
      
      response += '\n';
    });

    if (products.length > 3) {
      response += `\n... y ${products.length - 3} opciones más.`;
    }

    response += '\n\nDime el número del que te interesa para darte más detalles.';

    return {
      response,
      confidence: 0.9,
      intent: `${productType}_search`,
      requiresHuman: false,
      followUpQuestions: topProducts.map((p, i) => `Ver detalles del ${i + 1}`)
    };
  }

  async generatePriceResponse(analysis) {
    if (analysis.entities.products && analysis.entities.products.length > 0) {
      const productType = analysis.entities.products[0];
      const products = await this.searchProducts(productType, { limit: 5 });
      
      if (products.length > 0) {
        let response = `💰 **Precios de ${productType}:**\n\n`;
        
        const prices = products.map(p => p.displayPrice || p.price).sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];
        
        response += `📊 **Rango de precios:** $${new Intl.NumberFormat('es-CO').format(minPrice)} - $${new Intl.NumberFormat('es-CO').format(maxPrice)}\n\n`;
        
        products.slice(0, 3).forEach(product => {
          const price = product.displayPrice || product.price;
          response += `• **${product.name}**: $${new Intl.NumberFormat('es-CO').format(price)}`;
          if (product.sale_price) {
            response += ` (¡Oferta!)`;
          }
          response += '\n';
        });
        
        response += '\n🚚 **Envío GRATIS** en compras superiores a $200,000\n💳 Múltiples formas de pago disponibles';
        
        return {
          response,
          confidence: 0.9,
          intent: 'price_specific',
          requiresHuman: false,
          followUpQuestions: [
            '¿Te interesa alguna opción?',
            '¿Necesitas más detalles?',
            '¿Quieres información de financiación?'
          ]
        };
      }
    }

    await this.refreshCache();
    
    const categoryPrices = {};
    this.productCache.forEach(product => {
      const category = 'Productos Judaicos';
      const price = product.sale_price || product.price;
      
      if (!categoryPrices[category]) {
        categoryPrices[category] = { min: price, max: price, count: 0 };
      }
      
      categoryPrices[category].min = Math.min(categoryPrices[category].min, price);
      categoryPrices[category].max = Math.max(categoryPrices[category].max, price);
      categoryPrices[category].count++;
    });

    let response = '💰 **Lista de Precios - Judaica Breslov**\n\n';
    
    Object.entries(categoryPrices).forEach(([category, data]) => {
      response += `📂 **${category}**\n`;
      if (data.min === data.max) {
        response += `   $${new Intl.NumberFormat('es-CO').format(data.min)}\n`;
      } else {
        response += `   $${new Intl.NumberFormat('es-CO').format(data.min)} - $${new Intl.NumberFormat('es-CO').format(data.max)}\n`;
      }
      response += `   (${data.count} productos disponibles)\n\n`;
    });

    response += '🚚 **Envío GRATIS** en compras +$200,000\n💳 Aceptamos todas las formas de pago\n📱 Financiación disponible\n\n¿Qué categoría te interesa más?';

    return {
      response,
      confidence: 0.8,
      intent: 'price_general',
      requiresHuman: false,
      followUpQuestions: [
        '¿Buscas algo en un rango específico?',
        '¿Te interesa alguna categoría?',
        '¿Necesitas financiación?'
      ]
    };
  }

  generateShippingResponse(analysis) {
    const response = `📦 **Información Completa de Envíos**

🆓 **ENVÍO GRATIS** en compras superiores a $200,000
⚡ **Envío EXPRESS** disponible

⏰ **Tiempos de entrega:**
🏙️ **Bogotá, Medellín, Cali:** 1-2 días hábiles
🌆 **Ciudades principales:** 2-3 días hábiles  
🏘️ **Otras ciudades:** 3-5 días hábiles
🏔️ **Zonas rurales:** 5-8 días hábiles

📋 **Incluye:**
✅ Número de seguimiento
✅ Seguro de envío
✅ Empaque especial para productos delicados
✅ Notificaciones por WhatsApp

💳 **Formas de pago:**
• Tarjetas de crédito/débito
• PSE
• Efectivo contra entrega (+$8,000)
• Transferencia bancaria

¿A qué ciudad necesitas el envío?`;

    return {
      response,
      confidence: 0.9,
      intent: 'shipping_info',
      requiresHuman: false,
      followUpQuestions: [
        '¿A qué ciudad envías?',
        '¿Necesitas envío express?',
        '¿Prefieres contra entrega?'
      ]
    };
  }

  async generateStockResponse(analysis, conversationId) {
    if (analysis.entities.products && analysis.entities.products.length > 0) {
      const productType = analysis.entities.products[0];
      const products = await this.searchProducts(productType, { limit: 10 });
      
      if (products.length > 0) {
        let response = `📊 **Disponibilidad de ${productType}:**\n\n`;
        const inStock = products.filter(p => p.stock_quantity > 0);
        
        if (inStock.length > 0) {
          response += `✅ ¡Sí! Tenemos ${inStock.length} tipo(s) de ${productType} disponibles para envío inmediato.\n\nAquí tienes algunos:\n`;
          inStock.slice(0, 3).forEach((product, index) => {
            const price = product.sale_price || product.price;
            response += `${index + 1}. **${product.name}** - $${new Intl.NumberFormat('es-CO').format(price)}\n`;
          });
          response += `\nDime el número del que te interesa para darte más detalles.`;
        } else {
          response += `😔 Lo siento, parece que los artículos de "${productType}" están agotados en este momento. ¿Te gustaría que te avisemos cuando lleguen?`;
        }

        return {
          response,
          confidence: 0.9,
          intent: 'stock_specific',
          requiresHuman: false,
          followUpQuestions: inStock.length > 0 ? inStock.slice(0, 3).map((p, i) => `Detalles del ${i+1}`) : ['Avisarme cuando llegue', 'Buscar otro producto']
        };
      }
    }

    return {
      response: 'Claro, puedo verificar la disponibilidad. ¿Qué producto específico te interesa saber si tenemos en stock?',
      confidence: 0.7,
      intent: 'stock_general_inquiry',
      requiresHuman: false,
      followUpQuestions: ['¿Tienen tefilin?', '¿Hay kipá disponible?', 'Ver libros']
    };
  }

  async generateProductSelectionResponse(analysis, context) {
    console.log('🎯 PRODUCT SELECTION - Iniciando');
    
    const productIndex = analysis.entities.productIndex;
    const mentionedProductsJSON = context.productsMentioned || '[]';
    
    let mentionedProducts;
    try {
      mentionedProducts = JSON.parse(mentionedProductsJSON);
    } catch (parseError) {
      console.error('❌ Error parseando productos:', parseError);
      mentionedProducts = [];
    }

    if (mentionedProducts && mentionedProducts[productIndex]) {
      const product = mentionedProducts[productIndex];
      const productUrl = `https://judaicabreslovcolombia.com/producto/${product.id}`;
      
      let response = `✅ ¡Perfecto! Aquí tienes los detalles de **${product.name}**:\n\n`;
      response += `💰 **Precio:** $${new Intl.NumberFormat('es-CO').format(product.price)}\n`;
      
      if (product.description) {
        response += `📝 **Descripción:** ${product.description.substring(0, 200)}...\n`;
      }
      
      response += `\n🛒 **[VER Y COMPRAR AQUÍ](${productUrl})**\n\n`;
      response += `¿Te gustaría ver otro producto o necesitas ayuda con algo más?`;

      return {
        response,
        confidence: 0.95,
        intent: 'product_selection_details',
        requiresHuman: false,
        followUpQuestions: [
          '🛒 Ir a comprar',
          '🔍 Ver más opciones',
          '📞 Hablar con especialista'
        ],
        productLink: productUrl,
        selectedProduct: product
      };
    } else {
      return {
        response: '🤔 Disculpa, no estoy seguro a qué producto te refieres. ¿Podrías buscar el producto por su nombre para que pueda ayudarte?',
        confidence: 0.6,
        intent: 'selection_error',
        requiresHuman: false,
        followUpQuestions: ['🔍 Buscar velas', '📚 Ver libros', '📿 Ver tefilín']
      };
    }
  }

  async generateFallbackResponse(analysis) {
    const keywords = analysis.keywords;
    const products = await this.searchProducts(analysis.originalMessage, { limit: 3 });
    
    if (products.length > 0) {
      let response = `🤔 No entendí completamente tu pregunta, pero encontré estos productos relacionados:\n\n`;
      
      products.forEach((product, index) => {
        const price = product.displayPrice || product.price;
        response += `${index + 1}. **${product.name}** - ${new Intl.NumberFormat('es-CO').format(price)}\n`;
      });
      
      response += `\n¿Te refieres a alguno de estos? ¿O puedes ser más específico con tu consulta?`;
      
      return {
        response,
        confidence: 0.5,
        intent: 'partial_match',
        requiresHuman: false,
        followUpQuestions: [
          '¿Es sobre alguno de estos productos?',
          '¿Puedes reformular tu pregunta?',
          '¿Prefieres hablar con un especialista?'
        ]
      };
    }

    if (keywords.some(k => ['precio', 'costo'].includes(k))) {
      return {
        response: `💰 Veo que preguntas sobre precios. Te puedo ayudar con:\n\n• Precios de productos específicos\n• Rangos de precios por categoría\n• Ofertas y descuentos actuales\n\n¿Qué producto específico te interesa?`,
        confidence: 0.6,
        intent: 'price_help',
        requiresHuman: false,
        followUpQuestions: ['Ver tefilín', 'Ver libros', 'Ver precios generales']
      };
    } else if (keywords.some(k => ['envio', 'entrega'].includes(k))) {
      return this.generateShippingResponse(analysis);
    } else {
      return {
        response: `🤖 **No logré entender completamente tu consulta**\n\nSoy especialista en **Judaica Breslov** y puedo ayudarte con:\n\n📿 **Productos:** Tefilín, Tallitot, Mezuzot, Libros\n💰 **Información comercial:** Precios, stock, envíos\n📞 **Contacto:** Especialistas humanos disponibles\n\n**Ejemplos de preguntas:**\n"¿Qué tefilín tienes disponibles?"\n"¿Cuánto cuesta un tallit mediano?"\n"¿Hacen envíos a mi ciudad?"\n\n¿Puedes reformular tu pregunta?`,
        confidence: 0.4,
        intent: 'fallback_intelligent',
        requiresHuman: true,
        followUpQuestions: [
          '¿Buscas algún producto específico?',
          '¿Necesitas ayuda con precios?',
          '¿Prefieres hablar con un especialista?'
        ]
      };
    }
  }
}
export async function generateIntelligentResponse(userMessage, conversationId, sessionId, dashboardContext = null) {
  console.log('🧠 MOTOR INTELIGENTE INICIADO');
  console.log('📝 Parámetros recibidos:', {
    userMessage: userMessage?.substring(0, 50),
    conversationId,
    sessionId: sessionId?.substring(0, 15)
  });
  
  try {
    console.log('🧠 INTELLIGENT ENGINE - Processing:', userMessage.substring(0, 100) + '...');
    
    const chatbot = new IntelligentChatbot();
    console.log('✅ Chatbot creado exitosamente');
    
    console.log('🔍 Paso 2: Analizando intención...');
    const analysis = await chatbot.analyzeIntent(userMessage);
    console.log('📊 Analysis completado:', {
      intent: analysis.intent,
      confidence: analysis.confidence,
      entities: Object.keys(analysis.entities || {}),
      keywordCount: analysis.keywords?.length || 0
    });
    
    console.log('📋 Paso 3: Obteniendo contexto...');
    let context;
    try {
      context = await getConversationContext(conversationId, sessionId);
      console.log('✅ Contexto obtenido:', {
        conversationId: context.conversationId,
        stage: context.conversationStage,
        hasHistory: context.intentHistory?.length > 0
      });
    } catch (contextError) {
      console.error('⚠️ Error obteniendo contexto:', contextError.message);
      context = {
        conversationId, sessionId,
        currentIntent: null, intentHistory: [],
        userPreferences: {}, conversationStage: 'greeting',
        productsMentioned: '[]', escalationRequested: false,
        lastBotResponse: null
      };
    }
    
    console.log('💭 Paso 4: Generando respuesta...');
    const response = await chatbot.generateResponse(analysis, context);
    console.log('✨ Respuesta generada:', {
      intent: response.intent,
      confidence: response.confidence,
      hasFollowUps: response.followUpQuestions?.length > 0,
      responseLength: response.response?.length
    });
    
    console.log('📝 Paso 5: Actualizando contexto...');
    try {
      await updateConversationContext(conversationId, {
        currentIntent: response.intent,
        intentHistory: [...(context.intentHistory || []), response.intent].slice(-10),
        lastBotResponse: response.response,
        escalationRequested: response.requiresHuman
      });
      console.log('✅ Contexto actualizado');
    } catch (updateError) {
      console.log('⚠️ Error actualizando contexto:', updateError.message);
    }
    
    console.log('🎉 MOTOR INTELIGENTE COMPLETADO EXITOSAMENTE');
    return response;
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en generateIntelligentResponse:');
    console.error('📍 Nombre del error:', error.name);
    console.error('📝 Mensaje del error:', error.message);
    console.error('📚 Stack trace:', error.stack);
    console.error('🔧 Datos de entrada:', {
      userMessage: userMessage?.substring(0, 100),
      conversationId,
      sessionId: sessionId?.substring(0, 15)
    });
    
    return {
      response: '🤖 Disculpa, tuve un problema procesando tu consulta. ¿Podrías intentar de nuevo?\n\n📱 Para asistencia inmediata: WhatsApp +57 300 929 1156',
      confidence: 0.1,
      intent: 'system_error',
      requiresHuman: true,
      followUpQuestions: ['¿Intentas reformular tu pregunta?', '¿Prefieres contacto directo?'],
      error: true,
      errorDetails: error.message
    };
  }
}

export async function trackChatEvent(sessionId, eventType, metadata = {}) {
  try {
    await query(`
      INSERT INTO analytics_events (
        session_id, event_type, event_category, event_action,
        metadata, created_at
      ) VALUES (?, ?, 'chat', 'intelligent_response', ?, NOW())
    `, [sessionId, eventType, JSON.stringify(metadata)]);
  } catch (error) {
    console.log('⚠️ Analytics tracking failed:', error.message);
  }
}

export function createMessageHash(sessionId, content, timestamp) {
  const hashString = `${sessionId}_${content.trim()}_${Math.floor(timestamp / 10000)}`;
  return crypto.createHash('sha256').update(hashString).digest('hex');
}

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
    
    await query(
      'INSERT INTO chat_message_hashes (session_id, message_hash, message_content) VALUES (?, ?, ?)',
      [sessionId, messageHash, messageContent]
    );
    
    return false;
  } catch (error) {
    console.log('⚠️ Duplicate check error:', error.message);
    return false;
  }
}

export async function testIntelligentEngine(message = 'hola, busco un tefilin para bar mitzvah') {
  console.log('🧪 Testing Intelligent Engine with:', message);
  
  try {
    const chatbot = new IntelligentChatbot();
    const analysis = await chatbot.analyzeIntent(message);
    console.log('📊 Intent Analysis:', analysis);
    
    const response = await chatbot.generateResponse(analysis);
    console.log('🤖 Generated Response:', {
      intent: response.intent,
      confidence: response.confidence,
      responseLength: response.response.length,
      hasFollowUps: response.followUpQuestions?.length > 0
    });
    
    return {
      success: true,
      analysis,
      response,
      message: 'Test completed successfully'
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Test failed'
    };
  }
}

export async function getIntelligentStats() {
  try {
    const chatbot = new IntelligentChatbot();
    await chatbot.refreshCache();
    
    return {
      productCount: chatbot.productCache?.length || 0,
      categoryCount: chatbot.categoryCache?.length || 0,
      cacheAge: Date.now() - chatbot.lastCacheUpdate,
      cacheValid: (Date.now() - chatbot.lastCacheUpdate) < chatbot.cacheTimeout,
      synonymsCount: Object.keys(SYNONYMS).length,
      stopWordsCount: STOP_WORDS.size
    };
  } catch (error) {
    return { error: error.message };
  }
}

function enhanceResponseWithDashboardContext(baseResponse, visitorInfo, intent) {
  if (!visitorInfo) return baseResponse;
  
  let enhancedResponse = baseResponse;
  
  if (visitorInfo.behavior?.cartValue > 0) {
    enhancedResponse += `\n\n💰 *Veo que tienes $${visitorInfo.behavior.cartValue} en tu carrito. ¿Te puedo ayudar a completar tu pedido?*`;
  }
  
  if (visitorInfo.isRegistered && visitorInfo.user?.name) {
    enhancedResponse = enhancedResponse.replace(
      /¡Hola!/g, 
      `¡Hola ${visitorInfo.user.name}! Me da gusto verte de nuevo.`
    );
  }
  
  if (visitorInfo.traffic?.source === 'google' && visitorInfo.traffic?.keyword) {
    enhancedResponse += `\n\n🔍 *Vi que llegaste buscando "${visitorInfo.traffic.keyword}". Perfecto, puedo ayudarte con eso.*`;
  }
  
  if (visitorInfo.session?.currentPage?.includes('checkout') && intent !== 'checkout_help') {
    enhancedResponse += `\n\n🛒 *Noto que estás en el proceso de compra. ¿Necesitas ayuda para finalizar tu pedido?*`;
  }
  
  if (visitorInfo.location?.country && visitorInfo.location.country !== 'Colombia') {
    enhancedResponse += `\n\n🌍 *Veo que escribes desde ${visitorInfo.location.country}. ¡Realizamos envíos internacionales!*`;
  }
  
  return enhancedResponse;
}