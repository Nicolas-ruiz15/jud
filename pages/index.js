import Head from 'next/head';
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Función para serializar datos (evitar errores de Date)
function serializeData(data) {
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (data && typeof data === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeData(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return data;
}

export default function Home({ featuredProducts = [], categories = [], seoData = {} }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Datos del hero banner impactante
  const heroSlides = [
    {
      id: 1,
      title: 'Productos Judaicos Auténticos',
      subtitle: 'Directo desde Israel a tu hogar en Colombia',
      description: 'Mezuzot, Talitot, Tefilín y más con certificado de autenticidad',
      image: '/images/hero/banner-judaica-autentica.jpg',
      buttonText: 'Ver Producto',
      buttonLink: '/producto'
    },
    {
      id: 2,
      title: 'Literatura Breslov Exclusiva',
      subtitle: 'Libros del Rabí Shalom Arush',
      description: 'La colección más completa de enseñanzas del Rabí Nachman en español',
      image: '/images/hero/banner-libros-breslov.jpg',
      buttonText: 'Ver Libros',
      buttonLink: '/categorias/libros'
    },
    {
      id: 3,
      title: 'Envío Gratis a Colombia',
      subtitle: 'En compras superiores a $250.000',
      description: 'Recibe tus productos judaicos en toda Colombia de forma segura',
      image: '/images/hero/banner-envio-gratis-colombia.jpg',
      buttonText: 'Comprar Ahora',
      buttonLink: '/producto'
    }
  ];

  // Función optimizada para obtener imagen de categoría
  const getCategoryImage = (category) => {
    const imageSources = [
      category.image_url,
      category.image,
      category.featured_image
    ];
    
    for (const imageUrl of imageSources) {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        return imageUrl;
      }
    }
    
    const categoryName = category.slug || category.name?.toLowerCase() || 'default';
    
    const defaultImages = {
      'libros': '/images/categories/libros-default.jpg',
      'breslov': '/images/categories/breslov-default.jpg', 
      'mezuza': '/images/categories/mezuza-default.jpg',
      'mezuzot': '/images/categories/mezuza-default.jpg',
      'talit': '/images/categories/talit-default.jpg',
      'tallit': '/images/categories/talit-default.jpg',
      'tefilin': '/images/categories/tefilin-default.jpg',
      'kipa': '/images/categories/kipa-default.jpg',
      'kipot': '/images/categories/kipa-default.jpg',
      'joyeria': '/images/categories/joyeria-default.jpg',
      'jewelry': '/images/categories/joyeria-default.jpg',
      'arte': '/images/categories/arte-default.jpg'
    };
    
    for (const [key, imagePath] of Object.entries(defaultImages)) {
      if (categoryName.includes(key)) {
        return imagePath;
      }
    }
    
    return '/images/categories/default-category.jpg';
  };

  // Función optimizada para obtener imagen de producto
  const getProductImage = (product) => {
    if (product.featured_image && product.featured_image.trim() !== '') {
      return product.featured_image;
    }
    
    if (product.image_url && product.image_url.trim() !== '') {
      return product.image_url;
    }
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      return firstImage.image_url || firstImage.src || firstImage.url || firstImage;
    }
    
    return '/images/products/default-product.jpg';
  };

  // Funciones de tracking simplificadas y seguras
  const trackEvent = (eventName, parameters = {}) => {
    if (typeof window !== 'undefined') {
      try {
        if (window.gtag) {
          window.gtag('event', eventName, parameters);
        }
        if (window.analytics && typeof window.analytics.trackCustomEvent === 'function') {
          window.analytics.trackCustomEvent(eventName, parameters);
        }
      } catch (error) {
        console.warn('Analytics tracking error:', error);
      }
    }
  };

  useEffect(() => {
    if (mounted) {
      trackEvent('page_view', {
        page_title: 'Inicio - Judaica Breslov Colombia',
        page_location: typeof window !== 'undefined' ? window.location.href : ''
      });
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="animate-pulse">
            <div className="h-screen bg-gray-200"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={seoData?.title || 'Judaica Breslov Colombia - Tienda Online de Productos Judaicos Auténticos'}
      description={seoData?.description || 'Tienda líder en productos judaicos en Colombia. Mezuzot, Talitot, Tefilín, libros de Breslov y más. Productos auténticos desde Israel. Envío gratis +$250.000.'}
      canonical={seoData?.canonicalUrl || process.env.NEXT_PUBLIC_SITE_URL}
    >
      <Head>
        <meta name="keywords" content={seoData?.keywords || 'judaica colombia, breslov, productos judaicos, mezuza, talit, tefilin, libros judios, rabi najman, shalom arush, tienda judaica bogota'} />
        
        <meta property="og:image" content={seoData?.ogImage || `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-home.jpg`} />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={seoData?.ogImage || `${process.env.NEXT_PUBLIC_SITE_URL}/images/og-home.jpg`} />

        {seoData?.structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.structuredData) }}
          />
        )}
      </Head>

      {/* Hero Banner Optimizado */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation={{
            nextEl: '.hero-button-next',
            prevEl: '.hero-button-prev',
          }}
          pagination={{
            el: '.hero-pagination',
            clickable: true,
            bulletClass: 'hero-bullet',
            bulletActiveClass: 'hero-bullet-active'
          }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          loop={true}
          className="h-full"
          onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex)}
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <div className="relative h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  quality={index === 0 ? 90 : 75}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  onError={(e) => {
                    console.warn(`Error loading hero image: ${slide.image}`);
                    e.target.src = '/images/hero/default-hero.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-3xl text-white">
                      <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg"
                      >
                        {slide.title}
                      </motion.h1>
                      <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-2xl md:text-3xl font-light mb-6 text-gray-100 drop-shadow-md"
                      >
                        {slide.subtitle}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-xl mb-10 leading-relaxed max-w-2xl drop-shadow-md"
                      >
                        {slide.description}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                      >
                        <Link
                          href={slide.buttonLink}
                          className="inline-flex items-center bg-white text-gray-900 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all duration-300 text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                          onClick={() => {
                            trackEvent('hero_cta_click', {
                              slide_title: slide.title,
                              slide_index: index
                            });
                          }}
                        >
                          <span>{slide.buttonText}</span>
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Controles del hero */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="hero-pagination flex space-x-3"></div>
        </div>
        
        <button className="hero-button-prev absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-4 transition-all duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button className="hero-button-next absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-4 transition-all duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* Beneficios clave */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Envío Gratis</h3>
                <p className="text-gray-600">En compras +$250.000</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Productos Auténticos</h3>
                <p className="text-gray-600">Certificados desde Israel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Asesoría Experta</h3>
                <p className="text-gray-600">300 929 1156</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Principales */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Categorías Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra selección cuidadosamente curada de productos judaicos auténticos
            </p>
          </div>

          {categories && categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.slice(0, 6).map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group"
                  >
                    <Link href={`/categorias/${category.slug}`}>
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                        <div className="relative h-64 overflow-hidden bg-gray-100">
                          <Image
                            src={getCategoryImage(category)}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            loading={index < 3 ? 'eager' : 'lazy'}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              if (!e.target.src.includes('default-category.jpg')) {
                                e.target.src = '/images/categories/default-category.jpg';
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
                          
                          {category.product_count && (
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                              <span className="text-sm font-medium text-gray-900">
                                {category.product_count} productos
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {category.description || `Descubre nuestra selección de ${category.name.toLowerCase()}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/categorias"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span>Ver Todas las Categorías</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Cargando Categorías
              </h3>
              <p className="text-gray-600">
                Estamos preparando nuestras categorías de productos judaicos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Productos Más Vendidos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Productos Más Vendidos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los productos judaicos favoritos de nuestra comunidad en Colombia
            </p>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {featuredProducts.slice(0, 10).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <ProductCard 
                      product={{
                        ...product,
                        featured_image: getProductImage(product)
                      }}
                      onView={() => {
                        trackEvent('view_item', {
                          currency: 'COP',
                          value: product.sale_price || product.price,
                          items: [{
                            item_id: product.id.toString(),
                            item_name: product.name,
                            item_category: product.category_name || 'Judaica',
                            price: product.sale_price || product.price
                          }]
                        });
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/producto"
                  className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span>Ver Todos los Productos</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m0 0V3.5A1.5 1.5 0 017.5 2h9A1.5 1.5 0 0118 3.5V5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Próximamente Productos Destacados
              </h3>
              <p className="text-gray-600 mb-6">
                Estamos seleccionando los mejores productos para mostrar aquí.
              </p>
              <Link
                href="/producto"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                <span>Ver Todo el Catálogo</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Lo Que Dicen Nuestros Clientes</h2>
            <p className="text-xl text-gray-300">
              Testimonios reales de familias judías en Colombia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "David Levy",
                city: "Bogotá, Colombia",
                initials: "DL",
                color: "bg-blue-600",
                text: "El talit que compré para mi hijo es de una calidad excepcional. Llegó perfectamente empacado y con todos los certificados. Muy recomendado."
              },
              {
                name: "Ruth Cohen", 
                city: "Medellín, Colombia",
                initials: "RC",
                color: "bg-green-600",
                text: "Los libros de Breslov que he comprado han sido una bendición. El servicio al cliente es excepcional y muy conocedor de la tradición."
              },
              {
                name: "Michael Rosenberg",
                city: "Cali, Colombia", 
                initials: "MR",
                color: "bg-purple-600",
                text: "Encontré la mezuzá perfecta para mi nuevo hogar. La variedad es increíble y el envío fue súper rápido a Cali."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 text-lg italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center mr-4`}>
                    <span className="text-white font-bold">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400">{testimonial.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estilos CSS para el hero */}
      <style jsx>{`
        .hero-bullet {
          width: 14px;
          height: 14px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hero-bullet-active {
          background: white;
          transform: scale(1.3);
        }
      `}</style>
    </Layout>
  );
}

// FUNCIÓN GETSTATICPROPS QUE REALMENTE CARGA DATOS
export async function getStaticProps() {
  try {
    // Importar y cargar funciones API
    const { getFeaturedProducts, getCategories } = await import('../lib/api');
    
    const [featuredProducts, categories] = await Promise.all([
      getFeaturedProducts(8),
      getCategories(8)
    ]);

    const seoData = {
      title: 'Judaica Breslov Colombia - Tienda Online de Productos Judaicos Auténticos',
      description: 'Tienda líder en productos judaicos en Colombia. Mezuzot, Talitot, Tefilín, libros de Breslov y más. Productos auténticos desde Israel. Envío gratis +$250.000.',
      keywords: 'judaica colombia, breslov, productos judaicos, mezuza, talit, tefilin, libros judios, rabi najman, shalom arush, tienda judaica bogota',
      canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com',
      ogImage: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com'}/images/og-home.jpg`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Judaica Breslov Colombia",
        "url": process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com',
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.judaicabreslovcolombia.com'}/images/logo.png`,
        "description": "Tienda líder en productos judaicos en Colombia",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "CO"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+57-300-929-1156",
          "contactType": "customer service",
          "availableLanguage": ["Spanish"]
        }
      }
    };

    return {
      props: {
        featuredProducts: serializeData(featuredProducts || []),
        categories: serializeData(categories || []),
        seoData: serializeData(seoData)
      },
      revalidate: 300 // 5 minutos
    };
  } catch (error) {
    console.error('Error en getStaticProps:', error);
    
    // Fallback con datos vacíos si hay error
    return {
      props: {
        featuredProducts: [],
        categories: [],
        seoData: {
          title: 'Judaica Breslov Colombia - Tienda y Librería Online',
          description: 'Tienda y librería judaica online en Colombia.',
          canonicalUrl: 'https://www.judaicabreslovcolombia.com',
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Judaica Breslov Colombia"
          }
        }
      },
      revalidate: 60
    };
  }
}