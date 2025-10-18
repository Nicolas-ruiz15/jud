// pages/blog/[slug].js - PÁGINA INDIVIDUAL DEL BLOG SEO OPTIMIZADA
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import { motion } from 'framer-motion';
import { query } from '../../lib/database';
import { 
  generateCanonicalUrl, 
  generateBreadcrumbs,
  cleanMetaContent 
} from '../../lib/seoUtils';
import { generateArticleSchema } from '../../lib/advancedSchema';

export default function BlogPostPage({ post, relatedPosts, relatedProducts, category, tags }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    setShareUrl(window.location.href);
    
    // Incrementar views
    if (post?.id) {
      fetch(`/api/blog/increment-views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      }).catch(console.error);
    }
  }, [post]);

  // Tracking de progreso de lectura
  useEffect(() => {
    const updateReadingProgress = () => {
      const content = document.getElementById('blog-content');
      if (!content) return;

      const rect = content.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const contentHeight = rect.height;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(100, (scrolled / (contentHeight - viewportHeight)) * 100);
      
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', updateReadingProgress);
    updateReadingProgress();

    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  const handleShare = async (platform) => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(post.title);
    const text = encodeURIComponent(post.excerpt || post.title);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=${title}&body=${text}%0A%0A${url}`
    };

    if (navigator.share && platform === 'native') {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl
        });
        return;
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (router.isFallback) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Artículo no encontrado
            </h1>
            <Link href="/blog" className="text-blue-600 hover:underline">
              Volver al blog
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canonicalUrl = generateCanonicalUrl('post', post.slug);
  const metaTitle = post.meta_title || `${post.title} | Blog Judaica Breslov Colombia`;
  const metaDescription = post.meta_description || post.excerpt || `Lee sobre ${post.title} en nuestro blog judaico. Educación y tradiciones judías en Colombia.`;

  // Breadcrumbs
  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    { name: 'Blog', url: '/blog' }
  ];
  
  if (category) {
    breadcrumbItems.push({ 
      name: category.name, 
      url: `/blog?categoria=${category.slug}` 
    });
  }
  
  breadcrumbItems.push({ 
    name: post.title, 
    url: `/blog/${post.slug}` 
  });

  const articleSchema = generateArticleSchema(post, { name: post.author_name });
  const breadcrumbsSchema = generateBreadcrumbs(breadcrumbItems);

  return (
    <Layout
      title={metaTitle}
      description={cleanMetaContent(metaDescription, 160)}
      canonical={canonicalUrl}
    >
      <Head>
        {/* Meta tags adicionales */}
        <meta name="keywords" content={post.keywords || `${post.title}, blog judaico, ${category?.name || 'judaísmo'}`} />
        <meta name="author" content={post.author_name || 'Equipo Judaica Breslov'} />
        <meta name="article:published_time" content={post.published_at} />
        <meta name="article:modified_time" content={post.updated_at} />
        {category && <meta name="article:section" content={category.name} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={cleanMetaContent(metaDescription, 160)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="og:site_name" content="Judaica Breslov Colombia" />
        <meta property="article:author" content={post.author_name || 'Equipo Judaica Breslov'} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={cleanMetaContent(metaDescription, 160)} />
        {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}
        
        {/* Preload featured image */}
        {post.featured_image && (
          <link rel="preload" as="image" href={post.featured_image} />
        )}
      </Head>

      {/* Progress bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-gray-900 font-medium line-clamp-1" aria-current="page">
                      {item.name}
                    </span>
                  ) : (
                    <Link href={item.url} className="hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              <article className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                {/* Header del artículo */}
                <header className="p-8 pb-6 border-b border-gray-100">
                  {/* Categoría y meta info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {category && (
                        <Link
                          href={`/blog?categoria=${category.slug}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: `${category.color}20`,
                            color: category.color 
                          }}
                        >
                          {category.name}
                        </Link>
                      )}
                      <time className="text-sm text-gray-500">
                        {formatDate(post.published_at)}
                      </time>
                    </div>
                    
                    {post.featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Destacado
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {post.title}
                  </h1>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta información */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {post.author_name || 'Equipo Judaica Breslov'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {post.reading_time} min de lectura
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.views_count || 0} vistas
                      </span>
                    </div>

                    {/* Botones de compartir */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 mr-2">Compartir:</span>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        aria-label="Compartir en Facebook"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        aria-label="Compartir en WhatsApp"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="p-2 text-blue-400 hover:bg-blue-50 rounded-full transition-colors"
                        aria-label="Compartir en Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </header>

                {/* Imagen destacada */}
                {post.featured_image && (
                  <div className="relative h-64 md:h-80 lg:h-96">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Contenido */}
                <div 
                  id="blog-content" 
                  className="p-8 prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div className="px-8 pb-6 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-2 mt-6">
                      <span className="text-sm font-medium text-gray-600">Etiquetas:</span>
                      {tags.map(tag => (
                        <Link
                          key={tag.id}
                          href={`/blog?tag=${tag.slug}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm border hover:bg-gray-50 transition-colors"
                          style={{ 
                            borderColor: tag.color,
                            color: tag.color 
                          }}
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer del artículo */}
                <footer className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Última actualización: {formatDate(post.updated_at)}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">¿Te gustó este artículo?</span>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Compartir por WhatsApp
                      </button>
                    </div>
                  </div>
                </footer>
              </article>

              {/* Productos relacionados */}
              {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Productos Relacionados
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedProducts.slice(0, 3).map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link
                      href="/productos"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Ver más productos
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}

              {/* Artículos relacionados */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Artículos Relacionados
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedPosts.slice(0, 4).map(relatedPost => (
                      <article key={relatedPost.id} className="group">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          <div className="flex space-x-4">
                            {relatedPost.featured_image && (
                              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                                <Image
                                  src={relatedPost.featured_image}
                                  alt={relatedPost.title}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                {relatedPost.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatDate(relatedPost.published_at)}
                              </p>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {relatedPost.excerpt}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                
                {/* Tabla de contenidos (si el artículo es largo) */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">En este artículo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-600">
                      Tiempo de lectura: {post.reading_time} minutos
                    </div>
                    <div className="text-gray-600">
                      Categoría: {category?.name || 'General'}
                    </div>
                    <div className="text-gray-600">
                      Última actualización: {formatDate(post.updated_at)}
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">¿Te gustó este artículo?</h3>
                  <p className="text-blue-100 mb-4 text-sm">
                    Suscríbete para recibir más contenido judaico directo en tu email
                  </p>
                  <form className="space-y-3">
                    <input
                      type="email"
                      placeholder="Tu email"
                      className="w-full px-3 py-2 text-gray-900 rounded border-0 focus:ring-2 focus:ring-white"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-white text-blue-600 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
                    >
                      Suscribirse
                    </button>
                  </form>
                </div>

                {/* Navegación rápida */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Navegación</h3>
                  <div className="space-y-3">
                    <Link
                      href="/blog"
                      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Volver al blog
                    </Link>
                    {category && (
                      <Link
                        href={`/blog?categoria=${category.slug}`}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Más en {category.name}
                      </Link>
                    )}
                    <Link
                      href="/productos"
                      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Ver productos
                    </Link>
                  </div>
                </div>

                {/* Banner promocional */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 text-yellow-600">
                      <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">
                      Envío Gratis
                    </h3>
                    <p className="text-yellow-700 text-sm mb-4">
                      En compras mayores a $200.000 a toda Colombia
                    </p>
                    <Link
                      href="/productos"
                      className="inline-block bg-yellow-600 text-white px-4 py-2 rounded font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Comprar ahora
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-900 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                ¿Te interesa profundizar en el judaísmo?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Explora más artículos en nuestro blog y descubre productos auténticos para tu práctica religiosa
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/blog"
                  className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Más Artículos
                </Link>
                <Link
                  href="/productos"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
                >
                  Ver Productos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            articleSchema,
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

export async function getStaticProps({ params }) {
  try {
    const { slug } = params;
    
    // Obtener post
    const postResult = await query(`
      SELECT 
        bp.*,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color,
        bc.description as category_description
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.slug = ? AND bp.status = 'published' AND bp.published_at <= NOW()
      LIMIT 1
    `, [slug]);

    if (postResult.length === 0) {
      return { notFound: true };
    }

    const post = postResult[0];

    // Obtener categoría completa
    const category = post.category_name ? {
      name: post.category_name,
      slug: post.category_slug,
      color: post.category_color,
      description: post.category_description
    } : null;

    // Obtener tags
    const tags = await query(`
      SELECT bt.* 
      FROM blog_tags bt
      INNER JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
      WHERE bpt.post_id = ?
      ORDER BY bt.name
    `, [post.id]);

    // Obtener posts relacionados
    const relatedPosts = await query(`
      SELECT bp.*, bc.name as category_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.category_id = ? AND bp.id != ? AND bp.status = 'published' AND bp.published_at <= NOW()
      ORDER BY bp.published_at DESC
      LIMIT 4
    `, [post.category_id, post.id]);

    // Obtener productos relacionados
    const relatedProducts = await query(`
      SELECT 
        p.id, p.name, p.slug, p.price, p.sale_price, p.stock_status,
        pi.image_url as featured_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = 1
      INNER JOIN blog_post_products bpp ON p.id = bpp.product_id
      WHERE bpp.post_id = ? AND p.status = 'active'
      ORDER BY bpp.sort_order ASC
      LIMIT 6
    `, [post.id]);

    return {
      props: {
        post: JSON.parse(JSON.stringify(post)),
        category: category ? JSON.parse(JSON.stringify(category)) : null,
        tags: JSON.parse(JSON.stringify(tags)),
        relatedPosts: JSON.parse(JSON.stringify(relatedPosts)),
        relatedProducts: JSON.parse(JSON.stringify(relatedProducts))
      },
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error en getStaticProps del post:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    // Obtener algunos posts populares para pre-generar
    const posts = await query(`
      SELECT slug FROM blog_posts 
      WHERE status = 'published' AND featured = 1
      ORDER BY views_count DESC 
      LIMIT 10
    `);

    const paths = posts.map(post => ({
      params: { slug: post.slug }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}