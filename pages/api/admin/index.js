// pages/admin/index.js
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    loading: true
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas generales
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          ...statsData.data,
          loading: false
        });
      }

      // Obtener órdenes recientes
      const ordersResponse = await fetch('/api/admin/dashboard/recent-orders', {
        credentials: 'include'
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.data || []);
      }

      // Obtener productos más vendidos
      const topProductsResponse = await fetch('/api/admin/dashboard/top-products', {
        credentials: 'include'
      });
      
      if (topProductsResponse.ok) {
        const topProductsData = await topProductsResponse.json();
        setTopProducts(topProductsData.data || []);
      }

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md ${color} flex items-center justify-center text-white text-lg`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.loading ? '...' : value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts.toLocaleString()}
          icon="📦"
          color="bg-blue-500"
          trend={5}
        />
        <StatCard
          title="Órdenes Totales"
          value={stats.totalOrders.toLocaleString()}
          icon="🛒"
          color="bg-green-500"
          trend={12}
        />
        <StatCard
          title="Usuarios Registrados"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          color="bg-purple-500"
          trend={8}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats.totalRevenue)}
          icon="💰"
          color="bg-yellow-500"
          trend={-3}
        />
      </div>

      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas Importantes</h3>
          <div className="space-y-3">
            {stats.pendingOrders > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
                  ⚠️
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.pendingOrders} órdenes pendientes por procesar
                  </p>
                  <Link href="/admin/ordenes?status=pending" className="text-xs text-yellow-600 hover:text-yellow-800">
                    Ver órdenes →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">
                  📉
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {stats.lowStockProducts} productos con stock bajo
                  </p>
                  <Link href="/admin/productos?filter=low_stock" className="text-xs text-red-600 hover:text-red-800">
                    Ver productos →
                  </Link>
                </div>
              </div>
            )}

            {stats.pendingOrders === 0 && stats.lowStockProducts === 0 && (
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  ✅
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Todo está funcionando correctamente
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/productos/nuevo" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">
                ➕
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Nuevo Producto</span>
            </Link>
            
            <Link href="/admin/ordenes" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-sm">
                📋
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Ver Órdenes</span>
            </Link>
            
            <Link href="/admin/productos/categorias" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-sm">
                🏷️
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Categorías</span>
            </Link>
            
            <Link href="/admin/reportes" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white text-sm">
                📊
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Reportes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Órdenes recientes y productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Órdenes Recientes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Órdenes Recientes</h3>
            <Link href="/admin/ordenes" className="text-sm text-primary-600 hover:text-primary-800">
              Ver todas →
            </Link>
          </div>
          <div className="overflow-hidden">
            {recentOrders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentOrders.slice(0, 5).map((order) => (
                  <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Orden #{order.order_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer_email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay órdenes recientes
              </div>
            )}
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Productos Más Vendidos</h3>
            <Link href="/admin/reportes" className="text-sm text-primary-600 hover:text-primary-800">
              Ver reporte →
            </Link>
          </div>
          <div className="overflow-hidden">
            {topProducts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {topProducts.slice(0, 5).map((product, index) => (
                  <li key={product.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {product.total_sold} vendidos
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(product.total_revenue)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay datos de ventas disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;