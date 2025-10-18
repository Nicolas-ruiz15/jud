// pages/blog/index.js - PÁGINA PRINCIPAL DEL BLOG SEO OPTIMIZADA
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { query } from '../../lib/database';
import { 
  generateCanonicalUrl, 
  generateBreadcrumbs,
  cleanMetaContent 
} from '../../lib/seoUtils';

export default function BlogIndex({ 
  posts, 
  featuredPosts, 
  categories, 
  pagination, 
  selectedCategory 
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(posts);

  // Filtrar posts en tiempo real
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  const handleCategoryFilter = (categorySlug) => {
    if (categorySlug) {
      router.push(`/blog?categoria=${categorySlug}`);
    } else {
      router.push('/blog');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blog?buscar=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // SEO Data
  const pageTitle = selectedCategory 
    ? `${selectedCategory.name} - Blog Judaica Breslov Colombia`
    : 'Blog Judaica Breslov Colombia - Educación y Tradiciones Judías';
    
  const pageDescription = selectedCategory
    ? `Artículos sobre ${selectedCategory.name.toLowerCase()}. ${selectedCategory.description}`
    : 'Blog educativo sobre judaísmo, tradiciones judías, fiestas religiosas y productos judaicos. Guías completas para la comunidad judía en Colombia.';

  const canonicalUrl = selectedCategory
    ? `https://www.judaicabreslovcolombia.com/blog?categoria=${selectedCategory.slug}`
    : 'https://www.judaicabreslovcolombia.com/blog';

  // Breadcrumbs
  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    { name: 'Blog', url: '/blog' }
  ];
  
  if (selectedCategory) {
    breadcrumbItems.push({ 
      name: selectedCategory.name, 
      url: `/blog?categoria=${selectedCategory.slug}` 
    });
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout
      title={pageTitle}
      description={cleanMetaContent(pageDescription)}
      canonical={canonicalUrl}
    >
      <Head>
        {/* Meta tags adicionales */}
        <meta name="keywords" content="blog judaico, educación judía, tradiciones judías, fiestas judías, judaísmo colombia, breslov" />
        <meta name="author" content="Judaica Breslov Colombia" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={cleanMetaContent(pageDescription)} />
        <meta property="og:type" content="blog" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://www.judaicabreslovcolombia.com/images/blog-og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={cleanMetaContent(pageDescription)} />
        
        {/* Pagination meta */}
        {pagination.page > 1 && (
          <link rel="prev" href={pagination.page === 2 ? '/blog' : `/blog?pagina=${pagination.page - 1}`} />
        )}
        {pagination.page < pagination.totalPages && (
          <link rel="next" href={`/blog?pagina=${pagination.page + 1}`} />
        )}
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {selectedCategory ? selectedCategory.name : 'Blog Judaica Breslov'}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {selectedCategory 
                  ? selectedCategory.description
                  : 'Educación, tradiciones y sabiduría judía para toda la familia'
                }
              </p>
              
              {/* Buscador */}
              <form onSubmit={handleSearch} className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en el blog..."
                    className="w-full px-4 py-3 pl-12 text-gray-900 bg-white rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
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
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                
                {/* Categorías */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Categorías</h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCategoryFilter(null)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        !selectedCategory 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Todas las categorías
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilter(category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                          selectedCategory?.id === category.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category.icon && (
                          <span className="mr-2" style={{ color: category.color }}>
                            📚
                          </span>
                        )}
                        {category.name}
                        <span className="ml-auto text-sm text-gray-500">
                          ({category.post_count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posts destacados */}
                {featuredPosts.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Posts Destacados</h2>
                    <div className="space-y-4">
                      {featuredPosts.slice(0, 3).map(post => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            {post.featured_image && (
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                                <Image
                                  src={post.featured_image}
                                  alt={post.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(post.published_at)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-2">Newsletter Judaico</h2>
                  <p className="text-blue-100 mb-4 text-sm">
                    Recibe artículos y contenido especial directo en tu email
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
              </div>
            </div>

            {/* Posts Grid */}
            <div className="lg:col-span-3">
              {/* Filtros y resultados */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory ? selectedCategory.name : 'Últimos Artículos'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {searchTerm ? 
                      `${filteredPosts.length} resultados para "${searchTerm}"` :
                      `${pagination.total} artículos disponibles`
                    }
                  </p>
                </div>
              </div>

              {/* Posts */}
              {filteredPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {filteredPosts.map((post, index) => (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        {post.featured_image && (
                          <Link href={`/blog/${post.slug}`}>
                            <div className="relative h-48 overflow-hidden">
                              <Image
                                src={post.featured_image}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {post.featured && (
                                <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                                  Destacado
                                </div>
                              )}
                            </div>
                          </Link>
                        )}
                        
                        <div className="p-6">
                          {/* Categoría y fecha */}
                          <div className="flex items-center justify-between mb-3">
                            <Link
                              href={`/blog?categoria=${post.category_slug}`}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${post.category_color}20`,
                                color: post.category_color 
                              }}
                            >
                              {post.category_name}
                            </Link>
                            <time className="text-sm text-gray-500">
                              {formatDate(post.published_at)}
                            </time>
                          </div>

                          {/* Título */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            <Link href={`/blog/${post.slug}`}>
                              {post.title}
                            </Link>
                          </h3>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {post.reading_time} min
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {post.views_count}
                              </span>
                            </div>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Leer más →
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  {/* Paginación */}
                  {pagination.totalPages > 1 && !searchTerm && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                      {pagination.page > 1 && (
                        <Link
                          href={pagination.page === 2 ? '/blog' : `/blog?pagina=${pagination.page - 1}`}
                          className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        >
                          Anterior
                        </Link>
                      )}

                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <Link
                            key={pageNumber}
                            href={pageNumber === 1 ? '/blog' : `/blog?pagina=${pageNumber}`}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              pagination.page === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </Link>
                        );
                      })}

                      {pagination.page < pagination.totalPages && (
                        <Link
                          href={`/blog?pagina=${pagination.page + 1}`}
                          className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        >
                          Siguiente
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Sin resultados */
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay artículos disponibles'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? `No encontramos artículos que coincidan con "${searchTerm}". Intenta con otros términos.`
                      : 'Actualmente no hay artículos en esta categoría. ¡Vuelve pronto!'
                    }
                  </p>
                  <div className="space-y-2 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          router.push('/blog');
                        }}
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                      >
                        Ver todos los artículos
                      </button>
                    )}
                    <Link
                      href="/contacto"
                      className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition-colors"
                    >
                      Sugerir tema
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-900 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                ¿Buscas productos judaicos auténticos?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Explora nuestra tienda con más de 500 productos judaicos para tu hogar y práctica religiosa
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/productos"
                  className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Ver Productos
                </Link>
                <Link
                  href="/categorias"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
                >
                  Explorar Categorías
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
            {
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "Blog Judaica Breslov Colombia",
              "description": pageDescription,
              "url": canonicalUrl,
              "publisher": {
                "@type": "Organization",
                "name": "Judaica Breslov Colombia",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.judaicabreslovcolombia.com/logo-judaica-breslov.png"
                }
              },
              "blogPost": posts.slice(0, 10).map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "image": post.featured_image,
                "datePublished": post.published_at,
                "dateModified": post.updated_at,
                "author": {
                  "@type": "Person",
                  "name": post.author_name || "Equipo Judaica Breslov"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Judaica Breslov Colombia"
                },
                "url": `https://www.judaicabreslovcolombia.com/blog/${post.slug}`
              }))
            },
            {
              "@context": "https://schema.org",
              ...generateBreadcrumbs(breadcrumbItems)
            }
          ])
        }}
      />
    </Layout>
  );
}

export async function getServerSideProps({ query: queryParams }) {
  try {
    const page = parseInt(queryParams.pagina) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;
    const categorySlug = queryParams.categoria;
    const searchTerm = queryParams.buscar;

    // Construir query base
    let whereConditions = ['bp.status = "published"', 'bp.published_at <= NOW()'];
    let queryValues = [];

    // Filtro por categoría
    if (categorySlug) {
      whereConditions.push('bc.slug = ?');
      queryValues.push(categorySlug);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      whereConditions.push('(bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)');
      const searchPattern = `%${searchTerm}%`;
      queryValues.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener posts
    const postsQuery = `
      SELECT 
        bp.*,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.color as category_color,
        bc.icon as category_icon
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
      ORDER BY bp.featured DESC, bp.published_at DESC
      LIMIT ? OFFSET ?
    `;

    const posts = await query(postsQuery, [...queryValues, limit, offset]);

    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE ${whereClause}
    `;

    const [{ total }] = await query(countQuery, queryValues);

    // Obtener posts destacados
    const featuredPosts = await query(`
      SELECT bp.*, bc.name as category_name, bc.slug as category_slug
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.status = 'published' AND bp.featured = 1 AND bp.published_at <= NOW()
      ORDER BY bp.published_at DESC
      LIMIT 6
    `);

    // Obtener categorías con conteo
    const categories = await query(`
      SELECT 
        bc.*,
        COUNT(bp.id) as post_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.status = 'published'
      WHERE bc.status = 'active'
      GROUP BY bc.id
      ORDER BY bc.sort_order ASC, bc.name ASC
    `);

    // Obtener categoría seleccionada
    let selectedCategory = null;
    if (categorySlug) {
      const categoryResult = await query(
        'SELECT * FROM blog_categories WHERE slug = ? AND status = "active"',
        [categorySlug]
      );
      selectedCategory = categoryResult[0] || null;
    }

    // Paginación
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return {
      props: {
        posts: JSON.parse(JSON.stringify(posts)),
        featuredPosts: JSON.parse(JSON.stringify(featuredPosts)),
        categories: JSON.parse(JSON.stringify(categories)),
        pagination,
        selectedCategory: selectedCategory ? JSON.parse(JSON.stringify(selectedCategory)) : null
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps del blog:', error);
    return {
      props: {
        posts: [],
        featuredPosts: [],
        categories: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        selectedCategory: null
      }
    };
  }
}