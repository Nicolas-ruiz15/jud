// lib/chatbot/ultra-dynamic-response-generator.js - GENERADOR DINÁMICO UNIVERSAL V3.0

export class UltraJudaicaResponseGenerator {
  constructor() {
    this.conversationContext = new Map();
    this.lastShownProducts = new Map();
    
    // SISTEMA DE CATEGORIZACIÓN DINÁMICA
    this.intentCategories = {
      // Agrupaciones amplias en lugar de intents específicos
      books_literature: [
        'torah_chumash_inquiry', 'tanaj_bible_inquiry', 'books_breslov_comprehensive',
        'tehilim_psalms_inquiry', 'talmud_mishna_inquiry', 'sidur_prayer_inquiry',
        'zohar_kabbalah_inquiry'
      ],
      ritual_objects: [
        'tefilin_comprehensive', 'tallit_comprehensive', 'mezuzah_comprehensive',
        'kipa_yarmulke_inquiry', 'menorah_comprehensive', 'shofar_comprehensive'
      ],
      ceremonial_items: [
        'shabat_items_comprehensive', 'rosh_hashana_items', 'pesaj_passover_items',
        'januca_hanukkah_items'
      ],
      jewelry_accessories: ['jewelry_comprehensive'],
      pricing: ['price_inquiry_specific', 'price_inquiry_general'],
      availability: ['availability_inquiry'],
      shipping: ['shipping_inquiry'],
      social: ['greeting', 'thanks', 'farewell'],
      help: ['help_inquiry', 'recommendation_inquiry']
    };

    // PALABRAS CLAVE PARA DETECCIÓN AUTOMÁTICA
    this.categoryKeywords = {
      books_literature: [
        'libro', 'libros', 'torah', 'tanaj', 'chumash', 'jumash', 'tehilim', 'salmos',
        'sidur', 'talmud', 'mishna', 'zohar', 'breslov', 'emunah', 'jardín', 'najman',
        'arush', 'literatura', 'texto', 'lectura', 'estudio'
      ],
      ritual_objects: [
        'tefilín', 'tefilin', 'tallit', 'talit', 'tzitzit', 'mezuzá', 'mezuzah',
        'kipá', 'kipa', 'yarmulke', 'solideo', 'menorá', 'menorah', 'candelabro',
        'shofar', 'cuerno', 'ritual', 'ceremonia', 'religioso'
      ],
      ceremonial_items: [
        'shabat', 'kidush', 'copa', 'velas', 'candelabros', 'pesaj', 'seder',
        'janucá', 'janukiá', 'festividad', 'celebración', 'ceremonia'
      ],
      jewelry_accessories: [
        'collar', 'cadena', 'pulsera', 'anillo', 'aretes', 'colgante', 'joyería',
        'estrella david', 'magen david', 'jai', 'chai', 'hamsa', 'regalo'
      ],
      pricing: [
        'precio', 'cuánto', 'cuesta', 'vale', 'valor', 'costo', 'dinero', 'plata'
      ],
      availability: [
        'hay', 'tienen', 'disponible', 'stock', 'existencia', 'agotado'
      ],
      shipping: [
        'envío', 'enviar', 'entrega', 'domicilio', 'transportadora', 'delivery'
      ]
    };

    // CONOCIMIENTO JUDAICO CONTEXTUAL
    this.judaicaKnowledge = {
      books: {
        torah: {
          importance: "la fuente fundamental de sabiduría judía",
          use: "estudio diario y crecimiento espiritual",
          audience: "estudiosos de todos los niveles"
        },
        breslov: {
          importance: "enseñanzas transformadoras para la vida práctica",
          use: "desarrollo de emunah y alegría espiritual",
          audience: "buscadores de crecimiento personal"
        },
        tehilim: {
          importance: "plegarias del rey David para toda ocasión",
          use: "oración, consuelo y conexión espiritual",
          audience: "toda persona que busca conexión divina"
        }
      },
      rituals: {
        tefilin: {
          importance: "mitzvá diaria fundamental para hombres",
          use: "conexión diaria con el Creador",
          audience: "hombres a partir del bar mitzvá"
        },
        tallit: {
          importance: "manto sagrado para la oración",
          use: "cubrirse durante la oración y momentos sagrados",
          audience: "hombres para sinagoga y hogar"
        },
        mezuzah: {
          importance: "protección y recordatorio divino en el hogar",
          use: "colocar en las puertas de la casa",
          audience: "toda familia judía"
        }
      }
    };
  }

  // MÉTODO PRINCIPAL DINÁMICO
  async generate(context) {
    try {
      const { intent, searchResults, originalMessage, sessionId } = context;
      
      console.log(`🎨 Generando respuesta dinámica para: ${intent.type} con ${searchResults?.length || 0} productos`);

      // 1. DETERMINAR CATEGORÍA PRINCIPAL
      const category = this.determineCategory(intent, originalMessage, searchResults);
      console.log(`📂 Categoría detectada: ${category}`);

      // 2. ANALIZAR PRODUCTOS DISPONIBLES
      const productAnalysis = this.analyzeProducts(searchResults, category);
      
      // 3. GENERAR RESPUESTA DINÁMICA
      const response = await this.generateDynamicResponse(
        category, intent, productAnalysis, originalMessage, sessionId
      );

      // 4. GENERAR SUGERENCIAS CONTEXTUALES
      const suggestions = this.generateSmartSuggestions(category, productAnalysis, intent);

      return {
        text: response,
        suggestions: suggestions,
        requiresHuman: this.shouldRequireHuman(intent, productAnalysis),
        metadata: {
          category,
          productCount: searchResults?.length || 0,
          responseType: 'dynamic_generated',
          isJudaicaSpecialized: true
        }
      };

    } catch (error) {
      console.error('❌ Error en generación dinámica:', error);
      return this.generateFallbackResponse(context);
    }
  }

  // DETERMINACIÓN INTELIGENTE DE CATEGORÍA
  determineCategory(intent, message, products) {
    // 1. Intentar por intent type primero
    for (const [category, intents] of Object.entries(this.intentCategories)) {
      if (intents.includes(intent.type)) {
        return category;
      }
    }

    // 2. Analizar por palabras clave en el mensaje
    const messageLower = message.toLowerCase();
    let bestCategory = 'general';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    // 3. Analizar por productos encontrados
    if (products && products.length > 0) {
      const productCategory = this.categorizeByProducts(products);
      if (productCategory !== 'general') {
        return productCategory;
      }
    }

    return bestCategory;
  }

  // ANÁLISIS INTELIGENTE DE PRODUCTOS
  analyzeProducts(products, category) {
    if (!products || products.length === 0) {
      return {
        hasProducts: false,
        count: 0,
        priceRange: null,
        categories: [],
        featured: [],
        inStock: [],
        onSale: []
      };
    }

    const analysis = {
      hasProducts: true,
      count: products.length,
      categories: [...new Set(products.map(p => p.category).filter(Boolean))],
      featured: products.filter(p => p.featured),
      inStock: products.filter(p => p.stock_status === 'in_stock'),
      onSale: products.filter(p => p.sale_price && p.sale_price > 0 && p.sale_price < p.price),
      priceRange: this.calculatePriceRange(products),
      topProducts: products.slice(0, 4),
      judaicaRelevance: this.calculateJudaicaRelevance(products)
    };

    return analysis;
  }

  // GENERACIÓN DINÁMICA DE RESPUESTA
  async generateDynamicResponse(category, intent, productAnalysis, originalMessage, sessionId) {
    // Guardar productos para referencia
    if (sessionId && productAnalysis.topProducts) {
      this.lastShownProducts.set(sessionId, productAnalysis.topProducts);
    }

    switch (category) {
      case 'books_literature':
        return this.generateBooksResponse(intent, productAnalysis, originalMessage);
      
      case 'ritual_objects':
        return this.generateRitualResponse(intent, productAnalysis, originalMessage);
      
      case 'ceremonial_items':
        return this.generateCeremonialResponse(intent, productAnalysis, originalMessage);
      
      case 'jewelry_accessories':
        return this.generateJewelryResponse(intent, productAnalysis, originalMessage);
      
      case 'pricing':
        return this.generatePricingResponse(intent, productAnalysis, originalMessage);
      
      case 'availability':
        return this.generateAvailabilityResponse(intent, productAnalysis, originalMessage);
      
      case 'shipping':
        return this.generateShippingResponse(intent, productAnalysis, originalMessage);
      
      case 'social':
        return this.generateSocialResponse(intent, originalMessage);
      
      case 'help':
        return this.generateHelpResponse(intent, productAnalysis, originalMessage);
      
      default:
        return this.generateGeneralResponse(intent, productAnalysis, originalMessage);
    }
  }

  // RESPUESTAS DINÁMICAS POR CATEGORÍA

  generateBooksResponse(intent, analysis, message) {
    if (!analysis.hasProducts) {
      return `**📚 LITERATURA JUDAICA ESPECIALIZADA**

No encontré libros específicos para "${message}", pero tenemos una amplia selección:

**📖 CATEGORÍAS DISPONIBLES:**
• Literatura Breslov (Emunah, crecimiento espiritual)
• Textos Sagrados (Torá, Tanaj, Talmud)
• Libros de Oración (Sidur, Tehilim, Majzor)
• Obras de Estudio (Comentarios, Halajá)

**📱 CONSULTA PERSONALIZADA:**
https://wa.me/573009291156?text=Busco%20libros%20judaicos

**🌐 CATÁLOGO COMPLETO:**
https://www.judaicabreslovcolombia.com

*"La Torá es la luz del mundo"* - Proverbios`;
    }

    const books = analysis.topProducts;
    const hasBreslev = books.some(b => this.isBreslev(b));
    const hasTorah = books.some(b => this.isTorah(b));
    
    let response = `**📚 LITERATURA JUDAICA ENCONTRADA**\n\n`;
    
    if (hasBreslev) {
      response += `**🌟 Literatura Breslov Disponible:**\n`;
    } else if (hasTorah) {
      response += `**📜 Textos Sagrados Disponibles:**\n`;
    } else {
      response += `**📖 Libros Judaicos Disponibles:**\n`;
    }

    books.forEach((book, index) => {
      const price = this.formatPrice(book.display_price);
      const stockIcon = this.getStockIcon(book.stock_status);
      const saleText = book.sale_price && book.sale_price < book.price ? ' 🔥' : '';
      
      response += `\n**${index + 1}. ${book.name}**\n`;
      response += `${this.getBookDescription(book)}\n`;
      response += `💰 ${price}${saleText} ${stockIcon}\n`;
      response += `🛒 [Ver producto](https://www.judaicabreslovcolombia.com/producto/${book.slug})\n`;
    });

    response += `\n**📱 MÁS INFORMACIÓN:**\n`;
    response += `https://wa.me/573009291156?text=Libros%20judaicos\n\n`;
    
    if (hasBreslev) {
      response += `*"La meta principal del hombre es fortalecer su fe"* - Rabí Najmán`;
    } else {
      response += `*"Convierte la Torá en tu ocupación principal"* - Avot 1:15`;
    }

    return response;
  }

  generateRitualResponse(intent, analysis, message) {
    if (!analysis.hasProducts) {
      return `**🕯️ ARTÍCULOS RITUALES KOSHER**

**⚫ TEFILÍN CERTIFICADOS**
• Cuero kosher supervisado
• Escritura Sofer Stam
• Garantía de kashrut

**🤍 TALLITOT AUTÉNTICOS**
• Lana y algodón premium
• Tzitzit kosher atados
• Diseños tradicionales

**🏠 MEZUZOT KOSHER**
• Klaf certificado
• Estuches decorativos
• Instalación incluida

**👤 OTROS ARTÍCULOS**
• Kipot elegantes
• Menorá y Janukiá
• Shofar natural

**📱 ASESORÍA ESPECIALIZADA:**
https://wa.me/573009291156?text=Artículos%20rituales

*"Cada mitzvá es una luz en el mundo"*`;
    }

    const items = analysis.topProducts;
    let response = `**🕯️ ARTÍCULOS RITUALES DISPONIBLES**\n\n`;

    // Detectar tipo principal de artículo
    const mainType = this.detectMainRitualType(items);
    
    if (mainType === 'tefilin') {
      response += `**⚫ TEFILÍN KOSHER CERTIFICADO**\n\n`;
    } else if (mainType === 'tallit') {
      response += `**🤍 TALLITOT AUTÉNTICOS**\n\n`;
    } else if (mainType === 'mezuzah') {
      response += `**🏠 MEZUZOT PARA TU HOGAR**\n\n`;
    } else {
      response += `**✡️ ARTÍCULOS RITUALES KOSHER**\n\n`;
    }

    items.forEach((item, index) => {
      const price = this.formatPrice(item.display_price);
      const stockIcon = this.getStockIcon(item.stock_status);
      
      response += `**${index + 1}. ${item.name}**\n`;
      response += `${this.getRitualDescription(item)}\n`;
      response += `💰 ${price} ${stockIcon}\n`;
      response += `🛒 [Comprar](https://www.judaicabreslovcolombia.com/producto/${item.slug})\n\n`;
    });

    response += `**✅ GARANTÍA DE KASHRUT**\n`;
    response += `• Supervisión rabínica\n• Certificación auténtica\n• Calidad garantizada\n\n`;
    
    response += `**📱 CONSULTA:**\n`;
    response += `https://wa.me/573009291156?text=Artículos%20rituales\n\n`;
    response += `*"Hermosa es la mitzvá cuando se hace con hiddur"*`;

    return response;
  }

  generatePricingResponse(intent, analysis, message) {
    if (!analysis.hasProducts) {
      return `**💰 INFORMACIÓN DE PRECIOS**

**📚 LITERATURA JUDAICA:**
• Libros Breslov: $45,000 - $85,000
• Sidur/Tehilim: $35,000 - $65,000
• Torá/Tanaj: $120,000 - $350,000

**🕯️ ARTÍCULOS RITUALES:**
• Tefilín: $450,000 - $850,000
• Tallit: $85,000 - $280,000
• Mezuzot: $35,000 - $120,000

**💎 JOYERÍA JUDAICA:**
• Collares: $65,000 - $180,000
• Pulseras: $45,000 - $125,000

**🚚 ENVÍO GRATIS** en compras +$250,000

**📱 COTIZACIÓN:**
https://wa.me/573009291156?text=Consulta%20precios`;
    }

    const products = analysis.topProducts;
    let response = `**💰 PRECIOS DISPONIBLES**\n\n`;

    if (analysis.priceRange) {
      response += `**💵 RANGO DE PRECIOS: ${this.formatPrice(analysis.priceRange.min)} - ${this.formatPrice(analysis.priceRange.max)}**\n\n`;
    }

    products.forEach((product, index) => {
      const price = this.formatPrice(product.display_price);
      const originalPrice = product.sale_price && product.sale_price < product.price ? 
        this.formatPrice(product.price) : null;
      const stockIcon = this.getStockIcon(product.stock_status);
      
      response += `**${index + 1}. ${product.name}**\n`;
      
      if (originalPrice) {
        response += `~~${originalPrice}~~ ➜ **${price}** 🔥 ¡OFERTA!\n`;
      } else {
        response += `**${price}**\n`;
      }
      
      response += `${stockIcon} ${this.getStockStatus(product.stock_status)}\n`;
      response += `🛒 [Comprar](https://www.judaicabreslovcolombia.com/producto/${product.slug})\n\n`;
    });

    if (analysis.onSale.length > 0) {
      response += `**🔥 ¡${analysis.onSale.length} PRODUCTOS EN OFERTA!**\n\n`;
    }

    response += `**🚚 ENVÍO:**\n`;
    response += `• Bogotá: $18,000 (24-48h)\n`;
    response += `• Nacional: $23,000 (2-4 días)\n`;
    response += `• GRATIS en compras +$250,000\n\n`;
    
    response += `**📱 COTIZACIÓN PERSONALIZADA:**\n`;
    response += `https://wa.me/573009291156?text=Consulta%20precios`;

    return response;
  }

  generateAvailabilityResponse(intent, analysis, message) {
    if (!analysis.hasProducts) {
      return `**📦 CONSULTA DE DISPONIBILIDAD**

No encontré productos específicos para tu consulta.

**✅ ALTA DISPONIBILIDAD:**
• Literatura Breslov
• Artículos Shabat
• Joyería Judaica
• Kipot y accesorios

**⚡ STOCK LIMITADO:**
• Tefilín premium
• Mezuzot artesanales
• Sets ceremoniales

**📱 VERIFICAR PRODUCTO ESPECÍFICO:**
https://wa.me/573009291156?text=Consulta%20disponibilidad

**🌐 VER CATÁLOGO:**
https://www.judaicabreslovcolombia.com`;
    }

    const inStock = analysis.inStock;
    const outOfStock = analysis.topProducts.filter(p => p.stock_status === 'out_of_stock');
    
    let response = `**📦 DISPONIBILIDAD ACTUAL**\n\n`;

    if (inStock.length > 0) {
      response += `**✅ DISPONIBLE INMEDIATO (${inStock.length} productos):**\n\n`;
      
      inStock.forEach((product, index) => {
        const price = this.formatPrice(product.display_price);
        response += `**${index + 1}. ${product.name}**\n`;
        response += `💰 ${price} ✅ Listo para envío\n`;
        response += `🛒 [Ordenar](https://www.judaicabreslovcolombia.com/producto/${product.slug})\n\n`;
      });
    }

    if (outOfStock.length > 0) {
      response += `**⌛ EN REABASTECIMIENTO (${outOfStock.length} productos):**\n\n`;
      
      outOfStock.forEach((product, index) => {
        response += `**${index + 1}. ${product.name}**\n`;
        response += `📅 Próxima llegada: 5-7 días\n`;
        response += `📝 [Apartar](https://wa.me/573009291156?text=Apartar%20${encodeURIComponent(product.name)})\n\n`;
      });
    }

    response += `**🚚 ENVÍO RÁPIDO:**\n`;
    response += `• Bogotá: Mañana\n• Ciudades principales: 2-3 días\n\n`;
    
    response += `**📱 CONSULTA:**\n`;
    response += `https://wa.me/573009291156?text=Disponibilidad`;

    return response;
  }

  generateShippingResponse(intent, analysis, message) {
    return `**🚚 ENVÍOS A TODA COLOMBIA**

**📍 TARIFAS POR CIUDAD:**

🏛️ **BOGOTÁ**
• Costo: $18,000
• Tiempo: 24-48 horas
• Servicio express disponible

🌆 **CIUDADES PRINCIPALES**
*Medellín, Cali, Barranquilla, Cartagena*
• Costo: $23,000
• Tiempo: 2-3 días hábiles

🏘️ **RESTO DEL PAÍS**
• Costo: $23,000
• Tiempo: 3-4 días hábiles

**🆓 ENVÍO GRATIS**
En compras superiores a $250,000

**📦 INCLUYE:**
✅ Seguro de mercancía
✅ Empaque especial para productos delicados
✅ Código seguimiento SMS
✅ Soporte durante el envío

**📱 COORDINAR ENVÍO:**
https://wa.me/573009291156?text=Información%20envío

*Productos sagrados, entregados con cuidado especial*`;
  }

  generateSocialResponse(intent, message) {
    if (intent.type === 'greeting') {
      return `**¡Shalom Aleichem!** ✡️

Bienvenido a **Judaica Breslov Colombia**
🏪 *Especialistas en productos judaicos auténticos*

**📚 NUESTRAS ESPECIALIDADES:**
• Literatura Breslov auténtica
• Artículos rituales kosher certificados
• Joyería judaica tradicional
• Artículos para Shabat y festividades

¿En qué mitzvá puedo ayudarte hoy?

📱 WhatsApp: https://wa.me/573009291156
🌐 www.judaicabreslovcolombia.com`;
    }

    if (intent.type === 'thanks') {
      return `**¡Todá rabá!** 😊

Ha sido un placer asistirte en tu búsqueda espiritual.

**📱 MANTENTE EN CONTACTO:**
WhatsApp: https://wa.me/573009291156

¿Hay algo más en lo que pueda ayudarte?

*"Cada mitzvá es una luz en el mundo"* 🕯️`;
    }

    if (intent.type === 'farewell') {
      return `**🙏 ¡Shalom uvrajá!**

Gracias por consultar **Judaica Breslov Colombia**

**✨ RECUERDA:**
• Productos 100% auténticos
• Certificación kosher garantizada
• Envíos seguros a toda Colombia
• Atención personalizada siempre

**📱 MANTENTE EN CONTACTO:**
WhatsApp: https://wa.me/573009291156
Web: www.judaicabreslovcolombia.com

**🌟 "Que tengas un día lleno de bendiciones"**

*¡Esperamos verte pronto!* ✡️`;
    }

    return `**🏪 JUDAICA BRESLOV COLOMBIA**

Especialistas en productos judaicos auténticos.

📱 WhatsApp: https://wa.me/573009291156
🌐 www.judaicabreslovcolombia.com

¿En qué puedo ayudarte?`;
  }

  generateHelpResponse(intent, analysis, message) {
    return `**🤝 ¿CÓMO PUEDO AYUDARTE?**

**📚 PUEDO ASISTIRTE CON:**
• Buscar productos judaicos específicos
• Información de precios y disponibilidad
• Recomendaciones personalizadas
• Consultas sobre kashrut y autenticidad
• Información de envíos y pagos

**🏪 NUESTRAS ESPECIALIDADES:**
• **Literatura Breslov** - Libros transformadores
• **Textos Sagrados** - Torá, Tanaj, Talmud
• **Artículos Rituales** - Tefilín, Tallit, Mezuzot
• **Joyería Judaica** - Símbolos tradicionales
• **Artículos Ceremoniales** - Shabat y festividades

**💡 EJEMPLOS DE CONSULTAS:**
• "Busco libros de emunah"
• "Precio de tefilín kosher"
• "Mezuzah para casa nueva"
• "Envío a Medellín"

**📱 ATENCIÓN ESPECIALIZADA:**
https://wa.me/573009291156?text=Necesito%20ayuda

**🌐 CATÁLOGO COMPLETO:**
https://www.judaicabreslovcolombia.com

¿Qué producto judaico específico buscas?`;
  }

  generateGeneralResponse(intent, analysis, message) {
    if (!analysis.hasProducts) {
      return `**🏪 JUDAICA BRESLOV COLOMBIA**

No encontré productos específicos para "${message}", pero tenemos una amplia selección:

**📚 LITERATURA JUDAICA:**
• Libros Breslov auténticos
• Textos sagrados (Torá, Tanaj, Talmud)
• Libros de oración (Sidur, Tehilim)

**🕯️ ARTÍCULOS RITUALES:**
• Tefilín kosher certificados
• Tallitot tradicionales
• Mezuzot con klaf kosher

**💎 JOYERÍA Y ACCESORIOS:**
• Collares Estrella de David
• Pulseras Jai (vida)
• Kipot elegantes

**📱 CONSULTA PERSONALIZADA:**
https://wa.me/573009291156?text=${encodeURIComponent(message)}

**🌐 CATÁLOGO COMPLETO:**
https://www.judaicabreslovcolombia.com

¿Puedes ser más específico sobre lo que buscas?`;
    }

    // Si hay productos, mostrarlos de manera inteligente
    const products = analysis.topProducts;
    let response = `**🔍 PRODUCTOS ENCONTRADOS**\n\n`;

    response += `Encontré ${analysis.count} productos relacionados con tu consulta:\n\n`;

    products.forEach((product, index) => {
      const price = this.formatPrice(product.display_price);
      const stockIcon = this.getStockIcon(product.stock_status);
      
      response += `**${index + 1}. ${product.name}**\n`;
      response += `💰 ${price} ${stockIcon}\n`;
      response += `🛒 [Ver producto](https://www.judaicabreslovcolombia.com/producto/${product.slug})\n\n`;
    });

    response += `**📱 MÁS INFORMACIÓN:**\n`;
    response += `https://wa.me/573009291156?text=Consulta%20productos\n\n`;
    response += `¿Te interesa alguno en particular? (Puedes decir "el 1", "el segundo", etc.)`;

    return response;
  }

  // MÉTODOS AUXILIARES

  categorizeByProducts(products) {
    const categories = products.map(p => p.category).filter(Boolean);
    const categoryCount = {};
    
    categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const dominantCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Mapear categorías de productos a categorías de respuesta
    const categoryMap = {
      'torah_chumash': 'books_literature',
      'prayer_books': 'books_literature',
      'ritual_items': 'ritual_objects',
      'ceremonial': 'ceremonial_items',
      'jewelry': 'jewelry_accessories'
    };

    return categoryMap[dominantCategory] || 'general';
  }

  calculatePriceRange(products) {
    const prices = products.map(p => p.display_price).filter(p => p > 0);
    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }

  calculateJudaicaRelevance(products) {
    let score = 0;
    products.forEach(product => {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      if (text.includes('judaico') || text.includes('kosher') || text.includes('breslov')) score += 2;
      if (text.includes('torah') || text.includes('talmud') || text.includes('tefilin')) score += 3;
      if (text.includes('religioso') || text.includes('tradicional')) score += 1;
    });
    return score / products.length;
  }

  generateSmartSuggestions(category, analysis, intent) {
    const baseSuggestions = {
      books_literature: ['Ver más libros', 'Literatura Breslov', 'Textos sagrados'],
      ritual_objects: ['Artículos kosher', 'Certificación', 'Asesoría ritual'],
      ceremonial_items: ['Sets completos', 'Para festividades', 'Artículos Shabat'],
      jewelry_accessories: ['Joyería judaica', 'Regalos especiales', 'Símbolos tradicionales'],
      pricing: ['Ver disponibilidad', 'Métodos pago', 'Calcular envío'],
      availability: ['Apartar producto', 'WhatsApp directo', 'Ver similares'],
      shipping: ['Hacer pedido', 'Calcular costo', 'WhatsApp'],
      social: ['Ver productos', 'Literatura Breslov', 'Consultar'],
      help: ['Productos destacados', 'WhatsApp directo', 'Ver catálogo']
    };

    let suggestions = baseSuggestions[category] || ['WhatsApp directo', 'Ver catálogo', 'Ayuda'];

    // Agregar sugerencias dinámicas basadas en análisis
    if (analysis.onSale && analysis.onSale.length > 0) {
      suggestions.unshift('Ver ofertas');
    }
    
    if (analysis.featured && analysis.featured.length > 0) {
      suggestions.push('Productos destacados');
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }

  shouldRequireHuman(intent, analysis) {
    // Requerir humano para consultas complejas o cuando no hay productos
    const complexIntents = ['complaint', 'custom_order', 'technical_issue'];
    
    if (complexIntents.includes(intent.type)) {
      return true;
    }
    
    if (!analysis.hasProducts && intent.confidence < 0.5) {
      return true;
    }

    return false;
  }

  generateFallbackResponse(context) {
    return {
      text: `**🏪 JUDAICA BRESLOV COLOMBIA**

Disculpa, ocurrió un problema procesando tu consulta.

**📱 ATENCIÓN DIRECTA:**
WhatsApp: https://wa.me/573009291156

**🌐 CATÁLOGO:**
https://www.judaicabreslovcolombia.com

**📚 ESPECIALIDADES:**
• Literatura Breslov auténtica
• Artículos rituales kosher
• Joyería judaica tradicional

¿En qué producto específico puedo ayudarte?`,
      requiresHuman: true,
      suggestions: ['WhatsApp directo', 'Ver catálogo', 'Reintentar']
    };
  }

  // MÉTODOS DE UTILIDAD

  isBreslev(product) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();
    return text.includes('breslov') || text.includes('emunah') || text.includes('jardín') || text.includes('arush');
  }

  isTorah(product) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();
    return text.includes('torah') || text.includes('torá') || text.includes('chumash') || text.includes('tanaj');
  }

  detectMainRitualType(products) {
    const types = { tefilin: 0, tallit: 0, mezuzah: 0, other: 0 };
    
    products.forEach(product => {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      if (text.includes('tefilin') || text.includes('tefilín')) types.tefilin++;
      else if (text.includes('tallit') || text.includes('talit')) types.tallit++;
      else if (text.includes('mezuzah') || text.includes('mezuzá')) types.mezuzah++;
      else types.other++;
    });

    return Object.entries(types).sort(([,a], [,b]) => b - a)[0][0];
  }

  getBookDescription(book) {
    const name = book.name.toLowerCase();
    
    if (name.includes('emunah')) {
      return '🌟 Desarrollo de fe simple y confianza divina';
    }
    if (name.includes('jardín')) {
      return '🌸 Fundamentos para una vida de fe auténtica';
    }
    if (name.includes('torah') || name.includes('torá')) {
      return '📜 Texto sagrado fundamental del judaísmo';
    }
    if (name.includes('tehilim') || name.includes('salmos')) {
      return '🙏 Plegarias del rey David para toda ocasión';
    }
    if (name.includes('tanaj')) {
      return '📖 Escrituras hebreas completas';
    }
    
    return '📚 Literatura judaica auténtica';
  }

  getRitualDescription(item) {
    const name = item.name.toLowerCase();
    
    if (name.includes('tefilin')) {
      return '⚫ Artículo ritual kosher para oración diaria';
    }
    if (name.includes('tallit')) {
      return '🤍 Manto sagrado para la oración';
    }
    if (name.includes('mezuzah')) {
      return '🏠 Protección y bendición para el hogar';
    }
    if (name.includes('kipa')) {
      return '👤 Cobertura tradicional de respeto';
    }
    
    return '✡️ Artículo ritual tradicional';
  }

  formatPrice(price) {
    if (!price || isNaN(price)) return 'Consultar';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getStockIcon(status) {
    const icons = {
      'in_stock': '✅',
      'out_of_stock': '❌',
      'on_backorder': '⌛',
      'limited': '⚡'
    };
    return icons[status] || '❓';
  }

  getStockStatus(status) {
    const statuses = {
      'in_stock': 'Disponible inmediato',
      'out_of_stock': 'Agotado - Próxima llegada 5-7 días',
      'on_backorder': 'Por encargo - 3-5 días hábiles',
      'limited': 'Stock limitado - ¡Últimas unidades!'
    };
    return statuses[status] || 'Consultar disponibilidad';
  }
}