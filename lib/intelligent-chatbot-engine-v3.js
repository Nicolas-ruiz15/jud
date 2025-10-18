// lib/intelligent-chatbot-engine-v4.js - MOTOR ULTRA INTELIGENTE OPTIMIZADO
import { query } from './database';
import crypto from 'crypto';

// ============================================
// SISTEMA DE COMPRENSIÓN MEJORADO
// ============================================

class NLPProcessor {
  constructor() {
    // Mapa expandido de sinónimos y variaciones
    this.synonymGroups = {
      'tefilin': {
        variations: ['tefilín', 'tefillin', 'phylacteries', 'filacterias', 'tfilin', 'tefilines'],
        related: ['cajas de rezo', 'correas', 'retzuot', 'batim'],
        types: ['rashi', 'rabeinu tam', 'ashkenazi', 'sefardi', 'sefaradi'],
        context: ['rezo', 'oracion', 'plegaria', 'mitzvah']
      },
      'tallit': {
        variations: ['talit', 'tallitot', 'talitot', 'tallis', 'talis'],
        related: ['manto de oracion', 'prayer shawl', 'tzitzit', 'tzitzis'],
        types: ['gadol', 'katan', 'lana', 'seda', 'algodon'],
        context: ['rezo', 'sinagoga', 'shabat']
      },
      'mezuzah': {
        variations: ['mezuza', 'mezuzot', 'mezuzá', 'mezuzah'],
        related: ['pergamino', 'klaf', 'estuche', 'caja'],
        types: ['kosher', 'decorativa', 'plata', 'madera'],
        context: ['puerta', 'hogar', 'casa', 'bendicion']
      },
      'libros': {
        variations: ['libro', 'sefer', 'sfarim', 'sefarim', 'texto', 'textos'],
        related: ['sidur', 'sidurim', 'jumash', 'chumash', 'tanaj', 'tanakh', 'tehilim', 'salmos'],
        types: ['torah', 'talmud', 'mishna', 'guemara', 'halaja', 'cabala', 'zohar', 'midrash'],
        context: ['estudio', 'lectura', 'aprendizaje', 'judaismo']
      },
      'kipa': {
        variations: ['kipá', 'kipot', 'yarmulke', 'yarmulka', 'kippah', 'kippa'],
        related: ['solideo', 'gorro judio', 'cobertura'],
        types: ['tejida', 'saten', 'terciopelo', 'cuero', 'bordada'],
        context: ['cabeza', 'usar', 'llevar']
      }
    };

    // Patrones de intención mejorados con regex más precisos
    this.intentPatterns = {
      greeting: {
        patterns: [/^(hola|hey|hi|buenos?\s*(dias?|tardes?|noches?)|shalom|que\s+tal)/i],
        confidence: 0.95
      },
      productSearch: {
        patterns: [
          /busco\s+(.+)/i,
          /necesito\s+(.+)/i,
          /quiero\s+(.+)/i,
          /tienen\s+(.+)/i,
          /hay\s+(.+)/i,
          /mostrar?\s+(.+)/i,
          /ver\s+(.+)/i,
          /que\s+(.+)\s+tienen/i
        ],
        confidence: 0.9
      },
      priceInquiry: {
        patterns: [
          /cuanto\s+(cuesta|vale|es|sale)/i,
          /precio\s+(de|del|para)/i,
          /valor\s+(de|del)/i,
          /\$\s*\d+/,
          /presupuesto/i,
          /cotiz/i
        ],
        confidence: 0.92
      },
      availability: {
        patterns: [
          /hay\s+(disponible|stock)/i,
          /tienen?\s+(en\s+)?stock/i,
          /disponibilidad/i,
          /cuando\s+llega/i,
          /agotado/i
        ],
        confidence: 0.88
      },
      purchase: {
        patterns: [
          /como\s+compro/i,
          /donde\s+compro/i,
          /quiero\s+comprar/i,
          /proceso\s+de\s+compra/i,
          /forma\s+de\s+pago/i,
          /metodo\s+de\s+pago/i,
          /comprar/i
        ],
        confidence: 0.94
      },
      shipping: {
        patterns: [
          /envio/i,
          /envian?\s+a/i,
          /delivery/i,
          /entrega/i,
          /cuanto\s+tarda/i,
          /tiempo\s+de\s+entrega/i,
          /transportadora/i
        ],
        confidence: 0.9
      },
      contact: {
        patterns: [
          /contacto/i,
          /whatsapp/i,
          /telefono/i,
          /llamar/i,
          /hablar\s+con/i,
          /asesor/i,
          /ayuda\s+personal/i
        ],
        confidence: 0.93
      }
    };

    // Palabras clave de contexto
    this.contextKeywords = {
      urgency: ['urgente', 'rapido', 'pronto', 'hoy', 'mañana', 'ya'],
      quality: ['mejor', 'calidad', 'premium', 'economico', 'barato', 'bueno'],
      quantity: ['varios', 'muchos', 'cantidad', 'docena', 'par'],
      occasion: ['regalo', 'bar mitzvah', 'bat mitzvah', 'boda', 'festividad', 'shabat']
    };
  }

  // Normalización avanzada de texto
  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      // Normalizar acentos
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      // Normalizar espacios múltiples
      .replace(/\s+/g, ' ')
      // Mantener números pero normalizar puntuación
      .replace(/[^\w\s\d]/g, ' ')
      .trim();
  }

  // Extracción inteligente de entidades
  extractEntities(text) {
    const normalized = this.normalizeText(text);
    const entities = {
      products: [],
      numbers: [],
      context: [],
      modifiers: []
    };

    // Extraer números
    const numbers = normalized.match(/\d+/g);
    if (numbers) {
      entities.numbers = numbers.map(n => parseInt(n));
    }

    // Buscar productos mencionados
    for (const [product, data] of Object.entries(this.synonymGroups)) {
      const allTerms = [
        ...data.variations,
        ...data.related,
        ...data.types
      ];

      for (const term of allTerms) {
        if (normalized.includes(term.toLowerCase())) {
          if (!entities.products.includes(product)) {
            entities.products.push(product);
          }
          // Agregar contexto específico
          if (data.types.some(type => normalized.includes(type.toLowerCase()))) {
            entities.modifiers.push(...data.types.filter(type => 
              normalized.includes(type.toLowerCase())
            ));
          }
        }
      }
    }

    // Extraer contexto
    for (const [ctxType, keywords] of Object.entries(this.contextKeywords)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          entities.context.push({ type: ctxType, value: keyword });
        }
      }
    }

    return entities;
  }

  // Análisis de intención mejorado
  analyzeIntent(text) {
    const normalized = this.normalizeText(text);
    const entities = this.extractEntities(text);
    
    let bestIntent = { type: 'unknown', confidence: 0, entities };

    // Verificar cada patrón de intención
    for (const [intentType, data] of Object.entries(this.intentPatterns)) {
      for (const pattern of data.patterns) {
        const match = normalized.match(pattern);
        if (match) {
          const confidence = data.confidence;
          
          // Ajustar confianza basado en entidades encontradas
          let adjustedConfidence = confidence;
          if (entities.products.length > 0) adjustedConfidence += 0.05;
          if (entities.context.length > 0) adjustedConfidence += 0.03;
          
          if (adjustedConfidence > bestIntent.confidence) {
            bestIntent = {
              type: intentType,
              confidence: Math.min(adjustedConfidence, 1),
              entities,
              match: match[1] || match[0]
            };
          }
        }
      }
    }

    // Si no se encontró intención clara pero hay productos, es búsqueda
    if (bestIntent.type === 'unknown' && entities.products.length > 0) {
      bestIntent = {
        type: 'productSearch',
        confidence: 0.75,
        entities
      };
    }

    return bestIntent;
  }

  // Corrección de errores tipográficos
  correctSpelling(text) {
    const corrections = {
      'tefelin': 'tefilin',
      'talit': 'tallit',
      'mezusa': 'mezuzah',
      'kippa': 'kipa',
      'libor': 'libro',
      'envoi': 'envio',
      'presio': 'precio'
    };

    let corrected = text.toLowerCase();
    for (const [wrong, right] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    }

    return corrected;
  }
}

// ============================================
// SISTEMA DE BÚSQUEDA MEJORADO
// ============================================

class SmartSearchEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Búsqueda simplificada que SÍ funciona
  async search(entities, options = {}) {
    console.log('🔍 Buscando productos con entidades:', entities);
    
    try {
      // Si hay productos específicos para buscar
      if (entities.products && entities.products.length > 0) {
        const searchTerms = [];
        const searchParams = [];
        
        // Crear condiciones de búsqueda para cada producto
        entities.products.forEach(product => {
          // Agregar variaciones del término
          const variations = this.getProductVariations(product);
          variations.forEach(term => {
            searchTerms.push(`(
              LOWER(p.name) LIKE ? OR 
              LOWER(p.description) LIKE ? OR 
              LOWER(p.short_description) LIKE ?
            )`);
            const searchTerm = `%${term}%`;
            searchParams.push(searchTerm, searchTerm, searchTerm);
          });
        });
        
        // Query simplificada que DEBE funcionar
        const query = `
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
            p.stock_status,
            p.featured,
            CASE 
              WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 
              THEN p.sale_price 
              ELSE p.price 
            END as display_price,
            CASE 
              WHEN p.stock_status = 'in_stock' 
              THEN 1 
              ELSE 0 
            END as available
          FROM products p
          WHERE p.status = 'active'
            AND (${searchTerms.join(' OR ')})
          ORDER BY 
            p.featured DESC,
            p.stock_status DESC,
            p.created_at DESC
          LIMIT ${options.limit || 10}
        `;
        
        console.log('📝 Ejecutando query con términos:', searchParams.slice(0, 3));
        
        const results = await query(query, searchParams);
        
        console.log(`✅ Encontrados ${results.length} productos`);
        
        // Si no encuentra con búsqueda específica, hacer búsqueda más amplia
        if (results.length === 0) {
          console.log('🔄 Intentando búsqueda amplia...');
          
          const broadQuery = `
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
              p.stock_status,
              p.featured,
              CASE 
                WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 
                THEN p.sale_price 
                ELSE p.price 
              END as display_price,
              CASE 
                WHEN p.stock_status = 'in_stock' 
                THEN 1 
                ELSE 0 
              END as available
            FROM products p
            WHERE p.status = 'active'
              AND (
                LOWER(p.name) LIKE '%tefil%' OR
                LOWER(p.name) LIKE '%talit%' OR
                LOWER(p.name) LIKE '%mezuz%' OR
                LOWER(p.name) LIKE '%libr%' OR
                LOWER(p.name) LIKE '%kip%' OR
                LOWER(p.name) LIKE '%shabat%' OR
                LOWER(p.name) LIKE '%vela%' OR
                LOWER(p.description) LIKE '%tefil%' OR
                LOWER(p.description) LIKE '%talit%' OR
                LOWER(p.description) LIKE '%mezuz%'
              )
            ORDER BY p.featured DESC, p.created_at DESC
            LIMIT 10
          `;
          
          const broadResults = await query(broadQuery);
          console.log(`✅ Búsqueda amplia: ${broadResults.length} productos`);
          return broadResults;
        }
        
        return results;
        
      } else {
        // Búsqueda general sin términos específicos
        console.log('📦 Obteniendo productos destacados...');
        
        const generalQuery = `
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
            p.stock_status,
            p.featured,
            CASE 
              WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 
              THEN p.sale_price 
              ELSE p.price 
            END as display_price,
            CASE 
              WHEN p.stock_status = 'in_stock' 
              THEN 1 
              ELSE 0 
            END as available
          FROM products p
          WHERE p.status = 'active'
          ORDER BY 
            p.featured DESC,
            p.stock_status DESC,
            p.created_at DESC
          LIMIT 10
        `;
        
        const results = await query(generalQuery);
        console.log(`✅ Productos destacados: ${results.length}`);
        return results;
      }
      
    } catch (error) {
      console.error('❌ Error en búsqueda SQL:', error);
      console.error('Query:', error.sql);
      console.error('Params:', error.sqlMessage);
      
      // Intentar query de emergencia super simple
      try {
        console.log('🚨 Ejecutando query de emergencia...');
        const emergencyQuery = `
          SELECT id, name, slug, price, stock_status 
          FROM products 
          WHERE status = 'active' 
          LIMIT 5
        `;
        const emergencyResults = await query(emergencyQuery);
        console.log(`🆘 Productos de emergencia: ${emergencyResults.length}`);
        
        return emergencyResults.map(p => ({
          ...p,
          display_price: p.price,
          available: p.stock_status === 'in_stock' ? 1 : 0,
          description: '',
          short_description: ''
        }));
      } catch (emergencyError) {
        console.error('❌ Error crítico en búsqueda:', emergencyError);
        return [];
      }
    }
  }

  // Obtener variaciones de un término de búsqueda
  getProductVariations(productType) {
    const variations = {
      'tefilin': ['tefilin', 'tfilin', 'tefillin', 'tefelin', 'phylacteries', 'filacterias'],
      'tallit': ['talit', 'tallit', 'talis', 'tallis', 'tallitot', 'prayer shawl'],
      'mezuzah': ['mezuza', 'mezuzah', 'mezuzot', 'mezuze'],
      'libros': ['libro', 'libros', 'book', 'books', 'sefer', 'sidur', 'siddur'],
      'kipa': ['kipa', 'kipá', 'kippa', 'kippah', 'yarmulke', 'kipot'],
      'velas': ['vela', 'velas', 'candela', 'candelas', 'nerot'],
      'shofar': ['shofar', 'shofarot', 'cuerno'],
      'menorah': ['menora', 'menorah', 'candelabro', 'janukia', 'hanukia']
    };
    
    return variations[productType] || [productType];
  }

  // Calcular relevancia simplificada
  calculateRelevance(product, entities) {
    let score = 0;
    
    if (product.available) score += 10;
    if (product.featured) score += 5;
    
    const productName = (product.name || '').toLowerCase();
    const productDesc = (product.description || '').toLowerCase();
    
    entities.products?.forEach(searchTerm => {
      if (productName.includes(searchTerm.toLowerCase())) score += 20;
      if (productDesc.includes(searchTerm.toLowerCase())) score += 10;
    });
    
    return score;
  }
}

// ============================================
// GESTOR DE CONTEXTO CONVERSACIONAL
// ============================================

class ConversationContextManager {
  constructor() {
    this.contexts = new Map();
  }

  async loadContext(conversationId) {
    try {
      const [contextData] = await query(
        `SELECT * FROM chat_conversation_context 
         WHERE conversation_id = ? 
         ORDER BY updated_at DESC 
         LIMIT 1`,
        [conversationId]
      );

      if (contextData) {
        return {
          ...contextData,
          products_mentioned: JSON.parse(contextData.products_mentioned || '[]'),
          intent_history: JSON.parse(contextData.intent_history || '[]'),
          metadata: JSON.parse(contextData.metadata || '{}')
        };
      }

      return this.createNewContext(conversationId);
    } catch (error) {
      console.error('Error loading context:', error);
      return this.createNewContext(conversationId);
    }
  }

  createNewContext(conversationId) {
    return {
      conversation_id: conversationId,
      products_mentioned: [],
      intent_history: [],
      current_intent: null,
      conversation_stage: 'initial',
      metadata: {}
    };
  }

  async saveContext(conversationId, updates) {
    try {
      const context = await this.loadContext(conversationId);
      
      // Actualizar contexto
      Object.assign(context, updates);
      
      // Mantener histórico limitado
      if (context.intent_history.length > 10) {
        context.intent_history = context.intent_history.slice(-10);
      }
      if (context.products_mentioned.length > 5) {
        context.products_mentioned = context.products_mentioned.slice(-5);
      }

      // Guardar en BD
      await query(
        `INSERT INTO chat_conversation_context 
         (conversation_id, session_id, current_intent, intent_history, 
          products_mentioned, conversation_stage, metadata, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
          current_intent = VALUES(current_intent),
          intent_history = VALUES(intent_history),
          products_mentioned = VALUES(products_mentioned),
          conversation_stage = VALUES(conversation_stage),
          metadata = VALUES(metadata),
          updated_at = NOW()`,
        [
          conversationId,
          context.session_id || null,
          context.current_intent,
          JSON.stringify(context.intent_history),
          JSON.stringify(context.products_mentioned),
          context.conversation_stage,
          JSON.stringify(context.metadata)
        ]
      );

      return context;
    } catch (error) {
      console.error('Error saving context:', error);
      return null;
    }
  }

  async addProductToContext(conversationId, product) {
    const context = await this.loadContext(conversationId);
    
    // Evitar duplicados
    const exists = context.products_mentioned.some(p => p.id === product.id);
    if (!exists) {
      context.products_mentioned.push({
        id: product.id,
        name: product.name,
        price: product.display_price,
        slug: product.slug
      });
    }

    return this.saveContext(conversationId, context);
  }
}

// ============================================
// GENERADOR DE RESPUESTAS INTELIGENTE
// ============================================

class ResponseGenerator {
  constructor() {
    this.templates = {
      greeting: [
        "¡Shalom! 🌟 Bienvenido a Judaica Breslov Colombia. ¿En qué puedo ayudarte hoy?",
        "¡Hola! Soy tu asistente especializado en productos judaicos. ¿Qué necesitas?",
        "¡Bienvenido! ¿Buscas algo específico o prefieres ver nuestro catálogo?"
      ],
      productFound: (products) => {
        if (products.length === 1) {
          return this.generateSingleProductResponse(products[0]);
        }
        return this.generateMultipleProductsResponse(products);
      },
      noProducts: (search) => `
No encontré productos específicos para "${search}". 

Pero puedo ayudarte con:
• 📚 Libros judaicos y textos sagrados
• 🕊️ Tefilín y Tallitot
• 🏠 Mezuzot y artículos para el hogar
• 🕯️ Artículos de Shabat
• 💎 Joyería judaica

¿Qué categoría te interesa? O puedes escribir el nombre específico del producto.
      `,
      price: (product) => `
💰 **${product.name}**
Precio: $${new Intl.NumberFormat('es-CO').format(product.display_price)}
${product.sale_price ? `~~$${new Intl.NumberFormat('es-CO').format(product.price)}~~ ¡En oferta!` : ''}

${product.available ? '✅ Disponible' : '⚠️ Consultar disponibilidad'}

¿Te gustaría saber más detalles o cómo comprarlo?
      `,
      purchase: (product) => `
🛒 **Cómo comprar ${product ? product.name : 'nuestros productos'}:**

**Opción 1 - Tienda Online:**
🌐 [judaicabreslovcolombia.com](https://judaicabreslovcolombia.com${product ? `/producto/${product.slug}` : ''})

**Opción 2 - WhatsApp:**
📱 [Mensaje directo](https://wa.me/573009291156?text=Hola!%20Me%20interesa%20${product ? encodeURIComponent(product.name) : 'hacer%20una%20compra'})

**Métodos de pago:**
✅ Tarjetas crédito/débito
✅ PSE
✅ Efecty
✅ Transferencia bancaria

¿Necesitas más información?
      `
    };
  }

  generateSingleProductResponse(product) {
    const price = new Intl.NumberFormat('es-CO').format(product.display_price);
    
    return `
**${product.name}** 🎯

💰 **Precio:** $${price}
📦 **Estado:** ${product.available ? '✅ Disponible' : '⚠️ Consultar stock'}

${product.short_description ? `📝 ${product.short_description.substring(0, 150)}...` : ''}

**Opciones:**
🔗 [Ver en tienda](https://judaicabreslovcolombia.com/producto/${product.slug})
📱 [Comprar por WhatsApp](https://wa.me/573009291156?text=Hola!%20Me%20interesa%20${encodeURIComponent(product.name)})

¿Te gustaría saber más sobre este producto?
    `;
  }

  generateMultipleProductsResponse(products) {
    let response = `Encontré ${products.length} productos que pueden interesarte:\n\n`;
    
    products.slice(0, 5).forEach((product, index) => {
      const price = new Intl.NumberFormat('es-CO').format(product.display_price);
      const status = product.available ? '✅' : '⚠️';
      
      response += `**${index + 1}. ${product.name}**\n`;
      response += `   💰 $${price} ${status}\n`;
      response += `   [Ver detalles](https://judaicabreslovcolombia.com/producto/${product.slug})\n\n`;
    });

    response += `\n💡 Escribe el número del producto para más detalles, o dime si buscas algo más específico.`;
    
    return response;
  }

  async generateResponse(intent, searchResults = [], context = {}) {
    switch (intent.type) {
      case 'greeting':
        return {
          text: this.templates.greeting[Math.floor(Math.random() * this.templates.greeting.length)],
          suggestions: ['Ver tefilín', 'Libros judaicos', 'Artículos de Shabat'],
          requiresHuman: false
        };

      case 'productSearch':
        if (searchResults.length > 0) {
          return {
            text: this.templates.productFound(searchResults),
            suggestions: ['Ver más productos', 'Cómo comprar', 'Contacto'],
            requiresHuman: false,
            products: searchResults
          };
        } else {
          return {
            text: this.templates.noProducts(intent.match || 'tu búsqueda'),
            suggestions: ['Ver categorías', 'Buscar otro producto', 'Ayuda'],
            requiresHuman: false
          };
        }

      case 'priceInquiry':
        if (searchResults.length > 0) {
          return {
            text: this.templates.price(searchResults[0]),
            suggestions: ['Comprar ahora', 'Ver similares', 'Más información'],
            requiresHuman: false,
            products: [searchResults[0]]
          };
        }
        break;

      case 'purchase':
        return {
          text: this.templates.purchase(searchResults[0] || null),
          suggestions: ['WhatsApp', 'Tienda online', 'Métodos de pago'],
          requiresHuman: false
        };

      case 'shipping':
        return {
          text: `
🚚 **Información de envíos:**

**Bogotá:** $15,000 (2-3 días hábiles)
**Nacional:** $18,000 (3-4 días hábiles)
**Express:** Disponible con costo adicional

✅ Todos los envíos incluyen:
• Empaque seguro
• Número de seguimiento
• Seguro básico

¿A qué ciudad necesitas el envío?
          `,
          suggestions: ['Calcular envío', 'Tiempo de entrega', 'Rastrear pedido'],
          requiresHuman: false
        };

      case 'contact':
        return {
          text: `
📞 **Contacto directo:**

📱 WhatsApp: [+57 300 929 1156](https://wa.me/573009291156)
📧 Email: contacto@judaicabreslovcolombia.com
🌐 Web: [judaicabreslovcolombia.com](https://judaicabreslovcolombia.com)

**Horarios:**
Lunes a Viernes: 8:00 AM - 6:00 PM
Domingos: 8:00 AM - 2:00 PM

¿En qué más puedo ayudarte?
          `,
          suggestions: ['Llamar ahora', 'Enviar mensaje', 'Ver productos'],
          requiresHuman: false
        };

      case 'availability':
        if (searchResults.length > 0) {
          const available = searchResults.filter(p => p.available);
          const unavailable = searchResults.filter(p => !p.available);
          
          let text = '📦 **Disponibilidad:**\n\n';
          
          if (available.length > 0) {
            text += '✅ **En stock:**\n';
            available.slice(0, 3).forEach(p => {
              text += `• ${p.name}\n`;
            });
          }
          
          if (unavailable.length > 0) {
            text += '\n⏳ **Por encargo:**\n';
            unavailable.slice(0, 2).forEach(p => {
              text += `• ${p.name} (consultar tiempo)\n`;
            });
          }
          
          text += '\n¿Te interesa algún producto específico?';
          
          return {
            text,
            suggestions: ['Ver disponibles', 'Hacer pedido', 'Notificarme'],
            requiresHuman: false,
            products: searchResults
          };
        }
        break;

      default:
        return {
          text: `
No estoy seguro de entender tu consulta. 

Puedo ayudarte con:
• 🔍 Buscar productos específicos
• 💰 Consultar precios
• 📦 Información de disponibilidad
• 🚚 Detalles de envío
• 📞 Contacto directo

¿Podrías reformular tu pregunta o elegir una opción?
          `,
          suggestions: ['Ver productos', 'Hablar con asesor', 'Ayuda'],
          requiresHuman: true
        };
    }

    // Respuesta por defecto
    return {
      text: 'Disculpa, no pude procesar tu solicitud. ¿Podrías ser más específico?',
      suggestions: ['Ver categorías', 'Contacto', 'Ayuda'],
      requiresHuman: true
    };
  }
}

// ============================================
// MOTOR PRINCIPAL DEL CHATBOT
// ============================================

class IntelligentChatbotV4 {
  constructor() {
    this.nlp = new NLPProcessor();
    this.searchEngine = new SmartSearchEngine();
    this.contextManager = new ConversationContextManager();
    this.responseGenerator = new ResponseGenerator();
  }

  async processMessage(message, conversationId, sessionId) {
    console.log('🤖 Procesando mensaje:', message.substring(0, 50));
    
    try {
      // 1. Cargar contexto de conversación
      const context = await this.contextManager.loadContext(conversationId);
      console.log('📚 Contexto cargado:', { 
        stage: context.conversation_stage,
        productsCount: context.products_mentioned.length 
      });

      // 2. Corregir ortografía y normalizar
      const correctedMessage = this.nlp.correctSpelling(message);
      
      // 3. Analizar intención y extraer entidades
      const intent = this.nlp.analyzeIntent(correctedMessage);
      console.log('🎯 Intención detectada:', {
        type: intent.type,
        confidence: intent.confidence.toFixed(2),
        products: intent.entities.products
      });

      // 4. Manejar selección numérica (cuando el usuario escribe un número)
      if (intent.entities.numbers.length > 0 && context.products_mentioned.length > 0) {
        const selectedIndex = intent.entities.numbers[0] - 1;
        if (selectedIndex >= 0 && selectedIndex < context.products_mentioned.length) {
          const selectedProduct = context.products_mentioned[selectedIndex];
          
          // Buscar producto completo
          const [fullProduct] = await this.searchEngine.search(
            { products: [selectedProduct.name] },
            { limit: 1 }
          );
          
          if (fullProduct) {
            intent.type = 'productSelection';
            intent.selectedProduct = fullProduct;
          }
        }
      }

      // 5. Realizar búsqueda si es necesario
      let searchResults = [];
      if (intent.entities.products.length > 0 || 
          ['productSearch', 'priceInquiry', 'availability'].includes(intent.type)) {
        
        searchResults = await this.searchEngine.search(intent.entities, {
          limit: intent.type === 'priceInquiry' ? 1 : 5
        });
        
        console.log('🔍 Resultados de búsqueda:', searchResults.length);
      }

      // 6. Generar respuesta
      let response = await this.responseGenerator.generateResponse(
        intent,
        searchResults,
        context
      );

      // 7. Actualizar contexto
      const updatedContext = {
        current_intent: intent.type,
        intent_history: [...context.intent_history, intent.type],
        conversation_stage: this.determineStage(intent.type),
        metadata: {
          ...context.metadata,
          last_confidence: intent.confidence,
          last_entities: intent.entities
        }
      };

      // Agregar productos mencionados al contexto
      if (searchResults.length > 0) {
        updatedContext.products_mentioned = searchResults.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          price: p.display_price,
          slug: p.slug
        }));
      }

      await this.contextManager.saveContext(conversationId, updatedContext);

      // 8. Preparar respuesta final
      return {
        success: true,
        response: response.text,
        intent: intent.type,
        confidence: intent.confidence,
        requiresHuman: response.requiresHuman,
        suggestions: response.suggestions,
        products: response.products || [],
        metadata: {
          processingTime: Date.now(),
          version: 'v4-optimized'
        }
      };

    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      
      return {
        success: false,
        response: `Disculpa, tuve un problema procesando tu mensaje. 
                  ¿Podrías intentar de nuevo o contactarnos por WhatsApp?
                  📱 [WhatsApp](https://wa.me/573009291156)`,
        intent: 'error',
        confidence: 0,
        requiresHuman: true,
        suggestions: ['Intentar de nuevo', 'Contacto WhatsApp', 'Ver productos'],
        error: error.message
      };
    }
  }

  determineStage(intentType) {
    const stageMap = {
      'greeting': 'initial',
      'productSearch': 'browsing',
      'priceInquiry': 'evaluation',
      'availability': 'evaluation',
      'purchase': 'purchase_intent',
      'shipping': 'purchase_details',
      'contact': 'contact',
      'productSelection': 'product_focus'
    };
    
    return stageMap[intentType] || 'general';
  }

  // Método para manejar comandos especiales
  async handleSpecialCommands(message) {
    const commands = {
      '/ayuda': 'Muestra comandos disponibles',
      '/categorias': 'Lista todas las categorías',
      '/ofertas': 'Muestra productos en oferta',
      '/contacto': 'Información de contacto',
      '/reset': 'Reinicia la conversación'
    };

    if (message.startsWith('/')) {
      const command = message.split(' ')[0].toLowerCase();
      
      if (command === '/ayuda') {
        return {
          success: true,
          response: `
**Comandos disponibles:**
${Object.entries(commands).map(([cmd, desc]) => `${cmd} - ${desc}`).join('\n')}

**También puedes preguntar sobre:**
• Productos específicos (tefilín, libros, etc.)
• Precios y disponibilidad
• Proceso de compra
• Envíos y entregas
          `,
          requiresHuman: false
        };
      }

      if (command === '/categorias') {
        return {
          success: true,
          response: `
**Categorías disponibles:**

📿 **Tefilín y Accesorios**
📚 **Libros y Textos Sagrados**
🕊️ **Tallitot y Tzitzit**
🏠 **Mezuzot**
👑 **Kipot**
🕯️ **Artículos de Shabat**
🕎 **Menorot y Janukiot**
💎 **Joyería Judaica**
🍷 **Vinos Kosher**

¿Qué categoría te interesa explorar?
          `,
          requiresHuman: false,
          suggestions: ['Ver tefilín', 'Libros judaicos', 'Artículos Shabat']
        };
      }

      if (command === '/ofertas') {
        const offers = await query(`
          SELECT name, price, sale_price, slug
          FROM products 
          WHERE sale_price IS NOT NULL 
            AND sale_price < price 
            AND status = 'active'
            AND stock_status = 'in_stock'
          LIMIT 5
        `);

        if (offers.length > 0) {
          let response = '🎉 **Productos en oferta:**\n\n';
          offers.forEach(p => {
            const discount = Math.round((1 - p.sale_price/p.price) * 100);
            response += `**${p.name}**\n`;
            response += `~~${new Intl.NumberFormat('es-CO').format(p.price)}~~ `;
            response += `${new Intl.NumberFormat('es-CO').format(p.sale_price)} `;
            response += `(-${discount}%)\n`;
            response += `[Ver producto](https://judaicabreslovcolombia.com/producto/${p.slug})\n\n`;
          });
          
          return {
            success: true,
            response,
            requiresHuman: false,
            suggestions: ['Ver más ofertas', 'Comprar ahora']
          };
        }
      }

      if (command === '/reset') {
        // Limpiar contexto
        await query(
          'DELETE FROM chat_conversation_context WHERE conversation_id = ?',
          [conversationId]
        );
        
        return {
          success: true,
          response: '🔄 Conversación reiniciada. ¿En qué puedo ayudarte?',
          requiresHuman: false
        };
      }
    }

    return null;
  }
}

// ============================================
// SISTEMA DE ANÁLISIS Y MÉTRICAS
// ============================================

class AnalyticsTracker {
  async trackInteraction(conversationId, data) {
    try {
      await query(`
        INSERT INTO chat_analytics 
        (conversation_id, intent_type, confidence, has_products, requires_human, response_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        conversationId,
        data.intent,
        data.confidence,
        data.products?.length > 0 ? 1 : 0,
        data.requiresHuman ? 1 : 0,
        data.responseTime || 0
      ]);
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }

  async trackConversion(conversationId, productId, action) {
    try {
      await query(`
        INSERT INTO chat_conversions
        (conversation_id, product_id, action_type, created_at)
        VALUES (?, ?, ?, NOW())
      `, [conversationId, productId, action]);
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }
}

// ============================================
// FUNCIONES EXPORTADAS
// ============================================

let chatbot = null;
let analytics = null;

// Inicializar instancias singleton
function initialize() {
  if (!chatbot) {
    chatbot = new IntelligentChatbotV4();
    analytics = new AnalyticsTracker();
  }
}

// Función principal para procesar mensajes
export async function generateIntelligentResponse(userMessage, conversationId, sessionId) {
  const startTime = Date.now();
  
  console.log('🚀 Motor V4 Optimizado iniciado');
  console.log('📝 Mensaje:', userMessage.substring(0, 100));
  
  initialize();
  
  try {
    // Verificar comandos especiales primero
    const specialResponse = await chatbot.handleSpecialCommands(userMessage);
    if (specialResponse) {
      return specialResponse;
    }

    // Procesar mensaje normal
    const response = await chatbot.processMessage(userMessage, conversationId, sessionId);
    
    // Tracking de analytics
    const responseTime = Date.now() - startTime;
    await analytics.trackInteraction(conversationId, {
      ...response,
      responseTime
    });

    // Si hay productos con alta confianza, trackear posible conversión
    if (response.products?.length > 0 && response.confidence > 0.8) {
      await analytics.trackConversion(
        conversationId,
        response.products[0].id,
        'product_viewed'
      );
    }

    console.log(`✅ Procesamiento completado en ${responseTime}ms`);
    
    return response;

  } catch (error) {
    console.error('❌ Error crítico:', error);
    
    return {
      success: false,
      response: 'Disculpa, ocurrió un error. Por favor contacta a soporte.',
      intent: 'error',
      confidence: 0,
      requiresHuman: true,
      error: error.message
    };
  }
}

// Función para verificar duplicados
export async function isDuplicateMessage(sessionId, messageContent) {
  try {
    const hash = crypto
      .createHash('sha256')
      .update(`${sessionId}_${messageContent}_${Math.floor(Date.now() / 10000)}`)
      .digest('hex');
    
    const [existing] = await query(
      `SELECT id FROM chat_message_hashes 
       WHERE session_id = ? AND message_hash = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)`,
      [sessionId, hash]
    );
    
    if (existing) {
      return true;
    }
    
    await query(
      'INSERT INTO chat_message_hashes (session_id, message_hash, created_at) VALUES (?, ?, NOW())',
      [sessionId, hash]
    );
    
    return false;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
}

// Función para obtener sugerencias basadas en contexto
export async function getContextualSuggestions(conversationId) {
  initialize();
  
  try {
    const context = await chatbot.contextManager.loadContext(conversationId);
    
    // Sugerencias basadas en el stage de la conversación
    const suggestions = {
      'initial': ['Ver productos populares', 'Buscar tefilín', 'Libros judaicos'],
      'browsing': ['Ver más detalles', 'Comparar productos', 'Consultar precio'],
      'evaluation': ['Cómo comprar', 'Ver disponibilidad', 'Métodos de pago'],
      'purchase_intent': ['Completar compra', 'WhatsApp directo', 'Información de envío'],
      'product_focus': ['Comprar ahora', 'Ver similares', 'Hacer pregunta']
    };
    
    return suggestions[context.conversation_stage] || suggestions.initial;
    
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return ['Ver productos', 'Ayuda', 'Contacto'];
  }
}

// Exportar todas las funciones necesarias
export default {
  generateIntelligentResponse,
  isDuplicateMessage,
  getContextualSuggestions
};