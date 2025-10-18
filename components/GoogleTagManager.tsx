import { useEffect } from 'react';
import Head from 'next/head';

interface GoogleTagManagerProps {
  gtmId: string;
}

const GoogleTagManager: React.FC<GoogleTagManagerProps> = ({ gtmId }) => {
  useEffect(() => {
    // Solo cargar en producción
    if (process.env.NODE_ENV !== 'production' || !gtmId) return;

    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
  }, [gtmId]);

  // No renderizar en desarrollo o si no hay GTM ID
  if (process.env.NODE_ENV !== 'production' || !gtmId) {
    return null;
  }

  return (
    <>
      <Head>
        {/* Google Tag Manager Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />
      </Head>
      
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
};

export default GoogleTagManager;