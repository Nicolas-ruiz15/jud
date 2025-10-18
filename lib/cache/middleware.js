// lib/cache/middleware.js - Middleware de caché para tus APIs
import cache from './memory-cache.js';
import { CACHE_CONFIG, generateCacheKey, shouldUseCache, getDynamicTTL } from './config.js';

// Middleware principal de caché
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = CACHE_CONFIG.TTL.API_DEFAULT,
    keyPrefix = 'api',
    excludeParams = ['_', 'timestamp', 'nocache'],
    dynamicTTL = false,
    invalidateOn = []
  } = options;

  return async (req, res) => {
    // Solo cachear GET requests
    if (!shouldUseCache(req)) {
      return;
    }

    // Generar key de caché
    const params = { ...req.query };
    excludeParams.forEach(param => delete params[param]);
    const cacheKey = generateCacheKey(`${keyPrefix}:${req.url.split('?')[0]}`, params);

    // Intentar obtener del caché
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`🎯 API Cache HIT: ${req.url}`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttl}`);
      return res.status(200).json(cached);
    }

    // Si no está en caché, interceptar la respuesta
    const originalJson = res.json;
    res.json = async function(data) {
      // Solo cachear respuestas exitosas
      if (res.statusCode === 200 && data.success !== false) {
        const finalTTL = dynamicTTL ? getDynamicTTL(ttl) : ttl;
        await cache.set(cacheKey, data, finalTTL);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${finalTTL}`);
      }
      return originalJson.call(this, data);
    };
  };
};

// Wrapper específico para productos
export const withProductCache = (handler) => {
  return async (req, res) => {
    const middleware = cacheMiddleware({
      ttl: CACHE_CONFIG.TTL.PRODUCT_LIST,
      keyPrefix: 'products',
      dynamicTTL: true
    });

    // Aplicar middleware
    await new Promise((resolve) => {
      middleware(req, {
        ...res,
        json: async (data) => {
          await res.json(data);
          resolve();
        }
      });
    });

    // Si no hubo cache hit, ejecutar handler
    if (!res.headersSent) {
      await handler(req, res);
    }
  };
};

// Wrapper específico para detalles de producto
export const withProductDetailCache = (handler) => {
  return async (req, res) => {
    const { slug } = req.query;
    const cacheKey = generateCacheKey('product:detail', { slug });
    
    // Intentar obtener del caché
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`🎯 Product Detail Cache HIT: ${slug}`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_CONFIG.TTL.PRODUCT_DETAIL}`);
      return res.status(200).json(cached);
    }

    // Interceptar respuesta para cachear
    const originalJson = res.json;
    res.json = async function(data) {
      if (res.statusCode === 200 && data.success) {
        await cache.set(cacheKey, data, CACHE_CONFIG.TTL.PRODUCT_DETAIL);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${CACHE_CONFIG.TTL.PRODUCT_DETAIL}`);
      }
      return originalJson.call(this, data);
    };

    // Ejecutar handler original
    await handler(req, res);
  };
};

// Wrapper para categorías
export const withCategoryCache = (handler) => {
  return async (req, res) => {
    const cacheKey = generateCacheKey('categories:all', req.query);
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('🎯 Categories Cache HIT');
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const originalJson = res.json;
    res.json = async function(data) {
      if (res.statusCode === 200 && data.success) {
        await cache.set(cacheKey, data, CACHE_CONFIG.TTL.CATEGORIES);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson.call(this, data);
    };

    await handler(req, res);
  };
};

// Invalidación de caché
export const invalidateCache = async (patterns) => {
  let totalDeleted = 0;
  
  for (const pattern of patterns) {
    const deleted = await cache.delPattern(pattern);
    totalDeleted += deleted;
    console.log(`🔄 Invalidated: ${pattern} (${deleted} keys)`);
  }
  
  return totalDeleted;
};

// Middleware para invalidar caché después de cambios
export const invalidateOnChange = (patterns = []) => {
  return async (req, res, next) => {
    // Solo para POST, PUT, DELETE
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const originalJson = res.json;
      res.json = async function(data) {
        // Si la operación fue exitosa, invalidar caché
        if (res.statusCode < 300 && data.success !== false) {
          await invalidateCache(patterns);
        }
        return originalJson.call(this, data);
      };
    }
    if (next) next();
  };
};

// Helper para caché condicional basado en parámetros
export const conditionalCache = (condition, ttl = CACHE_CONFIG.TTL.API_DEFAULT) => {
  return async (req, res, next) => {
    if (condition(req)) {
      const middleware = cacheMiddleware({ ttl });
      return middleware(req, res, next);
    }
    if (next) next();
  };
};

// Estadísticas del caché (para debugging)
export const getCacheStats = async (req, res) => {
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
};

// Limpiar caché manualmente (admin)
export const clearCache = async (req, res) => {
  const { pattern, group } = req.query;
  
  let result;
  if (pattern) {
    result = await cache.delPattern(pattern);
    res.status(200).json({
      success: true,
      message: `Deleted ${result} keys matching pattern: ${pattern}`
    });
  } else if (group) {
    result = await cache.invalidateGroup(group);
    res.status(200).json({
      success: true,
      message: `Invalidated group ${group}: ${result} keys deleted`
    });
  } else {
    await cache.flush();
    res.status(200).json({
      success: true,
      message: 'All cache cleared'
    });
  }
};