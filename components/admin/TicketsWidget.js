// components/admin/TicketsWidget.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const TicketsWidget = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    urgent_tickets: 0,
    avg_response_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('urgent');

  useEffect(() => {
    loadTicketsData();
  }, []);

  const loadTicketsData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas de tickets
      const statsResponse = await fetch('/api/tickets/stats?period=7', {
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data.summary);
        }
      }

      // Cargar tickets urgentes y recientes
      const ticketsResponse = await fetch('/api/tickets?limit=10&priority=high,medium&status=open,in_progress', {
        credentials: 'include'
      });
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        if (ticketsData.success) {
          setTickets(ticketsData.data);
        }
      }

    } catch (error) {
      console.error('Error cargando datos de tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      pending_customer: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      pending_customer: 'Pendiente',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    };
    return texts[status] || status;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority] || '⚪';
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  const getUrgentTickets = () => {
    return tickets.filter(ticket => 
      ticket.priority === 'high' || 
      (ticket.priority === 'medium' && ticket.status === 'open')
    );
  };

  const getRecentTickets = () => {
    return tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const displayTickets = activeTab === 'urgent' ? getUrgentTickets() : getRecentTickets();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header del widget */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tickets de Soporte</h3>
              <p className="text-sm text-gray-600">Gestión y seguimiento</p>
            </div>
          </div>
          
          <Link
            href="/admin/tickets"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.total_tickets || 0}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.open_tickets || 0}
            </div>
            <div className="text-xs text-gray-600">Abiertos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : getUrgentTickets().length}
            </div>
            <div className="text-xs text-gray-600">Urgentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.avg_response_time ? `${Math.round(stats.avg_response_time)}h` : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Resp. Prom.</div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'urgent'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🚨 Urgentes ({getUrgentTickets().length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🕒 Recientes
          </button>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Cargando tickets...</p>
          </div>
        ) : displayTickets.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayTickets.slice(0, 8).map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getPriorityIcon(ticket.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          #{ticket.ticket_number}
                        </h4>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 font-medium truncate mb-1">
                        {ticket.subject}
                      </p>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>👤 {ticket.name}</span>
                        <span>📧 {ticket.email.length > 20 ? ticket.email.substring(0, 20) + '...' : ticket.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>📅 {formatDate(ticket.created_at)}</span>
                        {ticket.total_responses > 0 && (
                          <span>💬 {ticket.total_responses} respuestas</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-4">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-colors text-center"
                    >
                      Ver
                    </Link>
                    
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => {
                          // Lógica para tomar el ticket rápidamente
                          console.log('Tomar ticket:', ticket.id);
                        }}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
                      >
                        Tomar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {activeTab === 'urgent' ? 'No hay tickets urgentes' : 'No hay tickets recientes'}
            </h4>
            <p className="text-xs text-gray-500">
              {activeTab === 'urgent' 
                ? '¡Excelente! Todo está bajo control.'
                : 'No se han creado tickets recientemente.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer del widget */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Link
              href="/admin/tickets?status=open"
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>📂 Abiertos</span>
            </Link>
            <Link
              href="/admin/tickets?priority=high"
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>🔴 Alta prioridad</span>
            </Link>
            <Link
              href="/admin/tickets/stats"
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>📊 Estadísticas</span>
            </Link>
          </div>
          
          <button
            onClick={loadTicketsData}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            title="Actualizar"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketsWidget;