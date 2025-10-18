/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimización de imágenes con caché agresivo
  images: {
    domains: [
      'localhost', 
      'judaicabreslovcolombia.com',
      'www.judaicabreslovcolombia.com',
      'nuevo.breslovcolombia.com',
      'multimedia.epayco.co',
      'checkout.epayco.co',
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 año para imágenes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Optimizaciones generales
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Configuración experimental para mejor performance
  experimental: {
    webpackBuildWorker: true,
    optimizeCss: true,
    optimizeServerReact: true,
    gzipSize: true,
  },

  // Configuración de ISR - Nueva opción
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB

  // Webpack optimizado con caché persistente
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Caché persistente de webpack
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Resolver problemas de módulos
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Optimizaciones para producción
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            common: {
              minChunks: 2,
              priority: -5,
              reuseExistingChunk: true,
            },
            // Separar librerías pesadas
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              name: 'framework',
              priority: 10,
              chunks: 'all',
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto')
                  .createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // Rewrites optimizados
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ];
  },

  // Headers con caché agresivo y optimizaciones
  async headers() {
    return [
      // Headers de seguridad generales
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.epayco.co")'
          },
        ],
      },
      
      // ========== CACHÉ AGRESIVO PARA ASSETS ==========
      
      // Imágenes JPG
      {
        source: '/(.*)\\.jpg$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes JPEG
      {
        source: '/(.*)\\.jpeg$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes PNG
      {
        source: '/(.*)\\.png$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes GIF
      {
        source: '/(.*)\\.gif$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes SVG
      {
        source: '/(.*)\\.svg$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes ICO
      {
        source: '/(.*)\\.ico$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes WEBP
      {
        source: '/(.*)\\.webp$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Imágenes AVIF
      {
        source: '/(.*)\\.avif$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      
      // Archivos JavaScript
      {
        source: '/(.*)\\.js$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Archivos CSS
      {
        source: '/(.*)\\.css$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Fuentes WOFF
      {
        source: '/(.*)\\.woff$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Fuentes WOFF2
      {
        source: '/(.*)\\.woff2$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Fuentes TTF
      {
        source: '/(.*)\\.ttf$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Fuentes OTF
      {
        source: '/(.*)\\.otf$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Fuentes EOT
      {
        source: '/(.*)\\.eot$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // ========== CACHÉ PARA PÁGINAS HTML ==========
      
      // Página principal - Caché corto con revalidación
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59',
          },
        ],
      },
      
      // Páginas de productos - Caché medio
      {
        source: '/producto/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      
      // Páginas de categorías - Caché medio
      {
        source: '/categoria/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      
      // ========== APIs CON CACHÉ ==========
      
      // API de productos - Caché con stale-while-revalidate
      {
        source: '/api/products(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, Accept',
          },
        ],
      },
      
      // API de categorías - Caché largo
      {
        source: '/api/categories(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      
      // APIs sin caché (carrito, checkout, etc)
      {
        source: '/api/(cart|checkout|orders|auth)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // API de ePayco - Sin caché
      {
        source: '/api/epayco/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
        ],
      },
		{
      source: '/js/visitor-tracking.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Content-Type',
          value: 'application/javascript',
        },
      ],
    },
    ];
  },

  // Configuración de ISR y SSG
  staticPageGenerationTimeout: 90,
  
  // Variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_EPAYCO_PUBLIC_KEY: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY,
  },
  
  // Output standalone para mejor performance en VPS
  output: 'standalone',
  
  // Desactivar x-powered-by header
  poweredByHeader: false,
  
  // Comprimir respuestas
  compress: true,
};


module.exports = nextConfig;