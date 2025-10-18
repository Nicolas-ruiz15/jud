// pages/admin/analytics.js
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [realtimeData, setRealtimeData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const intervalRef = useRef();

  useEffect(() => {
    if (activeTab === 'realtime') {
      fetchRealtimeData();
      // Actualizar cada 10 segundos
      intervalRef.current = setInterval(fetchRealtimeData, 10000);
    } else {
      fetchOverviewData();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTab, period]);

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/realtime', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealtimeData(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      setLoading(false);
    }
  };

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/overview?period=${period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon, color = 'blue' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md bg-${color}-500 flex items-center justify-center text-white text-lg`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const RealtimeVisitors = () => {
    if (!realtimeData) return <div>Cargando...</div>;

    return (
      <div className="space-y-6">
        {/* Métricas en tiempo real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Visitantes Activos"
            value={realtimeData.metrics.active_visitors || 0}
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Muy Activos (5m)"
            value={realtimeData.metrics.very_active_visitors || 0}
            icon="⚡"
            color="blue"
          />
          <MetricCard
            title="Páginas Activas"
            value={realtimeData.metrics.active_pages || 0}
            icon="📄"
            color="purple"
          />
          <MetricCard
            title="Usuarios Conectados"
            value={realtimeData.metrics.logged_in_users || 0}
            icon="🔐"
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visitantes activos en detalle */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Visitantes Activos</h3>
              <p className="text-sm text-gray-500">Últimos 30 minutos</p>
            </div>
            <div className="overflow-hidden max-h-96 overflow-y-auto">
              {realtimeData.activeVisitors.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {realtimeData.activeVisitors.map((visitor) => (
                    <li key={visitor.session_id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              visitor.minutes_ago <= 2 ? 'bg-green-400' : 
                              visitor.minutes_ago <= 5 ? 'bg-yellow-400' : 'bg-gray-400'
                            }`}></span>
                            <span className="text-sm font-medium text-gray-900">
                              {visitor.user_name || 'Visitante Anónimo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{visitor.current_page_path}</p>
                          <p className="text-xs text-gray-400">
                            {visitor.device_type} • {visitor.city || 'Ubicación desconocida'} • 
                            hace {visitor.minutes_ago}m
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{visitor.page_views} páginas</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay visitantes activos en este momento
                </div>
              )}
            </div>
          </div>

          {/* Páginas más visitadas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Páginas Activas</h3>
              <p className="text-sm text-gray-500">Páginas con visitantes ahora</p>
            </div>
            <div className="overflow-hidden max-h-96 overflow-y-auto">
              {realtimeData.topPages.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {realtimeData.topPages.map((page, index) => (
                    <li key={index} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {page.current_page_title || page.current_page_path}
                          </p>
                          <p className="text-sm text-gray-500">{page.current_page_path}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{page.active_viewers} activos</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay páginas activas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fuentes de tráfico y eventos recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuentes de tráfico */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Fuentes de Tráfico</h3>
              <p className="text-sm text-gray-500">Visitantes activos por fuente</p>
            </div>
            <div className="p-6">
              {realtimeData.trafficSources.length > 0 ? (
                <div className="space-y-3">
                  {realtimeData.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{source.source}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {source.visitors} visitantes
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No hay datos de fuentes</p>
              )}
            </div>
          </div>

          {/* Eventos recientes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Eventos Recientes</h3>
              <p className="text-sm text-gray-500">Última hora</p>
            </div>
            <div className="overflow-hidden max-h-80 overflow-y-auto">
              {realtimeData.recentEvents.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {realtimeData.recentEvents.slice(0, 10).map((event, index) => (
                    <li key={index} className="px-6 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {event.event_action || event.event_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.page_path} • {event.user_name || 'Anónimo'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay eventos recientes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OverviewAnalytics = () => {
    if (!overviewData || loading) return <div>Cargando...</div>;

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    const dailyChartData = {
      labels: overviewData.dailyStats.map(stat => 
        new Date(stat.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Sesiones',
          data: overviewData.dailyStats.map(stat => stat.sessions),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Usuarios Únicos',
          data: overviewData.dailyStats.map(stat => stat.unique_users),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
        },
      ],
    };

    const deviceChartData = {
      labels: overviewData.deviceStats.map(stat => stat.device_type),
      datasets: [
        {
          data: overviewData.deviceStats.map(stat => stat.sessions),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
          ],
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Selector de período */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Resumen de Analytics</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Sesiones Totales"
            value={overviewData.overview.total_sessions}
            change={overviewData.overview.growth.sessions}
            icon="📊"
            color="blue"
          />
          <MetricCard
            title="Usuarios Únicos"
            value={overviewData.overview.unique_users}
            change={overviewData.overview.growth.users}
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Páginas Vistas"
            value={overviewData.overview.total_page_views}
            change={overviewData.overview.growth.pageViews}
            icon="📄"
            color="purple"
          />
          <MetricCard
            title="Duración Promedio"
            value={`${Math.floor(overviewData.overview.avg_session_duration / 60)}:${String(overviewData.overview.avg_session_duration % 60).padStart(2, '0')}`}
            icon="⏱️"
            color="yellow"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de tendencias */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias Diarias</h3>
            <Line data={dailyChartData} options={chartOptions} />
          </div>

          {/* Gráfico de dispositivos */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dispositivos</h3>
            <Doughnut data={deviceChartData} />
          </div>
        </div>

        {/* Tablas de datos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Páginas más visitadas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Páginas Más Visitadas</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Página
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vistas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Prom.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overviewData.topPages.slice(0, 8).map((page, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {page.page_title || page.page_path}
                          </div>
                          <div className="text-sm text-gray-500">{page.page_path}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.page_views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(page.avg_time_on_page / 60)}:{String(page.avg_time_on_page % 60).padStart(2, '0')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Eventos más frecuentes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Eventos Más Frecuentes</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sesiones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overviewData.topEvents.slice(0, 8).map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {event.event_action || event.event_type}
                          </div>
                          <div className="text-sm text-gray-500">{event.event_category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.event_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.unique_sessions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Métricas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {overviewData.overview.pages_per_session}
              </div>
              <div className="text-sm text-gray-500">Páginas por Sesión</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {overviewData.overview.bounce_rate}%
              </div>
              <div className="text-sm text-gray-500">Tasa de Rebote</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {overviewData.browserStats.length}
              </div>
              <div className="text-sm text-gray-500">Navegadores Únicos</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('realtime')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'realtime'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔴 Tiempo Real
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Resumen
            </button>
          </nav>
        </div>

        {/* Contenido */}
        <div className="min-h-screen">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'realtime' && <RealtimeVisitors />}
              {activeTab === 'overview' && <OverviewAnalytics />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;