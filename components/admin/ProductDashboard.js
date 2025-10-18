// components/admin/ProductDashboard.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const ProductDashboard = () => {
  const [stats, setStats] = useState({
    overview: {
      total: 0,
      active: 0,
      inactive: 0,
      draft: 0,
      featured: 0,
      lowStock: 0,
      outOfStock: 0,
      withImages: 0,
      noImages: 0,
      totalValue: 0,
      topCategories: []
    },
    recent: [],
    alerts: [],
    charts: {
      sales: { labels: [], data: [] },
      categories: { labels: [], data: [] },
      stockTrend: { labels: [], data: [] }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    if (loading) setLoading(true);
    else setRefreshing(true);

    try {
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Datos simulados pero realistas
      const mockData = {
        overview: {
          total: 248,
          active: 189,
          inactive: 32,
          draft: 27,
          featured: 15,
          lowStock: 8,
          outOfStock: 3,
          withImages: 195,
          noImages: 53,
          totalValue: 125780000,
          totalChange: 12.5,
          activePercentage: 76.2,
          featuredPercentage: 6.0,
          topCategories: [
            { name: 'Electrónicos', product_count: 45 },
            { name: 'Ropa', product_count: 38 },
            { name: 'Hogar', product_count: 32 },
            { name: 'Deportes', product_count: 28 },
            { name: 'Libros', product_count: 22 }
          ]
        },
        recent: [
          {
            id: 1,
            name: 'iPhone 15 Pro Max',
            price: 5200000,
            status: 'active',
            image: null,
            created_at: new Date()
          },
          {
            id: 2,
            name: 'MacBook Air M3',
            price: 6800000,
            status: 'draft',
            image: null,
            created_at: new Date()
          },
          {
            id: 3,
            name: 'Camiseta Premium',
            price: 89000,
            status: 'active',
            image: null,
            created_at: new Date()
          },
          {
            id: 4,
            name: 'Libro de JavaScript',
            price: 125000,
            status: 'active',
            image: null,
            created_at: new Date()
          },
          {
            id: 5,
            name: 'Auriculares Bluetooth',
            price: 450000,
            status: 'inactive',
            image: null,
            created_at: new Date()
          }
        ],
        alerts: [
          {
            type: 'warning',
            title: 'Stock Bajo',
            message: '8 productos con stock menor a 5 unidades',
            action: { label: 'Ver productos', url: '/admin/productos?stock_status=low_stock' }
          },
          {
            type: 'error',
            title: 'Productos Agotados',
            message: '3 productos están completamente agotados',
            action: { label: 'Reabastecer', url: '/admin/productos?stock_status=out_of_stock' }
          },
          {
            type: 'warning',
            title: 'Sin Imágenes',
            message: '53 productos no tienen imágenes asignadas',
            action: { label: 'Agregar imágenes', url: '/admin/productos?has_images=false' }
          },
          {
            type: 'info',
            title: 'Borradores Pendientes',
            message: '27 productos en estado borrador esperando revisión',
            action: { label: 'Revisar borradores', url: '/admin/productos?status=draft' }
          }
        ],
        charts: {
          sales: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            data: [12, 8, 15, 22, 18, 25, 13]
          },
          categories: {
            labels: ['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros'],
            data: [45, 38, 32, 28, 22]
          },
          stockTrend: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            data: [220, 235, 248, 242, 255, 248]
          }
        }
      };

      setStats(mockData);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CO').format(num || 0);
  };

  const StatCard = ({ title, value, change, icon, color = "blue", trend, onClick, isSelected }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 cursor-pointer border-2 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'} {change}
              </span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ alert }) => (
    <div className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
      alert.type === 'error' ? 'border-red-400 bg-red-50 hover:bg-red-100' :
      alert.type === 'warning' ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100' :
      'border-blue-400 bg-blue-50 hover:bg-blue-100'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <span className="text-xl">
            {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{alert.title}</h4>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          {alert.action && (
            <Link 
              href={alert.action.url} 
              className={`text-sm font-medium hover:underline ${
                alert.type === 'error' ? 'text-red-700' :
                alert.type === 'warning' ? 'text-yellow-700' :
                'text-blue-700'
              }`}
            >
              {alert.action.label} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const BarChart = ({ data, title, color = '#3B82F6' }) => {
    if (!data || !data.labels || !data.data) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.data, 1);
    
    return (
      <div className="h-64 p-4">
        <div className="flex items-end justify-between h-full space-x-2">
          {data.labels.map((label, index) => {
            const value = data.data[index] || 0;
            const height = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex items-end justify-center" style={{ height: '180px' }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80 relative group-hover:shadow-lg"
                    style={{ 
                      height: `${height}%`, 
                      backgroundColor: color,
                      minHeight: value > 0 ? '4px' : '0px'
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {value}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center font-medium">
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    let currentAngle = 0;
    
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) : 0;
              const angle = percentage * 360;
              const radius = 60;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((currentAngle / 360) * circumference);
              
              currentAngle += angle;
              
              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={colors[index] || '#6B7280'}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="hover:opacity-80 transition-opacity"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-6 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: colors[index] || '#6B7280' }}
              ></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500">
                  {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  const stockStatusData = [
    { label: 'En Stock', value: stats.overview.active - stats.overview.lowStock - stats.overview.outOfStock },
    { label: 'Stock Bajo', value: stats.overview.lowStock },
    { label: 'Agotado', value: stats.overview.outOfStock }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Productos</h1>
              <p className="text-gray-600 mt-1">Resumen completo y estadísticas de tu inventario</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
              <button
                onClick={() => fetchDashboardData()}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Productos"
            value={formatNumber(stats.overview.total)}
            change={`+${stats.overview.totalChange}% este mes`}
            icon="📦"
            trend="up"
            onClick={() => setSelectedMetric('total')}
            isSelected={selectedMetric === 'total'}
          />
          <StatCard
            title="Productos Activos"
            value={formatNumber(stats.overview.active)}
            change={`${stats.overview.activePercentage}% del total`}
            icon="✅"
            onClick={() => setSelectedMetric('active')}
            isSelected={selectedMetric === 'active'}
          />
          <StatCard
            title="Stock Bajo"
            value={formatNumber(stats.overview.lowStock)}
            change={stats.overview.lowStock > 0 ? 'Requiere atención' : 'Todo bien'}
            icon="⚠️"
            trend={stats.overview.lowStock > 0 ? 'down' : 'neutral'}
            onClick={() => setSelectedMetric('stock')}
            isSelected={selectedMetric === 'stock'}
          />
          <StatCard
            title="Valor Inventario"
            value={formatCurrency(stats.overview.totalValue)}
            change="+8.3% vs mes anterior"
            icon="💰"
            trend="up"
            onClick={() => setSelectedMetric('value')}
            isSelected={selectedMetric === 'value'}
          />
        </div>

        {/* Alertas */}
        {stats.alerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🚨 Alertas Importantes</h2>
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                {stats.alerts.length} alerta{stats.alerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.alerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">📈 Productos Agregados</h3>
              <span className="text-sm text-gray-500">Últimos 7 días</span>
            </div>
            <BarChart data={stats.charts.sales} title="Productos por día" color="#3B82F6" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">🏷️ Productos por Categoría</h3>
              <Link href="/admin/categorias" className="text-sm text-blue-600 hover:text-blue-800">
                Gestionar →
              </Link>
            </div>
            <BarChart data={stats.charts.categories} title="Distribución por categoría" color="#10B981" />
          </div>
        </div>

        {/* Sección Inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Estado del Stock */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">📊 Estado del Stock</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700">
                Ver detalles
              </button>
            </div>
            <DonutChart data={stockStatusData} title="Distribución de stock" />
          </div>

          {/* Productos Recientes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">🆕 Productos Recientes</h3>
              <Link href="/admin/productos" className="text-sm text-blue-600 hover:text-blue-800">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recent.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        width={48}
                        height={48}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-400 text-lg">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status === 'active' ? 'Activo' : 
                       product.status === 'draft' ? 'Borrador' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">⚡ Acciones Rápidas</h3>
            <div className="space-y-3">
              <Link
                href="/admin/productos/nuevo"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Nuevo Producto
              </Link>
              <Link
                href="/admin/productos?status=draft"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">📝</span>
                Revisar Borradores ({stats.overview.draft})
              </Link>
              <Link
                href="/admin/productos?stock_status=low_stock"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">⚠️</span>
                Stock Bajo ({stats.overview.lowStock})
              </Link>
              <button
                onClick={() => {
                  toast.success('Exportando productos...');
                }}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">📊</span>
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">📈 Estadísticas Generales</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total productos:</span>
                <span className="font-semibold text-gray-900">{formatNumber(stats.overview.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Con imágenes:</span>
                <span className="font-semibold text-green-600">{formatNumber(stats.overview.withImages)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sin imágenes:</span>
                <span className="font-semibold text-red-600">{formatNumber(stats.overview.noImages)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Destacados:</span>
                <span className="font-semibold text-purple-600">{formatNumber(stats.overview.featured)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Valor total:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(stats.overview.totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">🏷️ Top Categorías</h4>
            <div className="space-y-3">
              {stats.overview.topCategories.slice(0, 5).map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`}></span>
                    <span className="text-gray-700 truncate">{category.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{category.product_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Distribución por Estado</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Borradores:</span>
                </div>
                <span className="font-semibold text-yellow-600">{formatNumber(stats.overview.draft)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Destacados:</span>
                </div>
                <span className="font-semibold text-purple-600">{formatNumber(stats.overview.featured)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">% Productos activos:</span>
                  <span className="font-bold text-lg text-green-600">{stats.overview.activePercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Productos con Problemas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">🔍 Productos que Requieren Atención</h3>
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                {stats.overview.lowStock + stats.overview.outOfStock + stats.overview.noImages} problemas
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problemas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">📱</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">iPhone 13 Pro</div>
                        <div className="text-sm text-gray-500">SKU: IPH13PRO</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Stock bajo
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Sin imagen
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-red-600 font-medium">2 unidades</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href="/admin/productos/1" className="text-blue-600 hover:text-blue-900">
                      Editar
                    </Link>
                    <Link href="/productos/iphone-13-pro" target="_blank" className="text-gray-600 hover:text-gray-900">
                      Ver
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">💻</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">MacBook Pro M3</div>
                        <div className="text-sm text-gray-500">SKU: MBP-M3</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Agotado
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-red-600 font-medium">0 unidades</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href="/admin/productos/2" className="text-blue-600 hover:text-blue-900">
                      Editar
                    </Link>
                    <Link href="/productos/macbook-pro-m3" target="_blank" className="text-gray-600 hover:text-gray-900">
                      Ver
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">👕</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Camiseta Premium</div>
                        <div className="text-sm text-gray-500">SKU: CAM-PREM</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Sin SEO
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Sin categoría
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-green-600 font-medium">25 unidades</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Borrador
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href="/admin/productos/3" className="text-blue-600 hover:text-blue-900">
                      Editar
                    </Link>
                    <Link href="/productos/camiseta-premium" target="_blank" className="text-gray-600 hover:text-gray-900">
                      Ver
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando 3 de {stats.overview.lowStock + stats.overview.outOfStock + stats.overview.noImages} productos con problemas
              </p>
              <Link 
                href="/admin/productos?filter=problems" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todos los problemas →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-4 lg:mb-0">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Consejos para Optimizar tu Inventario</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mantén al menos 10 unidades de productos populares</li>
                <li>• Agrega imágenes de alta calidad a todos tus productos</li>
                <li>• Optimiza títulos y descripciones para SEO</li>
                <li>• Revisa y publica productos en borrador regularmente</li>
              </ul>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/productos/nuevo"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ➕ Agregar Producto
              </Link>
              <Link
                href="/admin/productos"
                className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                📋 Ver Todos
              </Link>
            </div>
          </div>
        </div>

        {/* Información del dashboard */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Dashboard actualizado por última vez: {new Date().toLocaleString('es-ES')} •{' '}
            <button 
              onClick={() => fetchDashboardData()} 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Actualizar datos
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
        