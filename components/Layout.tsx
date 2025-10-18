// components/Layout.tsx - LAYOUT COMPLETO CON CHAT FUNCIONAL
import React, { ReactNode, useState, useEffect } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import GoogleAnalytics from './GoogleAnalytics';
import GoogleTagManager from './GoogleTagManager';
import LiveChatWidget from './LiveChatWidget';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Judaica Breslov Colombia - Tienda y Librería Online',
  description = 'Tienda y librería judaica online en Colombia. Productos judíos, libros, mezuzot, tefilín, talitot y más. Envío a todo Colombia.',
  canonical,
  noindex = false,
  nofollow = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  useEffect(() => {
    setMounted(true);
    
    // 📊 Inicializar funciones de chat y analytics personalizados
    if (typeof window !== 'undefined') {
      // Funciones globales para chat
      initializeChatFunctions();
      // Analytics personalizado
      initializeCustomAnalytics();
    }
  }, []);

  // Inicializar funciones de chat
  const initializeChatFunctions = () => {
    try {
      // Función global para abrir chat desde cualquier lugar
      (window as any).openLiveChat = () => {
        const event = new CustomEvent('openLiveChat');
        window.dispatchEvent(event);
      };
      
      // Función para enviar mensaje programático
      (window as any).sendChatMessage = (message: string) => {
        const event = new CustomEvent('sendChatMessage', { detail: message });
        window.dispatchEvent(event);
      };

      // Función para iniciar chat con mensaje específico
      (window as any).startChatWithMessage = (message: string, context?: string) => {
        (window as any).openLiveChat();
        setTimeout(() => {
          const event = new CustomEvent('sendChatMessage', { 
            detail: { message: message, context: context } 
          });
          window.dispatchEvent(event);
        }, 500);
      };

      console.log('✅ Funciones de chat inicializadas');
    } catch (error) {
      console.log('Error inicializando chat functions:', error);
    }
  };

  // Función para inicializar analytics personalizado
  const initializeCustomAnalytics = () => {
    if (typeof window === 'undefined' || (window as any).customAnalytics) return;
    
    console.log('🚀 Inicializando Analytics Personalizado...');
    
    try {
      // Crear sessionId simple
      let sessionId = '';
      try {
        sessionId = sessionStorage.getItem('custom_analytics_session') || '';
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          sessionStorage.setItem('custom_analytics_session', sessionId);
        }
      } catch (e) {
        sessionId = 'sess_' + Date.now();
      }

      // Función para enviar eventos (falla silenciosamente)
      const sendCustomEvent = async (data: any) => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: null, ...data }),
            keepalive: true
          });
          console.log('📊 Custom Analytics:', data.type);
        } catch (e) {
          // Fallar silenciosamente para no romper el sitio
        }
      };

      // Crear objeto de analytics personalizado
      (window as any).customAnalytics = {
        track: (eventName: string, props: any = {}) => {
          sendCustomEvent({
            type: 'event',
            data: {
              eventType: eventName,
              eventCategory: props.category || 'interaction',
              eventAction: props.action || eventName,
              eventLabel: props.label,
              pageUrl: window.location.href,
              value: props.value,
              metadata: props.metadata
            }
          });
        },

        trackConversion: (type: string, value: number = 0, metadata: any = {}) => {
          sendCustomEvent({
            type: 'event',
            data: {
              eventType: 'conversion',
              eventCategory: type,
              eventAction: 'conversion',
              value: value,
              pageUrl: window.location.href,
              metadata: metadata
            }
          });
        },

        page: () => {
          sendCustomEvent({
            type: 'pageview',
            data: {
              pageUrl: window.location.href,
              pageTitle: document.title,
              referrer: document.referrer
            }
          });
        }
      };

      // Track página inicial
      setTimeout(() => (window as any).customAnalytics?.page(), 1000);

      console.log('✅ Analytics personalizado inicializado');

    } catch (error) {
      console.log('Analytics personalizado error (no problem):', error);
    }
  };

  // Evitar hydration mismatch mientras carga
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta charSet="utf-8" />
        
        {/* Robots meta tag */}
        <meta 
          name="robots" 
          content={`${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`} 
        />
        <meta name="googlebot" content="index, follow" />
        
        {/* Canonical URL */}
        {canonical && <link rel="canonical" href={canonical} />}
        
        {/* Favicons optimizados */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Judaica Breslov Colombia" />
        <meta property="og:locale" content="es_CO" />
        {canonical && <meta property="og:url" content={canonical} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Preconnect optimizado */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS Prefetch para ePayco */}
        <link rel="dns-prefetch" href="//checkout.epayco.co" />
        <link rel="dns-prefetch" href="//secure.payco.co" />
        
        {/* Font optimizado */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Structured Data básico */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Judaica Breslov Colombia",
              "description": "Tienda y librería judaica online en Colombia",
              "url": "https://www.judaicabreslovcolombia.com",
              "logo": "https://www.judaicabreslovcolombia.com/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+57-300-123-4567",
                "contactType": "customer service",
                "availableLanguage": ["Spanish"]
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "CO"
              }
            })
          }}
        />
      </Head>

      {/* Google Tag Manager */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}

      {/* Google Analytics */}
      {gaId && <GoogleAnalytics measurementId={gaId} />}

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1">
          {children}
        </main>
        
        <Footer />
        
        {/* 💬 Widget de Chat en Vivo */}
        <LiveChatWidget />
        
        {/* Toast notifications optimizado */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#059669',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </div>

      {/* Analytics initialization script CORREGIDO Y COMPLETO */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            
            // Función para trackear eventos con error handling (GA existente)
            function trackEvent(eventName, parameters) {
              try {
                if (window.dataLayer) {
                  window.dataLayer.push({
                    event: eventName,
                    ...parameters
                  });
                }
                if (window.gtag) {
                  window.gtag('event', eventName, parameters);
                }
              } catch (error) {
                console.warn('GA tracking error:', error);
              }
            }

            // Función combinada que envía a ambos sistemas
            function trackToBothSystems(eventName, parameters) {
              try {
                // Enviar a Google Analytics (existente)
                trackEvent(eventName, parameters);
                
                // Enviar a analytics personalizado
                if (window.customAnalytics) {
                  window.customAnalytics.track(eventName, {
                    category: parameters.event_category || 'interaction',
                    value: parameters.value,
                    metadata: parameters
                  });
                }
              } catch (error) {
                console.warn('Combined tracking error:', error);
              }
            }

            // Funciones de analytics COMPLETAS Y SEGURAS
            window.analytics = {
              trackEvent: function(eventName, parameters) {
                try {
                  trackToBothSystems(eventName || 'unknown_event', parameters || {});
                } catch (error) {
                  console.warn('trackEvent error:', error);
                }
              },
              
              trackViewItem: function(item) {
                try {
                  if (!item || !item.id) return;
                  const eventData = {
                    currency: 'COP',
                    value: item.price || 0,
                    items: [{
                      item_id: item.id,
                      item_name: item.name || 'Unknown',
                      item_category: item.category || 'Unknown',
                      price: item.price || 0,
                      quantity: 1
                    }]
                  };
                  trackToBothSystems('view_item', eventData);
                  
                  // También trackear en sistema personalizado
                  if (window.customAnalytics) {
                    window.customAnalytics.track('product_view', {
                      category: 'ecommerce',
                      value: item.price || 0,
                      metadata: item
                    });
                  }
                } catch (error) {
                  console.warn('trackViewItem error:', error);
                }
              },
              
              trackAddToCart: function(item, quantity) {
                try {
                  if (!item || !item.id) return;
                  quantity = quantity || 1;
                  const eventData = {
                    currency: 'COP',
                    value: (item.price || 0) * quantity,
                    items: [{
                      item_id: item.id,
                      item_name: item.name || 'Unknown',
                      item_category: item.category || 'Unknown',
                      price: item.price || 0,
                      quantity: quantity
                    }]
                  };
                  trackToBothSystems('add_to_cart', eventData);
                  
                  // Trackear conversión en sistema personalizado
                  if (window.customAnalytics) {
                    window.customAnalytics.trackConversion('add_to_cart', (item.price || 0) * quantity, {
                      product_id: item.id,
                      quantity: quantity
                    });
                  }
                } catch (error) {
                  console.warn('trackAddToCart error:', error);
                }
              },
              
              trackPurchase: function(transactionId, items, value, shipping, tax) {
                try {
                  if (!transactionId || !items) return;
                  const eventData = {
                    transaction_id: transactionId,
                    currency: 'COP',
                    value: value || 0,
                    shipping: shipping || 0,
                    tax: tax || 0,
                    items: (items || []).map(item => ({
                      item_id: item.id || 'unknown',
                      item_name: item.name || 'Unknown',
                      item_category: item.category || 'Unknown',
                      price: item.price || 0,
                      quantity: item.quantity || 1
                    }))
                  };
                  trackToBothSystems('purchase', eventData);
                  
                  // Conversión importante para sistema personalizado
                  if (window.customAnalytics) {
                    window.customAnalytics.trackConversion('purchase', value || 0, {
                      transaction_id: transactionId,
                      items_count: (items || []).length
                    });
                  }
                } catch (error) {
                  console.warn('trackPurchase error:', error);
                }
              },
              
              trackSelectItem: function(item, source) {
                try {
                  if (!item || !item.id) return;
                  const eventData = {
                    item_list_id: source || 'unknown',
                    item_list_name: source || 'Unknown List',
                    items: [{
                      item_id: item.id,
                      item_name: item.name || 'Unknown',
                      item_category: item.category || 'Unknown',
                      price: item.price || 0
                    }]
                  };
                  trackToBothSystems('select_item', eventData);
                } catch (error) {
                  console.warn('trackSelectItem error:', error);
                }
              },
              
              trackCustomEvent: function(eventName, parameters) {
                try {
                  trackToBothSystems(eventName || 'custom_event', parameters || {});
                } catch (error) {
                  console.warn('trackCustomEvent error:', error);
                }
              },
              
              // 💬 FUNCIONES DE CHAT SEGURAS
              trackChatEvent: function(eventName, data) {
                try {
                  if (window.customAnalytics) {
                    window.customAnalytics.track('chat_' + (eventName || 'unknown'), {
                      category: 'chat',
                      metadata: data || {}
                    });
                  }
                  trackEvent('chat_' + (eventName || 'unknown'), { 
                    event_category: 'chat', 
                    ...(data || {}) 
                  });
                } catch (error) {
                  console.warn('trackChatEvent error:', error);
                }
              },
              
              // 🎯 Trackear interacciones específicas del sitio
              trackSiteInteraction: function(action, element, value) {
                try {
                  if (window.customAnalytics) {
                    window.customAnalytics.track('site_interaction', {
                      category: 'interaction',
                      action: action || 'unknown',
                      label: element || 'unknown',
                      value: value || 0
                    });
                  }
                } catch (error) {
                  console.warn('trackSiteInteraction error:', error);
                }
              }
            };
            
            // Error handling global mejorado
            window.addEventListener('error', function(e) {
              try {
                if (window.analytics && typeof window.analytics.trackCustomEvent === 'function') {
                  window.analytics.trackCustomEvent('javascript_error', {
                    error_message: e.message || 'Unknown error',
                    error_filename: e.filename || 'Unknown file',
                    error_lineno: e.lineno || 0
                  });
                }
              } catch (trackingError) {
                console.warn('Error tracking failed:', trackingError);
              }
            });
          `,
        }}
      />
    </>
  );
};

export default Layout;