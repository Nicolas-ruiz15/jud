// components/admin/CategoryDashboard.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const CategoryDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    parent: 0,
    children: 0,
    featured: 0,
    noImages: 0,
    withImages: 0,
    topCategories: [],
    recentCategories: [],
    productDistribution: {
      empty: 0,
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0
    },
    charts: {
      statusPie: [],
      hierarchyPie: [],
      productDistributionBar: []
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (loading) setLoading(true);
    else setRefreshing(true);

    try {
      // Simulación de delay para demostrar loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener estadísticas reales
      const statsResponse = await fetch('/api/admin/categories/stats', {
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Obtener categorías recientes
      const recentResponse = await fetch('/api/admin/categories?limit=5&sort=created_at&order=DESC', {
        credentials: 'include'
      });
      
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        if (recentData.success) {
          setStats(prev => ({
            ...prev,
            recentCategories: recentData.data
          }));
        }
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Categorías</h1>
              <p className="text-gray-600 mt-1">Resumen completo de la organización de productos</p>
            </div>
            <div className="flex items-center space-x-4">
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
            title="Total Categorías"
            value={stats.total}
            change={`${stats.percentages?.active}% activas`}
            icon="📁"
            trend="neutral"
          />
          <StatCard
            title="Categorías Principales"
            value={stats.parent}
            change={`${stats.children} subcategorías`}
            icon="🌳"
            trend="neutral"
          />
          <StatCard
            title="Destacadas"
            value={stats.featured}
            change={`${stats.percentages?.featured}% del total`}
            icon="⭐"
            trend="neutral"
          />
          <StatCard
            title="Con Imágenes"
            value={stats.withImages}
            change={`${stats.percentages?.withImages}% del total`}
            icon="🖼️"
            trend={stats.percentages?.withImages > 80 ? 'up' : 'down'}
          />
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">📊 Estado de Categorías</h3>
            </div>
            <DonutChart data={stats.charts.statusPie} title="Distribución por estado" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">🌳 Estructura Jerárquica</h3>
            </div>
            <DonutChart data={stats.charts.hierarchyPie} title="Jerarquía de categorías" />
          </div>
        </div>

        {/* Distribución de productos */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">📦 Distribución de Productos por Categoría</h3>
          </div>
          <BarChart data={stats.charts.productDistributionBar} title="Productos por categoría" color="#10B981" />
        </div>

        {/* Sección Inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Categorías */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">🏆 Top Categorías</h3>
              <Link href="/admin/categorias" className="text-sm text-blue-600 hover:text-blue-800">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-4">
              {stats.topCategories.slice(0, 5).map((category, index) => (
                <div key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.product_count} productos</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    ${Math.round(category.avg_product_price || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categorías Recientes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">🆕 Categorías Recientes</h3>
              <Link href="/admin/categorias?sort=created_at&order=DESC" className="text-sm text-blue-600 hover:text-blue-800">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recentCategories.slice(0, 5).map((category) => (
                <div key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {category.image_url ? (
                      <Image 
                        src={category.image_url} 
                        alt={category.name} 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-400 text-lg">{category.icon || '📁'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                    <p className="text-sm text-gray-500">
                      {category.product_count || 0} productos
                      {category.parent_name && ` • ${category.parent_name}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      category.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {category.status === 'active' ? 'Activa' : 'Inactiva'}
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
                href="/admin/categorias/nueva"
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Nueva Categoría
              </Link>
              <Link
                href="/admin/categorias?viewMode=hierarchy"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">🌳</span>
                Ver Jerarquía
              </Link>
              <Link
                href="/admin/categorias?status=inactive"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">⚫</span>
                Categorías Inactivas ({stats.inactive})
              </Link>
              <button
                onClick={() => {
                  toast.success('Exportando categorías...');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">📈 Estadísticas Generales</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total categorías:</span>
                <span className="font-semibold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Categorías principales:</span>
                <span className="font-semibold text-blue-600">{stats.parent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subcategorías:</span>
                <span className="font-semibold text-purple-600">{stats.children}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Con imágenes:</span>
                <span className="font-semibold text-green-600">{stats.withImages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sin imágenes:</span>
                <span className="font-semibold text-red-600">{stats.noImages}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">% Activas:</span>
                  <span className="font-bold text-lg text-green-600">{stats.percentages?.active || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">📦 Distribución de Productos</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Sin productos:</span>
                </div>
                <span className="font-semibold text-red-600">{stats.productDistribution.empty}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">1-5 productos:</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.productDistribution.low}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">6-20 productos:</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.productDistribution.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">21-50 productos:</span>
                </div>
                <span className="font-semibold text-green-600">{stats.productDistribution.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">50+ productos:</span>
                </div>
                <span className="font-semibold text-purple-600">{stats.productDistribution.very_high}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categorías que Requieren Atención */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">🔍 Categorías que Requieren Atención</h3>
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                {stats.noImages + stats.inactive} problemas
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problemas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
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
                {/* Ejemplo de categorías con problemas */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">📁</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Electrónicos</div>
                        <div className="text-sm text-gray-500">/electronicos</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Sin imagen
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-green-600 font-medium">45 productos</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Activa
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href="/admin/categorias/1" className="text-blue-600 hover:text-blue-900">
                      Editar
                    </Link>
                    <Link href="/categorias/electronicos" target="_blank" className="text-gray-600 hover:text-gray-900">
                      Ver
                    </Link>
                  </td>
                </tr>
                
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">👕</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Ropa Antigua</div>
                        <div className="text-sm text-gray-500">/ropa-antigua</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Sin productos
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactiva
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-red-600 font-medium">0 productos</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Inactiva
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href="/admin/categorias/2" className="text-blue-600 hover:text-blue-900">
                      Editar
                    </Link>
                    <button className="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando categorías que requieren atención
              </p>
              <Link 
                href="/admin/categorias?status=inactive" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las categorías inactivas →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-4 lg:mb-0">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Consejos para Optimizar tus Categorías</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Asigna imágenes atractivas a todas las categorías principales</li>
                <li>• Mantén una jerarquía clara con máximo 3 niveles de profundidad</li>
                <li>• Usa descripciones SEO optimizadas para mejor posicionamiento</li>
                <li>• Revisa regularmente categorías sin productos y considera eliminarlas</li>
              </ul>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/categorias/nueva"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ➕ Nueva Categoría
              </Link>
              <Link
                href="/admin/categorias"
                className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                📋 Ver Todas
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

export default CategoryDashboard;