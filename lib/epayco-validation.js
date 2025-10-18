// lib/epayco-validation.js - Validación específica para ePayco
const z = require('zod');

// Esquema para validar la URL de destino del proxy
const proxyTargetSchema = z.string({
  required_error: 'URL de destino requerida',
  invalid_type_error: 'URL de destino debe ser una cadena de texto'
})
.url({ message: 'URL de destino inválida' })
.refine(
  (url) => {
    try {
      const urlObj = new URL(url);
      const allowedDomains = [
        'secure.epayco.co',
        'apify-private.epayco.co',
        'checkout.epayco.co',
        'api.epayco.co',
        'api.secure.epayco.co'
      ];
      return allowedDomains.includes(urlObj.hostname.toLowerCase());
    } catch {
      return false;
    }
  },
  { message: 'Dominio no permitido' }
)
.refine(
  (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Solo se permiten conexiones HTTPS' }
)
.refine(
  (url) => {
    try {
      const urlObj = new URL(url);
      const safePaths = [
        '/api/', '/v1/', '/payment/', '/validation/', '/restpagos/', '/getip'
      ];
      return safePaths.some(path => urlObj.pathname.includes(path));
    } catch {
      return false;
    }
  },
  { message: 'Ruta no permitida' }
);

// Esquema para validar los parámetros de la solicitud al proxy
const proxyRequestSchema = z.object({
  target: proxyTargetSchema
});

// Función para validar la URL de destino del proxy
const validateProxyTarget = (target) => {
  try {
    const result = proxyTargetSchema.safeParse(target);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para validar los parámetros de la solicitud al proxy
const validateProxyRequest = (query) => {
  try {
    const result = proxyRequestSchema.safeParse(query);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Middleware para validar la solicitud al proxy
const validateProxyMiddleware = (req, res, next) => {
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

module.exports = {
  proxyTargetSchema,
  proxyRequestSchema,
  validateProxyTarget,
  validateProxyRequest,
  validateProxyMiddleware
};