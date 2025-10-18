// pages/productos/[slug].js - VERSION SEO OPTIMIZADA
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useEcommerceAnalytics } from '../../hooks/useEcommerceAnalytics';
import { toast } from 'react-hot-toast';
import { 
  generateMetaTitle, 
  generateMetaDescription, 
  generateCanonicalUrl,
  generateBreadcrumbs,
  generateProductStructuredData,
  generateKeywords,
  cleanMetaContent
} from '../../lib/seoUtils';

export default function ProductDetailPage({ product, relatedProducts, category, seoData }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { 
    trackProductView, 
    trackAddToCart, 
    trackProductEngagement,
    isReady: analyticsReady 
  } = useEcommerceAnalytics();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pageStartTime] = useState(Date.now());
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);

  // 📊 ANALYTICS: Track vista de producto
  useEffect(() => {
    if (product && analyticsReady) {
      trackProductView({
        id: product.id,
        name: product.name,
        category: category?.name || 'Sin categoría',
        price: product.sale_price || product.price,
        sku: product.sku,
        brand: 'Judaica Breslov'
      });
    }
  }, [product, analyticsReady, trackProductView, category]);

  // 📊 ANALYTICS: Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollDepth > maxScrollDepth) {
        setMaxScrollDepth(Math.min(scrollDepth, 100));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [maxScrollDepth]);

  // 📊 ANALYTICS: Track engagement al salir de la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (product && analyticsReady) {
        const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
        trackProductEngagement(product, timeSpent, maxScrollDepth);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [product, analyticsReady, trackProductEngagement, pageStartTime, maxScrollDepth]);

  // Handle modal de imagen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowImageModal(false);
    };
    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const handleAddToCart = async () => {
    if (!product || product.stock_status !== 'in_stock') return;
    setIsAdding(true);
    
    try {
      const productData = {
        id: product.id,
        name: product.name,
        category: category?.name || 'Sin categoría',
        price: product.sale_price || product.price,
        sku: product.sku,
        brand: 'Judaica Breslov'
      };

      if (analyticsReady) {
        trackAddToCart(productData, quantity);
      }

      await addToCart(product.id, quantity, productData);
      
      toast.success(`${quantity} x ${product.name} añadido al carrito!`);
    } catch (error) {
      toast.error('Error al añadir el producto.');
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    minimumFractionDigits: 0 
  }).format(price);

  if (router.isFallback) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Producto no encontrado
            </h1>
            <Link href="/productos" className="text-blue-600 hover:underline">
              Ver todos los productos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [
    { image_url: '/images/placeholder.jpg', alt_text: product.name }
  ];

  const currentPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  // 🏷️ DATOS SEO GENERADOS
  const metaTitle = seoData?.metaTitle || generateMetaTitle(product, category);
  const metaDescription = seoData?.metaDescription || generateMetaDescription(product, category);
  const canonicalUrl = generateCanonicalUrl('product', product.slug);
  const keywords = generateKeywords(product, category);

  // 🍞 BREADCRUMBS
  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    { name: 'Productos', url: '/productos' }
  ];
  
  if (category) {
    breadcrumbItems.push({ 
      name: category.name, 
      url: `/categorias/${category.slug}` 
    });
  }
  
  breadcrumbItems.push({ 
    name: product.name, 
    url: `/productos/${product.slug}` 
  });

  const breadcrumbsSchema = generateBreadcrumbs(breadcrumbItems);
  const productSchema = generateProductStructuredData(product, category, images);

  return (
    <Layout
      title={metaTitle}
      description={cleanMetaContent(metaDescription)}
      canonical={canonicalUrl}
    >
      <Head>
        {/* Meta tags adicionales */}
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Judaica Breslov Colombia" />
        
        {/* Open Graph mejorado */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={cleanMetaContent(metaDescription)} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        {images[0] && <meta property="og:image" content={images[0].image_url} />}
        <meta property="og:site_name" content="Judaica Breslov Colombia" />
        <meta property="og:locale" content="es_CO" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={cleanMetaContent(metaDescription)} />
        {images[0] && <meta name="twitter:image" content={images[0].image_url} />}
        
        {/* Product meta tags */}
        <meta property="product:price:amount" content={currentPrice} />
        <meta property="product:price:currency" content="COP" />
        <meta property="product:availability" content={product.stock_status === 'in_stock' ? 'in stock' : 'out of stock'} />
        {product.sku && <meta property="product:retailer_item_id" content={product.sku} />}
        
        {/* Preload crítico */}
        {images[0] && (
          <link rel="preload" as="image" href={images[0].image_url} />
        )}
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumbs SEO mejorados */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-gray-900 font-medium" aria-current="page">
                      {item.name}
                    </span>
                  ) : (
                    <Link 
                      href={item.url} 
                      className="hover:text-blue-600 transition-colors"
                      itemProp="item"
                    >
                      <span itemProp="name">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Galería de Imágenes SEO optimizada */}
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="w-80 h-80 bg-white rounded-lg shadow-sm overflow-hidden mx-auto lg:w-96 lg:h-96">
                <Image
                  src={images[selectedImage]?.image_url || '/images/placeholder.jpg'}
                  alt={`${product.name} - ${images[selectedImage]?.alt_text || 'Imagen principal'}`}
                  width={384}
                  height={384}
                  className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform p-4"
                  onClick={() => setShowImageModal(true)}
                  priority={selectedImage === 0}
                  loading={selectedImage === 0 ? 'eager' : 'lazy'}
                />
              </div>
              
              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 bg-white rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                    >
                      <Image
                        src={image.image_url}
                        alt={`${product.name} - Miniatura ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Información del producto SEO optimizada */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                {category && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Link
                      href={`/categorias/${category.slug}`}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      title={`Ver más productos en ${category.name}`}
                    >
                      {category.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Precio con schema */}
              <div className="space-y-2" itemScope itemType="https://schema.org/Offer">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl font-bold text-gray-900"
                    itemProp="price"
                    content={currentPrice}
                  >
                    {formatPrice(currentPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  <meta itemProp="priceCurrency" content="COP" />
                </div>
                {hasDiscount && (
                  <div className="text-sm text-green-600 font-medium">
                    Ahorras {formatPrice(product.price - product.sale_price)}
                  </div>
                )}
              </div>

              {/* Estado de stock con schema */}
              <div className="space-y-2">
                {product.stock_status === 'in_stock' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Disponible</span>
                    <link itemProp="availability" href="https://schema.org/InStock" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">Sin stock</span>
                    <link itemProp="availability" href="https://schema.org/OutOfStock" />
                  </div>
                )}
              </div>

              {/* Descripción corta */}
              {product.short_description && (
                <div className="prose prose-sm text-gray-700">
                  <p>{product.short_description}</p>
                </div>
              )}

              {/* Agregar al carrito */}
              {product.stock_status === 'in_stock' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50" 
                        disabled={quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)} 
                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    aria-label={`Agregar ${quantity} ${product.name} al carrito`}
                  >
                    {isAdding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Agregando...
                      </>
                    ) : (
                      'Agregar al Carrito'
                    )}
                  </button>
                </div>
              )}

              {/* Información adicional estructurada */}
              <div className="border-t border-gray-200 pt-6 space-y-3">
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium" itemProp="sku">{product.sku}</span>
                  </div>
                )}
                
                {product.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{product.weight} kg</span>
                  </div>
                )}

                {product.dimensions && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dimensiones:</span>
                    <span className="font-medium">{product.dimensions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Descripción completa con heading SEO */}
          {product.description && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Descripción de {product.name}
              </h2>
              <div 
                className="prose prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Productos relacionados con heading SEO */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Productos Relacionados en {category?.name || 'Judaica'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map(relatedProduct => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal de imagen accesible */}
        <AnimatePresence>
          {showImageModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
              onClick={() => setShowImageModal(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Vista ampliada de la imagen del producto"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-2xl max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[selectedImage]?.image_url || '/images/placeholder.jpg'}
                  alt={`${product.name} - Vista ampliada`}
                  width={600}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
                  aria-label="Cerrar vista ampliada"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Structured Data optimizado */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            productSchema,
            {
              "@context": "https://schema.org",
              ...breadcrumbsSchema
            }
          ])
        }}
      />
    </Layout>
  );
}

// getStaticProps optimizado para SEO
export async function getStaticProps({ params }) {
  try {
    const { slug } = params;
    const { query } = require('../../lib/database');
    
    console.log('🔍 Buscando producto con slug:', slug);

    // Query optimizada con JOIN para obtener categoría principal
    const productResult = await query(`
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.sort_order) as image_urls,
        GROUP_CONCAT(DISTINCT pi.alt_text ORDER BY pi.sort_order) as image_alts,
        GROUP_CONCAT(DISTINCT pi.is_featured ORDER BY pi.sort_order) as image_featured,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.description as category_description
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.status = 'active'
      WHERE p.slug = ? AND p.status = 'active'
      GROUP BY p.id
      LIMIT 1
    `, [slug]);

    if (productResult.length === 0) {
      console.log('❌ Producto no encontrado:', slug);
      return { notFound: true };
    }

    const product = productResult[0];
    console.log('✅ Producto encontrado:', product.name);

    // Obtener todas las categorías del producto
    const categoriesResult = await query(`
      SELECT c.id, c.name, c.slug, c.description
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ? AND c.status = 'active'
    `, [product.id]);

    // Procesar imágenes
    const images = [];
    if (product.image_urls) {
      const urls = product.image_urls.split(',');
      const alts = product.image_alts ? product.image_alts.split(',') : [];
      const featured = product.image_featured ? product.image_featured.split(',') : [];

      for (let i = 0; i < urls.length; i++) {
        images.push({
          image_url: urls[i],
          alt_text: alts[i] || `${product.name} - Imagen ${i + 1}`,
          is_featured: featured[i] === '1'
        });
      }
    }

    // Preparar datos del producto
    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      price: parseFloat(product.price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      sku: product.sku,
      stock_status: product.stock_status,
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      woocommerce_id: product.woocommerce_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
      categories: categoriesResult,
      images: images
    };

    // Categoría principal
    const mainCategory = product.category_id ? {
      id: product.category_id,
      name: product.category_name,
      slug: product.category_slug,
      description: product.category_description
    } : (categoriesResult.length > 0 ? categoriesResult[0] : null);

    // Obtener productos relacionados
    let relatedProducts = [];
    if (mainCategory) {
      const relatedResult = await query(`
        SELECT 
          p.id, p.name, p.slug, p.price, p.sale_price, p.stock_status,
          pi.image_url as featured_image,
          pi.alt_text as image_alt
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id = ? AND p.slug != ? AND p.status = 'active'
        ORDER BY p.featured DESC, p.created_at DESC
        LIMIT 4
      `, [mainCategory.id, slug]);

      relatedProducts = relatedResult.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: parseFloat(p.price),
        sale_price: p.sale_price ? parseFloat(p.sale_price) : null,
        featured_image: p.featured_image,
        image_alt: p.image_alt || p.name,
        stock_status: p.stock_status
      }));
    }

    // Generar datos SEO
    const seoData = {
      metaTitle: generateMetaTitle(productData, mainCategory),
      metaDescription: generateMetaDescription(productData, mainCategory)
    };

    return {
      props: {
        product: JSON.parse(JSON.stringify(productData)),
        relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
        category: mainCategory ? JSON.parse(JSON.stringify(mainCategory)) : null,
        seoData: seoData
      },
      revalidate: 3600, // Revalidar cada hora
    };
  } catch (error) {
    console.error("❌ Error en getStaticProps:", error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  return { 
    paths: [], 
    fallback: 'blocking' 
  };
}