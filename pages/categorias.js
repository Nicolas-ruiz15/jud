// pages/categorias.js - ACTUALIZADA
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Layout from '../components/Layout';
import CategoryCard from '../components/CategoryCard';
import { motion } from 'framer-motion';

export default function CategoriasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('🔍 Cargando categorías...');
      
      const response = await fetch('/api/categories?include_count=true');
      const data = await response.json();
      
      console.log('📊 Respuesta de categorías:', data);
      
      if (data.success) {
        // Filtrar categorías que tengan productos
        const categoriesWithProducts = data.data.filter(cat => cat.product_count > 0);
        setCategories(categoriesWithProducts);
        console.log(`✅ ${categoriesWithProducts.length} categorías cargadas`);
      } else {
        setError(data.message || 'Error al cargar categorías');
        console.error('❌ Error en respuesta:', data.message);
      }
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      setError('Error de conexión al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Categorías - Judaica Breslov Colombia</title>
        <meta 
          name="description" 
          content="Explora nuestras categorías de productos judaicos: libros Breslov, mezuzot, tefilín, talitot, kipot y más. Encuentra todo para tu práctica judía." 
        />
        <meta name="keywords" content="categorias judaicas, libros breslov, mezuza, tefilin, talit, kipot, colombia, productos judios" />
        <link rel="canonical" href="https://www.judaicabreslovcolombia.com/categorias" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Categorías de Productos Judaicos - Judaica Breslov Colombia" />
        <meta property="og:description" content="Explora nuestras categorías organizadas de productos judaicos auténticos" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.judaicabreslovcolombia.com/categorias" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Categorías de Productos Judaicos - Judaica Breslov Colombia" />
        <meta name="twitter:description" content="Explora nuestras categorías organizadas de productos judaicos auténticos" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold mb-6">
                Categorías de Productos
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Encuentra fácilmente lo que buscas navegando por nuestras categorías 
                organizadas de productos judaicos auténticos y de alta calidad.
              </p>
              
              {/* Estadísticas */}
              {!loading && categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-8 flex justify-center items-center gap-8 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <span>{categories.length} categorías disponibles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <span>{categories.reduce((total, cat) => total + cat.product_count, 0)} productos totales</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando categorías...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="max-w-md mx-auto text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Error al cargar categorías
                </h3>
                <p className="text-red-700 text-sm mb-4">
                  {error}
                </p>
                <button
                  onClick={loadCategories}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Grid de categorías */}
          {!loading && !error && categories.length > 0 && (
            <>
              {/* Sección principal */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Explora por Categoría
                </h2>
                <p className="text-gray-600 text-center mb-8">
                  Haz clic en cualquier categoría para ver todos los productos disponibles
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <CategoryCard 
                      category={category}
                      onClick={() => {
                        // Analytics tracking
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'select_content', {
                            content_type: 'category',
                            content_id: category.slug,
                            content_name: category.name
                          });
                        }
                        
                        console.log('📊 Categoría seleccionada:', category.name);
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Información adicional */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-16 text-center"
              >
                <div className="bg-white rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    ¿No encuentras lo que buscas?
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Nuestro catálogo está en constante crecimiento. Si no encuentras un producto específico, 
                    contáctanos y te ayudaremos a encontrarlo o te informaremos sobre próximas incorporaciones.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/contacto"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Contáctanos
                    </a>
                    <a
                      href="/producto"
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Ver todos los productos
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Sin categorías */}
          {!loading && !error && categories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 mx-auto mb-6 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No hay categorías disponibles
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Las categorías aparecerán aquí una vez que se sincronicen los productos con el sistema.
              </p>
              <div className="space-y-3">
                <button
                  onClick={loadCategories}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Recargar categorías
                </button>
                <br />
                <a
                  href="/producto"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos los productos disponibles
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Schema.org structured data */}
        {categories.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": "Categorías de Productos Judaicos",
                "description": "Explora nuestras categorías organizadas de productos judaicos auténticos",
                "url": "https://www.judaicabreslovcolombia.com/categorias",
                "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": categories.length,
                  "itemListElement": categories.map((category, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Thing",
                      "name": category.name,
                      "description": category.description,
                      "url": `https://www.judaicabreslovcolombia.com/categorias/${category.slug}`
                    }
                  }))
                },
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Inicio",
                      "item": "https://www.judaicabreslovcolombia.com"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Categorías",
                      "item": "https://www.judaicabreslovcolombia.com/categorias"
                    }
                  ]
                }
              })
            }}
          />
        )}
      </div>
    </Layout>
  );
}