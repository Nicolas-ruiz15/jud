// lib/polling-manager.js - GESTIÓN INTELIGENTE DE POLLING
class PollingManager {
  constructor() {
    this.pollers = new Map();
    this.defaultInterval = 3000;
    this.maxInterval = 30000;
    this.minInterval = 1000;
  }

  // Crear o actualizar un poller
  createPoller(id, config = {}) {
    const {
      interval = this.defaultInterval,
      immediate = true,
      backoffMultiplier = 1.5,
      maxBackoff = this.maxInterval,
      onError = null,
      enabled = true
    } = config;

    // Detener poller existente si existe
    this.stopPoller(id);

    const poller = {
      id,
      interval: Math.max(interval, this.minInterval),
      originalInterval: interval,
      backoffMultiplier,
      maxBackoff,
      onError,
      enabled,
      isRunning: false,
      errorCount: 0,
      lastExecution: null,
      lastError: null,
      timer: null,
      execute: null // Se establecerá al iniciar
    };

    this.pollers.set(id, poller);
    console.log(`🔄 Poller created: ${id} (${interval}ms)`);
    
    return poller;
  }

  // Iniciar polling
  startPoller(id, executeFunction) {
    const poller = this.pollers.get(id);
    
    if (!poller) {
      console.error(`❌ Poller ${id} not found`);
      return false;
    }

    if (poller.isRunning) {
      console.log(`⚠️ Poller ${id} already running`);
      return true;
    }

    if (!poller.enabled) {
      console.log(`⏸️ Poller ${id} disabled`);
      return false;
    }

    poller.execute = executeFunction;
    poller.isRunning = true;

    // Ejecutar inmediatamente si está configurado
    if (executeFunction) {
      this._scheduleExecution(id, 0);
    }

    console.log(`▶️ Poller started: ${id}`);
    return true;
  }

  // Detener polling
  stopPoller(id) {
    const poller = this.pollers.get(id);
    
    if (!poller) {
      return false;
    }

    if (poller.timer) {
      clearTimeout(poller.timer);
      poller.timer = null;
    }

    poller.isRunning = false;
    console.log(`⏹️ Poller stopped: ${id}`);
    return true;
  }

  // Pausar polling temporalmente
  pausePoller(id) {
    const poller = this.pollers.get(id);
    
    if (poller) {
      poller.enabled = false;
      this.stopPoller(id);
      console.log(`⏸️ Poller paused: ${id}`);
    }
  }

  // Reanudar polling
  resumePoller(id) {
    const poller = this.pollers.get(id);
    
    if (poller && !poller.enabled) {
      poller.enabled = true;
      if (poller.execute) {
        this.startPoller(id, poller.execute);
      }
      console.log(`▶️ Poller resumed: ${id}`);
    }
  }

  // Cambiar intervalo dinámicamente
  setInterval(id, newInterval) {
    const poller = this.pollers.get(id);
    
    if (poller) {
      poller.interval = Math.max(newInterval, this.minInterval);
      console.log(`🔄 Poller ${id} interval changed to ${newInterval}ms`);
    }
  }

  // Ejecutar ahora (manual)
  executeNow(id) {
    const poller = this.pollers.get(id);
    
    if (poller && poller.execute && poller.enabled) {
      this._executePoller(id);
      return true;
    }
    
    return false;
  }

  // Programar siguiente ejecución
  _scheduleExecution(id, delay = null) {
    const poller = this.pollers.get(id);
    
    if (!poller || !poller.isRunning || !poller.enabled) {
      return;
    }

    const actualDelay = delay !== null ? delay : poller.interval;

    poller.timer = setTimeout(() => {
      this._executePoller(id);
    }, actualDelay);
  }

  // Ejecutar función del poller
  async _executePoller(id) {
    const poller = this.pollers.get(id);
    
    if (!poller || !poller.execute || !poller.enabled) {
      return;
    }

    try {
      poller.lastExecution = Date.now();
      
      // Ejecutar función
      await poller.execute();
      
      // Reset error count on success
      if (poller.errorCount > 0) {
        poller.errorCount = 0;
        poller.interval = poller.originalInterval;
        console.log(`✅ Poller ${id} recovered, interval reset`);
      }
      
      poller.lastError = null;
      
      // Programar siguiente ejecución
      this._scheduleExecution(id);
      
    } catch (error) {
      console.error(`❌ Poller ${id} execution error:`, error);
      
      poller.errorCount++;
      poller.lastError = {
        message: error.message,
        timestamp: Date.now()
      };

      // Aplicar backoff exponencial
      if (poller.backoffMultiplier > 1) {
        const newInterval = Math.min(
          poller.interval * poller.backoffMultiplier,
          poller.maxBackoff
        );
        poller.interval = newInterval;
        console.log(`⬆️ Poller ${id} backoff: ${newInterval}ms (errors: ${poller.errorCount})`);
      }

      // Callback de error personalizado
      if (poller.onError) {
        try {
          poller.onError(error, poller.errorCount);
        } catch (callbackError) {
          console.error(`❌ Poller ${id} error callback failed:`, callbackError);
        }
      }

      // Continuar polling a menos que haya demasiados errores
      if (poller.errorCount < 10) {
        this._scheduleExecution(id);
      } else {
        console.error(`💀 Poller ${id} disabled after 10 consecutive errors`);
        this.stopPoller(id);
        poller.enabled = false;
      }
    }
  }

  // Eliminar poller completamente
  removePoller(id) {
    this.stopPoller(id);
    this.pollers.delete(id);
    console.log(`🗑️ Poller removed: ${id}`);
  }

  // Obtener estado de un poller
  getPollerState(id) {
    const poller = this.pollers.get(id);
    
    if (!poller) {
      return null;
    }

    return {
      id: poller.id,
      isRunning: poller.isRunning,
      enabled: poller.enabled,
      interval: poller.interval,
      originalInterval: poller.originalInterval,
      errorCount: poller.errorCount,
      lastExecution: poller.lastExecution,
      lastError: poller.lastError,
      nextExecution: poller.timer ? Date.now() + poller.interval : null
    };
  }

  // Obtener estadísticas generales
  getStats() {
    const pollers = Array.from(this.pollers.values());
    
    return {
      total: pollers.length,
      running: pollers.filter(p => p.isRunning).length,
      enabled: pollers.filter(p => p.enabled).length,
      withErrors: pollers.filter(p => p.errorCount > 0).length,
      totalErrors: pollers.reduce((sum, p) => sum + p.errorCount, 0),
      pollers: pollers.map(p => ({
        id: p.id,
        isRunning: p.isRunning,
        enabled: p.enabled,
        interval: p.interval,
        errorCount: p.errorCount
      }))
    };
  }

  // Detener todos los pollers
  stopAll() {
    for (const id of this.pollers.keys()) {
      this.stopPoller(id);
    }
    console.log('⏹️ All pollers stopped');
  }

  // Limpiar todos los pollers
  cleanup() {
    this.stopAll();
    this.pollers.clear();
    console.log('🧹 Polling manager cleaned up');
  }
}

// Instancia global
const pollingManager = new PollingManager();

// FUNCIONES DE UTILIDAD PARA EL CHAT

// Poller para mensajes de chat
export function createChatMessagesPoller(conversationId, callback) {
  const pollerId = `chat-messages-${conversationId}`;
  
  pollingManager.createPoller(pollerId, {
    interval: 3000, // 3 segundos
    backoffMultiplier: 1.2,
    maxBackoff: 10000,
    onError: (error, count) => {
      console.error(`Chat messages polling error (${count}):`, error);
    }
  });

  return pollingManager.startPoller(pollerId, callback);
}

// Poller para estado del chat
export function createChatStatusPoller(callback) {
  const pollerId = 'chat-status';
  
  pollingManager.createPoller(pollerId, {
    interval: 30000, // 30 segundos
    backoffMultiplier: 1.5,
    maxBackoff: 60000,
    onError: (error, count) => {
      console.error(`Chat status polling error (${count}):`, error);
    }
  });

  return pollingManager.startPoller(pollerId, callback);
}

// Poller para visitantes en vivo (admin)
export function createLiveVisitorsPoller(callback) {
  const pollerId = 'live-visitors';
  
  pollingManager.createPoller(pollerId, {
    interval: 8000, // 8 segundos
    backoffMultiplier: 1.3,
    maxBackoff: 30000,
    onError: (error, count) => {
      console.error(`Live visitors polling error (${count}):`, error);
    }
  });

  return pollingManager.startPoller(pollerId, callback);
}

// Detener poller específico
export function stopChatPoller(conversationId) {
  const pollerId = `chat-messages-${conversationId}`;
  return pollingManager.stopPoller(pollerId);
}

// Funciones de gestión
export function pauseAllPolling() {
  for (const [id] of pollingManager.pollers) {
    pollingManager.pausePoller(id);
  }
}

export function resumeAllPolling() {
  for (const [id] of pollingManager.pollers) {
    pollingManager.resumePoller(id);
  }
}

export function getPollingStats() {
  return pollingManager.getStats();
}

export function cleanupPolling() {
  pollingManager.cleanup();
}

export default pollingManager;