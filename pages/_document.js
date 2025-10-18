import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Preconexiones para rendimiento */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS Prefetch para dominios externos */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Fuentes de Google */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Meta tags básicos */}
        <meta charSet="UTF-8" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Meta tags */}
        <meta name="application-name" content="Judaica Breslov Colombia" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Judaica Breslov" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Iconos y manifest */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Open Graph globales */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Judaica Breslov Colombia" />
        <meta property="og:locale" content="es_CO" />
        
        {/* Twitter Card globales */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@judaicabreslov" />
        
        {/* Verificaciones de motores de búsqueda */}
        {/* <meta name="google-site-verification" content="tu_codigo_verificacion_google" /> */}
        {/* <meta name="msvalidate.01" content="tu_codigo_verificacion_bing" /> */}
        
        {/* Configuración de seguridad */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Configuración de cache para navegadores */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      <body>
        {/* Mensaje para usuarios con JavaScript deshabilitado */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            background: '#f59e0b',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            zIndex: 9999
          }}>
            Para una mejor experiencia, por favor habilite JavaScript en su navegador.
          </div>
        </noscript>
        
        <Main />
        <NextScript />
        
        {/* Script de configuración inicial */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Configuración inicial del tema
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
              
              // Configuración inicial de analytics
              window.dataLayer = window.dataLayer || [];
              
              // Detección de capacidades del navegador
              window.browserCapabilities = {
                webp: false,
                avif: false,
                intersection: 'IntersectionObserver' in window,
                serviceWorker: 'serviceWorker' in navigator
              };
              
              // Detectar soporte WebP
              var webpTest = new Image();
              webpTest.onload = webpTest.onerror = function () {
                window.browserCapabilities.webp = (webpTest.height === 2);
              };
              webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
              
              // Detectar soporte AVIF
              var avifTest = new Image();
              avifTest.onload = avifTest.onerror = function () {
                window.browserCapabilities.avif = (avifTest.height === 2);
              };
              avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            `,
          }}
        />
      </body>
    </Html>
  );
}