// pages/productos.js - CON LOGS DE DIAGNÓSTICO
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductoPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    min_price: '',
    max_price: '',
    sort: 'created_at',
    order: 'DESC'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  });

  const router = useRouter();

  // 🔍 DIAGNÓSTICO - LOG DE PRODUCTOS CARGADOS
  useEffect(() => {
    if (products.length > 0) {
      console.log('🔍 Total productos cargados:', products.length);
      console.log('🔍 Primer producto:', products[0]);
      console.log('🔍 Todos los productos:', products);
    }
  }, [products]);

  // Cargar productos
  const loadProducts = async (newFilters = {}, page = 1) => {
    console.log('🔍 Cargando productos...');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
		 prioritize_stock: 'true',
        ...filters,
        ...newFilters
      });

      for (const [key, value] of params.entries()) {
        if (!value) params.delete(key);
      }

      console.log('🔍 URL de API:', `/api/products?${params}`);
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      console.log('🔍 Respuesta de API:', data);

      if (data.success) {
        console.log('🔍 Productos recibidos:', data.data);
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        console.error('❌ Error en respuesta API:', data.message);
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadProducts(updatedFilters, 1);
    if (window.innerWidth < 1024) {
      setShowFilters(false);
    }
  };

  const handlePageChange = (newPage) => {
    loadProducts(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      search: '',
      min_price: '',
      max_price: '',
      sort: 'created_at',
      order: 'DESC'
    };
    setFilters(clearedFilters);
    loadProducts(clearedFilters, 1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Skeleton loading component
  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );

  const CategoryList = ({ isMobile = false }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">Categorías</h3>
      </div>
      
      <div 
        onClick={() => handleFilterChange({ category: '' })}
        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
          !filters.category ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
      >
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-600 text-sm">🏠</span>
        </div>
        <span className="text-sm font-medium text-gray-700">Todas las categorías</span>
      </div>
      
      {[
        { slug: 'shabat', name: 'Shabat', icon: '🕯️', color: 'yellow' },
        { slug: 'torah-jumash-tanaj', name: 'Torah', icon: '📜', color: 'blue' },
        { slug: 'shofar', name: 'Shofar', icon: '📯', color: 'purple' },
        { slug: 'hanukah', name: 'Hanukah', icon: '🕎', color: 'orange' },
        { slug: 'menorah', name: 'Menorah', icon: '🕯️', color: 'green' },
        { slug: 'tehilim-salmos', name: 'Tehilim / Salmos', icon: '📖', color: 'amber' },
        { slug: 'mezuza', name: 'Mezuza', icon: '🚪', color: 'indigo' },
        { slug: 'talit-amp-tzittzit', name: 'Talit & TzitTzit', icon: '🎽', color: 'teal' },
        { slug: 'cabala', name: 'Cabala', icon: '🔯', color: 'pink' },
        { slug: 'breslov', name: 'Breslov', icon: '📚', color: 'gray' },
        { slug: 'infantil', name: 'Infantil', icon: '🧸', color: 'red' },
        { slug: 'jaguim', name: 'Jaguim', icon: '🎉', color: 'green' },
        { slug: 'jasidismo', name: 'Jasidismo', icon: '✡️', color: 'purple' },
        { slug: 'joyeria', name: 'Joyería', icon: '💍', color: 'yellow' },
        { slug: 'judaica', name: 'Judaica', icon: '🔯', color: 'blue' },
        { slug: 'kashrut', name: 'Kashrut', icon: '✅', color: 'green' },
        { slug: 'mujer', name: 'Mujer', icon: '👩', color: 'pink' },
        { slug: 'vinos', name: 'Vinos', icon: '🍷', color: 'purple' },
        { slug: 'pesaj', name: 'Pesaj', icon: '🍞', color: 'orange' },
        { slug: 'kosher', name: 'Kosher', icon: '🥘', color: 'green' }
      ].map((category) => (
        <div 
          key={category.slug}
          onClick={() => handleFilterChange({ category: category.slug })}
          className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
            filters.category === category.slug ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
        >
          <div className={`w-8 h-8 bg-${category.color}-100 rounded-lg flex items-center justify-center`}>
            <span className={`text-${category.color}-600 text-sm`}>{category.icon}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{category.name}</span>
        </div>
      ))}
    </div>
  );

  // 🔍 LOG FINAL ANTES DEL RENDER
  console.log('🔍 Renderizando página productos con:', products.length, 'productos');

  return (
    <Layout>
      <Head>
        <title>Tienda - Judaica Breslov Colombia</title>
        <meta 
          name="description" 
          content="Explora nuestra amplia selección de productos judaicos: libros, mezuzot, tefilín, talitot y más. Envío gratis a toda Colombia." 
        />
        <meta name="keywords" content="productos judaicos, libros breslov, mezuza, tefilin, talit, colombia" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="h-4"></div>
        
        <div className="bg-yellow-500 text-white py-3">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Inicio / Tienda</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <div className="text-center">
                    <div className="text-sm font-bold">ENVIOS GRATIS</div>
                    <div className="text-xs">En pedidos +200.000 solo transfer</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center">
                    <div className="text-sm font-bold">¿TE AYUDAMOS?</div>
                    <div className="text-xs">Escribenos</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div className="text-center">
                    <div className="text-sm font-bold">Pago Seguro</div>
                    <div className="text-xs">Varios metodos pago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            <div className="lg:hidden mb-4">
              <button
                onClick={toggleFilters}
                className="w-full flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">Filtros y Categorías</span>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className={`lg:w-64 lg:flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                
                <div className="p-4 border-b border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar productos
                      </label>
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                        placeholder="Buscar productos..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rango de Precio
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={filters.min_price}
                          onChange={(e) => handleFilterChange({ min_price: e.target.value })}
                          placeholder="Mín"
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={filters.max_price}
                          onChange={(e) => handleFilterChange({ max_price: e.target.value })}
                          placeholder="Máx"
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {(filters.search || filters.min_price || filters.max_price || filters.category) && (
                      <button
                        onClick={clearFilters}
                        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <CategoryList />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <select 
                      value={filters.category}
                      onChange={(e) => handleFilterChange({ category: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Categorías</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>Etiquetas</option>
                    </select>

                    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>En Inventario</option>
                    </select>

                    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>Descuento</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      value={`${filters.sort}-${filters.order}`}
                      onChange={(e) => {
                        const [sort, order] = e.target.value.split('-');
                        handleFilterChange({ sort, order });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="created_at-DESC">Ordenar por disponibilidad y fecha</option>
                      <option value="name-ASC">Nombre A-Z</option>
                      <option value="name-DESC">Nombre Z-A</option>
                      <option value="price-ASC">Precio menor a mayor</option>
                      <option value="price-DESC">Precio mayor a menor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Mostrando {Math.min(pagination.limit, products.length)} de {pagination.total} resultados
                </p>
              </div>

              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* 🔍 GRID DE PRODUCTOS CON LOGS */}
              {!loading && products.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
                  {products.map((product, index) => {
                    // 🔍 LOG POR CADA PRODUCTO RENDERIZADO
                    console.log(`🔍 Renderizando producto ${index}:`, product.name, product);
                    
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ProductCard 
                          product={product}
                          viewMode="grid"
                          onView={() => {
                            if (typeof window !== 'undefined' && window.analytics) {
                              window.analytics.trackViewItem({
                                id: product.id,
                                name: product.name,
                                category: product.categories,
                                price: product.sale_price || product.price
                              });
                            }
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && products.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m0 0V3.5A1.5 1.5 0 017.5 2h9A1.5 1.5 0 0118 3.5V5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Intenta ajustar los filtros o realizar una nueva búsqueda.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-yellow-500 text-white py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Ver Todos los Productos
                  </button>
                </div>
              )}

              {!loading && products.length > 0 && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-1 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded transition-colors ${
                          page === pagination.page
                            ? 'bg-yellow-500 text-white'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}