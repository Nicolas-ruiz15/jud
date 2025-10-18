// lib/analytics-tracker.js
// Script de tracking para analytics en tiempo real

class AnalyticsTracker {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || '/api/analytics/track';
    this.sessionId = this.getSessionId();
    this.userId = options.userId || null;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.events = [];
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 5000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    
    this.init();
  }

  // Inicializar tracker
  init() {
    this.trackSessionStart();
    this.setupEventListeners();
    this.startHeartbeat();

    // Track page view inicial
    this.trackPageView();

    // Enviar eventos al cerrar la página
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
      this.sendBatch(true); // Envío síncrono
    });

    // Enviar eventos cuando la página se oculta
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          timeOnPage: this.getTimeOnPage(),
          scrollDepth: this.maxScrollDepth
        });
        this.sendBatch();
      } else {
        this.trackEvent('page_visible');
      }
    });
  }

  // Obtener o crear session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Obtener parámetros UTM de la URL
  getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmTerm: params.get('utm_term'),
      utmContent: params.get('utm_content')
    };
  }

  // Track inicio de sesión
  trackSessionStart() {
    const utmParams = this.getUTMParams();
    
    this.sendEvent({
      type: 'session_start',
      data: {
        referrer: document.referrer,
        landingPage: window.location.href,
        pageTitle: document.title,
        ...utmParams
      }
    });
  }

  // Track vista de página
  trackPageView() {
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;

    this.sendEvent({
      type: 'pageview',
      data: {
        pageUrl: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer,
        loadTime: performance.timing ? 
          performance.timing.loadEventEnd - performance.timing.navigationStart : null
      }
    });
  }

  // Track evento personalizado
  trackEvent(eventType, eventData = {}) {
    const event = {
      type: 'event',
      data: {
        eventType,
        eventCategory: eventData.category || 'interaction',
        eventAction: eventData.action || eventType,
        eventLabel: eventData.label,
        pageUrl: window.location.href,
        elementId: eventData.elementId,
        elementClass: eventData.elementClass,
        elementText: eventData.elementText,
        value: eventData.value,
        metadata: eventData.metadata,
        timestamp: Date.now()
      }
    };

    this.addToBatch(event);
  }

  // Track conversión
  trackConversion(conversionType, value = 0, metadata = {}) {
    this.trackEvent('conversion', {
      category: conversionType,
      value: value,
      metadata: metadata
    });
  }

  // Configurar event listeners
  setupEventListeners() {
    // Track clics
    document.addEventListener('click', (e) => {
      const element = e.target;
      this.trackEvent('click', {
        elementId: element.id,
        elementClass: element.className,
        elementText: element.textContent?.substring(0, 100),
        elementTag: element.tagName.toLowerCase()
      });
    });

    // Track scroll depth
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollDepth > this.maxScrollDepth) {
          this.maxScrollDepth = Math.min(scrollDepth, 100);
          
          // Track milestone de scroll
          if (scrollDepth >= 25 && scrollDepth % 25 === 0) {
            this.trackEvent('scroll_depth', {
              value: scrollDepth,
              label: `${scrollDepth}%`
            });
          }
        }
      }, 250);
    });

    // Track tiempo en página cada 15 segundos
    setInterval(() => {
      const timeOnPage = this.getTimeOnPage();
      if (timeOnPage > 0 && timeOnPage % 15 === 0) {
        this.trackEvent('time_on_page', {
          value: timeOnPage,
          label: `${timeOnPage}s`
        });
      }
    }, 15000);

    // Track errores JavaScript
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        action: 'error',
        label: e.message,
        metadata: {
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno
        }
      });
    });

    // Track formularios
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.tagName === 'FORM') {
        this.trackEvent('form_submit', {
          elementId: form.id,
          elementClass: form.className,
          action: 'submit'
        });
      }
    });
  }

  // Obtener tiempo en página actual
  getTimeOnPage() {
    return Math.floor((Date.now() - this.pageStartTime) / 1000);
  }

  // Agregar evento al batch
  addToBatch(event) {
    this.events.push(event);
    
    if (this.events.length >= this.batchSize) {
      this.sendBatch();
    }
  }

  // Enviar evento individual
  sendEvent(event) {
    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      ...event
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
    } else {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(error => {
        console.warn('Analytics tracking error:', error);
      });
    }
  }

  // Enviar batch de eventos
  sendBatch(sync = false) {
    if (this.events.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      type: 'batch',
      data: {
        events: [...this.events]
      }
    };

    this.events = []; // Limpiar batch

    if (sync && navigator.sendBeacon) {
      navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
    } else {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(error => {
        console.warn('Analytics batch error:', error);
      });
    }
  }

  // Heartbeat para mantener sesión activa
  startHeartbeat() {
    setInterval(() => {
      this.trackEvent('heartbeat', {
        timeOnPage: this.getTimeOnPage(),
        scrollDepth: this.maxScrollDepth
      });
    }, this.heartbeatInterval);
  }

  // Track fin de sesión
  trackSessionEnd() {
    this.sendEvent({
      type: 'session_end',
      data: {
        duration: this.getTimeOnPage(),
        maxScrollDepth: this.maxScrollDepth
      }
    });
  }

  // Métodos públicos para tracking manual
  page(pageData = {}) {
    this.trackPageView();
  }

  identify(userId) {
    this.userId = userId;
  }

  track(eventName, properties = {}) {
    this.trackEvent(eventName, properties);
  }

  // Configurar auto-batch envío
  startBatchTimer() {
    setInterval(() => {
      if (this.events.length > 0) {
        this.sendBatch();
      }
    }, this.batchTimeout);
  }
}

// Inicializar tracker automáticamente si estamos en el browser
if (typeof window !== 'undefined') {
  window.AnalyticsTracker = AnalyticsTracker;
  
  // Auto-inicializar con configuración por defecto
  window.analytics = new AnalyticsTracker({
    userId: window.currentUserId || null
  });
}

export default AnalyticsTracker;