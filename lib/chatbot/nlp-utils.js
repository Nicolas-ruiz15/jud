// lib/chatbot/ultra-judaica-nlp-utils.js - PROCESAMIENTO NLP ULTRA-ESPECIALIZADO V2.0

export class UltraJudaicaNLPUtils {
  constructor() {
    this.cache = new Map();
    this.cacheMaxSize = 2000;
    this.cacheTimeout = 20 * 60 * 1000; // 20 minutos

    // SISTEMA COMPLETO DE STOP WORDS MULTIIDIOMA
    this.stopWords = {
      spanish: new Set([
        // Artículos y determinantes
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        // Preposiciones
        'de', 'del', 'en', 'con', 'para', 'por', 'que', 'cual', 'cuales', 'desde', 'hasta',
        // Pronombres
        'me', 'te', 'se', 'le', 'nos', 'les', 'lo', 'la', 'los', 'las',
        // Verbos auxiliares comunes
        'es', 'son', 'está', 'están', 'tiene', 'tienen', 'hay', 'ser', 'estar', 'tener',
        // Conjunciones
        'y', 'o', 'u', 'e', 'ni', 'pero', 'mas', 'sino', 'aunque', 'porque',
        // Palabras interrogativas genéricas
        'como', 'cuando', 'donde', 'quien', 'cuanto',
        // Stop words específicos para tienda judaica
        'producto', 'productos', 'articulo', 'articulos', 'cosa', 'cosas', 'algo',
        'busco', 'quiero', 'necesito', 'me', 'te', 'se', 'le', 'buscar', 'encontrar',
        // Jerga colombiana comercial
        'parce', 'hermano', 'brother', 'bro', 'mi', 'amor', 'corazón', 'vida',
        'pues', 'entonces', 'ahi', 'aca', 'alla', 'bacano', 'chevere'
      ]),

      english: new Set([
        'the', 'of', 'and', 'to', 'a', 'in', 'is', 'you', 'that', 'it', 'he', 'was',
        'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this',
        'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what'
      ]),

      hebrew: new Set([
        'של', 'את', 'על', 'אל', 'מן', 'כל', 'לא', 'הוא', 'אי', 'כי', 'זה', 'זו', 'זאת',
        'הוא', 'היא', 'הן', 'הם', 'אני', 'אתה', 'את', 'אנחנו', 'אתם', 'אתן'
      ])
    };

    // MAPEO COMPLETO DE CARACTERES ESPECIALES
    this.accentMap = {
      'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
      'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'ĕ': 'e', 'ė': 'e', 'ę': 'e',
      'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i', 'ĭ': 'i', 'į': 'i',
      'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'ŏ': 'o', 'ő': 'o',
      'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ŭ': 'u', 'ů': 'u', 'ű': 'u', 'ų': 'u',
      'ñ': 'n', 'ç': 'c'
    };

    // TÉRMINOS JUDAICOS ULTRA-ESPECIALIZADOS
    this.judaicTerms = {
      // Objetos rituales con todas sus variaciones
      religious_objects: {
        'tefilin': {
          variations: ['tefilín', 'tefilin', 'tfilin', 'phylacteries', 'filacterias', 'cajas de rezo'],
          transliterations: ['t\'filin', 'tefillin', 'tefelin'],
          related: ['batim', 'retzuot', 'parshiot', 'sofer', 'klaf', 'pergamino'],
          context: ['bar mitzvah', 'rezo matutino', 'mitzvá', 'ritual diario']
        },
        'tallit': {
          variations: ['talit', 'talis', 'tallis', 'prayer shawl', 'manto de oración', 'manto'],
          transliterations: ['tallit', 'talit', 'tallet'],
          related: ['tzitzit', 'zizit', 'atara', 'collar', 'flecos', 'cordones'],
          types: ['gadol', 'katan', 'grande', 'pequeño', 'camisa'],
          context: ['sinagoga', 'rezo', 'cobertura', 'mandamiento']
        },
        'mezuzah': {
          variations: ['mezuza', 'mezuzot', 'mezuzá', 'pergamino puerta'],
          transliterations: ['m\'zuzah', 'mezuza', 'mezusah'],
          related: ['klaf', 'pergamino', 'sofer', 'estuche', 'caja', 'shema'],
          context: ['puerta', 'hogar', 'casa', 'protección', 'bendición']
        },
        'kipa': {
          variations: ['kipá', 'kipot', 'yarmulke', 'yarmulka', 'kippah', 'solideo', 'gorro judío'],
          transliterations: ['kippa', 'kipa', 'yarmulka'],
          related: ['cabeza', 'cobertura', 'respeto', 'identidad'],
          materials: ['terciopelo', 'cuero', 'tela', 'satén'],
          context: ['diario', 'ceremonial', 'identidad judía']
        }
      },

      // Literatura sagrada expandida
      sacred_literature: {
        'torah': {
          variations: ['torá', 'tora', 'pentateuco', 'cinco libros', 'cinco libros de moisés'],
          transliterations: ['torah', 'tora', 'toyre'],
          related: ['chumash', 'jumash', 'humash', 'sefer torah', 'rollo'],
          books: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim'],
          spanish_books: ['génesis', 'éxodo', 'levítico', 'números', 'deuteronomio'],
          context: ['sagrada', 'divina', 'ley', 'mandamientos', 'estudio']
        },
        'tanaj': {
          variations: ['tanakh', 'biblia hebrea', 'escrituras hebreas', 'biblia judía'],
          transliterations: ['tanach', 'tanaj', 'tanakh'],
          sections: ['torah', 'neviim', 'ketuvim', 'ley', 'profetas', 'escritos'],
          context: ['completo', 'original', 'auténtico', 'sagrado']
        },
        'talmud': {
          variations: ['gemara', 'mishná', 'mishnah', 'shas'],
          transliterations: ['talmud', 'gemara', 'mishna'],
          types: ['babilónico', 'bavli', 'yerushalmi', 'jerusalén'],
          related: ['halajá', 'halakha', 'ley judía', 'código'],
          context: ['estudio', 'interpretación', 'discusión', 'análisis']
        },
        'tehilim': {
          variations: ['salmos', 'psalms', 'libro de salmos', 'salmos de david'],
          transliterations: ['t\'hilim', 'tehillim', 'tehilim'],
          related: ['david', 'rey david', 'plegarias', 'oraciones'],
          context: ['oración', 'súplica', 'alabanza', 'consuelo']
        }
      },

      // Breslov especializado
      breslov_terms: {
        'breslov': {
          variations: ['breslev', 'breslau', 'bresloer', 'jasidismo breslov'],
          founders: ['rabi najman', 'rabino najman', 'najman de breslov', 'nachman'],
          teachers: ['shalom arush', 'rabino arush', 'rab arush'],
          concepts: ['emunah', 'emuna', 'fe simple', 'hitbodedut', 'alegría'],
          context: ['movimiento', 'enseñanzas', 'crecimiento', 'espiritualidad']
        },
        'emunah': {
          variations: ['emuna', 'vivamos con emunah', 'fe', 'confianza', 'fe simple'],
          books: ['jardín de la fe', 'en el jardín de la fe', 'vivamos con emunah'],
          related: ['bitajón', 'confianza', 'providencia', 'fe divina'],
          context: ['fundamental', 'base', 'crecimiento', 'vida práctica']
        }
      },

      // Festividades y ceremonias
      holidays_ceremonies: {
        'shabat': {
          variations: ['shabbat', 'sábado', 'día de descanso', 'sabbath'],
          transliterations: ['shabbes', 'shabbos', 'shabat'],
          related: ['velas', 'kidush', 'jalá', 'havdalá', 'descanso'],
          items: ['copa kidush', 'candelabros', 'velas', 'mantel'],
          context: ['descanso', 'santificación', 'familia', 'paz']
        },
        'pesaj': {
          variations: ['pascua judía', 'passover', 'festa de pesaj'],
          transliterations: ['pesach', 'pesaj', 'peysaj'],
          related: ['seder', 'hagadá', 'matzá', 'éxodo', 'libertad'],
          items: ['plato seder', 'copa elías', 'hagadá', 'afikomen'],
          context: ['libertad', 'familia', 'tradición', 'historia']
        },
        'januca': {
          variations: ['chanuca', 'hanukkah', 'janukah', 'fiesta de las luces'],
          transliterations: ['chanukah', 'hanuka', 'januca'],
          related: ['janukiá', 'menorá', 'velas', 'milagro', 'aceite'],
          items: ['janukiá', 'velas', 'dreidel', 'latkes'],
          context: ['luz', 'milagro', 'resistencia', 'dedicación']
        }
      }
    };

    // PATRONES DE CORRECCIÓN ORTOGRÁFICA JUDAICA
    this.spellingCorrections = {
      // Objetos rituales
      'tefelin': 'tefilín', 'tefelín': 'tefilín', 'tefilin': 'tefilín',
      'phylacteries': 'tefilín', 'filacterias': 'tefilín',
      'talit': 'tallit', 'talis': 'tallit', 'tallis': 'tallit',
      'mezusa': 'mezuzá', 'mezuza': 'mezuzá', 'mezuzot': 'mezuzá',
      'kippa': 'kipá', 'yarmulka': 'kipá', 'yarmulke': 'kipá',
      
      // Literatura
      'tora': 'torá', 'torah': 'torá', 'tanakh': 'tanaj',
      'jumash': 'chumash', 'humash': 'chumash',
      'salmos': 'tehilim', 'tehillim': 'tehilim',
      
      // Festividades
      'januca': 'janucá', 'chanuca': 'janucá', 'hanukkah': 'janucá',
      'pascua': 'pesaj', 'passover': 'pesaj',
      
      // Breslov
      'breslev': 'breslov', 'najman': 'najmán', 'nachman': 'najmán',
      'emuna': 'emuná', 'emunah': 'emuná',
      
      // Errores comunes español-judaico
      'kosher': 'kasher', 'kashrut': 'kashrut', 'sidur': 'sidur'
    };

    // JERGA COMERCIAL Y CONVERSACIONAL
    this.slangMap = {
      // Internet y mensajería
      'q': 'que', 'xq': 'porque', 'pq': 'porque', 'x': 'por', 
      'bn': 'bien', 'bno': 'bueno', 'tbn': 'también',
      'dnd': 'donde', 'cdo': 'cuando', 'cm': 'como',
      
      // Comerciales judaica-específicos
      'pte': 'presente', 'env': 'envío', 'prod': 'producto',
      'lib': 'libro', 'art': 'artículo', 'prec': 'precio',
      'stock': 'existencia', 'disp': 'disponible',
      'kosher': 'kasher', 'cert': 'certificado',
      
      // Expresiones colombianas
      'parce': 'persona', 'man': 'persona', 'viejo': 'persona',
      'bacano': 'bueno', 'chevere': 'bueno', 'chimba': 'excelente',
      'plata': 'dinero', 'luca': 'mil pesos', 'vayna': 'cosa'
    };

    // CONTRACCIONES Y EXPANSIONES
    this.contractions = {
      // Español
      'al': 'a el', 'del': 'de el', 'nel': 'en el',
      
      // Judaico específico
      'rh': 'rosh hashaná', 'yk': 'yom kipur',
      'bm': 'bar mitzvá', 'bt': 'bat mitzvá',
      'r.': 'rabino', 'rab': 'rabino'
    };

    // PATRONES DE INTENCIÓN COMERCIAL JUDAICA
    this.commercialPatterns = {
      purchase_intent: /(?:quiero|necesito|busco)\s+(?:comprar|adquirir|conseguir|obtener)/i,
      price_inquiry: /(?:cuánto|cuanto)\s+(?:cuesta|vale|es|sale)|precio\s+de|valor\s+de/i,
      availability_check: /(?:hay|tienen|disponible|stock|existencia|agotado)/i,
      shipping_inquiry: /(?:envío|enviar|entrega|domicilio|transportadora)/i,
      certification_query: /(?:kosher|kasher|certificado|supervisión|rabínico)/i,
      recommendation_request: /(?:recomienda|aconsejan|sugieren|mejor|cuál\s+es)/i
    };

    // ANÁLISIS DE SENTIMIENTOS ESPECIALIZADO PARA JUDAICA
    this.sentimentLexicon = {
      very_positive: {
        words: ['excelente', 'fantástico', 'increíble', 'maravilloso', 'bendición', 'baruch hashem'],
        weight: 2.0
      },
      positive: {
        words: ['bueno', 'bien', 'bonito', 'hermoso', 'agradable', 'kasher', 'auténtico', 'tradicional'],
        weight: 1.0
      },
      negative: {
        words: ['malo', 'terrible', 'horrible', 'defectuoso', 'roto', 'falso', 'no kasher'],
        weight: -1.0
      },
      very_negative: {
        words: ['pésimo', 'terrible', 'estafa', 'fraude', 'engaño'],
        weight: -2.0
      }
    };

    // CLASIFICACIÓN DE PRODUCTOS JUDAICOS
    this.productCategories = {
      sacred_books: ['torah', 'tanaj', 'talmud', 'sidur', 'tehilim', 'chumash', 'libro'],
      breslov_literature: ['breslov', 'emunah', 'jardín', 'shalom arush', 'najmán'],
      ritual_objects: ['tefilín', 'tallit', 'mezuzá', 'kipá', 'shofar'],
      ceremonial_items: ['menorá', 'candelabro', 'janukiá', 'copa kidush', 'velas'],
      jewelry: ['collar', 'pulsera', 'anillo', 'estrella david', 'jai', 'hamsa'],
      home_items: ['mezuzá', 'candelabros', 'platos', 'manteles'],
      holiday_items: ['pesaj', 'janucá', 'rosh hashaná', 'sukot', 'purim']
    };
  }

  // MÉTODO PRINCIPAL: ANÁLISIS COMPLETO DE TEXTO JUDAICO
  analyzeJudaicText(text, options = {}) {
    const startTime = Date.now();
    
    try {
      // Verificar cache
      const cacheKey = `analyze_${text}_${JSON.stringify(options)}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const analysis = {
        original: text,
        normalized: this.normalizeJudaicText(text),
        tokens: [],
        
        // Análisis semántico judaico
        judaicTerms: [],
        productCategories: [],
        commercialIntent: null,
        sentiment: null,
        
        // Análisis lingüístico
        language: null,
        statistics: {},
        entities: {},
        
        // Metadata
        processingTime: 0,
        confidence: 0
      };

      // 1. Normalización y tokenización
      analysis.normalized = this.normalizeJudaicText(text);
      analysis.tokens = this.tokenizeJudaicText(analysis.normalized);

      // 2. Detección de idioma
      analysis.language = this.detectLanguage(text);

      // 3. Análisis de términos judaicos
      analysis.judaicTerms = this.extractJudaicTerms(text);

      // 4. Clasificación de productos
      analysis.productCategories = this.classifyJudaicProducts(text);

      // 5. Detección de intención comercial
      analysis.commercialIntent = this.detectCommercialIntent(text);

      // 6. Análisis de sentimientos
      analysis.sentiment = this.analyzeSentiment(text);

      // 7. Extracción de entidades
      analysis.entities = this.extractJudaicEntities(text);

      // 8. Estadísticas
      analysis.statistics = this.calculateTextStatistics(text, analysis.tokens);

      // 9. Calcular confianza general
      analysis.confidence = this.calculateAnalysisConfidence(analysis);

      analysis.processingTime = Date.now() - startTime;

      // Guardar en cache
      this.updateCache(cacheKey, analysis);

      console.log(`Análisis judaico completado en ${analysis.processingTime}ms - Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      
      return analysis;

    } catch (error) {
      console.error('Error en análisis NLP judaico:', error);
      return {
        original: text,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  // NORMALIZACIÓN ESPECIALIZADA PARA TEXTOS JUDAICOS
  normalizeJudaicText(text) {
    if (!text || typeof text !== 'string') return '';

    let normalized = text;

    // 1. Convertir a minúsculas
    normalized = normalized.toLowerCase();

    // 2. Normalizar caracteres Unicode
    normalized = normalized.normalize("NFD");

    // 3. Remover acentos usando mapa personalizado
    Object.entries(this.accentMap).forEach(([accented, normal]) => {
      const regex = new RegExp(accented, 'g');
      normalized = normalized.replace(regex, normal);
    });

    // 4. Corregir spellings comunes judaicos
    Object.entries(this.spellingCorrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(wrong)}\\b`, 'gi');
      normalized = normalized.replace(regex, correct);
    });

    // 5. Expandir contracciones
    Object.entries(this.contractions).forEach(([contraction, expansion]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(contraction)}\\b`, 'gi');
      normalized = normalized.replace(regex, expansion);
    });

    // 6. Corregir slang
    Object.entries(this.slangMap).forEach(([slang, correction]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(slang)}\\b`, 'gi');
      normalized = normalized.replace(regex, correction);
    });

    // 7. Limpiar caracteres especiales pero preservar importantes
    normalized = normalized
      .replace(/[^\w\sñáéíóúü\-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized;
  }

  // TOKENIZACIÓN INTELIGENTE PARA JUDAICA
  tokenizeJudaicText(text) {
    const tokens = text
      .split(/[\s\-_.,;:!?()[\]{}"']+/)
      .filter(token => token.length >= 2)
      .filter(token => !this.stopWords.spanish.has(token.toLowerCase()));

    // Detectar términos compuestos judaicos
    const compoundTerms = this.detectCompoundTerms(text);
    
    return [...tokens, ...compoundTerms]
      .map(token => token.toLowerCase())
      .filter((token, index, array) => array.indexOf(token) === index); // Unique
  }

  // DETECCIÓN DE TÉRMINOS COMPUESTOS JUDAICOS
  detectCompoundTerms(text) {
    const compounds = [];
    const compoundPatterns = [
      /copa\s+kidush/gi,
      /estrella\s+de\s+david/gi,
      /jardín\s+de\s+la\s+fe/gi,
      /vivamos\s+con\s+emunah/gi,
      /rabi\s+najman/gi,
      /shalom\s+arush/gi,
      /bar\s+mitzvah/gi,
      /bat\s+mitzvah/gi,
      /rosh\s+hashana/gi,
      /yom\s+kipur/gi,
      /tallit\s+gadol/gi,
      /tallit\s+katan/gi
    ];

    compoundPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        compounds.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return compounds;
  }

  // EXTRACCIÓN DE TÉRMINOS JUDAICOS ESPECÍFICOS
  extractJudaicTerms(text) {
    const foundTerms = [];
    const normalizedText = this.normalizeJudaicText(text);

    Object.entries(this.judaicTerms).forEach(([category, terms]) => {
      Object.entries(terms).forEach(([primaryTerm, termData]) => {
        // Verificar término principal
        if (normalizedText.includes(primaryTerm)) {
          foundTerms.push({
            term: primaryTerm,
            category: category,
            type: 'primary',
            confidence: 1.0
          });
        }

        // Verificar variaciones
        if (termData.variations) {
          termData.variations.forEach(variation => {
            if (normalizedText.includes(variation.toLowerCase())) {
              foundTerms.push({
                term: variation,
                category: category,
                type: 'variation',
                confidence: 0.9,
                primary: primaryTerm
              });
            }
          });
        }

        // Verificar términos relacionados
        if (termData.related) {
          termData.related.forEach(related => {
            if (normalizedText.includes(related.toLowerCase())) {
              foundTerms.push({
                term: related,
                category: category,
                type: 'related',
                confidence: 0.7,
                primary: primaryTerm
              });
            }
          });
        }
      });
    });

    // Eliminar duplicados y ordenar por confianza
    const uniqueTerms = foundTerms
      .filter((term, index, array) => 
        array.findIndex(t => t.term === term.term) === index)
      .sort((a, b) => b.confidence - a.confidence);

    return uniqueTerms;
  }

  // CLASIFICACIÓN DE PRODUCTOS JUDAICOS
  classifyJudaicProducts(text) {
    const classifications = [];
    const normalizedText = this.normalizeJudaicText(text);

    Object.entries(this.productCategories).forEach(([category, keywords]) => {
      let score = 0;
      let matchedKeywords = [];

      keywords.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
        
        // Búsqueda parcial para términos largos
        if (keyword.length > 5) {
          const words = normalizedText.split(' ');
          words.forEach(word => {
            if (word.includes(keyword.substring(0, 4)) && word.length >= keyword.length - 2) {
              score += 0.5;
            }
          });
        }
      });

      if (score > 0) {
        classifications.push({
          category: category,
          score: score,
          confidence: Math.min(score / keywords.length, 1.0),
          matchedKeywords: matchedKeywords
        });
      }
    });

    return classifications
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 categorías
  }

  // DETECCIÓN DE INTENCIÓN COMERCIAL
  detectCommercialIntent(text) {
    const intents = [];

    Object.entries(this.commercialPatterns).forEach(([intent, pattern]) => {
      if (pattern.test(text)) {
        const matches = text.match(pattern) || [];
        intents.push({
          intent: intent,
          confidence: Math.min(matches.length * 0.3 + 0.5, 1.0),
          matches: matches
        });
      }
    });

    // Determinar intención principal
    if (intents.length > 0) {
      const primaryIntent = intents.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        primary: primaryIntent.intent,
        confidence: primaryIntent.confidence,
        all: intents
      };
    }

    return null;
  }

  // ANÁLISIS DE SENTIMIENTOS ESPECIALIZADO
  analyzeSentiment(text) {
    const tokens = this.tokenizeJudaicText(text);
    let totalScore = 0;
    let wordCount = 0;
    const detectedWords = [];

    Object.entries(this.sentimentLexicon).forEach(([category, data]) => {
      data.words.forEach(word => {
        tokens.forEach(token => {
          if (token.includes(word) || word.includes(token)) {
            totalScore += data.weight;
            wordCount++;
            detectedWords.push({
              word: word,
              category: category,
              weight: data.weight
            });
          }
        });
      });
    });

    const avgScore = wordCount > 0 ? totalScore / wordCount : 0;
    let sentiment = 'neutral';
    let confidence = Math.abs(avgScore);

    if (avgScore > 0.3) {
      sentiment = avgScore > 1 ? 'very_positive' : 'positive';
    } else if (avgScore < -0.3) {
      sentiment = avgScore < -1 ? 'very_negative' : 'negative';
    }

    return {
      sentiment: sentiment,
      score: avgScore,
      confidence: Math.min(confidence, 1.0),
      detectedWords: detectedWords,
      wordCount: wordCount
    };
  }

  // EXTRACCIÓN DE ENTIDADES JUDAICAS
  extractJudaicEntities(text) {
    const entities = {
      products: [],
      people: [],
      places: [],
      books: [],
      ceremonies: [],
      dates: [],
      prices: []
    };

    const normalizedText = this.normalizeJudaicText(text);

    // Extraer productos mencionados
    const judaicTerms = this.extractJudaicTerms(text);
    entities.products = judaicTerms
      .filter(term => ['religious_objects', 'ceremonial_items'].includes(term.category))
      .map(term => term.term);

    // Extraer libros
    entities.books = judaicTerms
      .filter(term => ['sacred_literature', 'breslov_terms'].includes(term.category))
      .map(term => term.term);

    // Extraer personas importantes
    const personPatterns = [
      /rabi\s+najman/gi,
      /rabino\s+najman/gi,
      /shalom\s+arush/gi,
      /rabino\s+arush/gi,
      /rey\s+david/gi,
      /moisés/gi,
      /abraham/gi
    ];

    personPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.people.push(...matches);
      }
    });

    // Extraer precios
    const pricePattern = /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k|\d+\s*mil/gi;
    const priceMatches = text.match(pricePattern);
    if (priceMatches) {
      entities.prices = priceMatches;
    }

    // Extraer ciudades colombianas
    const colombianCities = [
      'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla',
      'cartagena', 'bucaramanga', 'pereira', 'manizales'
    ];

    colombianCities.forEach(city => {
      if (normalizedText.includes(city)) {
        entities.places.push(city);
      }
    });

    return entities;
  }

  // DETECCIÓN DE IDIOMA MEJORADA
  detectLanguage(text) {
    const tokens = text.toLowerCase().split(/\s+/);
    const scores = { spanish: 0, english: 0, hebrew: 0 };

    // Contar palabras en cada idioma
    Object.entries(this.stopWords).forEach(([lang, words]) => {
      tokens.forEach(token => {
        if (words.has(token)) {
          scores[lang]++;
        }
      });
    });

    // Detectar patrones específicos
    if (/[\u0590-\u05FF]/.test(text)) scores.hebrew += 5;
    if (/\b(the|and|is|are)\b/i.test(text)) scores.english += 2;
    if (/\b(el|la|de|que|y|es)\b/i.test(text)) scores.spanish += 3;

    const maxScore = Math.max(...Object.values(scores));
    const detectedLang = Object.entries(scores)
      .find(([, score]) => score === maxScore)?.[0] || 'unknown';

    return {
      primary: detectedLang,
      confidence: maxScore / tokens.length || 0,
      scores: scores
    };
  }

  // ESTADÍSTICAS AVANZADAS
  calculateTextStatistics(text, tokens) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = tokens.length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    const uniqueWords = new Set(tokens.map(t => t.toLowerCase())).size;
    const lexicalDiversity = uniqueWords / words || 0;
    
    const avgWordsPerSentence = words / sentences.length || 0;
    const avgCharsPerWord = charactersNoSpaces / words || 0;
    
    return {
      characters,
      charactersNoSpaces,
      words,
      uniqueWords,
      sentences: sentences.length,
      avgWordsPerSentence,
      avgCharsPerWord,
      lexicalDiversity,
      readabilityScore: this.calculateReadability(sentences.length, words, charactersNoSpaces),
      complexity: this.determineComplexity(avgWordsPerSentence, avgCharsPerWord, lexicalDiversity)
    };
  }

  calculateReadability(sentences, words, characters) {
    if (sentences === 0 || words === 0) return 0;
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = characters / words; // Aproximación
    
    // Fórmula Flesch adaptada para español
    let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    score = Math.max(0, Math.min(100, score));
    
    let level = 'difícil';
    if (score >= 90) level = 'muy_fácil';
    else if (score >= 80) level = 'fácil';
    else if (score >= 70) level = 'bastante_fácil';
    else if (score >= 60) level = 'estándar';
    else if (score >= 50) level = 'bastante_difícil';

    return { score, level };
  }

  determineComplexity(avgWordsPerSentence, avgCharsPerWord, lexicalDiversity) {
    const sentenceComplexity = Math.min(avgWordsPerSentence / 15, 1);
    const wordComplexity = Math.min(avgCharsPerWord / 6, 1);
    const vocabularyComplexity = lexicalDiversity;

    const overall = (sentenceComplexity + wordComplexity + vocabularyComplexity) / 3;

    let level = 'simple';
    if (overall > 0.7) level = 'complejo';
    else if (overall > 0.4) level = 'moderado';

    return {
      score: overall,
      level,
      factors: {
        sentences: sentenceComplexity,
        words: wordComplexity,
        vocabulary: vocabularyComplexity
      }
    };
  }

  // CÁLCULO DE CONFIANZA DEL ANÁLISIS
  calculateAnalysisConfidence(analysis) {
    let confidence = 0;
    let factors = 0;

    // Factor por términos judaicos encontrados
    if (analysis.judaicTerms.length > 0) {
      confidence += analysis.judaicTerms.reduce((sum, term) => sum + term.confidence, 0) / analysis.judaicTerms.length;
      factors++;
    }

    // Factor por categorías de productos identificadas
    if (analysis.productCategories.length > 0) {
      confidence += analysis.productCategories[0].confidence;
      factors++;
    }

    // Factor por detección de idioma
    if (analysis.language.confidence > 0.3) {
      confidence += analysis.language.confidence;
      factors++;
    }

    // Factor por intención comercial
    if (analysis.commercialIntent) {
      confidence += analysis.commercialIntent.confidence;
      factors++;
    }

    return factors > 0 ? confidence / factors : 0;
  }

  // UTILIDADES AUXILIARES
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  updateCache(key, data) {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('Cache NLP judaico limpiado');
  }

  // MÉTODOS PÚBLICOS DE UTILIDAD
  isJudaicTerm(term) {
    const analysis = this.analyzeJudaicText(term);
    return analysis.judaicTerms.length > 0;
  }

  getProductCategory(productName) {
    const analysis = this.analyzeJudaicText(productName);
    return analysis.productCategories.length > 0 ? 
      analysis.productCategories[0].category : 'unknown';
  }

  extractKeywords(text, maxKeywords = 10) {
    const tokens = this.tokenizeJudaicText(text);
    const analysis = this.analyzeJudaicText(text);
    
    // Combinar tokens normales con términos judaicos
    const keywords = [...tokens];
    analysis.judaicTerms.forEach(term => {
      if (term.confidence > 0.7) {
        keywords.push(term.term);
      }
    });

    // Calcular frecuencias
    const frequencies = {};
    keywords.forEach(keyword => {
      frequencies[keyword] = (frequencies[keyword] || 0) + 1;
    });

    // Bonus para términos judaicos
    analysis.judaicTerms.forEach(term => {
      if (frequencies[term.term]) {
        frequencies[term.term] *= 1.5;
      }
    });

    return Object.entries(frequencies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([keyword, frequency]) => ({
        keyword,
        frequency,
        importance: frequency / Math.max(...Object.values(frequencies))
      }));
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.cacheMaxSize,
      stopWordsCount: {
        spanish: this.stopWords.spanish.size,
        english: this.stopWords.english.size,
        hebrew: this.stopWords.hebrew.size
      },
      judaicTermsCount: Object.values(this.judaicTerms)
        .reduce((total, category) => total + Object.keys(category).length, 0),
      productCategoriesCount: Object.keys(this.productCategories).length,
      spellingCorrectionsCount: Object.keys(this.spellingCorrections).length,
      version: 'ultra-judaica-nlp-v2.0'
    };
  }
}