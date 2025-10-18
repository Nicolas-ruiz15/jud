// pages/mi-cuenta/tickets.js - VERSIÓN MEJORADA CON DISEÑO MODERNO
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

function MisTicketsPage({ user }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newTicket, setNewTicket] = useState({
    type: 'general',
    priority: 'medium',
    subject: '',
    description: '',
    order_number: '',
    product_name: ''
  });

  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    loadTickets();
  }, [activeFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      const filterParams = activeFilter !== 'all' ? `?status=${activeFilter}` : '';
      const response = await fetch(`/api/user/tickets${filterParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(data.data);
          setStats(data.stats);
        }
      } else {
        toast.error('Error cargando tickets');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Asunto y descripción son obligatorios');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Ticket creado exitosamente');
          setShowCreateForm(false);
          setNewTicket({
            type: 'general',
            priority: 'medium',
            subject: '',
            description: '',
            order_number: '',
            product_name: ''
          });
          loadTickets();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error creando ticket');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await logout();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-200',
      in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-200',
      pending_customer: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-200',
      resolved: 'bg-green-50 text-green-700 border-green-200 ring-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      pending_customer: 'Pendiente Respuesta',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getPriorityText = (priority) => {
    const texts = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return texts[priority] || priority;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const menuItems = [
    {
      title: 'Panel Principal',
      href: '/mi-cuenta',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      current: false
    },
    {
      title: 'Mis Tickets',
      href: '/mi-cuenta/tickets',
      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
      current: true
    },
    {
      title: 'Mis Pedidos',
      href: '/mi-cuenta/pedidos',
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z',
      current: false
    },
    {
      title: 'Información Personal',
      href: '/mi-cuenta/perfil',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      current: false
    },
    {
      title: 'Direcciones',
      href: '/mi-cuenta/direcciones',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
      current: false
    },
    {
      title: 'Métodos de Pago',
      href: '/mi-cuenta/pagos',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      current: false
    }
  ];

  return (
    <Layout
      title="Mis Tickets | Judaica Breslov Colombia"
      description="Gestiona tus tickets de soporte y consultas"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header compacto */}
        <div className="bg-white shadow-sm border-b border-gray-200/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-blue-600 transition-colors duration-200 font-medium">
                Inicio
              </Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/mi-cuenta" className="hover:text-blue-600 transition-colors duration-200 font-medium">
                Mi Cuenta
              </Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-semibold">Mis Tickets</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  Mis Tickets de Soporte
                </h1>
              </div>
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Ticket
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Sidebar mejorado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-100/50 border-b border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {user?.name || 'Usuario'}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {user?.email || 'email@ejemplo.com'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <nav className="p-3">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                        item.current 
                          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-100 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 ${item.current ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="truncate">{item.title}</span>
                      {item.current && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      )}
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-100 mt-4 pt-3">
                    <button
                      onClick={handleLogout}
                      className="group w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-sm font-medium"
                    >
                      <div className="w-5 h-5 flex-shrink-0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className="truncate">Cerrar Sesión</span>
                    </button>
                  </div>
                </nav>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-4">
              
              {/* Estadísticas mejoradas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_tickets || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Abiertos</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {(stats.open_tickets || 0) + (stats.in_progress_tickets || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resueltos</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {(stats.resolved_tickets || 0) + (stats.closed_tickets || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Calificación</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.avg_rating ? `${stats.avg_rating.toFixed(1)}/5` : 'N/A'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Filtros mejorados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-6 mb-8"
              >
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'all', label: 'Todos', count: stats.total_tickets, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'open', label: 'Abiertos', count: stats.open_tickets, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                    { key: 'in_progress', label: 'En Progreso', count: stats.in_progress_tickets, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { key: 'resolved', label: 'Resueltos', count: stats.resolved_tickets, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'closed', label: 'Cerrados', count: stats.closed_tickets, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                        activeFilter === filter.key
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : filter.color
                      }`}
                    >
                      <span>{filter.label}</span>
                      {filter.count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          activeFilter === filter.key ? 'bg-white/20 text-white' : 'bg-white/80 text-gray-700'
                        }`}>
                          {filter.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Lista de tickets mejorada */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50"
              >
                <div className="px-6 py-5 border-b border-gray-200/60">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    Mis Tickets
                  </h2>
                </div>

                <AnimatePresence mode="wait">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Cargando tickets...</p>
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {tickets.map((ticket, index) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  #{ticket.ticket_number}
                                </h3>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ring-1 ${getStatusColor(ticket.status)}`}>
                                  {getStatusText(ticket.status)}
                                </span>
                                <span className={`text-sm font-semibold flex items-center ${getPriorityColor(ticket.priority)}`}>
                                  <div className={`w-2 h-2 rounded-full mr-1 ${
                                    ticket.priority === 'high' ? 'bg-red-500' :
                                    ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></div>
                                  {getPriorityText(ticket.priority)}
                                </span>
                              </div>
                              
                              <h4 className="text-xl font-medium text-gray-900 mb-2">{ticket.subject}</h4>
                              <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{ticket.description}</p>
                              
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(ticket.created_at)}
                                </span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  {ticket.total_responses || 0} respuestas
                                </span>
                                {ticket.last_response_at && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Última: {formatDate(ticket.last_response_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-6">
                              <Link
                                href={`/mi-cuenta/tickets/${ticket.id}`}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group-hover:-translate-y-0.5"
                              >
                                Ver Detalle
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No tienes tickets aún
                      </h3>
                      <p className="text-gray-600 mb-6 text-sm">
                        Crea tu primer ticket de soporte para recibir ayuda personalizada
                      </p>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                      >
                        <span>Crear Primer Ticket</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear ticket mejorado */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  Crear Nuevo Ticket
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Consulta *
                    </label>
                    <select
                      value={newTicket.type}
                      onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="general">Consulta General</option>
                      <option value="soporte">Soporte Técnico</option>
                      <option value="pedidos">Gestión de Pedidos</option>
                      <option value="productos">Productos y Calidad</option>
                      <option value="quejas">Queja o Reclamo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prioridad *
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="low">Baja - Consulta general</option>
                      <option value="medium">Media - Problema moderado</option>
                      <option value="high">Alta - Problema urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Resumen breve del problema"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción Detallada *
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    placeholder="Describe el problema con el mayor detalle posible..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Pedido (opcional)
                    </label>
                    <input
                      type="text"
                      value={newTicket.order_number}
                      onChange={(e) => setNewTicket({...newTicket, order_number: e.target.value})}
                      placeholder="Ej: JBC-2024-001234"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Producto (opcional)
                    </label>
                    <input
                      type="text"
                      value={newTicket.product_name}
                      onChange={(e) => setNewTicket({...newTicket, product_name: e.target.value})}
                      placeholder="Nombre del producto"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleCreateTicket}
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Ticket'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default withClientAuth(MisTicketsPage);