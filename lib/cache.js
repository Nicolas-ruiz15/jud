// lib/cache.js - SISTEMA DE CACHE OPTIMIZADO PARA CHAT
import { query } from './database';

class ChatCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    this.maxSize = 1000; // Máximo 1000 entradas
  }

  // Obtener desde cache o ejecutar función
  async get(key, fetchFunction, ttl = this.defaultTTL) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expires) {
      console.log(`🎯 Cache HIT: ${key}`);
      return cached.data;
    }

    console.log(`📡 Cache MISS: ${key} - Fetching...`);
    
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`❌ Cache fetch error for ${key}:`, error);
      // Retornar cache expirado si existe
      return cached ? cached.data : null;
    }
  }

  // Establecer valor en cache
  set(key, data, ttl = this.defaultTTL) {
    // Limpiar si llegamos al límite
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires, created: Date.now() });

    // Limpiar timer anterior si existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Establecer auto-limpieza
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
    
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  // Eliminar entrada
  delete(key) {
    this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    console.log(`🗑️ Cache DELETE: ${key}`);
  }

  // Limpiar entradas expiradas
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expires) {
        toDelete.push(key);
      }
    }

    // Si aún hay muchas entradas, eliminar las más antiguas
    if (this.cache.size - toDelete.length >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].created - b[1].created)
        .slice(0, Math.floor(this.maxSize * 0.3)); // Eliminar 30% más antiguas
      
      toDelete.push(...entries.map(([key]) => key));
    }

    toDelete.forEach(key => this.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cache cleanup: ${toDelete.length} entries removed`);
    }
  }

  // Invalidar por patrón
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const toDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.delete(key));
    console.log(`🔄 Cache invalidated pattern "${pattern}": ${toDelete.length} entries`);
  }

  // Estadísticas del cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const value of this.cache.values()) {
      if (now >= value.expires) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      timers: this.timers.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }

  // Limpiar todo
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
    console.log('🧹 Cache cleared completely');
  }
}

// Instancia global
const chatCache = new ChatCache();

// FUNCIONES ESPECÍFICAS PARA EL CHAT

// Cache de productos para IA
export async function getCachedProducts() {
  return chatCache.get('products:all', async () => {
    console.log('🛍️ Fetching products from database...');
    
    const products = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.short_description,
        p.price, p.sale_price, p.sku, p.stock_quantity, p.stock_status,
        p.featured, p.status,
        CASE 
          WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 THEN p.sale_price
          ELSE p.price 
        END as display_price,
        CASE 
          WHEN p.stock_status = 'in_stock' AND (p.stock_quantity > 0 OR p.stock_quantity IS NULL) THEN 1
          ELSE 0 
        END as in_stock
      FROM products p
      WHERE p.status = 'active'
      ORDER BY p.featured DESC, p.stock_status DESC, p.created_at DESC
      LIMIT 100
    `);

    return products;
  }, 10 * 60 * 1000); // 10 minutos TTL para productos
}

// Cache de conversaciones activas
export async function getCachedActiveConversations() {
  return chatCache.get('conversations:active', async () => {
    console.log('💬 Fetching active conversations...');
    
    return await query(`
      SELECT id, session_id, status, assigned_to, visitor_name, 
             message_count, last_message_at, created_at
      FROM chat_conversations 
      WHERE status = 'active' 
      ORDER BY last_message_at DESC
      LIMIT 50
    `);
  }, 30 * 1000); // 30 segundos TTL para conversaciones
}

// Cache de visitantes en tiempo real
export async function getCachedRealtimeVisitors() {
  return chatCache.get('visitors:realtime', async () => {
    console.log('👥 Fetching realtime visitors...');
    
    return await query(`
      SELECT session_id, user_id, current_page_url, current_page_title,
             device_type, last_activity, pages_visited
      FROM analytics_realtime_visitors 
      WHERE last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ORDER BY last_activity DESC
      LIMIT 100
    `);
  }, 15 * 1000); // 15 segundos TTL para visitantes
}

// Invalidar cache relacionado con una conversación
export function invalidateConversationCache(conversationId, sessionId) {
  chatCache.invalidatePattern(`conversation:${conversationId}`);
  chatCache.invalidatePattern(`session:${sessionId}`);
  chatCache.delete('conversations:active');
  console.log(`🔄 Invalidated cache for conversation ${conversationId}`);
}

// Invalidar cache de productos
export function invalidateProductCache() {
  chatCache.delete('products:all');
  console.log('🛍️ Product cache invalidated');
}

// Funciones de utilidad
export function getCacheStats() {
  return chatCache.getStats();
}

export function clearAllCache() {
  chatCache.clear();
}

export default chatCache;