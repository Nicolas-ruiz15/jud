// lib/cache/config.js - Configuración general de caché

export const CACHE_CONFIG = {
  // Tiempos de vida del caché (en segundos)
  TTL: {
    // Productos
    PRODUCT_LIST: 300,        // 5 minutos para listas
    PRODUCT_DETAIL: 600,      // 10 minutos para detalles
    PRODUCT_FEATURED: 900,    // 15 minutos para destacados
    
    // Categorías (cambian poco)
    CATEGORIES: 3600,         // 1 hora
    CATEGORY_PRODUCTS: 600,   // 10 minutos
    
    // Búsquedas y filtros
    SEARCH_RESULTS: 300,      // 5 minutos
    FILTERED_PRODUCTS: 300,   // 5 minutos
    
    // Carrito y sesión
    CART_DATA: 1800,          // 30 minutos
    SESSION_DATA: 3600,       // 1 hora
    
    // Contenido estático
    STATIC_PAGES: 86400,      // 24 horas
    IMAGES: 604800,           // 7 días
    
    // API responses
    API_DEFAULT: 60,          // 1 minuto por defecto
    API_HEAVY: 300,           // 5 minutos para consultas pesadas
  },
  
  // Estrategias de invalidación
  INVALIDATION: {
    // Cuando actualizar el caché
    ON_PRODUCT_UPDATE: ['PRODUCT_DETAIL', 'PRODUCT_LIST', 'SEARCH_RESULTS'],
    ON_CATEGORY_UPDATE: ['CATEGORIES', 'CATEGORY_PRODUCTS'],
    ON_ORDER_CREATE: ['PRODUCT_DETAIL'], // Por stock
    ON_PRICE_UPDATE: ['PRODUCT_DETAIL', 'PRODUCT_LIST', 'PRODUCT_FEATURED'],
  },
  
  // Límites
  LIMITS: {
    MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB en memoria
    MAX_ENTRIES: 10000,                 // Máximo de entradas
    MAX_KEY_LENGTH: 250,                // Longitud máxima de key
  },
  
  // Configuración de Redis (si lo usas)
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
    DB: process.env.REDIS_DB || 0,
    KEY_PREFIX: 'judaica:',
    CONNECTION_TIMEOUT: 5000,
    COMMAND_TIMEOUT: 1000,
  },
  
  // Configuración de caché en memoria
  MEMORY: {
    checkPeriod: 600,     // Revisar expirados cada 10 minutos
    maxKeys: 1000,        // Máximo de keys en memoria
    stdTTL: 300,          // TTL por defecto: 5 minutos
  }
};

// Helper para generar keys de caché
export const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${key}:${params[key]}`)
    .join(':');
  
  return `${prefix}${sortedParams ? ':' + sortedParams : ''}`;
};

// Helper para determinar si debemos usar caché
export const shouldUseCache = (req) => {
  // No cachear si:
  // - Es POST, PUT, DELETE, PATCH
  if (req.method !== 'GET') return false;
  
  // - Tiene header no-cache
  if (req.headers['cache-control'] === 'no-cache') return false;
  
  // - Es usuario admin (si tienes auth)
  // if (req.user?.role === 'admin') return false;
  
  return true;
};

// Helper para TTL dinámico basado en hora del día
export const getDynamicTTL = (baseTTL) => {
  const hour = new Date().getHours();
  
  // Horario de alto tráfico (10am - 8pm): TTL más corto
  if (hour >= 10 && hour <= 20) {
    return Math.floor(baseTTL * 0.75);
  }
  
  // Horario de bajo tráfico: TTL más largo
  return Math.floor(baseTTL * 1.25);
};