// pages/admin/tickets/stats.js - Estadísticas de Tickets para Admin
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { motion } from 'framer-motion';

export default function TicketsStatsAdmin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30'); // días
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tickets/stats?period=${period}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error cargando estadísticas');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Error en respuesta del servidor');
      }

    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatHours = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.round(minutes / 60 * 10) / 10;
    return `${hours}h`;
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${Math.round(value)}%`;
  };

  const getRecommendationIcon = (type) => {
    const icons = {
      urgent: '🚨',
      response_time: '⏰',
      satisfaction: '⭐',
      resolution: '📈',
      complaints: '⚠️',
      sla_response: '📊',
      sla_resolution: '🎯',
      positive: '🌟'
    };
    return icons[type] || '📝';
  };

  const getRecommendationColor = (priority) => {
    const colors = {
      high: 'border-red-200 bg-red-50',
      medium: 'border-yellow-200 bg-yellow-50',
      info: 'border-green-200 bg-green-50'
    };
    return colors[priority] || 'border-gray-200 bg-gray-50';
  };

  const getPriorityTextColor = (priority) => {
    const colors = {
      high: 'text-red-800',
      medium: 'text-yellow-800',
      info: 'text-green-800'
    };
    return colors[priority] || 'text-gray-800';
  };

  if (loading && !refreshing) {
    return (
      <AdminLayout title="📊 Estadísticas de Tickets">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="📊 Estadísticas de Tickets">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">❌ Error: {error}</div>
          <button
            onClick={refreshStats}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="📊 Estadísticas de Tickets">
      
      {/* Header de la sección */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 mt-1">Análisis detallado del sistema de soporte</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
          <button
            onClick={refreshStats}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <Link
            href="/admin/tickets"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver a Tickets
          </Link>
        </div>
      </div>

      {stats && (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.summary?.total_tickets || 0}</p>
                  <p className="text-sm text-gray-500">Últimos {period} días</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tasa de Resolución</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatPercentage(stats.summary?.resolution_rate)}
                  </p>
                  <p className="text-sm text-gray-500">Resueltos/Total</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tiempo Promedio</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {formatHours(stats.summary?.avg_first_response_hours)}
                  </p>
                  <p className="text-sm text-gray-500">Primera respuesta</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Satisfacción</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.summary?.avg_customer_rating ? 
                      `${stats.summary.avg_customer_rating.toFixed(1)}/5` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Calificación promedio</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Distribución por estado y prioridad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Estados */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
              <div className="space-y-4">
                {[
                  { key: 'open_tickets', label: 'Abiertos', color: 'bg-red-500', value: stats.summary?.open_tickets || 0 },
                  { key: 'in_progress_tickets', label: 'En Progreso', color: 'bg-blue-500', value: stats.summary?.in_progress_tickets || 0 },
                  { key: 'pending_customer_tickets', label: 'Pendiente Cliente', color: 'bg-yellow-500', value: stats.summary?.pending_customer_tickets || 0 },
                  { key: 'resolved_tickets', label: 'Resueltos', color: 'bg-green-500', value: stats.summary?.resolved_tickets || 0 },
                  { key: 'closed_tickets', label: 'Cerrados', color: 'bg-gray-500', value: stats.summary?.closed_tickets || 0 }
                ].map((item) => {
                  const percentage = stats.summary?.total_tickets ? 
                    (item.value / stats.summary.total_tickets * 100) : 0;
                  
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8">{item.value}</span>
                        <span className="text-xs text-gray-500 w-10">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prioridades */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Prioridad</h3>
              <div className="space-y-4">
                {[
                  { key: 'high_priority_tickets', label: 'Alta Prioridad', color: 'bg-red-500', value: stats.summary?.high_priority_tickets || 0 },
                  { key: 'medium_priority_tickets', label: 'Media Prioridad', color: 'bg-yellow-500', value: stats.summary?.medium_priority_tickets || 0 },
                  { key: 'low_priority_tickets', label: 'Baja Prioridad', color: 'bg-green-500', value: stats.summary?.low_priority_tickets || 0 }
                ].map((item) => {
                  const percentage = stats.summary?.total_tickets ? 
                    (item.value / stats.summary.total_tickets * 100) : 0;
                  
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8">{item.value}</span>
                        <span className="text-xs text-gray-500 w-10">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance por tipo */}
          {stats.performance_by_type && stats.performance_by_type.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Tipo de Ticket</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Respuesta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Resolución</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa Resolución</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.performance_by_type.map((type, index) => (
                      <tr key={type.type} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {type.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {type.total_tickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatHours(type.avg_first_response)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatHours(type.avg_resolution_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(type.resolution_rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {type.avg_rating ? `${type.avg_rating.toFixed(1)}/5` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tickets urgentes */}
          {stats.urgent_tickets && stats.urgent_tickets.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🚨 Tickets Urgentes ({stats.urgent_tickets.length})
              </h3>
              <div className="space-y-3">
                {stats.urgent_tickets.slice(0, 10).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-red-900">#{ticket.ticket_number}</span>
                        <span className="text-sm text-red-700">{ticket.subject}</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-red-600">
                        <span>👤 {ticket.name}</span>
                        <span>⏰ {ticket.hours_open}h abierto</span>
                        <span className="capitalize">🏷️ {ticket.priority} prioridad</span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
                {stats.urgent_tickets.length > 10 && (
                  <div className="text-center pt-3">
                    <Link
                      href="/admin/tickets?priority=high"
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Ver todos los tickets urgentes ({stats.urgent_tickets.length}) →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {stats.recommendations && stats.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Recomendaciones del Sistema</h3>
              <div className="space-y-4">
                {stats.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getRecommendationColor(rec.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getRecommendationIcon(rec.type)}</span>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${getPriorityTextColor(rec.priority)} mb-1`}>
                          {rec.title}
                        </h4>
                        <p className={`text-sm ${getPriorityTextColor(rec.priority)} mb-2`}>
                          {rec.description}
                        </p>
                        <p className={`text-xs ${getPriorityTextColor(rec.priority)} font-medium`}>
                          💡 Acción recomendada: {rec.action}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}