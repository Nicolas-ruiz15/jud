// lib/chatbot/ultra-master-judaica-engine.js - MOTOR MAESTRO ULTRA-ESPECIALIZADO V2.0 REPARADO

import { query } from '../database';
import { UltraComprehensiveIntentSystem } from './intents.js';
import { UltraJudaicaSynonymsManager } from './synonyms.js';
import { UltraJudaicaResponseGenerator } from './responses.js';
import { UltraJudaicaNLPUtils } from './nlp-utils.js';
import { UltraJudaicaProductSearch } from './product-search.js';

export class UltraMasterJudaicaChatbot {
  constructor() {
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationError = null;
    
    // Componentes ultra-especializados
    this.components = {
      intentSystem: null,
      synonymsManager: null,
      responseGenerator: null,
      nlpUtils: null,
      productSearch: null
    };
    
    // Configuración avanzada
    this.config = {
      fallbackThreshold: 0.2,
      confidenceThreshold: 0.4,
      maxRetries: 3,
      enableFullIntegration: true,
      enableContextualMemory: true,
      enableLearning: true,
      debug: process.env.NODE_ENV === 'development',
      
      // Configuración específica para judaica
      requireKosherValidation: true,
      enableBreslovSpecialization: true,
      enableHebrewSupport: true,
      prioritizeAuthenticity: true
    };
    
    // Estadísticas detalladas
    this.stats = {
      totalMessages: 0,
      successfulResponses: 0,
      fallbackResponses: 0,
      errors: 0,
      averageConfidence: 0,
      productSearches: 0,
      judaicaQueries: 0,
      breslovQueries: 0,
      ritualObjectQueries: 0,
      
      // Métricas de rendimiento
      averageResponseTime: 0,
      nlpAnalysisTime: 0,
      searchTime: 0,
      responseGenerationTime: 0,
      
      // Métricas de calidad
      highConfidenceResponses: 0,
      humanHandoffRate: 0,
      userSatisfactionScore: 0,
      
      initTime: null,
      lastProcessTime: null,
      version: 'ultra-master-v2.0-reparado'
    };

    // Memoria contextual avanzada
    this.contextMemory = new Map();
    this.userSessions = new Map();
    this.conversationHistory = new Map();
    
    console.log('Ultra Master Judaica Chatbot Engine inicializado');
  }

  // INICIALIZACIÓN COMPLETA DEL SISTEMA CON MEJOR MANEJO DE ERRORES
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (this.isInitializing) {
      console.log('Inicialización ya en progreso, esperando...');
      return await this.waitForInitialization();
    }

    this.isInitializing = true;
    const startTime = Date.now();

    try {
      console.log('🚀 INICIANDO ULTRA MASTER JUDAICA CHATBOT ENGINE V2.0 REPARADO 🚀');

      await this.initializeAllComponentsWithFallbacks();
      
      // Validar integración completa
      await this.validateFullIntegration();
      
      // Pre-cargar conocimiento judaico
      await this.preloadJudaicaKnowledge();
      
      this.isInitialized = true;
      this.isInitializing = false;
      this.stats.initTime = Date.now() - startTime;

      console.log(`✅ ULTRA MASTER ENGINE REPARADO INICIALIZADO EN ${this.stats.initTime}ms`);
      console.log('🎯 ESPECIALIZACIÓN JUDAICA ACTIVA');
      console.log('📚 CONOCIMIENTO BRESLOV CARGADO');
      console.log('🕯️ PRODUCTOS RITUALES INDEXADOS');
      
      return true;

    } catch (error) {
      this.isInitializing = false;
      this.initializationError = error;
      console.error('❌ ERROR CRÍTICO EN INICIALIZACIÓN:', error);
      return false;
    }
  }

  async initializeAllComponentsWithFallbacks() {
    try {
      console.log('⚙️ Inicializando componentes ultra-especializados CON FALLBACKS...');

      // 1. NLP Utils (sin dependencias) - CON MANEJO DE ERRORES
      console.log('1/5 Inicializando Ultra NLP Utils...');
      try {
        this.components.nlpUtils = new UltraJudaicaNLPUtils();
        console.log('✅ NLP Utils creado:', !!this.components.nlpUtils);
      } catch (error) {
        console.error('❌ Error creando NLP Utils:', error.message);
        this.components.nlpUtils = null;
      }
      
      // 2. Synonyms Manager (sin dependencias) - CON MANEJO DE ERRORES
      console.log('2/5 Inicializando Ultra Synonyms Manager...');
      try {
        this.components.synonymsManager = new UltraJudaicaSynonymsManager();
        console.log('✅ Synonyms Manager creado:', !!this.components.synonymsManager);
      } catch (error) {
        console.error('❌ Error creando Synonyms Manager:', error.message);
        this.components.synonymsManager = null;
      }
      
      // 3. Intent System (CRÍTICO) - CON MANEJO DE ERRORES DETALLADO
      console.log('3/5 Inicializando Ultra Intent System...');
      console.log('🔍 ANTES de crear IntentSystem');
      try {
        this.components.intentSystem = new UltraComprehensiveIntentSystem();
        console.log('✅ Intent System creado:', !!this.components.intentSystem);
        console.log('🎯 Método classify existe:', typeof this.components.intentSystem?.classify);
        
        // Validar que el sistema de intenciones funcione
        if (this.components.intentSystem && typeof this.components.intentSystem.classify === 'function') {
          console.log('🎯 Sistema de intenciones VALIDADO');
        } else {
          throw new Error('Sistema de intenciones no tiene método classify');
        }
      } catch (error) {
        console.error('❌ ERROR CRÍTICO creando Intent System:', error.message);
        console.error('Stack trace:', error.stack);
        this.components.intentSystem = this.createFallbackIntentSystem();
        console.log('🆘 Intent System de emergencia creado');
      }
      
      // 4. Product Search (CON dependencias integradas) - CON MANEJO DE ERRORES
      console.log('4/5 Inicializando Ultra Product Search con integración completa...');
      try {
        this.components.productSearch = new UltraJudaicaProductSearch(
          this.components.synonymsManager,  // ← INTEGRACIÓN CLAVE
          this.components.nlpUtils          // ← INTEGRACIÓN CLAVE
        );
        console.log('✅ Product Search creado con integración completa');
      } catch (error) {
        console.error('❌ Error creando Product Search:', error.message);
        // Crear versión simplificada sin integración
        this.components.productSearch = new UltraJudaicaProductSearch();
        console.log('⚠️ Product Search creado sin integración');
      }
      
      // 5. Response Generator (sin dependencias externas) - CON MANEJO DE ERRORES
      console.log('5/5 Inicializando Ultra Response Generator...');
      try {
        this.components.responseGenerator = new UltraJudaicaResponseGenerator();
        console.log('✅ Response Generator creado:', !!this.components.responseGenerator);
      } catch (error) {
        console.error('❌ Error creando Response Generator:', error.message);
        this.components.responseGenerator = this.createFallbackResponseGenerator();
        console.log('🆘 Response Generator de emergencia creado');
      }
      
      console.log('✅ Todos los componentes inicializados con manejo de errores');
      
    } catch (error) {
      console.error('❌ Error inicializando componentes:', error);
      throw error;
    }
  }

  // SISTEMA DE INTENCIONES DE EMERGENCIA
  createFallbackIntentSystem() {
    return {
      classify: (message, sessionId, context) => {
        console.log('🆘 Usando sistema de intenciones de emergencia');
        
        const messageLower = message.toLowerCase();
        
        // Clasificación básica por palabras clave
        if (/(?:torah|torá|chumash|jumash|pentateuco|libro.*torah)/.test(messageLower)) {
          return {
            type: 'torah_chumash_inquiry',
            confidence: 0.8,
            entities: { products: ['torah'] },
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:breslov|emunah|jardín.*fe|shalom.*arush)/.test(messageLower)) {
          return {
            type: 'books_breslov_comprehensive',
            confidence: 0.8,
            entities: { products: ['breslov'] },
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:tefilín|tefilin|phylacteries|filacterias)/.test(messageLower)) {
          return {
            type: 'tefilin_comprehensive',
            confidence: 0.8,
            entities: { products: ['tefilin'] },
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:tallit|talit|tzitzit|manto.*oración)/.test(messageLower)) {
          return {
            type: 'tallit_comprehensive',
            confidence: 0.8,
            entities: { products: ['tallit'] },
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:mezuzah|mezuzá|pergamino.*puerta)/.test(messageLower)) {
          return {
            type: 'mezuzah_comprehensive',
            confidence: 0.8,
            entities: { products: ['mezuzah'] },
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:precio|cuánto.*cuesta|valor|cuánto.*vale)/.test(messageLower)) {
          return {
            type: 'price_inquiry_specific',
            confidence: 0.7,
            entities: {},
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        if (/(?:envío|enviar|entrega|domicilio)/.test(messageLower)) {
          return {
            type: 'shipping_inquiry',
            confidence: 0.7,
            entities: {},
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        

		if 				(/(?:envío|envíos|hacen\s+envíos|envían|mandan|delivery|domicilio|transportadora|cuánto.*envío|precio.*envío|tiempo.*entrega)/.test(messageLower)) {
  return {
    type: 'shipping_inquiry',
    confidence: 0.8,
    entities: {},
    fallback: false,
    reason: 'FALLBACK_CLASSIFICATION'
  };
}

// Formas de pago
if (/(?:formas.*pago|aceptan.*tarjeta|pse|efectivo|cuotas|financiación)/.test(messageLower)) {
  return { type: 'payment_inquiry', confidence: 0.8, entities: {}, fallback: false };
}

// Horarios
if (/(?:horario|hasta.*hora|qué.*hora|atienden.*sábado)/.test(messageLower)) {
  return { type: 'hours_inquiry', confidence: 0.8, entities: {}, fallback: false };
}

// Ubicación/contacto
if (/(?:dónde|dirección|ubicación|teléfono|contacto|tienda.*física)/.test(messageLower)) {
  return { type: 'location_inquiry', confidence: 0.8, entities: {}, fallback: false };
}

// Recomendaciones
if (/(?:recomiendan|sugieren|cuál.*mejor|para.*principiante|para.*regalo)/.test(messageLower)) {
  return { type: 'recommendation_inquiry', confidence: 0.8, entities: {}, fallback: false };
}  
        if (/(?:hola|buenos|shalom|saludos)/.test(messageLower)) {
          return {
            type: 'greeting',
            confidence: 0.9,
            entities: {},
            fallback: false,
            reason: 'FALLBACK_CLASSIFICATION'
          };
        }
        
        // Si no coincide con nada, retornar unknown pero con mejor confianza
        return {
          type: 'unknown',
          confidence: 0.3,
          entities: {},
          fallback: true,
          reason: 'NO_FALLBACK_MATCH'
        };
      }
    };
  }

  // GENERADOR DE RESPUESTAS DE EMERGENCIA
  createFallbackResponseGenerator() {
    return {
      generate: (context) => {
        return {
          text: `**🏪 JUDAICA BRESLOV COLOMBIA**

Disculpa, nuestro sistema de respuestas está en modo básico.

**📱 ATENCIÓN DIRECTA:**
WhatsApp: https://wa.me/573009291156

**🌐 CATÁLOGO:**
https://www.judaicabreslovcolombia.com

¿En qué producto judaico te puedo ayudar?`,
          requiresHuman: false,
          suggestions: ['WhatsApp Directo', 'Ver Catálogo']
        };
      }
    };
  }

  async validateFullIntegration() {
    console.log('🔍 Validando integración completa...');
    
    const validations = [];
    
    // Validar componentes críticos
    if (this.components.intentSystem) {
      validations.push('✅ Intent System inicializado');
      if (typeof this.components.intentSystem.classify === 'function') {
        validations.push('✅ Intent System.classify funcional');
      } else {
        validations.push('❌ Intent System.classify NO funcional');
      }
    } else {
      validations.push('❌ Intent System NO inicializado');
    }
    
    if (this.components.responseGenerator) {
      validations.push('✅ Response Generator inicializado');
    } else {
      validations.push('❌ Response Generator NO inicializado');
    }
    
    if (this.components.productSearch) {
      validations.push('✅ Product Search inicializado');
      
      // Validar integración
      if (this.components.productSearch.synonymManager) {
        validations.push('✅ Product Search ← Synonyms Manager');
      } else {
        validations.push('⚠️ Product Search SIN Synonyms Manager');
      }
      
      if (this.components.productSearch.nlpUtils) {
        validations.push('✅ Product Search ← NLP Utils');
      } else {
        validations.push('⚠️ Product Search SIN NLP Utils');
      }
    } else {
      validations.push('❌ Product Search NO inicializado');
    }
    
    validations.forEach(validation => console.log(validation));
    
    const criticalErrors = validations.filter(v => v.includes('❌') && (v.includes('Intent System') || v.includes('Response Generator')));
    if (criticalErrors.length > 0) {
      console.log('⚠️ Sistema funcionará con capacidades limitadas');
    } else {
      console.log('🎯 INTEGRACIÓN BÁSICA VALIDADA EXITOSAMENTE');
    }
  }

  async preloadJudaicaKnowledge() {
    console.log('📚 Pre-cargando conocimiento judaico especializado...');
    
    // Términos críticos para pre-caché
    const criticalTerms = [
      // Literatura esencial
      'emunah', 'breslov', 'torah', 'tanaj', 'tehilim', 'sidur',
      'jardín de la fe', 'vivamos con emunah', 'shalom arush',
      
      // Objetos rituales
      'tefilín', 'tallit', 'mezuzá', 'kipá', 'shofar', 'menorá',
      
      // Ceremonias y festividades
      'shabat', 'pesaj', 'janucá', 'rosh hashaná', 'yom kipur',
      
      // Artículos ceremoniales
      'copa kidush', 'candelabros', 'velas', 'plato seder'
    ];
    
    for (const term of criticalTerms) {
      try {
        // Pre-cargar sinónimos si está disponible
        if (this.components.synonymsManager && this.components.synonymsManager.getSynonymsForTerm) {
          await this.components.synonymsManager.getSynonymsForTerm(term);
        }
        
        // Pre-analizar con NLP si está disponible
        if (this.components.nlpUtils && this.components.nlpUtils.analyzeJudaicText) {
          this.components.nlpUtils.analyzeJudaicText(term);
        }
      } catch (error) {
        console.log(`Advertencia pre-cargando "${term}":`, error.message);
      }
    }
    
    console.log(`📖 Conocimiento judaico pre-cargado: ${criticalTerms.length} términos críticos`);
  }

  // PROCESAMIENTO PRINCIPAL DE MENSAJES CON MEJOR MANEJO DE ERRORES
  async processMessage(message, conversationId, sessionId, userContext = {}) {
    if (!this.isInitialized) {
      if (!await this.initialize()) {
        return this.generateSystemError('INITIALIZATION_FAILED', message);
      }
    }

    this.stats.totalMessages++;
    const startTime = Date.now();
    const messageStartTime = Date.now();

    try {
      console.log(`💬 PROCESANDO MENSAJE JUDAICO: "${message.substring(0, 50)}..."`);

      // 1. Obtener/crear contexto de sesión
      const sessionContext = this.getOrCreateSessionContext(sessionId, userContext);

      // 2. Pre-procesar mensaje con especialización judaica
      const nlpStartTime = Date.now();
      const processedMessage = await this.preprocessMessageWithJudaicaNLP(message);
      this.stats.nlpAnalysisTime = Date.now() - nlpStartTime;

      // 3. Clasificar intención con sistema ultra-comprehensivo MEJORADO
      const intent = await this.classifyIntentUltraComprehensiveImproved(processedMessage, sessionContext);
      console.log(`🎯 INTENCIÓN DETECTADA: ${intent.type} (${(intent.confidence * 100).toFixed(1)}%)`);
      
      // 4. Ejecutar búsqueda de productos SOLO cuando sea necesario
      const searchStartTime = Date.now();
      let searchResults = [];
      if (this.shouldExecuteProductSearch(intent)) {
        console.log(`🔍 EJECUTANDO BÚSQUEDA ESPECIALIZADA para: ${intent.type}`);
        searchResults = await this.executeSpecializedProductSearch(processedMessage, intent, sessionId);
        this.stats.productSearches++;
        console.log(`📦 PRODUCTOS ENCONTRADOS: ${searchResults.length}`);
      } else {
        console.log(`⭐ SALTANDO BÚSQUEDA para intent: ${intent.type}`);
      }
      this.stats.searchTime = Date.now() - searchStartTime;

      // 5. Generar respuesta ultra-especializada
      const responseStartTime = Date.now();
      const response = await this.generateUltraSpecializedResponse(
        intent, searchResults, sessionContext, processedMessage, sessionId
      );
      this.stats.responseGenerationTime = Date.now() - responseStartTime;

      // 6. Actualizar contexto y estadísticas
      this.updateSessionContext(sessionId, intent, searchResults, response);
      this.updateAdvancedStats(intent, response, Date.now() - messageStartTime);

      const result = {
        success: true,
        response: response.text,
        intent: intent.type,
        confidence: intent.confidence,
        requiresHuman: response.requiresHuman || false,
        suggestions: response.suggestions || [],
        products: searchResults || [],
        
        metadata: {
          processingTime: Date.now() - startTime,
          intent: intent.type,
          confidence: intent.confidence,
          entitiesDetected: Object.keys(intent.entities || {}).length,
          productsFound: (searchResults || []).length,
          sessionId,
          isJudaicaSpecialized: true,
          breslovContent: this.detectBreslovContent(message, searchResults),
          kosherValidated: this.validateKosherContent(searchResults),
          
          // Métricas detalladas
          timings: {
            nlpAnalysis: this.stats.nlpAnalysisTime,
            productSearch: this.stats.searchTime,
            responseGeneration: this.stats.responseGenerationTime
          },
          
          // Debug info
          fallbackUsed: intent.fallback || false,
          systemStatus: this.getSystemStatus()
        }
      };

      console.log(`✅ MENSAJE PROCESADO EXITOSAMENTE EN ${result.metadata.processingTime}ms`);
      console.log(`📊 Confianza: ${(intent.confidence * 100).toFixed(1)}% | Productos: ${searchResults.length} | Humano: ${response.requiresHuman ? 'SÍ' : 'NO'}`);
      
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.stats.errors++;
      
      console.error('❌ ERROR PROCESANDO MENSAJE JUDAICO:', error);

      return this.generateSystemError('PROCESSING_ERROR', message, {
        error: error.message,
        processingTime,
        sessionId
      });
    }
  }

  // CLASIFICACIÓN DE INTENCIÓN MEJORADA CON FALLBACKS
  async classifyIntentUltraComprehensiveImproved(message, sessionContext) {
    if (!this.components.intentSystem) {
      console.log('⚠️ Intent System no disponible, usando clasificación de emergencia');
      return {
        type: 'unknown',
        confidence: 0.2,
        entities: {},
        fallback: true,
        reason: 'NO_INTENT_SYSTEM'
      };
    }

    try {
      const result = await this.components.intentSystem.classify(
        message, 
        sessionContext.sessionId, 
        sessionContext
      );
      
      if (!result || !result.type) {
        console.log('⚠️ Intent System retornó resultado inválido');
        return {
          type: 'unknown',
          confidence: 0.2,
          entities: {},
          fallback: true,
          reason: 'INVALID_CLASSIFICATION_RESULT'
        };
      }

      // Validar que la confianza sea razonable
      if (result.confidence > 0.5) {
        // Detectar especialización judaica
        if (this.isJudaicaSpecificIntent(result, message)) {
          this.stats.judaicaQueries++;
          
          if (this.isBreslovSpecificQuery(message, result.entities)) {
            this.stats.breslovQueries++;
          }
          
          if (this.isRitualObjectQuery(message, result.entities)) {
            this.stats.ritualObjectQueries++;
          }
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Error en clasificación ultra-comprehensiva:', error);
      
      // Intentar clasificación de emergencia
      console.log('🆘 Intentando clasificación de emergencia...');
      try {
        const fallbackResult = this.createFallbackIntentSystem().classify(message, sessionContext.sessionId, sessionContext);
        fallbackResult.fallback = true;
        fallbackResult.reason = 'CLASSIFICATION_ERROR_FALLBACK';
        return fallbackResult;
      } catch (fallbackError) {
        console.error('❌ Error en clasificación de emergencia:', fallbackError);
        return {
          type: 'unknown',
          confidence: 0.1,
          entities: {},
          fallback: true,
          reason: 'TOTAL_CLASSIFICATION_FAILURE',
          error: error.message
        };
      }
    }
  }

  getSystemStatus() {
    return {
      intentSystem: !!this.components.intentSystem,
      responseGenerator: !!this.components.responseGenerator,
      productSearch: !!this.components.productSearch,
      synonymsManager: !!this.components.synonymsManager,
      nlpUtils: !!this.components.nlpUtils,
      fullyInitialized: this.isInitialized
    };
  }

  // Resto de métodos permanecen igual...
  // [Aquí van todos los otros métodos que ya tenías, sin cambios]

  async preprocessMessageWithJudaicaNLP(message) {
    try {
      if (!message || typeof message !== 'string') {
        return '';
      }

      let processed = message.trim();
      
      if (processed.length === 0) return '';
      if (processed.length > 2000) processed = processed.substring(0, 2000);

      // Análisis NLP judaico completo si está disponible
      if (this.components.nlpUtils) {
        try {
          const nlpAnalysis = this.components.nlpUtils.analyzeJudaicText(processed);
          
          // Usar texto normalizado del análisis NLP
          if (nlpAnalysis.normalized) {
            processed = nlpAnalysis.normalized;
          }
          
          console.log(`🧠 NLP JUDAICO: ${nlpAnalysis.judaicTerms?.length || 0} términos judaicos detectados`);
          console.log(`📂 CATEGORÍAS: ${nlpAnalysis.productCategories?.map(c => c.category).join(', ') || 'ninguna'}`);
          
        } catch (nlpError) {
          console.log('⚠️ Error en NLP Utils, usando texto original:', nlpError.message);
        }
      }

      return processed.replace(/\s+/g, ' ').trim();

    } catch (error) {
      console.error('❌ Error en preprocessing NLP:', error);
      return message || '';
    }
  }

  shouldExecuteProductSearch(intent) {
    // NUNCA buscar para estos intents
    const nonProductIntents = [
      'greeting', 'thanks', 'farewell', 'affirmation', 'negation',
      'shipping_inquiry', 'contact_inquiry', 'payment_inquiry',
      'hours_inquiry', 'location_inquiry'
    ];
    
    if (nonProductIntents.includes(intent.type)) {
      return false;
    }
    
    // SIEMPRE buscar para estos intents
    const productSearchIntents = [
      'torah_chumash_inquiry', 'tanaj_bible_inquiry', 'books_breslov_comprehensive',
      'tefilin_comprehensive', 'tallit_comprehensive', 'mezuzah_comprehensive',
      'price_inquiry_specific', 'availability_inquiry', 'specific_product_inquiry'
    ];
    
    return productSearchIntents.includes(intent.type) || 
           (intent.entities && intent.entities.products && intent.entities.products.length > 0);
  }

  async executeSpecializedProductSearch(message, intent, sessionId) {
    if (!this.config.enableFullIntegration || !this.components.productSearch) {
      return [];
    }

    try {
      // Extraer términos usando múltiples fuentes
      const searchTerms = this.extractSearchTermsMultiSource(message, intent);
      
      if (searchTerms.length === 0) {
        console.log('⚠️ No se encontraron términos de búsqueda válidos');
        return await this.components.productSearch.getPopularProducts(6);
      }

      console.log(`🔎 BÚSQUEDA INTEGRADA con términos: [${searchTerms.join(', ')}]`);
      
      // Ejecutar búsqueda con integración completa (NLP + Synonyms)
      const searchResults = await this.components.productSearch.searchProducts(
        searchTerms, 
        intent, 
        10
      );
      
      // Validar resultados para contenido judaico
      const validatedResults = this.validateJudaicaResults(searchResults, intent);
      
      return validatedResults;

    } catch (error) {
      console.error('❌ Error en búsqueda especializada:', error);
      return [];
    }
  }

  extractSearchTermsMultiSource(message, intent) {
    const terms = new Set();
    
    // 1. Términos de entidades del intent
    if (intent.entities) {
      Object.values(intent.entities).forEach(entityArray => {
        if (Array.isArray(entityArray)) {
          entityArray.forEach(entity => {
            if (typeof entity === 'string' && entity.length > 1) {
              terms.add(entity);
            }
          });
        }
      });
    }
    
    // 2. Análisis NLP si está disponible
    if (this.components.nlpUtils) {
      try {
        const nlpAnalysis = this.components.nlpUtils.analyzeJudaicText(message);
        
        // Términos judaicos detectados
        if (nlpAnalysis.judaicTerms) {
          nlpAnalysis.judaicTerms.forEach(term => {
            if (term.confidence > 0.7) {
              terms.add(term.term);
            }
          });
        }
        
        // Keywords extraídas
        if (nlpAnalysis.entities && nlpAnalysis.entities.products) {
          nlpAnalysis.entities.products.forEach(product => terms.add(product));
        }
      } catch (nlpError) {
        console.log('Advertencia en análisis NLP:', nlpError.message);
      }
    }
    
    // 3. Detección de sinónimos si está disponible
    if (this.components.synonymsManager) {
      try {
        const detectedProducts = this.components.synonymsManager.detectProducts ? 
          this.components.synonymsManager.detectProducts(message) : [];
        detectedProducts.forEach(product => terms.add(product));
      } catch (synonymError) {
        console.log('Advertencia en detección de sinónimos:', synonymError.message);
      }
    }
    
    // 4. Fallback: extraer del mensaje directamente
    if (terms.size === 0) {
      const messageWords = message.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !this.isStopWord(word));
      
      messageWords.forEach(word => terms.add(word));
    }
    
    return Array.from(terms).slice(0, 10); // Limitar cantidad
  }

  async generateUltraSpecializedResponse(intent, searchResults, sessionContext, originalMessage, sessionId) {
    if (!this.components.responseGenerator) {
      return {
        text: this.getEmergencyFallbackResponse(),
        requiresHuman: true,
        suggestions: ['Contactar WhatsApp', 'Ver catálogo online']
      };
    }

    try {
      const context = {
        intent,
        searchResults: searchResults || [],
        conversationContext: sessionContext,
        userContext: sessionContext,
        originalMessage,
        sessionId,
        
        // Contexto judaico especializado
        isJudaicaQuery: this.isJudaicaSpecificIntent(intent, originalMessage),
        breslovContent: this.detectBreslovContent(originalMessage, searchResults),
        ritualContext: this.detectRitualContext(originalMessage, intent),
        holidayContext: this.detectHolidayContext(originalMessage),
        kosherValidation: this.validateKosherContent(searchResults)
      };

      const response = await this.components.responseGenerator.generate(context);
      
      if (!response || !response.text) {
        throw new Error('Response generator returned invalid response');
      }

      return {
        text: response.text,
        requiresHuman: response.requiresHuman || false,
        suggestions: response.suggestions || [],
        followUpQuestions: response.followUpQuestions || [],
        metadata: response.metadata || {}
      };

    } catch (error) {
      console.error('❌ Error generando respuesta ultra-especializada:', error);
      return {
        text: this.getEmergencyFallbackResponse(),
        requiresHuman: true,
        suggestions: ['Reformular pregunta', 'Contactar WhatsApp'],
        error: error.message
      };
    }
  }

  // Métodos auxiliares existentes...
  isJudaicaSpecificIntent(intent, message) {
    // Verificar por tipo de intent
    const judaicaIntents = [
      'torah_chumash_inquiry', 'tanaj_bible_inquiry', 'books_breslov_comprehensive',
      'tefilin_comprehensive', 'tallit_comprehensive', 'mezuzah_comprehensive',
      'kosher_certification', 'holiday_items'
    ];
    
    if (judaicaIntents.includes(intent.type)) {
      return true;
    }
    
    // Verificar por entidades judaicas
    if (intent.entities) {
      const hasJudaicaEntities = ['products', 'breslov_books', 'religious_books', 'ritual_items']
        .some(entityType => intent.entities[entityType] && intent.entities[entityType].length > 0);
      
      if (hasJudaicaEntities) {
        return true;
      }
    }
    
    // Verificar por términos judaicos en el mensaje
    const judaicaKeywords = [
      'judaico', 'judío', 'hebreo', 'kosher', 'breslov', 'torah', 'talmud',
      'tefilin', 'tallit', 'mezuzah', 'kipa', 'shabat', 'pesaj', 'januca'
    ];
    
    const messageLower = message.toLowerCase();
    return judaicaKeywords.some(keyword => messageLower.includes(keyword));
  }

  isBreslovSpecificQuery(message, entities) {
    const breslovTerms = ['breslov', 'breslev', 'emunah', 'emuna', 'jardín', 'jardin', 
                         'shalom arush', 'arush', 'najman', 'nachman'];
    
    const messageLower = message.toLowerCase();
    return breslovTerms.some(term => messageLower.includes(term)) ||
           (entities && entities.breslov_books && entities.breslov_books.length > 0);
  }

  isRitualObjectQuery(message, entities) {
    const ritualTerms = ['tefilin', 'tallit', 'mezuzah', 'kipa', 'shofar', 'menorah'];
    
    const messageLower = message.toLowerCase();
    return ritualTerms.some(term => messageLower.includes(term)) ||
           (entities && entities.ritual_items && entities.ritual_items.length > 0);
  }

  detectBreslovContent(message, products) {
    const breslovIndicators = ['breslov', 'emunah', 'jardín', 'shalom arush', 'najman'];
    const messageLower = message.toLowerCase();
    
    const inMessage = breslovIndicators.some(indicator => messageLower.includes(indicator));
    const inProducts = products && products.some(product => 
      breslovIndicators.some(indicator => 
        product.name.toLowerCase().includes(indicator) ||
        (product.description && product.description.toLowerCase().includes(indicator))
      )
    );
    
    return inMessage || inProducts;
  }

  detectRitualContext(message, intent) {
    const ritualContexts = ['bar mitzvah', 'bat mitzvah', 'sinagoga', 'rezo', 'ritual', 'ceremonia'];
    const messageLower = message.toLowerCase();
    
    return ritualContexts.some(context => messageLower.includes(context));
  }

  detectHolidayContext(message) {
    const holidays = ['shabat', 'pesaj', 'januca', 'rosh hashana', 'yom kipur', 'sukot', 'purim'];
    const messageLower = message.toLowerCase();
    
    return holidays.find(holiday => messageLower.includes(holiday)) || null;
  }

  validateKosherContent(products) {
    if (!products || products.length === 0) return true;
    
    return products.every(product => {
      const productText = `${product.name} ${product.description || ''}`.toLowerCase();
      const problematicTerms = ['no kosher', 'not kosher', 'treif'];
      return !problematicTerms.some(term => productText.includes(term));
    });
  }

  validateJudaicaResults(results, intent) {
    if (!results || results.length === 0) return results;
    
    return results
      .filter(product => this.isAuthenticJudaicaProduct(product))
      .sort((a, b) => {
        const aJudaicaScore = this.calculateJudaicaRelevanceScore(a);
        const bJudaicaScore = this.calculateJudaicaRelevanceScore(b);
        
        if (aJudaicaScore !== bJudaicaScore) {
          return bJudaicaScore - aJudaicaScore;
        }
        
        return (b.relevance_score || 0) - (a.relevance_score || 0);
      });
  }

  isAuthenticJudaicaProduct(product) {
    const productText = `${product.name} ${product.description || ''}`.toLowerCase();
    
    const authenticityIndicators = [
      'kosher', 'kasher', 'certificado', 'auténtico', 'tradicional',
      'sofer', 'rabínico', 'supervisado'
    ];
    
    const problematicIndicators = [
      'imitación', 'réplica', 'decorativo', 'no ritual'
    ];
    
    const hasAuthenticity = authenticityIndicators.some(indicator => 
      productText.includes(indicator));
    const hasProblems = problematicIndicators.some(indicator => 
      productText.includes(indicator));
    
    return !hasProblems || hasAuthenticity;
  }

  calculateJudaicaRelevanceScore(product) {
    let score = 0;
    const productText = `${product.name} ${product.description || ''}`.toLowerCase();
    
    const highRelevanceTerms = ['torah', 'tefilin', 'tallit', 'mezuzah', 'breslov', 'kosher'];
    const mediumRelevanceTerms = ['judaico', 'judío', 'hebreo', 'sinagoga', 'ritual'];
    const lowRelevanceTerms = ['religioso', 'espiritual', 'tradicional'];
    
    highRelevanceTerms.forEach(term => {
      if (productText.includes(term)) score += 3;
    });
    
    mediumRelevanceTerms.forEach(term => {
      if (productText.includes(term)) score += 2;
    });
    
    lowRelevanceTerms.forEach(term => {
      if (productText.includes(term)) score += 1;
    });
    
    return score;
  }

  getOrCreateSessionContext(sessionId, userContext) {
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, {
        sessionId: sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0,
        lastIntent: null,
        lastProducts: [],
        preferences: {},
        judaicaSpecialization: {
          breslovInterest: false,
          ritualObjectQueries: 0,
          preferredCategories: []
        },
        ...userContext
      });
    }
    
    const session = this.userSessions.get(sessionId);
    session.lastActivity = Date.now();
    session.messageCount++;
    
    return session;
  }

  updateSessionContext(sessionId, intent, searchResults, response) {
    const session = this.userSessions.get(sessionId);
    if (!session) return;
    
    session.lastIntent = intent.type;
    
    if (searchResults && searchResults.length > 0) {
      session.lastProducts = searchResults.slice(0, 5);
      
      if (this.isBreslovSpecificQuery('', intent.entities)) {
        session.judaicaSpecialization.breslovInterest = true;
      }
      
      if (this.isRitualObjectQuery('', intent.entities)) {
        session.judaicaSpecialization.ritualObjectQueries++;
      }
      
      searchResults.forEach(product => {
        if (product.category && product.category !== 'general') {
          const prefs = session.judaicaSpecialization.preferredCategories;
          const existing = prefs.find(p => p.category === product.category);
          if (existing) {
            existing.count++;
          } else {
            prefs.push({ category: product.category, count: 1 });
          }
        }
      });
    }
  }

  updateAdvancedStats(intent, response, processingTime) {
    this.stats.lastProcessTime = processingTime;
    this.stats.averageResponseTime = (this.stats.averageResponseTime + processingTime) / 2;
    
    if (response.requiresHuman) {
      this.stats.humanHandoffRate = (this.stats.humanHandoffRate * this.stats.totalMessages + 1) / this.stats.totalMessages;
    }
    
    if (intent.confidence >= 0.8) {
      this.stats.highConfidenceResponses++;
    }
    
    if (intent.confidence > 0) {
      this.updateAverageConfidence(intent.confidence);
    }
    
    if (!response.requiresHuman && intent.confidence >= this.config.confidenceThreshold) {
      this.stats.successfulResponses++;
    } else {
      this.stats.fallbackResponses++;
    }
  }

  updateAverageConfidence(newConfidence) {
    if (this.stats.successfulResponses === 1) {
      this.stats.averageConfidence = newConfidence;
    } else {
      this.stats.averageConfidence = (
        (this.stats.averageConfidence * (this.stats.successfulResponses - 1) + newConfidence) / 
        this.stats.successfulResponses
      );
    }
  }

  getEmergencyFallbackResponse() {
    return `**⚠️ SISTEMA TEMPORALMENTE LIMITADO**

Disculpa, nuestro asistente especializado está experimentando dificultades.

**🔧 ASISTENCIA INMEDIATA:**
📱 **WhatsApp:** https://wa.me/573009291156?text=Asistencia%20técnica
🌐 **Sitio web:** https://www.judaicabreslovcolombia.com

**📚 NUESTRAS ESPECIALIDADES:**
• Literatura Breslov auténtica
• Artículos rituales kosher certificados
• Joyería judaica tradicional
• Artículos para Shabat y festividades

*Trabajamos para ofrecerte la mejor experiencia en productos judaicos*`;
  }

  generateSystemError(errorType, originalMessage, metadata = {}) {
    this.stats.errors++;
    
    const errorResponses = {
      'INITIALIZATION_FAILED': `**⚠️ SISTEMA INICIÁNDOSE**

Nuestro asistente especializado se está preparando para atenderte.

**📱 ATENCIÓN INMEDIATA:**
WhatsApp: https://wa.me/573009291156?text=Sistema%20iniciándose

*Disculpa las molestias, estaremos listos en un momento*`,

      'PROCESSING_ERROR': `**⚠️ ERROR TEMPORAL**

Ocurrió un problema procesando tu consulta sobre productos judaicos.

**🔧 SOLUCIONES:**
📱 **WhatsApp directo:** https://wa.me/573009291156?text=Error%20técnico
🌐 **Catálogo online:** https://www.judaicabreslovcolombia.com

*Nuestro compromiso con la calidad incluye resolver cualquier inconveniente*`
    };

    const fallbackText = errorResponses[errorType] || this.getEmergencyFallbackResponse();

    return {
      success: false,
      response: fallbackText,
      intent: 'system_error',
      confidence: 0,
      requiresHuman: true,
      suggestions: ['Reformular consulta', 'WhatsApp directo', 'Ver catálogo'],
      products: [],
      error: true,
      metadata: {
        errorType,
        originalMessage: originalMessage?.substring(0, 100),
        isJudaicaSpecialized: true,
        systemStatus: this.getSystemStatus(),
        ...metadata
      }
    };
  }

  isStopWord(word) {
    const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te'];
    return stopWords.includes(word.toLowerCase());
  }

  async waitForInitialization() {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (this.isInitializing && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (this.isInitializing) {
      throw new Error('Timeout esperando inicialización del motor ultra-especializado');
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    return this.isInitialized;
  }

  getSystemInfo() {
    const componentStatus = {};
    Object.entries(this.components).forEach(([name, component]) => {
      componentStatus[name] = {
        initialized: !!component,
        type: component?.constructor?.name || 'null',
        specialized: name.includes('Judaica') || name.includes('Ultra'),
        integration: name === 'productSearch' ? {
          hasSynonymManager: !!component?.synonymManager,
          hasNlpUtils: !!component?.nlpUtils,
          isFullyIntegrated: !!(component?.synonymManager && component?.nlpUtils)
        } : undefined
      };
    });

    return {
      systemName: 'Ultra Master Judaica Chatbot Engine v2.0 REPARADO',
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      initializationError: this.initializationError?.message || null,
      
      components: componentStatus,
      config: this.config,
      
      stats: {
        ...this.stats,
        successRate: this.stats.totalMessages > 0 ? 
          (this.stats.successfulResponses / this.stats.totalMessages * 100).toFixed(2) + '%' : '0%',
        errorRate: this.stats.totalMessages > 0 ? 
          (this.stats.errors / this.stats.totalMessages * 100).toFixed(2) + '%' : '0%',
        fallbackRate: this.stats.totalMessages > 0 ? 
          (this.stats.fallbackResponses / this.stats.totalMessages * 100).toFixed(2) + '%' : '0%',
        judaicaSpecializationRate: this.stats.totalMessages > 0 ?
          (this.stats.judaicaQueries / this.stats.totalMessages * 100).toFixed(2) + '%' : '0%'
      },
      
      integration: {
        synonymManagerConnected: !!this.components.productSearch?.synonymManager,
        nlpUtilsConnected: !!this.components.productSearch?.nlpUtils,
        fullIntegrationActive: !!(this.components.productSearch?.synonymManager && this.components.productSearch?.nlpUtils),
        judaicaSpecializationActive: true,
        breslovContentActive: this.config.enableBreslovSpecialization,
        kosherValidationActive: this.config.requireKosherValidation
      },
      
      health: this.getHealthStatus(),
      
      sessions: {
        activeSessions: this.userSessions.size,
        totalProcessedMessages: this.stats.totalMessages
      }
    };
  }

  getHealthStatus() {
    let score = 0;
    let issues = [];

    if (this.isInitialized) score += 20;
    else issues.push('Sistema no inicializado');

    if (this.components.intentSystem) score += 20;
    else issues.push('Sistema de intenciones faltante');

    if (this.components.responseGenerator) score += 20;
    else issues.push('Generador de respuestas faltante');

    if (this.components.productSearch) score += 15;
    else issues.push('Motor de búsqueda faltante');

    if (this.components.synonymsManager) score += 10;
    else issues.push('Gestor de sinónimos faltante');

    if (this.components.nlpUtils) score += 10;
    else issues.push('Utilidades NLP faltantes');

    if (this.components.productSearch?.synonymManager && this.components.productSearch?.nlpUtils) {
      score += 15;
    } else {
      issues.push('Integración completa incompleta');
    }

    if (this.config.enableBreslovSpecialization) score += 5;
    if (this.config.requireKosherValidation) score += 5;

    let status = 'critical';
    if (score >= 95) status = 'excellent';
    else if (score >= 85) status = 'very_good';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'degraded';
    else if (score >= 40) status = 'poor';

    return {
      status,
      score,
      issues,
      canProcess: this.isInitialized && (this.components.intentSystem || this.components.responseGenerator),
      isFullyIntegrated: !!(this.components.productSearch?.synonymManager && this.components.productSearch?.nlpUtils),
      isJudaicaSpecialized: true,
      specializations: {
        breslov: this.config.enableBreslovSpecialization,
        kosher: this.config.requireKosherValidation,
        hebrew: this.config.enableHebrewSupport,
        authenticity: this.config.prioritizeAuthenticity
      }
    };
  }

  clearCache(type = 'all') {
    if (type === 'all' || type === 'products') {
      if (this.components.productSearch) {
        this.components.productSearch.clearCache();
      }
    }
    if (type === 'all' || type === 'synonyms') {
      if (this.components.synonymsManager) {
        this.components.synonymsManager.clearCache();
      }
    }
    if (type === 'all' || type === 'intents') {
      if (this.components.intentSystem) {
        this.components.intentSystem.clearCache();
      }
    }
    if (type === 'all' || type === 'nlp') {
      if (this.components.nlpUtils) {
        this.components.nlpUtils.clearCache();
      }
    }
    
    console.log(`🧹 Cache limpiado: ${type}`);
  }

  async reinitialize() {
    console.log('🔄 Reinicializando Ultra Master Judaica Engine...');
    
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationError = null;
    
    this.components = {
      intentSystem: null,
      synonymsManager: null,
      responseGenerator: null,
      nlpUtils: null,
      productSearch: null
    };
    
    this.contextMemory.clear();
    this.userSessions.clear();
    this.conversationHistory.clear();
    
    this.clearCache();
    
    return await this.initialize();
  }

  async shutdown() {
    console.log('🛑 Cerrando Ultra Master Judaica Engine...');
    
    this.isInitialized = false;
    this.clearCache();
    
    if (this.components.synonymsManager?.clearCache) {
      this.components.synonymsManager.clearCache();
    }
    
    if (this.components.nlpUtils?.clearCache) {
      this.components.nlpUtils.clearCache();
    }

    if (this.components.productSearch?.clearCache) {
      this.components.productSearch.clearCache();
    }
    
    if (this.components.intentSystem?.clearCache) {
      this.components.intentSystem.clearCache();
    }
    
    this.contextMemory.clear();
    this.userSessions.clear();
    this.conversationHistory.clear();
    
    this.components = {
      intentSystem: null,
      synonymsManager: null,
      responseGenerator: null,
      nlpUtils: null,
      productSearch: null
    };
    
    console.log('✅ Ultra Master Judaica Engine cerrado correctamente');
  }
}