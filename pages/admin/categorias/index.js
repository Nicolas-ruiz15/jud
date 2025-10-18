// pages/admin/categorias/index.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const CategoriesAdmin = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'hierarchy'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: router.query.search || '',
    parent_id: router.query.parent_id || '',
    status: router.query.status || '',
    featured: router.query.featured || '',
    sort: router.query.sort || 'sort_order',
    order: router.query.order || 'ASC',
    page: parseInt(router.query.page) || 1,
    limit: parseInt(router.query.limit) || 20
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    parent: 0,
    children: 0,
    featured: 0,
    noImages: 0
  });
  const [hierarchy, setHierarchy] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (viewMode === 'hierarchy') {
      fetchHierarchy();
    } else {
      fetchCategories();
    }
    fetchStats();
  }, [filters, viewMode]);

  // Guardar preferencia de vista
  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin-categories-view');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-categories-view', viewMode);
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

  const fetchCategories = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        include_children: 'false'
      }).toString();

      const response = await fetch(`/api/admin/categories?${queryParams}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Error cargando categorías: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error de conexión al cargar categorías');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories/hierarchy?include_products=false&max_depth=3', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setHierarchy(data.data.hierarchy);
      } else {
        toast.error('Error cargando jerarquía: ' + data.message);
      }
    } catch (error) {
      console.error('Error cargando jerarquía:', error);
      toast.error('Error de conexión al cargar jerarquía');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/categories/stats', {
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
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v && v !== '') queryParams.set(k, v);
      });
      const newUrl = `/admin/categorias?${queryParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [filters]);

  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedCategories.length === 0) {
      toast.error('Selecciona al menos una categoría');
      return;
    }

    const confirmMessages = {
      'delete': `¿Eliminar ${selectedCategories.length} categoría(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      'activate': `¿Activar ${selectedCategories.length} categoría(s) seleccionada(s)?`,
      'deactivate': `¿Desactivar ${selectedCategories.length} categoría(s) seleccionada(s)?`,
      'feature': `¿Destacar ${selectedCategories.length} categoría(s) seleccionada(s)?`,
      'unfeature': `¿Quitar de destacadas ${selectedCategories.length} categoría(s) seleccionada(s)?`,
      'export': `¿Exportar ${selectedCategories.length} categoría(s) seleccionada(s)?`
    };

    if (action !== 'export' && !confirm(confirmMessages[action])) return;

    setBulkActionLoading(true);
    try {
      if (action === 'export') {
        // Exportar categorías seleccionadas
        const exportData = categories
          .filter(c => selectedCategories.includes(c.id))
          .map(c => ({
            ID: c.id,
            Nombre: c.name,
            Slug: c.slug,
            Descripción: c.description || '',
            Estado: c.status,
            Destacada: c.featured ? 'Sí' : 'No',
            'Total Productos': c.product_count || 0,
            'Categoría Padre': c.parent_name || ''
          }));

        downloadCSV(exportData, `categorias-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Categorías exportadas exitosamente');
        setSelectedCategories([]);
        return;
      }

      const response = await fetch('/api/admin/categories/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          category_ids: selectedCategories
        })
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          viewMode === 'hierarchy' ? fetchHierarchy() : fetchCategories(false),
          fetchStats()
        ]);
        setSelectedCategories([]);
        
        const actionLabels = {
          'delete': 'eliminadas',
          'activate': 'activadas',
          'deactivate': 'desactivadas',
          'feature': 'destacadas',
          'unfeature': 'quitadas de destacadas'
        };
        
        toast.success(`${selectedCategories.length} categoría(s) ${actionLabels[action]} exitosamente`);
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

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`¿Eliminar la categoría "${categoryName}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          viewMode === 'hierarchy' ? fetchHierarchy() : fetchCategories(false),
          fetchStats()
        ]);
        toast.success('Categoría eliminada exitosamente');
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      toast.error('Error eliminando la categoría');
    }
  };

  const handleQuickStatusChange = async (categoryId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        await Promise.all([
          viewMode === 'hierarchy' ? fetchHierarchy() : fetchCategories(false),
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

  const handleQuickFeatureToggle = async (categoryId, currentFeatured) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: !currentFeatured })
      });

      const data = await response.json();
      if (data.success) {
        await fetchCategories(false);
        toast.success(currentFeatured ? 'Categoría quitada de destacadas' : 'Categoría destacada');
      } else {
        toast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error actualizando destacado:', error);
      toast.error('Error actualizando categoría');
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      parent_id: '',
      status: '',
      featured: '',
      sort: 'sort_order',
      order: 'ASC',
      page: 1,
      limit: 20
    };
    setFilters(clearedFilters);
    router.push('/admin/categorias', undefined, { shallow: true });
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

  const getStatusBadge = (status) => {
    const styles = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      'active': 'Activa',
      'inactive': 'Inactiva'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Componente para mostrar jerarquía
  const HierarchyView = ({ categories, level = 0 }) => (
    <div className={`${level > 0 ? 'ml-6' : ''}`}>
      {categories.map((category) => (
        <div key={category.id} className="mb-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleSelectCategory(category.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              
              <div className="flex items-center space-x-2">
                {category.image_url ? (
                  <div className="w-8 h-8 relative rounded overflow-hidden">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-sm">
                      {category.icon || '📁'}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {level > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Nivel {level + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    /{category.slug} • {category.product_count} productos
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {category.featured && (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  ⭐ Destacada
                </span>
              )}
              
              {getStatusBadge(category.status)}
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleQuickFeatureToggle(category.id, category.featured)}
                  className={`p-1 rounded transition-colors ${
                    category.featured 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                  title={category.featured ? 'Quitar de destacadas' : 'Destacar categoría'}
                >
                  ⭐
                </button>
                
                <Link
                  href={`/admin/categorias/${category.id}`}
                  className="text-primary-600 hover:text-primary-900 transition-colors p-1"
                >
                  ✏️
                </Link>
                
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-900 transition-colors p-1"
                  title="Eliminar categoría"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          {category.children && category.children.length > 0 && (
            <HierarchyView categories={category.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );

  // Memoized filters summary
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      value && value !== '' && !['page', 'limit', 'sort', 'order'].includes(key)
    ).length;
  }, [filters]);

  if (loading) {
    return (
      <AdminLayout title="Gestión de Categorías">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="ml-4 text-gray-600">Cargando categorías...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Categorías">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Activas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <div className="text-sm text-gray-500">Inactivas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.parent}</div>
          <div className="text-sm text-gray-500">Principales</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.children}</div>
          <div className="text-sm text-gray-500">Subcategorías</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
          <div className="text-sm text-gray-500">Destacadas</div>
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
                Categorías ({viewMode === 'hierarchy' ? hierarchy.length : pagination.total || 0})
              </h2>
              
              {refreshing && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Actualizando...
                </div>
              )}
              
              {activeFiltersCount > 0 && viewMode !== 'hierarchy' && (
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
                onClick={() => viewMode === 'hierarchy' ? fetchHierarchy() : fetchCategories()}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refrescar lista"
              >
                <div className={refreshing ? 'animate-spin' : ''}>🔄</div>
              </button>
              
              {/* Botón filtros (solo en modo tabla) */}
              {viewMode === 'table' && (
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
              )}
              
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
                  onClick={() => setViewMode('hierarchy')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'hierarchy' 
                      ? 'bg-white text-gray-900 shadow' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🌳 Jerarquía
                </button>
              </div>
              
              <Link 
                href="/admin/categorias/nueva"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                ➕ Nueva Categoría
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros avanzados (solo en modo tabla) */}
        {showFilters && viewMode === 'table' && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nombre, descripción..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Categoría padre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría padre
                </label>
                <select
                  value={filters.parent_id}
                  onChange={(e) => handleFilterChange('parent_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas las categorías</option>
                  <option value="null">Solo principales</option>
                  {categories.filter(c => !c.parent_id).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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
                  <option value="active">🟢 Activas</option>
                  <option value="inactive">⚫ Inactivas</option>
                </select>
              </div>

              {/* Destacadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destacadas
                </label>
                <select
                  value={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas</option>
                  <option value="true">⭐ Solo destacadas</option>
                  <option value="false">📁 Solo normales</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
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
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="sort_order-ASC">📊 Orden personalizado</option>
                  <option value="name-ASC">🔤 Nombre A-Z</option>
                  <option value="name-DESC">🔤 Nombre Z-A</option>
                  <option value="created_at-DESC">📅 Más recientes</option>
                  <option value="created_at-ASC">📅 Más antiguas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorías por página
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
        )}

        {/* Acciones masivas */}
        {selectedCategories.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <span className="text-sm font-medium text-blue-900">
                {selectedCategories.length} categoría{selectedCategories.length !== 1 ? 's' : ''} seleccionada{selectedCategories.length !== 1 ? 's' : ''}
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
                  onClick={() => handleBulkAction('feature')}
                  disabled={bulkActionLoading}
                  className="text-xs bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
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
        {viewMode === 'hierarchy' ? (
          // Vista de jerarquía
          <div className="p-6">
            {hierarchy.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🌳</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay categorías aún
                </h3>
                <p className="text-gray-500 mb-6">
                  Comienza creando tu primera categoría principal.
                </p>
                <Link 
                  href="/admin/categorias/nueva"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  ➕ Crear primera categoría
                </Link>
              </div>
            ) : (
              <HierarchyView categories={hierarchy} />
            )}
          </div>
        ) : (
          // Vista de tabla
          <>
            {categories.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📁</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeFiltersCount > 0 ? 'No se encontraron categorías' : 'No tienes categorías aún'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeFiltersCount > 0 
                    ? 'Intenta ajustar los filtros para encontrar categorías.'
                    : 'Comienza creando tu primera categoría para organizar productos.'
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
                    href="/admin/categorias/nueva"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    ➕ Crear primera categoría
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCategories.length === categories.length && categories.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jerarquía
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleSelectCategory(category.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              {category.image_url ? (
                                <Image
                                  src={category.image_url}
                                  alt={category.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-gray-400 text-lg">
                                    {category.icon || '📁'}
                                  </span>
                                </div>
                              )}
                              {category.featured && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  ⭐
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {category.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                /{category.slug}
                              </div>
                              {category.description && (
                                <div className="text-xs text-gray-400 truncate max-w-xs">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {category.parent_name ? (
                              <div>
                                <span className="text-gray-500">
                                  {category.parent_name} →
                                </span>
                                <br />
                                <span className="font-medium">{category.name}</span>
                              </div>
                            ) : (
                              <span className="font-medium text-blue-600">Principal</span>
                            )}
                          </div>
                          {category.children_count > 0 && (
                            <div className="text-xs text-gray-500">
                              {category.children_count} subcategoría{category.children_count !== 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {category.product_count || 0}
                          </div>
                          <div className="text-xs text-gray-500">productos</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={category.status}
                            onChange={(e) => handleQuickStatusChange(category.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="active">🟢 Activa</option>
                            <option value="inactive">⚫ Inactiva</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {category.sort_order || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuickFeatureToggle(category.id, category.featured)}
                              className={`p-1 rounded transition-colors ${
                                category.featured 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={category.featured ? 'Quitar de destacadas' : 'Destacar categoría'}
                            >
                              ⭐
                            </button>
                            
                            <Link
                              href={`/admin/categorias/${category.id}`}
                              className="text-primary-600 hover:text-primary-900 transition-colors"
                            >
                              ✏️
                            </Link>
                            
                            <Link
                              href={`/categorias/${category.slug}`}
                              target="_blank"
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              👁️
                            </Link>
                            
                            <button
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar categoría"
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
                    <span className="font-medium">{pagination.total}</span> categorías
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
          Gestión de categorías · {viewMode === 'hierarchy' ? hierarchy.length : categories.length} categorías cargadas
          {selectedCategories.length > 0 && ` · ${selectedCategories.length} seleccionadas`}
        </p>
      </div>
    </AdminLayout>
  );
};

export default CategoriesAdmin;