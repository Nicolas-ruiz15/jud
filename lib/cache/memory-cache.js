// lib/cache/memory-cache.js - Sistema de caché en memoria para VPS
// No requiere Redis, perfecto para tu VPS con Plesk

import NodeCache from 'node-cache';
import { CACHE_CONFIG, generateCacheKey } from './config.js';

// Crear instancia de caché en memoria
const memoryCache = new NodeCache({
  stdTTL: CACHE_CONFIG.MEMORY.stdTTL,
  checkperiod: CACHE_CONFIG.MEMORY.checkPeriod,
  useClones: false, // Mejor performance
  deleteOnExpire: true,
  maxKeys: CACHE_CONFIG.MEMORY.maxKeys
});

// Estadísticas del caché
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Clase principal del caché
class MemoryCache {
  // Obtener valor del caché
  async get(key) {
    try {
      const value = memoryCache.get(key);
      if (value !== undefined) {
        stats.hits++;
        console.log(`✅ Cache HIT: ${key}`);
        return value;
      }
      stats.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Establecer valor en caché
  async set(key, value, ttl = CACHE_CONFIG.MEMORY.stdTTL) {
    try {
      // Verificar tamaño del caché
      const keys = memoryCache.keys();
      if (keys.length >= CACHE_CONFIG.MEMORY.maxKeys) {
        // Eliminar las keys más viejas (LRU)
        const sortedKeys = keys.sort((a, b) => {
          const ttlA = memoryCache.getTtl(a) || 0;
          const ttlB = memoryCache.getTtl(b) || 0;
          return ttlA - ttlB;
        });
        
        // Eliminar el 10% más viejo
        const toDelete = Math.floor(keys.length * 0.1);
        for (let i = 0; i < toDelete; i++) {
          memoryCache.del(sortedKeys[i]);
        }
        console.log(`🧹 Limpieza de caché: eliminadas ${toDelete} entradas`);
      }

      const success = memoryCache.set(key, value, ttl);
      if (success) {
        stats.sets++;
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      }
      return success;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Eliminar del caché
  async del(key) {
    try {
      const deleted = memoryCache.del(key);
      if (deleted) {
        stats.deletes++;
        console.log(`🗑️ Cache DELETE: ${key}`);
      }
      return deleted;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  // Eliminar por patrón
  async delPattern(pattern) {
    try {
      const keys = memoryCache.keys();
      const regex = new RegExp(pattern);
      let deleted = 0;
      
      for (const key of keys) {
        if (regex.test(key)) {
          if (memoryCache.del(key)) {
            deleted++;
          }
        }
      }
      
      console.log(`🗑️ Cache DELETE pattern: ${pattern} (${deleted} keys)`);
      return deleted;
    } catch (error) {
      console.error('Error deleting pattern:', error);
      return 0;
    }
  }

  // Limpiar todo el caché
  async flush() {
    try {
      memoryCache.flushAll();
      console.log('🧹 Cache FLUSH: Toda la memoria limpiada');
      return true;
    } catch (error) {
      console.error('Error flushing cache:', error);
      return false;
    }
  }

  // Obtener estadísticas
  getStats() {
    const keys = memoryCache.keys();
    const hitRate = stats.hits + stats.misses > 0 
      ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) 
      : 0;

    return {
      ...stats,
      hitRate: `${hitRate}%`,
      totalKeys: keys.length,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }

  // Resetear estadísticas
  resetStats() {
    stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  // Wrapper para funciones con caché
  async cacheable(key, fetchFunction, ttl = CACHE_CONFIG.MEMORY.stdTTL) {
    // Intentar obtener del caché
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar función
    const result = await fetchFunction();
    
    // Guardar en caché solo si hay resultado
    if (result !== null && result !== undefined) {
      await this.set(key, result, ttl);
    }
    
    return result;
  }

  // Invalidar grupos de caché relacionados
  async invalidateGroup(group) {
    const patterns = CACHE_CONFIG.INVALIDATION[group] || [];
    let totalDeleted = 0;

    for (const pattern of patterns) {
      totalDeleted += await this.delPattern(pattern);
    }

    console.log(`🔄 Invalidated group ${group}: ${totalDeleted} keys`);
    return totalDeleted;
  }
}

// Exportar instancia única (singleton)
const cacheInstance = new MemoryCache();

// Limpiar caché al recibir señal de terminación
process.on('SIGTERM', () => {
  console.log('📊 Cache Stats on shutdown:', cacheInstance.getStats());
  cacheInstance.flush();
});

// Monitoreo periódico (opcional)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const stats = cacheInstance.getStats();
    console.log('📊 Cache Stats:', {
      hitRate: stats.hitRate,
      keys: stats.totalKeys,
      memory: `${stats.memoryUsage.toFixed(2)} MB`
    });
  }, 300000); // Cada 5 minutos
}

export default cacheInstance;