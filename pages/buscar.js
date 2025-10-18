// pages/buscar.js - Página de búsqueda completa
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

export default function BuscarPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'created_at',
    order: 'DESC'
  });

  const router = useRouter();
  const { q, category, min_price, max_price } = router.query;

  useEffect(() => {
    if (q) {
      setSearchQuery(q.toString());
      performSearch(q.toString());
    }
  }, [q, category, min_price, max_price]);

  const performSearch = async (query, page = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        order: filters.order
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newQuery = formData.get('search');
    
    if (newQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(newQuery.trim())}`);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (searchQuery) {
      performSearch(searchQuery, 1);
    }
  };

  const handlePageChange = (newPage) => {
    performSearch(searchQuery, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(price);

  return (
    <Layout
      title={`Búsqueda: ${searchQuery} | Judaica Breslov Colombia`}
      description={`Resultados de búsqueda para "${searchQuery}" en Judaica Breslov Colombia`}
    >
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header de búsqueda */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-blue-600">Inicio</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Búsqueda</span>
              {searchQuery && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">"{searchQuery}"</span>
                </>
              )}
            </nav>

            {/* Buscador principal */}
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {searchQuery ? `Resultados para "${searchQuery}"` : 'Buscar Productos'}
              </h1>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Buscar productos judaicos..."
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Buscar
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar de filtros */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Filtros</h3>
                
                {/* Filtro de precio */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Rango de Precio</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Máx"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Ordenamiento */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Ordenar por</h4>
                  <select
                    value={`${filters.sort}-${filters.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      handleFilterChange({ sort, order });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="created_at-DESC">Más recientes</option>
                    <option value="name-ASC">Nombre A-Z</option>
                    <option value="name-DESC">Nombre Z-A</option>
                    <option value="price-ASC">Precio menor a mayor</option>
                    <option value="price-DESC">Precio mayor a menor</option>
                  </select>
                </div>

                {/* Limpiar filtros */}
                <button
                  onClick={() => {
                    setFilters({
                      category: '',
                      minPrice: '',
                      maxPrice: '',
                      sort: 'created_at',
                      order: 'DESC'
                    });
                    if (searchQuery) performSearch(searchQuery, 1);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="lg:col-span-3">
              {searchQuery && (
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">
                      {loading ? 'Buscando...' : `${pagination.total || 0} resultados encontrados`}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Buscando productos...</span>
                  </div>
                </div>
              )}

              {/* Sin query */}
              {!searchQuery && !loading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Busca productos judaicos
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Usa el buscador para encontrar mezuzot, talitot, libros y más
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/producto" className="text-blue-600 hover:text-blue-700 font-medium">
                      Ver todos los productos
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/categorias" className="text-blue-600 hover:text-blue-700 font-medium">
                      Explorar categorías
                    </Link>
                  </div>
                </div>
              )}

              {/* Resultados */}
              {!loading && searchQuery && products.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            if (typeof window !== 'undefined' && window.gtag) {
                              window.gtag('event', 'search', {
                                search_term: searchQuery
                              });
                            }
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Paginación */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          pagination.page === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Anterior
                      </button>

                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => {
                        const pageNumber = pagination.page <= 3 
                          ? index + 1 
                          : pagination.page + index - 2;
                        
                        if (pageNumber > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              pagination.page === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
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

              {/* Sin resultados */}
              {!loading && searchQuery && products.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146.832-5.636 2.364M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No encontramos resultados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No hay productos que coincidan con "{searchQuery}". Intenta con otros términos.
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-center space-x-4">
                      <Link href="/producto" className="text-blue-600 hover:text-blue-700 font-medium">
                        Ver todos los productos
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href="/categorias" className="text-blue-600 hover:text-blue-700 font-medium">
                        Explorar categorías
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                      O contáctanos al WhatsApp para ayudarte a encontrar lo que buscas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}