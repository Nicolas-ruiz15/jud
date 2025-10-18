// pages/_app.js - TU VERSION QUE FUNCIONA + ANALYTICS SEGURO
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import ProtectedRoute from '../components/admin/ProtectedRoute';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { setupCorsInterceptor } from '../utils/epayco-interceptors';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutos
      },
    },
  }));

  // LLAMA AL INTERCEPTOR UNA SOLA VEZ AL MONTAR LA APLICACIÓN
  useEffect(() => {
    setupCorsInterceptor();
    
    // 📊 ANALYTICS: Solo inicializar en páginas públicas (no admin)
    if (typeof window !== 'undefined' && !router.pathname.startsWith('/admin')) {
      initializeSimpleAnalytics();
    }
  }, []); // El array vacío asegura que se ejecute solo una vez al inicio

  // 🆕 NUEVO useEffect para cargar script de tracking
  useEffect(() => {
    // Solo cargar el script en páginas públicas (no admin)
    if (!router.pathname.startsWith('/admin')) {
      // Verificar si el script ya existe
      if (!document.querySelector('#visitor-tracking-script')) {
        const script = document.createElement('script');
        script.id = 'visitor-tracking-script';
        script.src = '/js/visitor-tracking.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [router.pathname]);

  // 📊 FUNCIÓN SIMPLE DE ANALYTICS (no rompe nada)
  const initializeSimpleAnalytics = () => {
    if (window.analytics) return; // No reinicializar
    
    console.log('🚀 Inicializando Analytics Simple...');
    
    try {
      // Crear sessionId simple
      let sessionId = sessionStorage.getItem('analytics_session');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        sessionStorage.setItem('analytics_session', sessionId);
      }
      
      // Función para enviar eventos (falla silenciosamente)
      const sendEvent = async (data) => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: null, ...data }),
            keepalive: true
          });
          console.log('📊 Analytics:', data.type);
        } catch (e) {
          // Fallar silenciosamente para no romper el sitio
        }
      };

      // Crear objeto analytics global simple
      window.analytics = {
        track: (eventName, props = {}) => {
          sendEvent({
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

        trackConversion: (type, value = 0, metadata = {}) => {
          sendEvent({
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
          sendEvent({
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
      setTimeout(() => window.analytics.page(), 1000);

      // Track cambios de ruta
      const handleRouteChange = () => {
        setTimeout(() => window.analytics?.page(), 100);
      };
      
      router.events.on('routeChangeComplete', handleRouteChange);

      console.log('✅ Analytics inicializado correctamente');

    } catch (error) {
      console.log('Analytics error (no problem):', error.message);
    }
  };

  // Determinar si es una ruta de admin
  const isAdminRoute = router.pathname.startsWith('/admin');
  const isAdminLoginRoute = router.pathname === '/admin/login';
  const isProtectedAdminRoute = isAdminRoute && !isAdminLoginRoute;

  return (
    <QueryClientProvider client={queryClient}>
      {isAdminRoute ? (
        // Contexto específico para admin
        <AdminAuthProvider>
          {isProtectedAdminRoute ? (
            <ProtectedRoute>
              <Component {...pageProps} />
            </ProtectedRoute>
          ) : (
            <Component {...pageProps} />
          )}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AdminAuthProvider>
      ) : (
        // Contexto normal para el sitio web
        <AuthProvider>
          <CartProvider>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      )}
    </QueryClientProvider>
  );
}

export default MyApp;