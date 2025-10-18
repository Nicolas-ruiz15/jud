// components/AnalyticsProvider.js - VERSION FUNCIONAL
import { useEffect, useContext, createContext } from 'react';
import { useRouter } from 'next/router';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    console.warn('useAnalytics debe ser usado dentro de AnalyticsProvider');
    return {
      track: () => {},
      trackConversion: () => {},
      identify: () => {},
      page: () => {},
      isReady: false
    };
  }
  return context;
};

const AnalyticsProvider = ({ children, userId = null }) => {
  const router = useRouter();

  useEffect(() => {
    
    
    // Crear el tracker inline para evitar problemas de carga
    const createTracker = () => {
      console.log('🔧 Creando Analytics Tracker');
      
      class AnalyticsTracker {
        constructor(options = {}) {
          this.apiUrl = options.apiUrl || '/api/analytics/track';
          this.sessionId = this.getSessionId();
          this.userId = options.userId || null;
          this.pageStartTime = Date.now();
          this.maxScrollDepth = 0;
          this.events = [];
          this.batchSize = options.batchSize || 5;
          this.batchTimeout = options.batchTimeout || 10000;
          this.heartbeatInterval = options.heartbeatInterval || 30000;
          
          console.log('📊 Analytics Tracker initialized', {
            sessionId: this.sessionId,
            userId: this.userId
          });
          
          this.init();
        }

        getSessionId() {
          let sessionId = sessionStorage.getItem('analytics_session_id');
          if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session_id', sessionId);
            console.log('🆔 Generated new sessionId:', sessionId);
          }
          return sessionId;
        }

        init() {
          this.trackSessionStart();
          this.setupEventListeners();
          this.startHeartbeat();
          this.trackPageView();

          window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
            this.sendBatch(true);
          });

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

        trackSessionStart() {
          const utmParams = this.getUTMParams();
          console.log('🚀 Tracking session start');
          
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

        trackPageView() {
          this.pageStartTime = Date.now();
          this.maxScrollDepth = 0;
          console.log('📄 Tracking page view:', window.location.href);

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

          console.log('🎯 Tracking event:', eventType, eventData);
          this.addToBatch(event);
        }

        trackConversion(conversionType, value = 0, metadata = {}) {
          console.log('💰 Tracking conversion:', conversionType, value);
          this.trackEvent('conversion', {
            category: conversionType,
            value: value,
            metadata: metadata
          });
        }

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

          // Track scroll
          let scrollTimeout;
          window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              const scrollDepth = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
              );
              
              if (scrollDepth > this.maxScrollDepth) {
                this.maxScrollDepth = Math.min(scrollDepth, 100);
                if (scrollDepth >= 25 && scrollDepth % 25 === 0) {
                  this.trackEvent('scroll_depth', {
                    value: scrollDepth,
                    label: scrollDepth + '%'
                  });
                }
              }
            }, 250);
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

        getTimeOnPage() {
          return Math.floor((Date.now() - this.pageStartTime) / 1000);
        }

        addToBatch(event) {
          this.events.push(event);
          if (this.events.length >= this.batchSize) {
            this.sendBatch();
          }
        }

        sendEvent(event) {
          const payload = {
            sessionId: this.sessionId,
            userId: this.userId,
            ...event
          };

          console.log('📤 Sending event:', payload);

          if (navigator.sendBeacon) {
            navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
          } else {
            fetch(this.apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true
            }).then(response => response.json())
              .then(result => {
                console.log('📥 Event response:', result);
              })
              .catch(error => {
                console.error('❌ Event error:', error);
              });
          }
        }

        sendBatch(sync = false) {
          if (this.events.length === 0) return;
          
          console.log('📦 Sending batch:', this.events.length, 'events');
          
          const payload = {
            sessionId: this.sessionId,
            userId: this.userId,
            type: 'batch',
            data: { events: [...this.events] }
          };
          this.events = [];

          if (sync && navigator.sendBeacon) {
            navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
          } else {
            fetch(this.apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              keepalive: true
            }).then(response => response.json())
              .then(result => {
                console.log('📥 Batch response:', result);
              })
              .catch(error => {
                console.error('❌ Batch error:', error);
              });
          }
        }

        startHeartbeat() {
          setInterval(() => {
            this.trackEvent('heartbeat', {
              timeOnPage: this.getTimeOnPage(),
              scrollDepth: this.maxScrollDepth
            });
          }, this.heartbeatInterval);
        }

        trackSessionEnd() {
          console.log('🏁 Tracking session end');
          this.sendEvent({
            type: 'session_end',
            data: {
              duration: this.getTimeOnPage(),
              maxScrollDepth: this.maxScrollDepth
            }
          });
        }

        // Métodos públicos
        page() { this.trackPageView(); }
        identify(userId) { 
          this.userId = userId;
          console.log('👤 User identified:', userId);
        }
        track(eventName, properties = {}) { 
          this.trackEvent(eventName, properties); 
        }
      }

      // Crear instancia global
      window.AnalyticsTracker = AnalyticsTracker;
      window.analytics = new AnalyticsTracker({
        userId: userId,
        apiUrl: '/api/analytics/track'
      });

      console.log('✅ Analytics ready:', window.analytics);
    };

    // Crear tracker inmediatamente
    createTracker();

    // Escuchar cambios de ruta
    const handleRouteChange = (url) => {
      console.log('🔄 Route changed to:', url);
      if (window.analytics) {
        setTimeout(() => {
          window.analytics.page();
        }, 100);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, userId]);

  // Métodos de tracking expuestos
  const track = (eventName, properties = {}) => {
    if (window.analytics) {
      window.analytics.track(eventName, properties);
    }
  };

  const trackConversion = (type, value = 0, metadata = {}) => {
    if (window.analytics) {
      window.analytics.trackConversion(type, value, metadata);
    }
  };

  const identify = (newUserId) => {
    if (window.analytics) {
      window.analytics.identify(newUserId);
    }
  };

  const page = (pageData = {}) => {
    if (window.analytics) {
      window.analytics.page(pageData);
    }
  };

  const contextValue = {
    track,
    trackConversion,
    identify,
    page,
    isReady: typeof window !== 'undefined' && !!window.analytics
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;