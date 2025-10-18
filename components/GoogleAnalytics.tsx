import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface GoogleAnalyticsProps {
  measurementId: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ measurementId }) => {
  const router = useRouter();

  useEffect(() => {
    // Solo cargar en producción
    if (process.env.NODE_ENV !== 'production' || !measurementId) return;

    // Cargar script de Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Inicializar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: window.location.pathname,
    });

    // Asignar gtag a window
    window.gtag = gtag;

    return () => {
      // Cleanup: remover script cuando el componente se desmonte
      const existingScript = document.querySelector(`script[src*="${measurementId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [measurementId]);

  useEffect(() => {
    // Trackear cambios de ruta
    const handleRouteChange = (url: string) => {
      if (typeof window.gtag !== 'undefined') {
        window.gtag('config', measurementId, {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, measurementId]);

  return null;
};

export default GoogleAnalytics;