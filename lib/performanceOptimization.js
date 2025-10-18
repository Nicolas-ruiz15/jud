// lib/performanceOptimization.js - OPTIMIZACIÓN DE VELOCIDAD

// 1. Optimización de imágenes con placeholders
export const OptimizedImage = ({ src, alt, width, height, priority = false, className = "" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);

  // Placeholder base64 (imagen 1x1 px transparente)
  const placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=";

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder mientras carga */}
      {!imageLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Imagen optimizada */}
      <Image
        src={imageSrc || placeholder}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={85}
        className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        placeholder="blur"
        blurDataURL={placeholder}
        style={{
          objectFit: 'contain',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

// 2. Hook para lazy loading de datos
export const useLazyLoad = (callback, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !data && !loading) {
          setLoading(true);
          callback()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, dependencies);

  return { data, loading, error, ref: observerRef };
};

// 3. Preload crítico de recursos
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Preload fuentes críticas
  const linkFont = document.createElement('link');
  linkFont.rel = 'preload';
  linkFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  linkFont.as = 'style';
  linkFont.crossOrigin = 'anonymous';
  document.head.appendChild(linkFont);

  // Preload logo
  const linkLogo = document.createElement('link');
  linkLogo.rel = 'preload';
  linkLogo.href = '/logo-judaica-breslov.png';
  linkLogo.as = 'image';
  document.head.appendChild(linkLogo);

  // DNS prefetch para servicios externos
  const dnsPrefetchUrls = [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  dnsPrefetchUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// 4. Optimización de JavaScript con Web Workers
export class SearchWorker {
  constructor() {
    if (typeof window !== 'undefined' && window.Worker) {
      this.worker = new Worker('/workers/search-worker.js');
    }
  }

  search(query, products) {
    return new Promise((resolve) => {
      if (!this.worker) {
        // Fallback sin worker
        const results = products.filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase())
        );
        resolve(results);
        return;
      }

      this.worker.onmessage = (e) => {
        resolve(e.data);
      };

      this.worker.postMessage({ query, products });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// 5. Cache estratégico para API calls
export const createApiCache = () => {
  const cache = new Map();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (Date.now() - item.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
      }
      
      return item.data;
    },
    
    set: (key, data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
    },
    
    clear: () => cache.clear()
  };
};

// 6. Optimización de CSS crítico
export const injectCriticalCSS = () => {
  if (typeof document === 'undefined') return;

  const criticalCSS = `
    /* CSS crítico inline */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    .header { background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// 7. Lazy loading para componentes pesados
export const LazyProductGrid = dynamic(() => import('../components/ProductGrid'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false
});

// 8. Optimización de scroll performance
export const useVirtualScroll = (items, itemHeight = 250, containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 1, items.length);
  
  const visibleItemsData = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems: visibleItemsData,
    totalHeight,
    offsetY,
    onScroll: handleScroll
  };
};

// 9. Service Worker para cache offline
export const registerServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
};

// 10. Métricas de Core Web Vitals
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Medir LCP (Largest Contentful Paint)
  const observeLCP = () => {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      
      // Enviar a analytics si es > 2.5s (malo)
      if (lastEntry.startTime > 2500) {
        if (window.analytics) {
          window.analytics.trackCustomEvent('core_web_vitals', {
            metric: 'LCP',
            value: lastEntry.startTime,
            rating: 'poor'
          });
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // Medir FID (First Input Delay)
  const observeFID = () => {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
        
        const fid = entry.processingStart - entry.startTime;
        if (fid > 100) { // Malo si > 100ms
          if (window.analytics) {
            window.analytics.trackCustomEvent('core_web_vitals', {
              metric: 'FID',
              value: fid,
              rating: 'poor'
            });
          }
        }
      });
    }).observe({ entryTypes: ['first-input'] });
  };

  // Medir CLS (Cumulative Layout Shift)
  const observeCLS = () => {
    let clsValue = 0;
    
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      console.log('CLS:', clsValue);
      
      if (clsValue > 0.1) { // Malo si > 0.1
        if (window.analytics) {
          window.analytics.trackCustomEvent('core_web_vitals', {
            metric: 'CLS',
            value: clsValue,
            rating: 'poor'
          });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  };

  // Inicializar observadores
  observeLCP();
  observeFID();
  observeCLS();
};

// 11. Optimización de fonts con font-display
export const optimizeFonts = () => {
  if (typeof document === 'undefined') return;

  const fontCSS = `
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 300 700;
      font-display: swap;
      src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZg.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
  `;

  const style = document.createElement('style');
  style.textContent = fontCSS;
  document.head.appendChild(style);
};

// 12. Prefetch de páginas críticas
export const prefetchCriticalPages = () => {
  if (typeof window === 'undefined') return;

  const criticalUrls = [
    '/productos',
    '/categorias',
    '/carrito',
    '/contacto'
  ];

  criticalUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// 13. Optimización de eventos de scroll
export const useThrottledScroll = (callback, delay = 100) => {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);
};

const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// 14. Componente de imagen con WebP support
export const NextGenImage = ({ src, alt, ...props }) => {
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, 1, 1);
      
      const dataURL = canvas.toDataURL('image/webp');
      setSupportsWebP(dataURL.indexOf('data:image/webp') === 0);
    };

    checkWebPSupport();
  }, []);

  const optimizedSrc = supportsWebP && src.includes('.jpg') || src.includes('.png') 
    ? src.replace(/\.(jpg|png)$/, '.webp')
    : src;

  return <OptimizedImage src={optimizedSrc} alt={alt} {...props} />;
};

// 15. Hook para detectar conexión lenta
export const useNetworkStatus = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateConnectionStatus = () => {
        // Considerar conexión lenta si < 1.5 Mbps
        setIsSlowConnection(connection.downlink < 1.5);
      };

      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);
      
      return () => connection.removeEventListener('change', updateConnectionStatus);
    }
  }, []);

  return isSlowConnection;
};

// 16. Configuración inicial de performance
export const initializePerformanceOptimizations = () => {
  if (typeof window === 'undefined') return;

  // 1. Preload recursos críticos
  preloadCriticalResources();
  
  // 2. Inyectar CSS crítico
  injectCriticalCSS();
  
  // 3. Optimizar fuentes
  optimizeFonts();
  
  // 4. Prefetch páginas críticas
  prefetchCriticalPages();
  
  // 5. Medir Web Vitals
  measureWebVitals();
  
  // 6. Registrar Service Worker
  registerServiceWorker();
  
  console.log('✅ Performance optimizations initialized');
};

// 17. Configuración de next.config.js para performance
export const nextConfigOptimizations = {
  // Configuración para performance
  compress: true,
  poweredByHeader: false,
  
  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 año
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers para cache agresivo
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimizaciones para producción
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default {
  OptimizedImage,
  useLazyLoad,
  SearchWorker,
  createApiCache,
  measureWebVitals,
  initializePerformanceOptimizations,
  nextConfigOptimizations
};