// lib/chatbot/ultra-judaica-product-search.js - MOTOR DE BÚSQUEDA ULTRA-ESPECIALIZADO V2.0

import { query } from '../database.js';

export class UltraJudaicaProductSearch {
  constructor(synonymManager = null, nlpUtils = null, databaseStatusCallback = null) {
    this.searchCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutos

    // Integración con otros componentes
    this.synonymManager = synonymManager;
    this.nlpUtils = nlpUtils;
    this.onDatabaseStatus = typeof databaseStatusCallback === 'function'
      ? databaseStatusCallback
      : null;

    this.lastDatabaseStatus = {
      connected: null,
      checkedAt: null,
      latency: null,
      error: null,
      source: 'product-search'
    };
    
    // SISTEMA AVANZADO DE STOP WORDS PARA BÚSQUEDA
    this.searchStopWords = new Set([
      // Palabras de consulta que no aportan al producto específico
      'busco', 'buscar', 'necesito', 'quiero', 'deseo', 'me', 'te', 'se', 'le',
      'encontrar', 'ver', 'mostrar', 'enseñar', 'conseguir', 'obtener',
      'precio', 'precios', 'cuanto', 'cuesta', 'vale', 'costo', 'valor',
      'hay', 'tienen', 'existe', 'disponible', 'stock', 'existencia',
      
      // Artículos y determinantes
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'del', 'de', 'al', 'a', 'en', 'con', 'para', 'por', 'sin',
      
      // Palabras genéricas
      'cosa', 'cosas', 'articulo', 'articulos', 'producto', 'productos',
      'libro', 'libros', 'item', 'items', 'objeto', 'objetos',
      
      // Interrogativos genéricos
      'que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'quien',
      
      // Conectores
      'y', 'o', 'u', 'e', 'ni', 'pero', 'mas', 'sino', 'aunque'
    ]);

    // CATEGORÍAS DE PRODUCTOS JUDAICOS ESPECIALIZADAS
    this.productCategories = {
      sacred_literature: {
        torah_chumash: {
          keywords: ['torah', 'torá', 'tora', 'chumash', 'jumash', 'humash', 'pentateuco', 
                    'cinco libros', 'bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim',
                    'génesis', 'éxodo', 'levítico', 'números', 'deuteronomio'],
          weight: 1.0,
          context: ['sagrado', 'divino', 'ley', 'mandamientos', 'estudio']
        },
        
        tanaj_bible: {
          keywords: ['tanaj', 'tanakh', 'biblia hebrea', 'escrituras', 'neviim', 'ketuvim',
                    'profetas', 'escritos', 'samuel', 'reyes', 'isaías', 'jeremías'],
          weight: 1.0,
          context: ['completo', 'original', 'auténtico']
        },
        
        talmud_mishna: {
          keywords: ['talmud', 'gemara', 'mishná', 'mishnah', 'shas', 'halajá', 'halakha',
                    'babilónico', 'bavli', 'yerushalmi', 'tratado', 'masechet'],
          weight: 0.95,
          context: ['estudio', 'interpretación', 'ley']
        },
        
        prayer_books: {
          keywords: ['sidur', 'sidurim', 'tehilim', 'salmos', 'majzor', 'machzor',
                    'libro de rezos', 'oraciones', 'plegarias', 'liturgia'],
          weight: 0.9,
          context: ['oración', 'rezo', 'diario', 'festividad']
        },
        
        breslov_literature: {
          keywords: ['breslov', 'breslev', 'emunah', 'emuna', 'jardín de la fe', 'jardin',
                    'vivamos con emunah', 'shalom arush', 'arush', 'najman', 'nachman',
                    'en el jardín', 'agua del edén', 'luz del alma'],
          weight: 1.0,
          context: ['crecimiento', 'fe', 'inspiración', 'práctica']
        },
        
        kabbalah_mysticism: {
          keywords: ['zohar', 'cábala', 'kabbalah', 'kabala', 'cabalá', 'misticismo',
                    'sefer zohar', 'libro del esplendor', 'shimon bar iojai'],
          weight: 0.85,
          context: ['místico', 'profundo', 'esotérico']
        }
      },

      ritual_objects: {
        tefilin: {
          keywords: ['tefilín', 'tefilin', 'phylacteries', 'filacterias', 'cajas de rezo',
                    'batim', 'retzuot', 'correas', 'pergaminos', 'parshiot'],
          weight: 1.0,
          context: ['ritual diario', 'mitzvá', 'bar mitzvá', 'kosher']
        },
        
        tallit_tzitzit: {
          keywords: ['tallit', 'talit', 'tzitzit', 'zizit', 'manto de oración', 'prayer shawl',
                    'manto', 'gadol', 'katan', 'flecos', 'cordones', 'atara'],
          weight: 1.0,
          context: ['sinagoga', 'cobertura', 'mandamiento']
        },
        
        mezuzah: {
          keywords: ['mezuzá', 'mezuzah', 'mezuza', 'mezuzot', 'klaf', 'pergamino',
                    'estuche', 'caja', 'puerta', 'shema', 'sofer'],
          weight: 1.0,
          context: ['hogar', 'protección', 'bendición']
        },
        
        kipa_yarmulke: {
          keywords: ['kipá', 'kipa', 'kipot', 'yarmulke', 'yarmulka', 'kippah',
                    'solideo', 'gorro judío', 'cobertura'],
          weight: 0.9,
          context: ['cabeza', 'respeto', 'identidad']
        },
        
        shofar: {
          keywords: ['shofar', 'cuerno', 'trompeta judía', 'carnero', 'antílope',
                    'kudu', 'rosh hashaná', 'año nuevo'],
          weight: 0.95,
          context: ['festividad', 'llamado', 'despertar']
        }
      },

      ceremonial_items: {
        menorah_chanukiah: {
          keywords: ['menorá', 'menorah', 'candelabro', 'janukiá', 'chanukiah',
                    'siete brazos', 'nueve brazos', 'shamash', 'luz'],
          weight: 0.95,
          context: ['luz', 'festividad', 'ceremonial']
        },
        
        shabat_items: {
          keywords: ['copa kidush', 'kiddush', 'kidush', 'candelabros shabat',
                    'velas shabat', 'plato jalá', 'havdalá', 'havdala'],
          weight: 0.9,
          context: ['shabat', 'santificación', 'familia']
        },
        
        holiday_items: {
          keywords: ['pesaj', 'pascua', 'seder', 'plato seder', 'keará', 'hagadá',
                    'copa elías', 'matzá', 'janucá', 'chanucá', 'hanukkah',
                    'dreidel', 'sevivón', 'velas janucá'],
          weight: 0.85,
          context: ['festividad', 'familia', 'tradición']
        }
      },

      jewelry_accessories: {
        religious_jewelry: {
          keywords: ['collar', 'cadena', 'pulsera', 'anillo', 'aretes', 'pendientes',
                    'colgante', 'dije', 'medalla', 'amuleto'],
          weight: 0.8,
          context: ['joyería', 'regalo', 'identidad']
        },
        
        jewish_symbols: {
          keywords: ['estrella de david', 'magen david', 'estrella david', 'hexagrama',
                    'jai', 'chai', 'vida', 'hamsa', 'jamsa', 'mano de fátima',
                    'mano protectora', 'jerusalén', 'kotel'],
          weight: 0.9,
          context: ['símbolo', 'protección', 'identidad judía']
        }
      },

      home_decor: {
        wall_art: {
          keywords: ['cuadro', 'lámina', 'poster', 'arte', 'decoración', 'pared',
                    'shema israel', 'birkat habayit', 'bendición hogar'],
          weight: 0.7,
          context: ['decoración', 'hogar', 'bendición']
        }
      }
    };

    // PATRONES DE BÚSQUEDA INTELIGENTE
    this.searchPatterns = {
      // Patrones para extraer productos de frases naturales
      product_extraction: [
        // "busco/necesito/quiero [producto]"
        /(?:busco|necesito|quiero|me interesa|precio de|cuánto cuesta|tienen|hay)\s+(?:un\s+|una\s+|el\s+|la\s+|los\s+|las\s+)?(.+?)(?:\?|$|,|\.)/i,
        
        // "[producto] disponible/en stock"
        /(.+?)\s+(?:disponible|en stock|agotado|precio|costo)/i,
        
        // "para [ocasión] necesito [producto]"
        /(?:para\s+.+?\s+(?:necesito|busco|quiero))\s+(.+)/i,
        
        // Patrón directo de producto
        /^(.+?)(?:\s+(?:kosher|certificado|premium|mehudar|simple))?$/i
      ],
      
      // Patrones de ocasiones especiales
      occasions: {
        'bar_mitzvah': ['bar mitzvá', 'bar mitzvah', 'celebración', 'ceremonia'],
        'bat_mitzvah': ['bat mitzvá', 'bat mitzvah'],
        'wedding': ['boda', 'casamiento', 'matrimonio', 'nupcias'],
        'new_home': ['casa nueva', 'hogar nuevo', 'mudanza', 'estrenar casa'],
        'gift': ['regalo', 'presente', 'obsequio', 'detalle'],
        'synagogue': ['sinagoga', 'templo', 'comunidad']
      },
      
      // Patrones de calidad
      quality_indicators: {
        'premium': ['mehudar', 'premium', 'superior', 'lujo', 'elegante'],
        'standard': ['estándar', 'normal', 'básico', 'regular'],
        'certified': ['kosher', 'kasher', 'certificado', 'supervisado', 'rabínico'],
        'artisanal': ['artesanal', 'hecho a mano', 'tradicional', 'único']
      }
    };

    // SISTEMA DE SCORING Y RELEVANCIA
    this.scoringWeights = {
      exact_match: 2.0,
      partial_match: 1.5,
      synonym_match: 1.2,
      category_match: 1.0,
      related_term: 0.8,
      context_match: 0.6,

      // Bonus por características especiales
      featured_product: 0.3,
      in_stock: 0.2,
      on_sale: 0.15,
      kosher_certified: 0.1
    };

    this.offlineCatalog = this.buildOfflineCatalog();

    console.log('Motor de búsqueda judaica inicializado');
  }

  reportDatabaseStatus(connected, details = {}) {
    const status = {
      connected,
      checkedAt: new Date().toISOString(),
      latency: typeof details.latency === 'number' ? details.latency : null,
      error: connected ? null : (details.error || details.message || null),
      source: 'product-search'
    };

    this.lastDatabaseStatus = status;

    if (this.onDatabaseStatus) {
      try {
        this.onDatabaseStatus(status);
      } catch (callbackError) {
        console.warn('⚠️ Error notificando estado de base de datos:', callbackError.message);
      }
    }
  }

  shouldUseOfflineFallback() {
    return this.lastDatabaseStatus.connected === false;
  }

  normalizeSearchTerms(searchTerms) {
    if (!searchTerms) {
      return [];
    }

    const termsArray = Array.isArray(searchTerms) ? searchTerms : [searchTerms];

    return termsArray
      .map(term => (term ?? '').toString().trim().toLowerCase())
      .filter(term => term.length > 0)
      .slice(0, 10);
  }

  // MÉTODO PRINCIPAL DE BÚSQUEDA INTELIGENTE
  async searchProducts(searchTerms, intent = {}, limit = 10) {
    try {
      console.log(`Iniciando búsqueda avanzada: "${Array.isArray(searchTerms) ? searchTerms.join(', ') : searchTerms}"`);

      // Preparar términos de búsqueda
      const processedTerms = await this.preprocessSearchTerms(searchTerms, intent);
      
      if (processedTerms.length === 0) {
        console.log('No se encontraron términos válidos, mostrando productos populares');
        return await this.getPopularProducts(limit);
      }

      // Construir y ejecutar consulta
      const searchQuery = this.buildAdvancedSearchQuery(processedTerms, intent, limit);
      const dbStart = Date.now();
      const results = await query(searchQuery.sql, searchQuery.params);
      this.reportDatabaseStatus(true, { latency: Date.now() - dbStart });

      // Procesar y rankear resultados
      const processedResults = await this.processAndRankResults(results, processedTerms, intent);

      console.log(`Búsqueda completada: ${processedResults.length} productos encontrados`);
      return processedResults;

    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      this.reportDatabaseStatus(false, { error: error.message });

      if (this.shouldUseOfflineFallback()) {
        return this.getOfflineFallbackProducts(searchTerms, limit);
      }

      return await this.fallbackSearch(searchTerms, limit);
    }
  }

  // PREPROCESAMIENTO INTELIGENTE DE TÉRMINOS
  async preprocessSearchTerms(searchInput, intent) {
    try {
      let terms = [];

      // Convertir a array si es string
      if (typeof searchInput === 'string') {
        terms = await this.extractTermsFromText(searchInput);
      } else if (Array.isArray(searchInput)) {
        terms = searchInput.filter(term => term && term.length > 1);
      }

      // Limpiar términos
      terms = this.cleanSearchTerms(terms);

      // Expandir con sinónimos si está disponible
      if (this.synonymManager) {
        terms = await this.expandWithSynonyms(terms);
      }

      // Analizar con NLP si está disponible
      if (this.nlpUtils) {
        const nlpResults = await this.analyzeWithNLP(searchInput);
        if (nlpResults.products && nlpResults.products.length > 0) {
          terms.push(...nlpResults.products);
        }
      }

      // Detectar productos por categoría
      const categoryTerms = this.detectProductsByCategory(terms.join(' '));
      terms.push(...categoryTerms);

      // Eliminar duplicados y términos muy cortos
      terms = [...new Set(terms)]
        .filter(term => term && term.length > 1)
        .slice(0, 15); // Limitar cantidad

      console.log(`Términos procesados: [${terms.join(', ')}]`);
      return terms;

    } catch (error) {
      console.error('Error en preprocesamiento:', error);
      return Array.isArray(searchInput) ? searchInput : [searchInput].filter(Boolean);
    }
  }

  // EXTRACCIÓN INTELIGENTE DE TÉRMINOS DE TEXTO
  async extractTermsFromText(text) {
    const extractedTerms = [];
    
    // Usar patrones de extracción
    for (const pattern of this.searchPatterns.product_extraction) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let term = match[1].trim().toLowerCase();
        
        // Limpiar término extraído
        term = this.cleanExtractedTerm(term);
        
        if (term && term.length > 2) {
          extractedTerms.push(term);
        }
      }
    }

    // Si no se extrajo nada específico, tokenizar todo el texto
    if (extractedTerms.length === 0) {
      const words = text.toLowerCase()
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && 
          !this.searchStopWords.has(word) &&
          !word.match(/^\d+$/)
        );
      
      extractedTerms.push(...words);
    }

    // Detectar términos compuestos importantes
    const compoundTerms = this.detectCompoundTerms(text);
    extractedTerms.push(...compoundTerms);

    return [...new Set(extractedTerms)];
  }

  cleanExtractedTerm(term) {
    return term
      .replace(/\b(?:un|una|el|la|los|las|de|del|para|por|con|sin)\b/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sáéíóúñü]/g, '')
      .trim();
  }

  detectCompoundTerms(text) {
    const compounds = [];
    const compoundPatterns = [
      /copa\s+kidush/gi,
      /estrella\s+de\s+david/gi,
      /jardín\s+de\s+la\s+fe/gi,
      /vivamos\s+con\s+emunah/gi,
      /en\s+el\s+jardín\s+de\s+la\s+paz/gi,
      /rabi\s+najman/gi,
      /rabino\s+najman/gi,
      /shalom\s+arush/gi,
      /bar\s+mitzvah/gi,
      /bat\s+mitzvah/gi,
      /rosh\s+hashaná/gi,
      /yom\s+kipur/gi,
      /tallit\s+gadol/gi,
      /tallit\s+katan/gi,
      /cajas\s+de\s+rezo/gi,
      /manto\s+de\s+oración/gi,
      /candelabros\s+de\s+shabat/gi,
      /velas\s+de\s+shabat/gi
    ];

    compoundPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        compounds.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return compounds;
  }

  cleanSearchTerms(terms) {
    return terms
      .map(term => {
        if (typeof term !== 'string') return '';
        
        return term
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter(term => 
        term && 
        term.length > 1 && 
        !this.searchStopWords.has(term) &&
        !term.match(/^\d+$/)
      );
  }

  // EXPANSIÓN CON SINÓNIMOS
  async expandWithSynonyms(terms) {
    const expandedTerms = new Set(terms);
    
    for (const term of terms) {
      try {
        const synonymData = await this.synonymManager.getSynonymsForTerm(term);
        if (synonymData) {
          // Agregar variaciones más relevantes
          if (synonymData.variations) {
            synonymData.variations.slice(0, 3).forEach(variation => {
              expandedTerms.add(variation);
            });
          }
          
          // Agregar términos relacionados
          if (synonymData.related) {
            synonymData.related.slice(0, 2).forEach(related => {
              expandedTerms.add(related);
            });
          }
        }
      } catch (error) {
        console.log(`Error expandiendo sinónimos para "${term}":`, error.message);
      }
    }

    return Array.from(expandedTerms);
  }

  // ANÁLISIS NLP
  async analyzeWithNLP(text) {
    try {
      const analysis = this.nlpUtils.analyzeJudaicText(text);
      
      return {
        products: analysis.judaicTerms?.map(term => term.term) || [],
        categories: analysis.productCategories?.map(cat => cat.category) || [],
        intent: analysis.commercialIntent
      };
    } catch (error) {
      console.log('Error en análisis NLP:', error.message);
      return { products: [], categories: [], intent: null };
    }
  }

  // DETECCIÓN POR CATEGORÍAS
  detectProductsByCategory(text) {
    const detectedTerms = [];
    const normalizedText = text.toLowerCase();

    Object.entries(this.productCategories).forEach(([mainCategory, subCategories]) => {
      Object.entries(subCategories).forEach(([subCategory, data]) => {
        data.keywords.forEach(keyword => {
          if (normalizedText.includes(keyword)) {
            detectedTerms.push(keyword);
            
            // Agregar términos de contexto relacionados
            if (data.context) {
              data.context.forEach(contextTerm => {
                if (normalizedText.includes(contextTerm)) {
                  detectedTerms.push(contextTerm);
                }
              });
            }
          }
        });
      });
    });

    return [...new Set(detectedTerms)];
  }

  // CONSTRUCCIÓN DE CONSULTA AVANZADA
  buildAdvancedSearchQuery(terms, intent, limit) {
    if (!terms || terms.length === 0) {
      return this.getPopularProductsQuery(limit);
    }

    // Construir condiciones de búsqueda múltiples
    const searchConditions = [];
    const params = [];
    
    // Añadir parámetros para scoring al principio
    const firstTerm = terms[0] || '';
    params.push(`%${firstTerm}%`, `%${firstTerm}%`);

    terms.forEach(term => {
      searchConditions.push(`(
        name LIKE ? OR 
        description LIKE ? OR 
        short_description LIKE ? OR 
        tags LIKE ? OR 
        keywords LIKE ? OR
        category LIKE ? OR
        sku LIKE ?
      )`);
      
      const searchPattern = `%${term}%`;
      params.push(searchPattern, searchPattern, searchPattern, 
                 searchPattern, searchPattern, searchPattern, searchPattern);
    });

    // Añadir limit al final
    params.push(limit);

    const sql = `
      SELECT 
        id, name, slug, description, short_description, tags, keywords,
        price, sale_price, stock_status, stock_quantity, featured,
        category, sku,
        CASE WHEN sale_price > 0 AND sale_price < price THEN sale_price ELSE price END as display_price,
        
        -- Sistema de scoring avanzado
        (
          -- Coincidencia exacta en nombre (mayor peso)
          CASE WHEN LOWER(name) LIKE ? THEN ${this.scoringWeights.exact_match} ELSE 0 END +
          
          -- Coincidencia parcial en nombre
          CASE WHEN name LIKE ? THEN ${this.scoringWeights.partial_match} ELSE 0 END +
          
          -- Coincidencia en descripción
          CASE WHEN description LIKE ? THEN 0.8 ELSE 0 END +
          
          -- Coincidencia en tags/keywords
          CASE WHEN tags LIKE ? OR keywords LIKE ? THEN 0.6 ELSE 0 END +
          
          -- Bonus por características especiales
          CASE WHEN featured = 1 THEN ${this.scoringWeights.featured_product} ELSE 0 END +
          CASE WHEN stock_status = 'in_stock' THEN ${this.scoringWeights.in_stock} ELSE 0 END +
          CASE WHEN sale_price > 0 AND sale_price < price THEN ${this.scoringWeights.on_sale} ELSE 0 END +
          
          -- Bonus por términos kosher/certificado
          CASE WHEN (description LIKE '%kosher%' OR description LIKE '%certificado%' OR 
                     tags LIKE '%kosher%' OR keywords LIKE '%kosher%') 
               THEN ${this.scoringWeights.kosher_certified} ELSE 0 END
        ) as relevance_score
        
      FROM products 
      WHERE status = 'active' 
      AND (${searchConditions.join(' OR ')})
      
      ORDER BY 
        relevance_score DESC,
        CASE WHEN stock_status = 'in_stock' THEN 1 ELSE 2 END,
        featured DESC,
        display_price ASC
      LIMIT ?
    `;

    // Añadir parámetros adicionales para el scoring
    const scoringParams = [
      `%${firstTerm}%`, `%${firstTerm}%`, `%${firstTerm}%`,
      `%${firstTerm}%`, `%${firstTerm}%`
    ];

    return {
      sql: sql,
      params: [...scoringParams, ...params]
    };
  }

  getPopularProductsQuery(limit) {
    return {
      sql: `
        SELECT 
          id, name, slug, description, short_description, tags, keywords,
          price, sale_price, stock_status, stock_quantity, featured,
          category, sku,
          CASE WHEN sale_price > 0 AND sale_price < price THEN sale_price ELSE price END as display_price,
          (
            CASE WHEN featured = 1 THEN 2.0 ELSE 0 END +
            CASE WHEN stock_status = 'in_stock' THEN 1.0 ELSE 0 END +
            CASE WHEN sale_price > 0 THEN 0.5 ELSE 0 END
          ) as relevance_score
        FROM products 
        WHERE status = 'active'
        ORDER BY 
          relevance_score DESC,
          featured DESC,
          created_at DESC
        LIMIT ?
      `,
      params: [limit]
    };
  }

  // PROCESAMIENTO Y RANKING DE RESULTADOS
  async processAndRankResults(results, searchTerms, intent) {
    if (!results || results.length === 0) {
      return [];
    }

    return results.map(product => {
      // Generar slug limpio
      let cleanSlug = product.slug;
      if (!cleanSlug || cleanSlug === 'NULL' || cleanSlug === '') {
        cleanSlug = this.generateSlugFromName(product.name);
      }

      // Calcular relevancia adicional basada en términos de búsqueda
      const additionalRelevance = this.calculateAdditionalRelevance(product, searchTerms);

      // Determinar categoría principal
      const detectedCategory = this.detectProductCategory(product.name, product.description, product.category);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        short_description: product.short_description,
        price: parseFloat(product.price || 0),
        sale_price: parseFloat(product.sale_price || 0),
        display_price: parseFloat(product.display_price || product.price || 0),
        stock_status: product.stock_status || 'in_stock',
        stock_quantity: parseInt(product.stock_quantity || 0),
        featured: product.featured === 1,
        slug: cleanSlug,
        category: detectedCategory,
        sku: product.sku,
        
        // URLs y enlaces
        url: `https://www.judaicabreslovcolombia.com/producto/${cleanSlug}`,
        
        // Scoring
        relevance_score: (parseFloat(product.relevance_score) || 0) + additionalRelevance,
        
        // Metadata adicional
        is_judaica: this.isJudaicProduct(product.name, product.description),
        quality_level: this.determineQualityLevel(product.name, product.description),
        occasions: this.detectSuitableOccasions(product.name, product.description)
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  calculateAdditionalRelevance(product, searchTerms) {
    let additionalScore = 0;
    const productText = `${product.name} ${product.description || ''} ${product.tags || ''} ${product.keywords || ''}`.toLowerCase();
    
    searchTerms.forEach(term => {
      const termLower = term.toLowerCase();
      
      // Coincidencia exacta en nombre
      if (product.name.toLowerCase().includes(termLower)) {
        additionalScore += 1.0;
      }
      
      // Coincidencia en descripción
      if (productText.includes(termLower)) {
        additionalScore += 0.5;
      }
      
      // Coincidencia parcial inteligente
      if (termLower.length > 4) {
        const partial = termLower.substring(0, Math.floor(termLower.length * 0.7));
        if (productText.includes(partial)) {
          additionalScore += 0.3;
        }
      }
    });

    return Math.min(additionalScore, 2.0); // Limitar el bonus adicional
  }

  generateSlugFromName(name) {
    if (!name) return 'producto';
    
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  detectProductCategory(name, description, existingCategory) {
    if (existingCategory && existingCategory !== 'general') {
      return existingCategory;
    }

    const text = `${name} ${description || ''}`.toLowerCase();
    
    // Buscar en categorías especializadas
    for (const [mainCategory, subCategories] of Object.entries(this.productCategories)) {
      for (const [subCategory, data] of Object.entries(subCategories)) {
        if (data.keywords.some(keyword => text.includes(keyword))) {
          return subCategory;
        }
      }
    }

    // Fallback a detección básica
    if (text.includes('libro') || text.includes('sefer')) return 'sacred_literature';
    if (text.includes('tefilin')) return 'tefilin';
    if (text.includes('tallit')) return 'tallit_tzitzit';
    if (text.includes('mezuzah') || text.includes('mezuza')) return 'mezuzah';
    if (text.includes('kipa') || text.includes('yarmulke')) return 'kipa_yarmulke';
    if (text.includes('collar') || text.includes('cadena')) return 'religious_jewelry';
    
    return 'general';
  }

  isJudaicProduct(name, description) {
    const text = `${name} ${description || ''}`.toLowerCase();
    const judaicKeywords = [
      'judaico', 'judío', 'hebreo', 'kosher', 'kasher', 'torah', 'talmud',
      'tefilin', 'tallit', 'mezuzah', 'kipa', 'shofar', 'menorah',
      'shabat', 'januca', 'pesaj', 'rosh hashana', 'breslov'
    ];

    return judaicKeywords.some(keyword => text.includes(keyword));
  }

  determineQualityLevel(name, description) {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    if (text.match(/mehudar|premium|superior|lujo|elegante|artesanal/)) {
      return 'premium';
    }
    if (text.match(/básico|simple|económico|standard/)) {
      return 'basic';
    }
    if (text.match(/kosher|certificado|supervisado|rabínico/)) {
      return 'certified';
    }
    
    return 'standard';
  }

  detectSuitableOccasions(name, description) {
    const text = `${name} ${description || ''}`.toLowerCase();
    const occasions = [];
    
    Object.entries(this.searchPatterns.occasions).forEach(([occasion, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        occasions.push(occasion);
      }
    });

    // Detectar ocasiones implícitas
    if (text.includes('tefilin')) occasions.push('bar_mitzvah');
    if (text.includes('copa') || text.includes('candelabro')) occasions.push('new_home');
    if (text.includes('collar') || text.includes('joyeria')) occasions.push('gift');
    
    return occasions;
  }

  // BÚSQUEDAS ESPECIALIZADAS
  async searchByCategory(category, limit = 10) {
    try {
      const categoryData = this.findCategoryData(category);
      if (categoryData) {
        return await this.searchProducts(categoryData.keywords, { type: 'category' }, limit);
      }

      // Búsqueda directa por categoría en BD
      const dbStart = Date.now();
      const results = await query(`
        SELECT
          id, name, slug, description, short_description,
          price, sale_price, stock_status, featured,
          CASE WHEN sale_price > 0 AND sale_price < price THEN sale_price ELSE price END as display_price
        FROM products
        WHERE status = 'active'
        AND category = ?
        ORDER BY featured DESC, name ASC
        LIMIT ?
      `, [category, limit]);

      this.reportDatabaseStatus(true, { latency: Date.now() - dbStart });

      return this.processAndRankResults(results, [category], { type: 'category' });

    } catch (error) {
      console.error('Error en búsqueda por categoría:', error);
      this.reportDatabaseStatus(false, { error: error.message });
      return this.getOfflineFallbackProducts([category], limit);
    }
  }

  findCategoryData(category) {
    for (const [mainCategory, subCategories] of Object.entries(this.productCategories)) {
      if (subCategories[category]) {
        return subCategories[category];
      }
    }
    return null;
  }

  async getPopularProducts(limit = 6) {
    try {
      const query_obj = this.getPopularProductsQuery(limit);
      const dbStart = Date.now();
      const results = await query(query_obj.sql, query_obj.params);
      this.reportDatabaseStatus(true, { latency: Date.now() - dbStart });
      return this.processAndRankResults(results, ['populares'], { type: 'popular' });

    } catch (error) {
      console.error('Error obteniendo productos populares:', error);
      this.reportDatabaseStatus(false, { error: error.message });
      return this.getOfflineFallbackProducts(['populares'], limit);
    }
  }

  async searchSimilarProducts(productName, limit = 4) {
    let searchTerms = [productName];

    try {
      console.log(`Buscando productos similares a: "${productName}"`);

      // Expandir con sinónimos si está disponible
      if (this.synonymManager) {
        const synonymData = await this.synonymManager.getSynonymsForTerm(productName);
        if (synonymData) {
          searchTerms.push(...(synonymData.variations || []).slice(0, 3));
          searchTerms.push(...(synonymData.related || []).slice(0, 2));
        }
      }

      return await this.searchProducts(searchTerms, { type: 'similarity' }, limit);

    } catch (error) {
      console.error('Error buscando productos similares:', error);
      this.reportDatabaseStatus(false, { error: error.message });
      return this.getOfflineFallbackProducts(searchTerms, limit);
    }
  }

  getOfflineFallbackProducts(searchTerms, limit = 6) {
    const normalizedTerms = this.normalizeSearchTerms(searchTerms);

    console.log('🔄 Utilizando catálogo offline ultra-especializado', normalizedTerms);

    const scored = this.offlineCatalog.map(product => {
      let score = product.offlineScore ?? 1;

      if (normalizedTerms.length === 0) {
        score += product.featured ? 1 : 0;
      }

      normalizedTerms.forEach(term => {
        if (product.nameLower.includes(term)) {
          score += 2.2;
        }

        if (product.keywordsLower.includes(term)) {
          score += 1.5;
        }

        if (product.tagsLower.includes(term)) {
          score += 1.0;
        }

        if (product.category && product.category.includes(term)) {
          score += 0.6;
        }
      });

      return {
        ...product,
        relevance_score: score,
        display_price: product.display_price ||
          (product.sale_price > 0 && product.sale_price < product.price
            ? product.sale_price
            : product.price)
      };
    });

    const sorted = scored
      .filter(product => normalizedTerms.length === 0 || product.relevance_score > 0.4)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    if (sorted.length === 0) {
      return [];
    }

    return this.processAndRankResults(
      sorted,
      normalizedTerms.length > 0 ? normalizedTerms : ['offline'],
      { type: 'offline_fallback', fallback: true }
    );
  }

  buildOfflineCatalog() {
    const rawProducts = [
      {
        id: 'offline-tallit-premium',
        name: 'Tallit de Lana Premium Breslov',
        slug: 'tallit-lana-premium-breslov',
        description: 'Manto de oración 100% lana con tzitzit kosher atados a mano y atará bordada.',
        short_description: 'Tallit mehudar certificado para Shajarit y festividades.',
        tags: 'tallit, tzitzit, breslov, bar mitzvah',
        keywords: 'tallit kosher tzitzit lana breslov bar mitzva',
        price: 420000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 4,
        featured: 1,
        category: 'ritual_objects',
        sku: 'OFF-TALLIT-001',
        offlineScore: 3.2
      },
      {
        id: 'offline-tefilin-certificado',
        name: 'Tefilín Kosher Certificado Mehudar',
        slug: 'tefilin-kosher-certificado-mehudar',
        description: 'Juego completo de tefilín con pergaminos escritos por sofer certificado y correas reforzadas.',
        short_description: 'Incluye estuche protector y certificado de kashrut.',
        tags: 'tefilin, kosher, sofer, mitzva',
        keywords: 'tefilin kosher certificado sofer mezuzah mitzva',
        price: 1150000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 2,
        featured: 1,
        category: 'ritual_objects',
        sku: 'OFF-TEF-001',
        offlineScore: 3.8
      },
      {
        id: 'offline-mezuzah-klaf',
        name: 'Mezuzá con Klaf Kosher y Estuche Decorado',
        slug: 'mezuzah-klaf-kosher-estuche-decorado',
        description: 'Pergamino kosher certificado con estuche metálico resistente para puertas principales.',
        short_description: 'Incluye instrucciones de instalación y bendición.',
        tags: 'mezuzah, klaf, hogar, proteccion',
        keywords: 'mezuzah kosher klaf hogar proteccion judaica',
        price: 189000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 10,
        featured: 1,
        category: 'ritual_objects',
        sku: 'OFF-MEZ-001',
        offlineScore: 2.9
      },
      {
        id: 'offline-sidur-heb-es',
        name: 'Sidur Completo Hebreo - Español con Fonética',
        slug: 'sidur-hebreo-espanol-fonetica',
        description: 'Sidur con traducción al español, transliteración fonética y guía para cada servicio diario.',
        short_description: 'Ideal para sinagogas y estudio personal.',
        tags: 'sidur, oraciones, fonetica, español',
        keywords: 'sidur hebreo español fonetica oraciones shabat',
        price: 165000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 8,
        featured: 1,
        category: 'books_literature',
        sku: 'OFF-SID-001',
        offlineScore: 2.7
      },
      {
        id: 'offline-tehilim-interlineal',
        name: 'Tehilim Interlineal Hebreo Español',
        slug: 'tehilim-interlineal-hebreo-espanol',
        description: 'Libro de Salmos interlineal con comentario breve y transliteración para acompañar cada capítulo.',
        short_description: 'Formato portátil para uso diario.',
        tags: 'tehilim, salmos, libro, oracion',
        keywords: 'tehilim salmos libro oracion hebreo español',
        price: 98000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 15,
        featured: 0,
        category: 'books_literature',
        sku: 'OFF-TEH-001',
        offlineScore: 2.5
      },
      {
        id: 'offline-jardin-fe',
        name: 'Jardín de la Fe - Edición Actualizada',
        slug: 'jardin-de-la-fe-edicion-actualizada',
        description: 'Best seller del Rabino Shalom Arush con guías prácticas de emuná para toda la familia.',
        short_description: 'Edición revisada con capítulos adicionales.',
        tags: 'breslov, emuna, libro, shalom arush',
        keywords: 'jardin de la fe shalom arush breslov emuna',
        price: 110000,
        sale_price: 95000,
        stock_status: 'in_stock',
        stock_quantity: 12,
        featured: 1,
        category: 'books_breslov',
        sku: 'OFF-BRE-001',
        offlineScore: 3.1
      },
      {
        id: 'offline-menora-januca',
        name: 'Menorá de Janucá de Nueve Brazos en Latón Pulido',
        slug: 'menora-januca-nueve-brazos-laton',
        description: 'Menorá tradicional con base estable, incluye velas de prueba y guía de encendido.',
        short_description: 'Perfecta para Janucá y decoración del hogar.',
        tags: 'menora, januca, festivo, decoracion',
        keywords: 'menora januca hanukkah laton decoracion festividad',
        price: 260000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 6,
        featured: 1,
        category: 'ceremonial_items',
        sku: 'OFF-MEN-001',
        offlineScore: 2.6
      },
      {
        id: 'offline-collar-estrella',
        name: 'Collar Estrella de David en Plata Esterlina',
        slug: 'collar-estrella-de-david-plata-esterlina',
        description: 'Collar de plata 925 con cadena ajustable y dije de Maguén David detallado.',
        short_description: 'Incluye estuche de regalo.',
        tags: 'joyeria, estrella de david, plata, regalo',
        keywords: 'collar estrella de david plata joyeria regalo',
        price: 145000,
        sale_price: 0,
        stock_status: 'in_stock',
        stock_quantity: 9,
        featured: 1,
        category: 'jewelry_accessories',
        sku: 'OFF-JOY-001',
        offlineScore: 2.8
      }
    ];

    return rawProducts.map((product, index) => ({
      ...product,
      nameLower: product.name.toLowerCase(),
      keywordsLower: (product.keywords || '').toLowerCase(),
      tagsLower: (product.tags || '').toLowerCase(),
      display_price: product.sale_price > 0 && product.sale_price < product.price
        ? product.sale_price
        : product.price,
      relevance_score: (product.offlineScore ?? 1.5) + ((rawProducts.length - index) * 0.05)
    }));
  }

  // BÚSQUEDA DE FALLBACK
  async fallbackSearch(searchTerms, limit) {
    try {
      console.log('Usando búsqueda de fallback');

      if (this.shouldUseOfflineFallback()) {
        console.log('📦 Catálogo offline activado por indisponibilidad de base de datos');
        return this.getOfflineFallbackProducts(searchTerms, limit);
      }

      let searchTerm = '';
      if (typeof searchTerms === 'string') {
        searchTerm = searchTerms;
      } else if (Array.isArray(searchTerms) && searchTerms.length > 0) {
        searchTerm = searchTerms[0];
      }
      
      if (!searchTerm) {
        return await this.getPopularProducts(limit);
      }

      const dbStart = Date.now();
      const results = await query(`
        SELECT
          id, name, slug, description, short_description,
          price, sale_price, stock_status, featured,
          CASE WHEN sale_price > 0 AND sale_price < price THEN sale_price ELSE price END as display_price
        FROM products
        WHERE status = 'active'
        AND (name LIKE ? OR description LIKE ? OR keywords LIKE ?)
        ORDER BY featured DESC, name ASC
        LIMIT ?
      `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, limit]);

      this.reportDatabaseStatus(true, { latency: Date.now() - dbStart });

      return this.processAndRankResults(results, [searchTerm], { type: 'fallback' });

    } catch (error) {
      console.error('Error en fallback search:', error);
      this.reportDatabaseStatus(false, { error: error.message });
      return this.getOfflineFallbackProducts(searchTerms, limit);
    }
  }

  // UTILIDADES Y ESTADÍSTICAS
  clearCache() {
    this.searchCache.clear();
    console.log('Cache de búsqueda limpiado');
  }

  getSearchStats() {
    return {
      cacheSize: this.searchCache.size,
      hasNlpUtils: !!this.nlpUtils,
      hasSynonymManager: !!this.synonymManager,
      productCategoriesCount: Object.values(this.productCategories)
        .reduce((total, subCats) => total + Object.keys(subCats).length, 0),
      searchPatternsCount: this.searchPatterns.product_extraction.length,
      stopWordsCount: this.searchStopWords.size,
      isFullyIntegrated: !!(this.nlpUtils && this.synonymManager),
      version: 'ultra-judaica-search-v2.0'
    };
  }

  async diagnoseSearch(searchTerms) {
    console.log('=== DIAGNÓSTICO DE BÚSQUEDA JUDAICA ===');
    console.log(`Términos originales: ${JSON.stringify(searchTerms)}`);
    
    const processedTerms = await this.preprocessSearchTerms(searchTerms, {});
    console.log(`Términos procesados: [${processedTerms.join(', ')}]`);
    
    const categoryDetection = this.detectProductsByCategory(processedTerms.join(' '));
    console.log(`Categorías detectadas: [${categoryDetection.join(', ')}]`);
    
    if (this.synonymManager) {
      console.log('Sinónimos disponibles: SÍ');
      const firstTerm = processedTerms[0];
      if (firstTerm) {
        const synonymData = await this.synonymManager.getSynonymsForTerm(firstTerm);
        console.log(`Sinónimos para "${firstTerm}":`, synonymData);
      }
    } else {
      console.log('Sinónimos disponibles: NO');
    }
    
    if (this.nlpUtils) {
      console.log('NLP Utils disponible: SÍ');
      const nlpAnalysis = await this.analyzeWithNLP(searchTerms);
      console.log('Análisis NLP:', nlpAnalysis);
    } else {
      console.log('NLP Utils disponible: NO');
    }
    
    console.log('=== FIN DIAGNÓSTICO ===');
  }
}