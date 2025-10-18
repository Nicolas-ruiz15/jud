// pages/api/_middleware.js - Middleware global para todas las APIs
import { NextResponse } from 'next/server';
import { securityMiddleware, applyRateLimiting, validateOrigin, preventCommonAttacks, logSuspiciousRequests } from '../../middleware/security';

/**
 * Middleware global para todas las rutas de API
 * Aplica medidas de seguridad a todas las solicitudes
 */
export function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // Solo aplicar a rutas de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Crear respuesta para modificar
  const response = NextResponse.next();
  
  // Aplicar cabeceras de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Validar método HTTP
  const method = req.method;
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];
  if (!allowedMethods.includes(method)) {
    return new NextResponse(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Validar origen en producción
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    const allowedOrigins = [
      'https://www.judaicabreslovcolombia.com',
      'https://judaicabreslovcolombia.com'
    ];
    
    // Para solicitudes con origen (CORS)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      // En middleware de Edge Runtime solo podemos registrar, no bloquear por ahora
      console.warn(`Solicitud con origen no permitido: ${origin}`);
    }
    
    // Para solicitudes con referer
    if (referer && !allowedOrigins.some(allowed => referer.startsWith(allowed))) {
      console.warn(`Solicitud con referer no permitido: ${referer}`);
    }
  }
  
  // Detectar patrones sospechosos en URLs
  const suspiciousPatterns = [
    /\.\./i, // Directory traversal
    /\/(wp-admin|wp-login|wp-content|admin|administrator|phpmyadmin|mysql|database)\//, // Intentos de acceso a paneles comunes
    /\.(php|asp|aspx|jsp|cgi|env|git|svn|htaccess)$/i, // Extensiones sospechosas
    /\/(config|setup|install|backup|dump|logs)\//, // Archivos sensibles
  ];
  
  const url = req.url;
  
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`Solicitud sospechosa detectada: ${method} ${url} desde ${req.headers.get('x-forwarded-for') || 'unknown'}`);
  }
  
  return response;
}

// Configuración para el middleware
export const config = {
  matcher: '/api/:path*',
};