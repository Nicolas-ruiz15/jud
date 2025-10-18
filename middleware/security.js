// middleware/security.js - Middleware de seguridad global para APIs
const { apiRateLimiter, paymentRateLimiter } = require('../lib/rate-limiter');

/**
 * Middleware de seguridad global para todas las APIs
 * Implementa:
 * - Rate limiting
 * - Cabeceras de seguridad
 * - Validación básica de solicitudes
 */
const securityMiddleware = (req, res, next) => {
  // Establecer cabeceras de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Validar método HTTP
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  // Validar tamaño de cuerpo para prevenir ataques DoS
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({ error: 'Cuerpo de solicitud demasiado grande' });
  }
  
  // Continuar con el siguiente middleware
  next();
};

/**
 * Middleware para aplicar rate limiting según la ruta
 */
const applyRateLimiting = (req, res, next) => {
  const path = req.url;
  
  // Aplicar rate limiting más estricto para rutas de pago
  if (path.includes('/api/payment/') || path.includes('/api/epayco/')) {
    return paymentRateLimiter(req, res, next);
  }
  
  // Aplicar rate limiting general para otras rutas de API
  return apiRateLimiter(req, res, next);
};

/**
 * Middleware para validar el origen de las solicitudes
 */
const validateOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // En producción, validar que las solicitudes vengan del dominio correcto
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      'https://www.judaicabreslovcolombia.com',
      'https://judaicabreslovcolombia.com'
    ];
    
    // Para solicitudes con origen (CORS)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.warn(`Solicitud con origen no permitido: ${origin}`);
      // No bloquear, solo registrar (para evitar falsos positivos)
    }
    
    // Para solicitudes con referer
    if (referer && !allowedOrigins.some(allowed => referer.startsWith(allowed))) {
      console.warn(`Solicitud con referer no permitido: ${referer}`);
      // No bloquear, solo registrar (para evitar falsos positivos)
    }
  }
  
  next();
};

/**
 * Middleware para detectar y prevenir ataques comunes
 */
const preventCommonAttacks = (req, res, next) => {
  // Detectar inyección SQL básica
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|alter|union|exec|declare|cast)\b.*\b(from|into|table|database|values)\b)|('\s*or\s*'\s*=\s*')|(";\s*--)/i;
  
  if (sqlInjectionPattern.test(body) || sqlInjectionPattern.test(query)) {
    console.error('Posible intento de inyección SQL detectado');
    return res.status(403).json({ error: 'Solicitud bloqueada por motivos de seguridad' });
  }
  
  // Detectar XSS básico
  const xssPattern = /<script\b[^>]*>[\s\S]*?<\/script>|javascript:|on\w+\s*=|<img[^>]+\bsrc\s*=\s*['"]?data:/i;
  
  if (xssPattern.test(body) || xssPattern.test(query)) {
    console.error('Posible intento de XSS detectado');
    return res.status(403).json({ error: 'Solicitud bloqueada por motivos de seguridad' });
  }
  
  next();
};

/**
 * Middleware para registrar solicitudes sospechosas
 */
const logSuspiciousRequests = (req, res, next) => {
  // Patrones sospechosos en URLs
  const suspiciousPatterns = [
    /\.\./i, // Directory traversal
    /\/(wp-admin|wp-login|wp-content|admin|administrator|phpmyadmin|mysql|database)\//, // Intentos de acceso a paneles comunes
    /\.(php|asp|aspx|jsp|cgi|env|git|svn|htaccess)$/i, // Extensiones sospechosas
    /\/(config|setup|install|backup|dump|logs)\//, // Archivos sensibles
  ];
  
  const url = req.url;
  
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`Solicitud sospechosa detectada: ${req.method} ${url} desde ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
  }
  
  next();
};

// Exportar todos los middlewares
module.exports = {
  securityMiddleware,
  applyRateLimiting,
  validateOrigin,
  preventCommonAttacks,
  logSuspiciousRequests
};