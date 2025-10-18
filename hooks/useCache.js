// hooks/useCache.js - Hook de React para caché del lado cliente
import { useState, useEffect, useCallback, useRef } from 'react';

// Store global de caché en memoria del navegador
const globalCache = new Map();
const cacheTimestamps = new Map();

// Configuración de TTL por defecto (en segundos)
const DEFAULT_TTL = {
  products: 300,      // 5 minutos
  categories: 3600,   // 1 hora
  search: 180,        // 3 minutos
  user: 600,          // 10 minutos
  default: 300        // 5 minutos
};

// Hook principal de caché
export function useCache(key, fetcher, options = {}) {
  const {
    ttl = DEFAULT_TTL.default,
    enabled = true,
    staleWhileRevalidate = true,
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!globalCache.has(key));
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Verificar si el caché está expirado
  const isCacheExpired = useCallback((cacheKey) => {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (!timestamp) return true;
    
    const now = Date.now();
    const age = (now - timestamp) / 1000; // en segundos
    return age > ttl;
  }, [ttl]);

  // Función para actualizar caché
  const updateCache = useCallback((cacheKey, value) => {
    globalCache.set(cacheKey, value);
    cacheTimestamps.set(cacheKey, Date.now());
    
    // Limpiar caché viejo si hay demasiadas entradas
    if (globalCache.size > 100) {
      const entries = Array.from(cacheTimestamps.entries());
      entries.sort((a, b) => a[1] - b[1]);
      
      // Eliminar el 20% más viejo
      const toDelete = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toDelete; i++) {
        globalCache.delete(entries[i][0]);
        cacheTimestamps.delete(entries[i][0]);
      }
    }
  }, []);

  // Función de fetch con caché
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    const cacheKey = typeof key === 'function' ? key() : key;
    
    // Si no es force refresh y tenemos caché válido
    if (!forceRefresh && globalCache.has(cacheKey) && !isCacheExpired(cacheKey)) {
      const cachedData = globalCache.get(cacheKey);
      setData(cachedData);
      setLoading(false);
      setIsStale(false);
      console.log(`📱 Client Cache HIT: ${cacheKey}`);
      return cachedData;
    }

    // Si tenemos caché pero está stale y staleWhileRevalidate está activo
    if (staleWhileRevalidate && globalCache.has(cacheKey)) {
      const staleData = globalCache.get(cacheKey);
      setData(staleData);
      setIsStale(true);
      console.log(`📱 Serving stale cache: ${cacheKey}`);
    } else {
      setLoading(true);
    }

    try {
      console.log(`📱 Fetching fresh data: ${cacheKey}`);
      const freshData = await fetcherRef.current();
      
      if (isMountedRef.current) {
        updateCache(cacheKey, freshData);
        setData(freshData);
        setLoading(false);
        setError(null);
        setIsStale(false);
        
        if (onSuccess) {
          onSuccess(freshData);
        }
      }
      
      return freshData;
    } catch (err) {
      console.error(`❌ Cache fetch error for ${cacheKey}:`, err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
        
        // Si hay error y tenemos caché stale, usarlo
        if (globalCache.has(cacheKey)) {
          const fallbackData = globalCache.get(cacheKey);
          setData(fallbackData);
          setIsStale(true);
        }
        
        if (onError) {
          onError(err);
        }
      }
      
      throw err;
    }
  }, [enabled, key, isCacheExpired, staleWhileRevalidate, updateCache, onSuccess, onError]);

  // Efecto para fetch inicial
  useEffect(() => {
    fetchData();
  }, [key, ...dependencies]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Función para limpiar caché específico
  const clearCache = useCallback(() => {
    const cacheKey = typeof key === 'function' ? key() : key;
    globalCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
    console.log(`🗑️ Client cache cleared: ${cacheKey}`);
  }, [key]);

  // Función para precarga
  const prefetch = useCallback(async (prefetchKey, prefetchFetcher) => {
    if (globalCache.has(prefetchKey) && !isCacheExpired(prefetchKey)) {
      return; // Ya está en caché
    }
    
    try {
      const data = await prefetchFetcher();
      updateCache(prefetchKey, data);
      console.log(`📱 Prefetched: ${prefetchKey}`);
    } catch (err) {
      console.error(`❌ Prefetch error for ${prefetchKey}:`, err);
    }
  }, [isCacheExpired, updateCache]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    clearCache,
    prefetch,
    isCached: globalCache.has(key)
  };
}

// Hook específico para productos
export function useProductsCache(params = {}) {
  const key = `products:${JSON.stringify(params)}`;
  
  return useCache(
    key,
    async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/products${queryString ? '?' + queryString : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    {
      ttl: params.search ? DEFAULT_TTL.search : DEFAULT_TTL.products,
      staleWhileRevalidate: true
    }
  );
}

// Hook para caché de producto individual
export function useProductCache(slug) {
  const key = `product:${slug}`;
  
  return useCache(
    key,
    async () => {
      const response = await fetch(`/api/products/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      return response.json();
    },
    {
      ttl: DEFAULT_TTL.products,
      staleWhileRevalidate: true
    }
  );
}

// Hook para categorías
export function useCategoriesCache() {
  return useCache(
    'categories:all',
    async () => {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.json();
    },
    {
      ttl: DEFAULT_TTL.categories,
      staleWhileRevalidate: true
    }
  );
}

// Utilidades de caché global
export const cacheUtils = {
  // Limpiar todo el caché
  clearAll: () => {
    globalCache.clear();
    cacheTimestamps.clear();
    console.log('🗑️ All client cache cleared');
  },
  
  // Limpiar caché por patrón
  clearPattern: (pattern) => {
    const regex = new RegExp(pattern);
    let cleared = 0;
    
    for (const [key] of globalCache) {
      if (regex.test(key)) {
        globalCache.delete(key);
        cacheTimestamps.delete(key);
        cleared++;
      }
    }
    
    console.log(`🗑️ Cleared ${cleared} cache entries matching: ${pattern}`);
    return cleared;
  },
  
  // Obtener tamaño del caché
  getSize: () => {
    return {
      entries: globalCache.size,
      keys: Array.from(globalCache.keys())
    };
  },
  
  // Obtener estadísticas
  getStats: () => {
    const now = Date.now();
    const stats = {
      total: globalCache.size,
      expired: 0,
      fresh: 0,
      oldest: null,
      newest: null
    };
    
    for (const [key, timestamp] of cacheTimestamps) {
      const age = (now - timestamp) / 1000;
      
      if (age > DEFAULT_TTL.default) {
        stats.expired++;
      } else {
        stats.fresh++;
      }
      
      if (!stats.oldest || timestamp < stats.oldest.timestamp) {
        stats.oldest = { key, timestamp, age };
      }
      
      if (!stats.newest || timestamp > stats.newest.timestamp) {
        stats.newest = { key, timestamp, age };
      }
    }
    
    return stats;
  },
  
  // Prefetch múltiples recursos
  prefetchMany: async (items) => {
    const promises = items.map(({ key, fetcher }) => {
      if (!globalCache.has(key)) {
        return fetcher()
          .then(data => {
            globalCache.set(key, data);
            cacheTimestamps.set(key, Date.now());
            console.log(`📱 Prefetched: ${key}`);
          })
          .catch(err => {
            console.error(`❌ Prefetch error for ${key}:`, err);
          });
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
  }
};

// Limpiar caché periódicamente (cada 5 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const stats = cacheUtils.getStats();
    if (stats.expired > stats.total * 0.5) {
      console.log('🧹 Auto-cleaning expired cache entries');
      cacheUtils.clearPattern('.*');
    }
  }, 300000);
}