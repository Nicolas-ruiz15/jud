// lib/rate-limiter.js - Implementación de rate limiting para APIs
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuración para limitar intentos de inicio de sesión
const loginLimiter = new RateLimiterMemory({
  points: 5, // Número de intentos permitidos
  duration: 60 * 15, // Período de tiempo en segundos (15 minutos)
  blockDuration: 60 * 15, // Bloqueo por 15 minutos después de agotar los intentos
});

// Configuración para limitar solicitudes a la API general
const apiLimiter = new RateLimiterMemory({
  points: 60, // Número de solicitudes permitidas
  duration: 60, // Período de tiempo en segundos (1 minuto)
});

// Configuración para limitar solicitudes a endpoints de pago
const paymentLimiter = new RateLimiterMemory({
  points: 10, // Número de solicitudes permitidas
  duration: 60, // Período de tiempo en segundos (1 minuto)
});

// Middleware para limitar intentos de inicio de sesión
const loginRateLimiter = async (req, res, next) => {
  try {
    // Usar la IP como identificador
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await loginLimiter.consume(ip);
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error en rate limiter:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Si se excede el límite, devolver 429 (Too Many Requests)
    return res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión. Por favor, inténtelo de nuevo más tarde.'
    });
  }
};

// Middleware para limitar solicitudes a la API general
const apiRateLimiter = async (req, res, next) => {
  try {
    // Usar la IP como identificador
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await apiLimiter.consume(ip);
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error en rate limiter:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Si se excede el límite, devolver 429 (Too Many Requests)
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.'
    });
  }
};

// Middleware para limitar solicitudes a endpoints de pago
const paymentRateLimiter = async (req, res, next) => {
  try {
    // Usar la IP como identificador
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await paymentLimiter.consume(ip);
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error en rate limiter:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Si se excede el límite, devolver 429 (Too Many Requests)
    return res.status(429).json({
      error: 'Demasiadas solicitudes de pago. Por favor, inténtelo de nuevo más tarde.'
    });
  }
};

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
  paymentRateLimiter
};