// pages/admin/productos/index.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProductDashboard from '../../../components/admin/ProductDashboard';

const ProductsAdmin = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: router.query.search || '',
    category: router.query.category || '',
    status: router.query.status || '',
    stock_status: router.query.stock_status || '',
    featured: router.query.featured || '',
    price_min: router.query.price_min || '',
    price_max: router.query.price_max || '',
    has_images: router.query.has_images || '',
    sort: router.query.sort || 'created_at',
    order: router.query.order || 'DESC',
    page: parseInt(router.query.page) || 1,
    limit: parseInt(router.query.limit) || 20
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
    lowStock: 0,
    outOfStock: 0,
    noImages: 0,
    featured: 0
  });
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Debounce para búsqueda
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStats();
  }, [filters]);

  // Guardar preferencia de vista en localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin-products-view');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-products-view', viewMode);
  }, [viewMode]);

  // Debounce para búsqueda
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    setSearchDebounce(
      setTimeout(() => {
        if (filters.search !== router.query.search) {
          handleFilterChange('search', filters.search, false);
        }
      }, 500)
    );

    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [filters.search]);

  const fetchProducts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        include_images: 'true',
        include_categories: 'true'
      }).toString();

      const response = await fetch(`/api/admin/products?${queryParams}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Error cargando productos: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error de conexión al cargar productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?include_count=true', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/products/stats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleFilterChange = useCallback((key, value, updateUrl = true) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    if (updateUrl) {
      // Actualizar URL sin recargar
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v && v !== '') queryParams.set(k, v);
      });
      const newUrl = `/admin/productos?${queryParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [filters]);

  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    const confirmMessages = {
      'delete': `¿Eliminar ${selectedProducts.length} productos seleccionados? Esta acción no se puede deshacer.`,
      'activate': `¿Activar ${selectedProducts.length} productos seleccionados?`,
      'deactivate': `¿Desactivar ${selectedProducts.length} productos seleccionados?`,
      'feature': `¿Destacar ${selectedProducts.length} productos seleccionados?`,
      'unfeature': `¿Quitar de destacados ${selectedProducts.length} productos seleccionados?`,
      'draft': `¿Mover a borrador ${selectedProducts.length} productos seleccionados?`,
      'duplicate': `¿Duplicar ${selectedProducts.length} productos seleccionados?`,
      'export': `¿Exportar ${selectedProducts.length} productos seleccionados?`
    };

    if (action !== 'export' && !confirm(confirmMessages[action])) return;

    setBulkActionLoading(true);
    try {
      if (action === 'export') {
        // Exportar productos seleccionados
        const exportData = products
          .filter(p => selectedProducts.includes(p.id))
          .map(p => ({
            ID: p.id,
            Nombre: p.name,
            SKU: p.sku || '',
            Precio: p.price,
            'Precio Oferta': p.sale_price || '',
            Stock: p.stock_quantity || 0,
            Estado: p.status,
            Destacado: p.featured ? 'Sí' : 'No',
            Categorías: p.categories?.map(c => c.name).join(', ') || ''
          }));

        downloadCSV(exportData, `productos-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Productos exportados exitosamente');
        setSelectedProducts([]);
        return;
      }

      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          product_ids: selectedProducts
        })
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          fetchProducts(false),
          fetchStats()
        ]);
        setSelectedProducts([]);
        
        const actionLabels = {
          'delete': 'eliminados',
          'activate': 'activados',
          'deactivate': 'desactivados',
          'feature': 'destacados',
          'unfeature': 'quitados de destacados',
          'draft': 'movidos a borrador',
          'duplicate': 'duplicados'
        };
        
        toast.success(`${selectedProducts.length} productos ${actionLabels[action]} exitosamente`);
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error en acción masiva:', error);
      toast.error('Error realizando la acción');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!confirm(`¿Eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          fetchProducts(false),
          fetchStats()
        ]);
        toast.success('Producto eliminado exitosamente');
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error eliminando el producto');
    }
  };

  const handleQuickStatusChange = async (productId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          fetchProducts(false),
          fetchStats()
        ]);
        toast.success('Estado actualizado');
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error actualizando estado');
    }
  };

  const handleQuickFeatureToggle = async (productId, currentFeatured) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: !currentFeatured })
      });

      const data = await response.json();
      if (data.success) {
        await fetchProducts(false);
        toast.success(currentFeatured ? 'Producto quitado de destacados' : 'Producto destacado');
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error actualizando destacado:', error);
      toast.error('Error actualizando producto');
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      status: '',
      stock_status: '',
      featured: '',
      price_min: '',
      price_max: '',
      has_images: '',
      sort: 'created_at',
      order: 'DESC',
      page: 1,
      limit: 20
    };
    setFilters(clearedFilters);
    router.push('/admin/productos', undefined, { shallow: true });
  };

  const downloadCSV = (data, filename) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'draft': 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'draft': 'Borrador'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStockBadge = (product) => {
    if (!product.manage_stock) {
      return <span className="text-xs text-gray-500">Sin gestión</span>;
    }

    if (product.stock_status === 'out_of_stock' || product.stock_quantity === 0) {
      return <span className="text-xs text-red-600 font-medium">❌ Agotado</span>;
    }

    if (product.stock_quantity <= 5) {
      return <span className="text-xs text-yellow-600 font-medium">⚠️ Stock bajo ({product.stock_quantity})</span>;
    }

    return <span className="text-xs text-green-600 font-medium">✅ En stock ({product.stock_quantity})</span>;
  };

  // Memoized filters summary
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      value && value !== '' && !['page', 'limit', 'sort', 'order'].includes(key)
    ).length;
  }, [filters]);

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200">
      <div className="relative">
        <input
          type="checkbox"
          checked={selectedProducts.includes(product.id)}
          onChange={() => handleSelectProduct(product.id)}
          className="absolute top-2 left-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded z-10"
        />
        
        <div className="aspect-square relative mb-3 bg-gray-100 rounded-lg overflow-hidden">
          {product.featured_image ? (
            <Image
              src={product.featured_image}
              alt={product.image_alt || product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-xs">Sin imagen</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col space-y-1">
          {product.featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              ⭐
            </span>
          )}
          {product.sale_price && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              OFERTA
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {product.sale_price ? (
                <div className="space-y-1">
                  <div className="text-sm font-bold text-red-600">
                    {formatCurrency(product.sale_price)}
                  </div>
                  <div className="text-xs text-gray-500 line-through">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                  </div>
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleQuickFeatureToggle(product.id, product.featured)}
              className={`p-1 rounded ${
                product.featured 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={product.featured ? 'Quitar de destacados' : 'Destacar producto'}
            >
              ⭐
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div>{getStockBadge(product)}</div>
            <span className="text-gray-500 truncate max-w-20">
              {product.sku || 'Sin SKU'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <select
              value={product.status}
              onChange={(e) => handleQuickStatusChange(product.id, e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1 mr-2"
            >
              <option value="active">🟢 Activo</option>
              <option value="inactive">⚫ Inactivo</option>
              <option value="draft">🟡 Borrador</option>
            </select>
            
            <div className="text-xs text-gray-500">
              ID: {product.id}
            </div>
          </div>
          
          <div className="flex space-x-1 pt-2">
            <Link
              href={`/admin/productos/${product.id}`}
              className="flex-1 bg-primary-600 text-white text-xs py-2 px-3 rounded text-center hover:bg-primary-700 transition-colors"
            >
              ✏️ Editar
            </Link>
            <Link
              href={`/productos/${product.slug}`}
              target="_blank"
              className="flex-1 bg-gray-500 text-white text-xs py-2 px-3 rounded text-center hover:bg-gray-600 transition-colors"
            >
              👁️ Ver
            </Link>
            <button
              onClick={() => handleDeleteProduct(product.id, product.name)}
              className="bg-red-500 text-white text-xs py-2 px-3 rounded hover:bg-red-600 transition-colors"
              title="Eliminar producto"
            >
              🗑️
            </button>
          </div>
          
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
              {product.categories.slice(0, 2).map((cat) => (
                <span key={cat.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {cat.name}
                </span>
              ))}
              {product.categories.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{product.categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Gestión de Productos">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <div className="text-sm text-gray-500">Inactivos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          <div className="text-sm text-gray-500">Borradores</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
          <div className="text-sm text-gray-500">Stock bajo</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-700">{stats.outOfStock}</div>
          <div className="text-sm text-gray-500">Agotados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
          <div className="text-sm text-gray-500">Destacados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{stats.noImages}</div>
          <div className="text-sm text-gray-500">Sin imagen</div>
        </div>
      </div>

      {/* Header con filtros */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900">
                Productos ({pagination.total || 0})
              </h2>
              
              {refreshing && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Actualizando...
                </div>
              )}
              
              {activeFiltersCount > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botón refrescar */}
              <button
                onClick={() => fetchProducts()}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refrescar lista"
              >
                <div className={refreshing ? 'animate-spin' : ''}>🔄</div>
              </button>
              
              {/* Botón filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-md text-sm ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔍 Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              
              {/* Vista toggles */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📋 Tabla
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔲 Cuadrícula
                </button>
              </div>
              
              <Link 
                href="/admin/productos/nuevo"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                ➕ Nuevo Producto
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre, SKU, descripción..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name} ({category.product_count || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">🟢 Activos</option>
                    <option value="inactive">⚫ Inactivos</option>
                    <option value="draft">🟡 Borradores</option>
                  </select>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Stock
                  </label>
                  <select
                    value={filters.stock_status}
                    onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todo el stock</option>
                    <option value="in_stock">✅ En stock</option>
                    <option value="out_of_stock">❌ Agotado</option>
                    <option value="low_stock">⚠️ Stock bajo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Destacados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destacados
                  </label>
                  <select
                    value={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="true">⭐ Solo destacados</option>
                    <option value="false">📦 Solo normales</option>
                  </select>
                </div>

                {/* Precio mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.price_min}
                    onChange={(e) => handleFilterChange('price_min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Precio máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio máximo
                  </label>
                  <input
                    type="number"
                    placeholder="999999999"
                    value={filters.price_max}
                    onChange={(e) => handleFilterChange('price_max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Imágenes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes
                  </label>
                  <select
                    value={filters.has_images}
                    onChange={(e) => handleFilterChange('has_images', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="true">🖼️ Con imágenes</option>
                    <option value="false">📷 Sin imágenes</option>
                  </select>
                </div>

                {/* Ordenar por */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={`${filters.sort}-${filters.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      handleFilterChange('sort', sort);
                      handleFilterChange('order', order);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="created_at-DESC">📅 Más recientes</option>
                    <option value="created_at-ASC">📅 Más antiguos</option>
                    <option value="name-ASC">🔤 Nombre A-Z</option>
                    <option value="name-DESC">🔤 Nombre Z-A</option>
                    <option value="price-ASC">💰 Precio menor</option>
                    <option value="price-DESC">💰 Precio mayor</option>
                    <option value="stock_quantity-ASC">📦 Menor stock</option>
                    <option value="stock_quantity-DESC">📦 Mayor stock</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Productos por página
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones masivas */}
        {selectedProducts.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  🟢 Activar
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  ⚫ Desactivar
                </button>
                <button
                  onClick={() => handleBulkAction('draft')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  🟡 Borrador
                </button>
                <button
                  onClick={() => handleBulkAction('feature')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  ⭐ Destacar
                </button>
                <button
                  onClick={() => handleBulkAction('unfeature')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  ⭐ Quitar destacado
                </button>
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  📄 Duplicar
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  📊 Exportar CSV
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  🗑️ Eliminar
                </button>
                
                {bulkActionLoading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Procesando...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFiltersCount > 0 ? 'No se encontraron productos' : 'No tienes productos aún'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeFiltersCount > 0 
                ? 'Intenta ajustar los filtros para encontrar productos.'
                : 'Comienza creando tu primer producto para la tienda.'
              }
            </p>
            <div className="flex justify-center space-x-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
              <Link 
                href="/admin/productos/nuevo"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                ➕ Crear primer producto
              </Link>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              // Vista de cuadrícula
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ) : (
              // Vista de tabla
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorías
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-12 w-12 relative">
                              {product.featured_image ? (
                                <Image
                                  src={product.featured_image}
                                  alt={product.image_alt || product.name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-gray-400 text-lg">📦</span>
                                </div>
                              )}
                              {product.featured && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  ⭐
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                /{product.slug}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {product.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.sku || (
                              <span className="text-gray-400 italic">Sin SKU</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {product.sale_price ? (
                              <div className="space-y-1">
                                <div className="font-bold text-red-600">
                                  {formatCurrency(product.sale_price)}
                                </div>
                                <div className="text-gray-400 line-through text-xs">
                                  {formatCurrency(product.price)}
                                </div>
                                <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded inline-block">
                                  -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                                </div>
                              </div>
                            ) : (
                              <div className="font-medium text-gray-900">
                                {formatCurrency(product.price)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStockBadge(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={product.status}
                            onChange={(e) => handleQuickStatusChange(product.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="active">🟢 Activo</option>
                            <option value="inactive">⚫ Inactivo</option>
                            <option value="draft">🟡 Borrador</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-32">
                            {product.categories && product.categories.length > 0 ? (
                              <div className="space-y-1">
                                {product.categories.slice(0, 2).map((cat, index) => (
                                  <span key={cat.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded block truncate">
                                    {cat.name}
                                  </span>
                                ))}
                                {product.categories.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{product.categories.length - 2} más
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Sin categoría</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuickFeatureToggle(product.id, product.featured)}
                              className={`p-1 rounded transition-colors ${
                                product.featured 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={product.featured ? 'Quitar de destacados' : 'Destacar producto'}
                            >
                              ⭐
                            </button>
                            
                            <Link
                              href={`/admin/productos/${product.id}`}
                              className="text-primary-600 hover:text-primary-900 transition-colors"
                            >
                              ✏️
                            </Link>
                            
                            <Link
                              href={`/productos/${product.slug}`}
                              target="_blank"
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              👁️
                            </Link>
                            
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar producto"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                    <span className="font-medium">{pagination.total}</span> productos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let page;
                        if (pagination.totalPages <= 5) {
                          page = i + 1;
                        } else if (pagination.page <= 3) {
                          page = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          page = pagination.totalPages - 4 + i;
                        } else {
                          page = pagination.page - 2 + i;
                        }
                        
                        const isActive = page === pagination.page;
                        return (
                          <button
                            key={page}
                            onClick={() => handleFilterChange('page', page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer con información adicional */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Gestión de productos · {products.length} productos cargados
          {selectedProducts.length > 0 && ` · ${selectedProducts.length} seleccionados`}
        </p>
      </div>
    </AdminLayout>
  );
};

export default ProductsAdmin;