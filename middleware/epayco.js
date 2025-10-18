// middleware/epayco.js - Middleware específico para rutas de ePayco
const { paymentRateLimiter } = require('../lib/rate-limiter');
const { validateProxyTarget } = require('../lib/epayco-validation');
const { EpaycoService } = require('../services/epayco');

/**
 * Middleware para validar solicitudes al proxy de ePayco
 */
const validateProxyRequest = (req, res, next) => {
  const { target } = req.query;
  
  if (!target) {
    return res.status(400).json({ 
      success: false, 
      message: 'Target URL requerida' 
    });
  }
  
  let decodedTarget;
  try {
    decodedTarget = decodeURIComponent(target);
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL de destino no se puede decodificar: ' + error.message
    });
  }
  
  // Validar la URL de destino
  const validationResult = validateProxyTarget(decodedTarget);
  
  if (!validationResult.success) {
    console.error(`Validación de proxy fallida: ${JSON.stringify(validationResult.error)}`);
    return res.status(403).json({ 
      success: false, 
      message: validationResult.error?.message || 'URL de destino inválida'
    });
  }
  
  // Almacenar la URL validada para su uso posterior
  req.validatedTarget = validationResult.data;
  next();
};

/**
 * Middleware para validar firmas en webhooks de ePayco
 */
const validateEpaycoSignature = (req, res, next) => {
  // Solo aplicar a rutas de confirmación
  if (!req.url.includes('/api/payment/epayco/confirmation')) {
    return next();
  }
  
  const {
    x_ref_payco,
    x_transaction_id,
    x_amount,
    x_currency_code,
    x_signature
  } = req.body;
  
  // Verificar que tenemos todos los datos necesarios
  if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature) {
    console.error('❌ Faltan datos para validar firma de ePayco');
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan datos para validar firma' 
    });
  }
  
  // Validar la firma
  const epaycoService = new EpaycoService();
  const signatureData = {
    ref_payco: x_ref_payco,
    transaction_id: x_transaction_id,
    amount: x_amount,
    currency: x_currency_code,
    signature: x_signature
  };
  
  if (!epaycoService.validateSignature(signatureData)) {
    console.error('❌ Firma de ePayco inválida');
    return res.status(403).json({ 
      success: false, 
      message: 'Firma inválida' 
    });
  }
  
  next();
};

/**
 * Middleware para aplicar rate limiting a rutas de ePayco
 */
const epaycoRateLimiter = (req, res, next) => {
  return paymentRateLimiter(req, res, next);
};

/**
 * Middleware para validar el origen de las solicitudes a ePayco
 */
const validateEpaycoOrigin = (req, res, next) => {
  // Para webhooks de confirmación, permitir solicitudes de ePayco
  if (req.url.includes('/api/payment/epayco/confirmation')) {
    // ePayco no envía un origen específico en sus webhooks, así que no validamos
    return next();
  }
  
  // Para otras solicitudes, validar el origen
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // En producción, validar que las solicitudes vengan del dominio correcto
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      'https://www.judaicabreslovcolombia.com',
      'https://judaicabreslovcolombia.com',
      'https://secure.epayco.co',
      'https://checkout.epayco.co'
    ];
    
    // Para solicitudes con origen (CORS)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.warn(`Solicitud a ePayco con origen no permitido: ${origin}`);
      // No bloquear, solo registrar (para evitar falsos positivos)
    }
    
    // Para solicitudes con referer
    if (referer && !allowedOrigins.some(allowed => referer.startsWith(allowed))) {
      console.warn(`Solicitud a ePayco con referer no permitido: ${referer}`);
      // No bloquear, solo registrar (para evitar falsos positivos)
    }
  }
  
  next();
};

// Exportar todos los middlewares
module.exports = {
  validateProxyRequest,
  validateEpaycoSignature,
  epaycoRateLimiter,
  validateEpaycoOrigin
};