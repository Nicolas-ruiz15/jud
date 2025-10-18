// utils/chat-helpers.js - UTILIDADES OPTIMIZADAS Y FUNCIONALES
import crypto from 'crypto';

// ============================================
// VALIDACIONES MEJORADAS
// ============================================

export function validateMessage(message) {
  const errors = [];
  
  if (!message || typeof message !== 'string') {
    errors.push('Mensaje requerido');
  } else {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      errors.push('Mensaje no puede estar vacío');
    } else if (trimmed.length > 1000) {
      errors.push('Mensaje muy largo (máximo 1000 caracteres)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanMessage: message?.trim() || ''
  };
}

export function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return false;
  
  // Formato esperado: sess_timestamp_randomhex
  const sessionPattern = /^sess_\d{13}_[a-f0-9]{6,8}$/;
  return sessionPattern.test(sessionId);
}

export function isValidConversationId(conversationId) {
  return conversationId && 
         (typeof conversationId === 'number' || 
          (typeof conversationId === 'string' && !isNaN(parseInt(conversationId))));
}

// ============================================
// GENERADORES
// ============================================

export function generateSessionId() {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString('hex');
  return `sess_${timestamp}_${randomBytes}`;
}

export function generateMessageHash(sessionId, content, timeWindow = 30000) {
  const timestamp = Math.floor(Date.now() / timeWindow) * timeWindow;
  const hashString = `${sessionId}_${content.trim()}_${timestamp}`;
  return crypto.createHash('sha256').update(hashString).digest('hex');
}

// ============================================
// DETECCIÓN DE INTENCIONES
// ============================================

export function detectMessageIntent(message) {
  if (!message) return 'unknown';
  
  const lowerMessage = message.toLowerCase();
  
  // Patrones de intención
  const patterns = {
    greeting: /\b(hola|hello|hi|buenos|buenas|shalom)\b/,
    question: /\b(qué|que|cómo|como|cuál|cual|cuándo|cuando|dónde|donde|por qué|porque)\b/,
    purchase: /\b(comprar|precio|costo|cuánto|cuanto|pagar|pago)\b/,
    support: /\b(ayuda|problema|error|no funciona|soporte)\b/,
    goodbye: /\b(adiós|adios|chao|bye|hasta luego|gracias)\b/
  };
  
  for (const [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerMessage)) {
      return intent;
    }
  }
  
  return 'general';
}

export function analyzeSentiment(message) {
  if (!message) return 'neutral';
  
  const lowerMessage = message.toLowerCase();
  
  const positiveWords = ['gracias', 'perfecto', 'excelente', 'bueno', 'genial', 'increíble'];
  const negativeWords = ['problema', 'mal', 'error', 'terrible', 'horrible', 'pésimo'];
  
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  
  return 'neutral';
}

export function extractKeywords(message, stopWords = []) {
  if (!message) return [];
  
  const defaultStopWords = [
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
    'da', 'su', 'por', 'son', 'con', 'para', 'mi', 'está', 'tiene', 'me', 'si', 'bien'
  ];
  
  const allStopWords = new Set([...defaultStopWords, ...stopWords]);
  
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !allStopWords.has(word))
    .filter(Boolean);
}

// ============================================
// FORMATEO Y UTILIDADES
// ============================================

export function formatTimeAgo(timestamp) {
  try {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-CO', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return '';
  }
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function detectDevice(userAgent) {
  if (!userAgent) return { type: 'desktop', isMobile: false };
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { type: 'mobile', isMobile: true };
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return { type: 'tablet', isMobile: false };
  }
  
  return { type: 'desktop', isMobile: false };
}

export function generateWhatsAppUrl(phoneNumber, message = '') {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
}

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
  validateMessage,
  isValidSessionId,
  isValidConversationId,
  generateSessionId,
  generateMessageHash,
  detectMessageIntent,
  analyzeSentiment,
  extractKeywords,
  formatTimeAgo,
  formatDuration,
  detectDevice,
  generateWhatsAppUrl
};