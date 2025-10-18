import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import { motion } from 'framer-motion';

export default function CategoriaPage() {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');

  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      loadCategory();
      loadProducts();
    }
  }, [slug, sort, order]);

  const loadCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setCategory(data.data);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error cargando categoría:', error);
      router.push('/404');
    }
  };

  const loadProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: slug,
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort,
        order
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort, newOrder) => {
    setSort(newSort);
    setOrder(newOrder);
  };

  const handlePageChange = (newPage) => {
    loadProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!category && !loading) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>
          {category ? `${category.name} - Judaica Breslov Colombia` : 'Cargando...'}
        </title>
        {category && (
          <>
            <meta 
              name="description" 
              content={category.meta_description || category.description || `Productos de ${category.name} en Judaica Breslov Colombia`} 
            />
            <meta name="keywords" content={`${category.name}, productos judaicos, colombia, breslov`} />
            <link rel="canonical" href={`https://judaicabreslovcolombia.com/categorias/${category.slug}`} />
            
            {/* Open Graph */}
            <meta property="og:title" content={`${category.name} - Judaica Breslov Colombia`} />
            <meta property="og:description" content={category.meta_description || category.description} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={`https://judaicabreslovcolombia.com/categorias/${category.slug}`} />
            {category.image && <meta property="og:image" content={category.image} />}
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${category.name} - Judaica Breslov Colombia`} />
            <meta name="twitter:description" content={category.meta_description || category.description} />
            {category.image && <meta name="twitter:image" content={category.image} />}
          </>
        )}
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-blue-600 transition-colors">
                Inicio
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/categorias" className="text-gray-500 hover:text-blue-600 transition-colors">
                Categorías
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">
                {category ? category.name : 'Cargando...'}
              </span>
            </nav>
          </div>
        </div>

        {/* Header de categoría */}
        {category && (
          <div className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-8">
              <div className="flex items-center gap-6">
                {category.image && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h1>
                  {category.description && (
                    <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {pagination.total || 0} producto{pagination.total !== 1 ? 's' : ''} disponible{pagination.total !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Subcategorías */}
          {category && category.subcategories && category.subcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Subcategorías</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {category.subcategories.map(subcategory => (
                  <Link
                    key={subcategory.id}
                    href={`/categorias/${subcategory.slug}`}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-center border border-gray-100 hover:border-blue-200"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{subcategory.name}</h3>
                    <p className="text-sm text-gray-500">
                      {subcategory.product_count} producto{subcategory.product_count !== 1 ? 's' : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Controles de ordenamiento */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <p className="text-gray-600">
                {loading ? 'Cargando productos...' : `Mostrando ${products.length} de ${pagination.total} productos`}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Ordenar por:
              </label>
              <select
                value={`${sort}-${order}`}
                onChange={(e) => {
                  const [newSort, newOrder] = e.target.value.split('-');
                  handleSortChange(newSort, newOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="created_at-DESC">Más recientes</option>
                <option value="name-ASC">Nombre A-Z</option>
                <option value="name-DESC">Nombre Z-A</option>
                <option value="price-ASC">Precio menor a mayor</option>
                <option value="price-DESC">Precio mayor a menor</option>
                <option value="featured-DESC">Destacados primero</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Cargando productos...</span>
              </div>
            </div>
          )}

          {/* Grid de productos */}
          {!loading && products.length > 0 && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ProductCard 
                      product={product}
                      onView={() => {
                        if (typeof window !== 'undefined' && window.analytics) {
                          window.analytics.trackViewItem({
                            id: product.id,
                            name: product.name,
                            category: category.name,
                            price: product.sale_price || product.price
                          });
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  {/* Botón anterior */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, index) => {
                    let pageNumber;
                    if (pagination.totalPages <= 7) {
                      pageNumber = index + 1;
                    } else if (pagination.page <= 4) {
                      pageNumber = index + 1;
                    } else if (pagination.page >= pagination.totalPages - 3) {
                      pageNumber = pagination.totalPages - 6 + index;
                    } else {
                      pageNumber = pagination.page - 3 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pagination.page === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {/* Botón siguiente */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}

          {/* Sin productos */}
          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V9a2 2 0 01-2 2h-2m0 0v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m0 0h4" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay productos en esta categoría
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {category ? 
                  `Actualmente no tenemos productos disponibles en la categoría "${category.name}". Te invitamos a explorar otras categorías.` :
                  'No se encontraron productos que coincidan con los criterios seleccionados.'
                }
              </p>
              <div className="space-y-2 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/categorias"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Ver todas las categorías
                </Link>
                <Link
                  href="/productos"
                  className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition-colors"
                >
                  Ver todos los productos
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Schema.org structured data */}
        {category && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": category.name,
                "description": category.description || `Productos de ${category.name} en Judaica Breslov Colombia`,
                "url": `https://judaicabreslovcolombia.com/categorias/${category.slug}`,
                "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": pagination.total,
                  "itemListElement": products.map((product, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Product",
                      "name": product.name,
                      "description": product.short_description,
                      "image": product.featured_image,
                      "url": `https://judaicabreslovcolombia.com/productos/${product.slug}`,
                      "offers": {
                        "@type": "Offer",
                        "priceCurrency": "COP",
                        "price": product.sale_price || product.price,
                        "availability": product.stock_status === 'in_stock' ? 
                          "https://schema.org/InStock" : 
                          "https://schema.org/OutOfStock"
                      }
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
                      "item": "https://judaicabreslovcolombia.com"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Categorías",
                      "item": "https://judaicabreslovcolombia.com/categorias"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": category.name,
                      "item": `https://judaicabreslovcolombia.com/categorias/${category.slug}`
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