// lib/chatbot/chatbotInstance.js - VERSIÓN CORREGIDA PARA ULTRA MASTER ENGINE

import { UltraMasterJudaicaChatbot } from './engine.js';  // ✅ CORREGIDO: Import correcto
import { query } from '../database.js';

console.log("🤖 Inicializando instancia del Ultra Master Judaica Chatbot...");

class ChatbotSingleton {
  constructor() {
    this.chatbot = null;
    this.isInitializing = false;
    this.isInitialized = false;
    this.initPromise = null;
    this.initError = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.lastDatabaseStatus = {
      connected: null,
      checkedAt: null,
      latency: null,
      error: null,
      source: 'chatbot-instance'
    };
  }

  async getInstance() {
    // Si ya está inicializado y funciona, devolver la instancia
    if (this.isInitialized && this.chatbot) {
      this.enhanceSystemInfo();
      return this.chatbot;
    }

    // Si hay un error pero no hemos agotado reintentos
    if (this.initError && this.retryCount < this.maxRetries) {
      console.log(`⚠️ Error previo detectado, reintentando (${this.retryCount + 1}/${this.maxRetries})...`);
      this.reset();
    }

    // Si ya está inicializando, esperar
    if (this.isInitializing && this.initPromise) {
      console.log("⏳ Esperando inicialización en curso...");
      return await this.initPromise;
    }

    return await this.initialize();
  }

  async initialize() {
    this.isInitializing = true;
    this.retryCount++;

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log(`🚀 Creando Ultra Master Judaica Engine (intento ${this.retryCount})...`);
        
        // ✅ CORRECCIÓN: Usar el motor correcto
        this.chatbot = new UltraMasterJudaicaChatbot();
        
        console.log("⚙️ Inicializando Ultra Master Engine (con fallbacks automáticos)...");
        const success = await this.chatbot.initialize();
        
        if (success) {
          this.isInitialized = true;
          this.isInitializing = false;
          this.initError = null;
          console.log("✅✅✅ ULTRA MASTER JUDAICA ENGINE INICIALIZADO Y LISTO ✅✅✅");
          
          // Verificar salud del sistema
          const health = this.chatbot.getSystemInfo();
          console.log(`🏥 Estado de salud Ultra Master: ${health?.health?.status || 'unknown'}`);
          console.log(`🎯 Integración completa: ${health?.integration?.fullIntegrationActive ? 'SÍ' : 'NO'}`);
          console.log(`🕎 Especialización judaica: ${health?.integration?.judaicaSpecializationActive ? 'SÍ' : 'NO'}`);

          this.enhanceSystemInfo();

          resolve(this.chatbot);
        } else {
          throw new Error("Inicialización del Ultra Master Engine falló");
        }
        
      } catch (error) {
        console.error(`❌ Error inicializando Ultra Master Engine (intento ${this.retryCount}):`, error);
        
        this.isInitialized = false;
        this.isInitializing = false;
        this.initError = error;
        
        // Si hemos agotado reintentos, crear chatbot de emergencia
        if (this.retryCount >= this.maxRetries) {
          console.log("🆘 Creando chatbot de emergencia ultra-simplificado...");
          this.chatbot = this.createUltraEmergencyChatbot();
          this.isInitialized = true;
          this.initError = null;
          this.enhanceSystemInfo();
          resolve(this.chatbot);
        } else {
          reject(error);
        }
      }
    });

    return await this.initPromise;
  }

  enhanceSystemInfo() {
    if (!this.chatbot) {
      return;
    }

    if (typeof this.chatbot.getSystemInfo === 'function' && !this.chatbot.__enhancedWithDatabase) {
      const originalGetSystemInfo = this.chatbot.getSystemInfo.bind(this.chatbot);

      this.chatbot.getSystemInfo = () => {
        const info = originalGetSystemInfo();
        if (info) {
          info.database = {
            ...this.lastDatabaseStatus,
            checkedAt: this.lastDatabaseStatus.checkedAt
          };
        }
        return info;
      };

      this.chatbot.__enhancedWithDatabase = true;
    }

    if (typeof this.chatbot.updateDatabaseStatus === 'function') {
      if (!this.chatbot.__databaseStatusPatched) {
        const originalUpdate = this.chatbot.updateDatabaseStatus.bind(this.chatbot);

        this.chatbot.updateDatabaseStatus = (status = {}) => {
          originalUpdate(status);
          this.lastDatabaseStatus = {
            connected: status.connected ?? this.lastDatabaseStatus.connected ?? null,
            checkedAt: status.checkedAt || new Date().toISOString(),
            latency: typeof status.latency === 'number' ? status.latency : this.lastDatabaseStatus.latency,
            error: status.error || null,
            source: status.source || 'engine'
          };
        };

        this.chatbot.__databaseStatusPatched = true;
      }
    } else {
      this.chatbot.updateDatabaseStatus = (status = {}) => {
        this.lastDatabaseStatus = {
          connected: status.connected ?? this.lastDatabaseStatus.connected ?? null,
          checkedAt: status.checkedAt || new Date().toISOString(),
          latency: typeof status.latency === 'number' ? status.latency : this.lastDatabaseStatus.latency,
          error: status.error || null,
          source: status.source || 'engine'
        };
      };
    }

    if (this.chatbot?.components?.productSearch) {
      this.chatbot.components.productSearch.onDatabaseStatus = this.chatbot.updateDatabaseStatus;
    }
  }

  async checkDatabaseHealth(timeoutMs = 5000) {
    const start = Date.now();
    let timer;

    try {
      const healthPromise = (async () => {
        await query('SELECT 1 as chatbot_health_check');
      })();

      await Promise.race([
        healthPromise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`DB health check timeout after ${timeoutMs}ms`)), timeoutMs);
        })
      ]);

      const latency = Date.now() - start;
      return {
        connected: true,
        checkedAt: new Date().toISOString(),
        latency,
        error: null,
        source: 'chatbot-instance'
      };

    } catch (error) {
      return {
        connected: false,
        checkedAt: new Date().toISOString(),
        latency: null,
        error: error.message,
        source: 'chatbot-instance'
      };

    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  createUltraEmergencyChatbot() {
    console.log("🆘 Activando modo de emergencia ultra-simplificado...");

    return {
      processMessage: async (message, conversationId, sessionId, userContext) => {
        try {
          console.log(`💬 Procesando en modo emergencia ultra: "${message}"`);
          
          const cleanMessage = message.toLowerCase().trim();
          
          // Respuestas de emergencia especializadas para judaica
          if (/^(hola|hi|hello|shalom|buenos|buenas)/i.test(cleanMessage)) {
            return {
              success: true,
              response: "¡Shalom Aleichem! 🕎\n\nBienvenido a Judaica Breslov Colombia.\n\nEstoy en modo básico por mantenimiento del Ultra Master Engine.\n\n📱 **Para mejor atención:** https://wa.me/573009291156\n🌐 **Catálogo:** https://www.judaicabreslovcolombia.com\n\n¿En qué mitzvá puedo ayudarte?",
              intent: 'greeting',
              confidence: 0.9,
              requiresHuman: false,
              suggestions: ['WhatsApp directo', 'Ver catálogo', 'Literatura Breslov'],
              products: [],
              metadata: {
                emergencyMode: true,
                ultraMasterEngine: false,
                engineVersion: 'emergency-v1.0'
              }
            };
          }
          
          if (/^(gracias|thanks|muchas gracias)/i.test(cleanMessage)) {
            return {
              success: true,
              response: "¡Todá rabá! 😊\n\n📱 WhatsApp: https://wa.me/573009291156\n\n¿Algo más en lo que pueda ayudarte espiritualmente?",
              intent: 'thanks',
              confidence: 0.9,
              requiresHuman: false,
              suggestions: ['WhatsApp directo', 'Ver productos'],
              products: [],
              metadata: { emergencyMode: true }
            };
          }
          
          if (/^(adiós|chau|chao|hasta luego|bye)/i.test(cleanMessage)) {
            return {
              success: true,
              response: "¡Hasta pronto! Shalom uvrajá 🕎\n\n📱 WhatsApp: https://wa.me/573009291156\n🌐 www.judaicabreslovcolombia.com\n\n¡Que tengas un día lleno de bendiciones!",
              intent: 'farewell',
              confidence: 0.9,
              requiresHuman: false,
              suggestions: [],
              products: [],
              metadata: { emergencyMode: true }
            };
          }
          
          if (/(busco|necesito|quiero|precio|tefilín|tallit|mezuzah|libro|breslov|torah|sidur|emunah)/i.test(cleanMessage)) {
            return {
              success: true,
              response: `**📚 PRODUCTOS JUDAICOS ESPECIALIZADOS**

**📖 LITERATURA BRESLOV:**
• Jardín de la Fe - Rabino Shalom Arush
• Vivamos con Emunah
• En el Jardín de la Paz

**🕯️ ARTÍCULOS RITUALES KOSHER:**
• Tefilín certificados
• Tallit y Tzitzit
• Mezuzot con klaf kosher
• Kipot elegantes

**💎 JOYERÍA JUDAICA:**
• Collares Estrella de David
• Pulseras Jai (vida)
• Colgantes Hamsa

📱 **Consulta especializada:** https://wa.me/573009291156?text=${encodeURIComponent(message)}
🌐 **Catálogo completo:** https://www.judaicabreslovcolombia.com

*Ultra Master Engine en mantenimiento - Atención personalizada disponible*`,
              intent: 'product_inquiry',
              confidence: 0.8,
              requiresHuman: false,
              suggestions: ['WhatsApp consulta', 'Ver catálogo', 'Literatura Breslov'],
              products: [],
              metadata: { emergencyMode: true, originalQuery: message }
            };
          }
          
          if (/(envío|envio|entrega|delivery)/i.test(cleanMessage)) {
            return {
              success: true,
              response: `**🚚 ENVÍOS ESPECIALIZADOS JUDAICOS**

🏢 **BOGOTÁ:** $18,000 (24-48h)
🌆 **CIUDADES PRINCIPALES:** $23,000 (2-3 días)
🆓 **GRATIS:** Compras +$250,000

**📦 EMPAQUE ESPECIAL:**
✡️ Protección extra para artículos sagrados
📿 Embalaje respetuoso para objetos rituales

📱 **Coordinar:** https://wa.me/573009291156
🌐 **Ver productos:** https://www.judaicabreslovcolombia.com`,
              intent: 'shipping_inquiry',
              confidence: 0.8,
              requiresHuman: false,
              suggestions: ['WhatsApp directo', 'Ver productos'],
              products: [],
              metadata: { emergencyMode: true }
            };
          }
          
          if (/(contacto|whatsapp|teléfono|asesor|hablar)/i.test(cleanMessage)) {
            return {
              success: true,
              response: "📱 **ESPECIALISTAS JUDAICOS DISPONIBLES:**\n\nhttps://wa.me/573009291156\n\n🕐 Horario: Lun-Vie 9am-6pm\n🎓 Asesores especializados en productos judaicos\n✡️ Atención personalizada garantizada\n\n¿Prefieres que te contactemos?",
              intent: 'contact_request',
              confidence: 0.8,
              requiresHuman: false,
              suggestions: ['Hacer consulta'],
              products: [],
              metadata: { emergencyMode: true }
            };
          }
          
          // Para cualquier otra consulta
          return {
            success: true,
            response: `Ultra Master Judaica Engine en mantenimiento.\n\n**Para consultas especializadas:**\n📱 **WhatsApp directo:** https://wa.me/573009291156?text=${encodeURIComponent(message)}\n🌐 **Catálogo especializado:** https://www.judaicabreslovcolombia.com\n\n**Nuestros productos judaicos:**\n• Literatura Sagrada (Torah, Tanaj, Tehilim)\n• Libros Breslov auténticos\n• Artículos rituales kosher (Tefilín, Tallit, Mezuzot)\n• Artículos para Shabat (copas, velas)\n• Joyería judaica tradicional\n\nNuestros especialistas te atenderán personalmente.`,
            intent: 'emergency_fallback',
            confidence: 0.6,
            requiresHuman: true,
            suggestions: ['WhatsApp directo', 'Ver catálogo', 'Llamar'],
            products: [],
            metadata: {
              emergencyMode: true,
              originalQuery: message,
              ultraMasterEngine: false
            }
          };
          
        } catch (emergencyError) {
          console.error('❌ Error en modo emergencia ultra:', emergencyError);
          return {
            success: false,
            response: "Error crítico del sistema especializado.\n\n📱 **Contacto directo:** https://wa.me/573009291156\n🌐 **Web:** https://www.judaicabreslovcolombia.com\n\nDisculpa las molestias.",
            intent: 'critical_error',
            confidence: 0,
            requiresHuman: true,
            suggestions: ['WhatsApp directo', 'Ver web'],
            products: [],
            error: emergencyError.message,
            metadata: { criticalError: true }
          };
        }
      },
      
      getSystemInfo: () => ({
        isInitialized: true,
        mode: 'emergency',
        status: 'degraded',
        message: 'Ultra Master Engine funcionando en modo de emergencia',
        retryCount: this.retryCount,
        lastError: this.initError?.message || null,
        integration: {
          fullIntegrationActive: false,
          judaicaSpecializationActive: true,
          breslovContentActive: false
        },
        health: {
          status: 'emergency',
          score: 30
        },
        database: {
          ...this.lastDatabaseStatus,
          connected: this.lastDatabaseStatus.connected ?? false
        }
      }),

      reinitialize: () => this.forceReinitialize(),
      getSessionStats: () => null
    };
  }

  reset() {
    this.chatbot = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
    this.initError = null;
  }

  async forceReinitialize() {
    console.log("🔄 Forzando reinicialización completa del Ultra Master Engine...");
    this.retryCount = 0;
    this.reset();
    return await this.getInstance();
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      hasError: !!this.initError,
      error: this.initError?.message || null,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      mode: this.chatbot?.getSystemInfo ? 'ultra_master' : 'emergency',
      engineType: 'UltraMasterJudaicaChatbot',
      database: this.lastDatabaseStatus
    };
  }

  async healthCheck() {
    try {
      if (!this.chatbot) {
        return { healthy: false, reason: 'No Ultra Master Engine instance' };
      }

      // Test básico con mensaje judaico
      const [testResponse, databaseStatus] = await Promise.all([
        this.chatbot.processMessage('shalom', 'health-check', 'health-session'),
        this.checkDatabaseHealth()
      ]);

      this.lastDatabaseStatus = databaseStatus;
      if (typeof this.chatbot.updateDatabaseStatus === 'function') {
        this.chatbot.updateDatabaseStatus({ ...databaseStatus, source: 'health-check' });
      }

      this.enhanceSystemInfo();

      return {
        healthy: testResponse.success && databaseStatus.connected !== false,
        mode: this.chatbot.getSystemInfo ? 'ultra_master' : 'emergency',
        systemInfo: this.chatbot.getSystemInfo ? this.chatbot.getSystemInfo() : null,
        testResponse: {
          intent: testResponse.intent,
          confidence: testResponse.confidence,
          hasProducts: testResponse.products?.length > 0
        },
        database: databaseStatus
      };

    } catch (error) {
      const failureStatus = {
        connected: false,
        checkedAt: new Date().toISOString(),
        latency: null,
        error: error.message,
        source: 'chatbot-instance'
      };

      this.lastDatabaseStatus = failureStatus;

      if (typeof this.chatbot?.updateDatabaseStatus === 'function') {
        this.chatbot.updateDatabaseStatus({ ...failureStatus, source: 'health-check' });
      }

      return {
        healthy: false,
        reason: error.message,
        needsReinit: true,
        database: failureStatus
      };
    }
  }
}

// Crear la instancia singleton
const chatbotSingleton = new ChatbotSingleton();

// Función principal para obtener la instancia
export async function getChatbotInstance() {
  try {
    return await chatbotSingleton.getInstance();
  } catch (error) {
    console.error("❌ Error crítico obteniendo instancia del Ultra Master Engine:", error);
    throw error;
  }
}

// Función para verificar estado
export function getChatbotStatus() {
  return chatbotSingleton.getStatus();
}

// Función para reinicializar
export async function reinitializeChatbot() {
  return await chatbotSingleton.forceReinitialize();
}

// Función para verificar salud
export async function healthCheckChatbot() {
  return await chatbotSingleton.healthCheck();
}

// Export por defecto para compatibilidad
export default {
  async processMessage(...args) {
    const instance = await getChatbotInstance();
    return await instance.processMessage(...args);
  },
  
  async getSystemInfo() {
    const instance = await getChatbotInstance();
    return instance.getSystemInfo ? instance.getSystemInfo() : { mode: 'emergency' };
  },
  
  getStatus: getChatbotStatus,
  healthCheck: healthCheckChatbot
};