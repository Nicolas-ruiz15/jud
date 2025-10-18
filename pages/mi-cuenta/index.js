// pages/mi-cuenta/index.js - VERSIÓN MEJORADA CON MEJORES PRÁCTICAS 2025
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

function MiCuentaPage({ user }) {
  const [stats, setStats] = useState({
    orders: 0,
    totalSpent: 0,
    favoriteCategory: 'N/A'
  });
  const [ticketStats, setTicketStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    resolved_tickets: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      // Cargar estadísticas del usuario
      const statsResponse = await fetch('/api/user/stats', {
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Cargar pedidos recientes
      const ordersResponse = await fetch('/api/user/orders/recent', {
        credentials: 'include'
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          setRecentOrders(ordersData.data);
        }
      }

      // Cargar tickets recientes
      const ticketsResponse = await fetch('/api/user/tickets?limit=5', {
        credentials: 'include'
      });
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        if (ticketsData.success) {
          setRecentTickets(ticketsData.data);
          setTicketStats(ticketsData.stats);
        }
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando algunos datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await logout();
    }
  };

  const formatPrice = (price) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(price);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-200',
      shipped: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-200',
      delivered: 'bg-green-50 text-green-700 border-green-200 ring-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200 ring-red-200',
      // Ticket statuses
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
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      // Ticket statuses
      open: 'Abierto',
      in_progress: 'En Progreso',
      pending_customer: 'Pendiente Respuesta',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    };
    return texts[status] || status;
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
      current: true
    },
    {
      title: 'Mis Tickets',
      href: '/mi-cuenta/tickets',
      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
      current: false
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
      title="Mi Cuenta | Judaica Breslov Colombia"
      description="Panel de control personal para gestionar pedidos, información y preferencias"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header compacto */}
        <div className="bg-white shadow-sm border-b border-gray-200/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-blue-600 transition-colors duration-200 font-medium">
                Inicio
              </Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-semibold">Mi Cuenta</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Hola, {user?.name?.split(' ')[0] || 'Usuario'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente desde
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                   {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Fecha no disponible'}
                  </p>
                </div>
                
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-100">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Sidebar rediseñado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                {/* Header del sidebar con gradiente */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-100/50 border-b border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
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
                
                {/* Navegación mejorada */}
                <nav className="p-3">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                        item.current 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-5 h-5 flex-shrink-0 ${item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="truncate">{item.title}</span>
                      {item.current && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
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

            {/* Contenido principal rediseñado */}
            <div className="lg:col-span-4">
              {/* Banner informativo mejorado */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-2xl p-5 mb-8 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-500/10 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-blue-900 mb-1">
                      ¡Panel de cuenta personalizado!
                    </h3>
                    <p className="text-sm text-blue-800/80 leading-relaxed">
                      Desde aquí puedes gestionar tu información personal, ver tus pedidos, crear tickets de soporte y configurar tus preferencias.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Estadísticas con diseño moderno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Total de Pedidos
                      </p>
                      {loading ? (
                        <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-12 rounded-lg"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900 mb-1">{stats.orders}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Total Gastado
                      </p>
                      {loading ? (
                        <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-20 rounded-lg"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                          {formatPrice(stats.totalSpent)}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Tickets Soporte
                      </p>
                      {loading ? (
                        <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-12 rounded-lg"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{ticketStats.total_tickets}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {ticketStats.open_tickets} abiertos
                          </p>
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Categoría Favorita
                      </p>
                      {loading ? (
                        <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-16 rounded-lg"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stats.favoriteCategory}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Acciones rápidas rediseñadas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-6 mb-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  Acciones Rápidas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/mi-cuenta/pedidos"
                    className="group flex items-center space-x-4 p-4 border border-gray-200/60 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Ver Pedidos</p>
                      <p className="text-xs text-gray-500">Historial completo</p>
                    </div>
                  </Link>

                  <Link
                    href="/mi-cuenta/tickets"
                    className="group flex items-center space-x-4 p-4 border border-gray-200/60 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Mis Tickets</p>
                      <p className="text-xs text-gray-500">Soporte y consultas</p>
                    </div>
                  </Link>

                  <Link
                    href="/mi-cuenta/perfil"
                    className="group flex items-center space-x-4 p-4 border border-gray-200/60 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Mi Perfil</p>
                      <p className="text-xs text-gray-500">Editar información</p>
                    </div>
                  </Link>

                  <Link
                    href="/productos"
                    className="group flex items-center space-x-4 p-4 border border-gray-200/60 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Seguir Comprando</p>
                      <p className="text-xs text-gray-500">Ver catálogo</p>
                    </div>
                  </Link>
                </div>
              </motion.div>

              {/* Sección de tickets y pedidos con mejor diseño */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Tickets recientes rediseñados */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      Tickets Recientes
                    </h2>
                    <Link
                      href="/mi-cuenta/tickets"
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors duration-200 flex items-center group"
                    >
                      Ver todos
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  <AnimatePresence mode="wait">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                              <div>
                                <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2"></div>
                                <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                              </div>
                            </div>
                            <div className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentTickets.length > 0 ? (
                      <div className="space-y-3">
                        {recentTickets.map((ticket, index) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex items-center justify-between p-4 border border-gray-100/60 rounded-xl hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50/50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-200">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">#{ticket.ticket_number}</p>
                                <p className="text-xs text-gray-600 truncate max-w-[180px]">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {formatDate(ticket.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ring-1 ${getStatusColor(ticket.status)}`}>
                                {getStatusText(ticket.status)}
                              </span>
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No tienes tickets aún
                        </h3>
                        <p className="text-gray-600 mb-6 text-sm">
                          Crea tu primer ticket de soporte para recibir ayuda personalizada
                        </p>
                        <Link
                          href="/mi-cuenta/tickets"
                          className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                        >
                          <span>Crear Primer Ticket</span>
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Pedidos recientes rediseñados */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg mr-3 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                        </svg>
                      </div>
                      Pedidos Recientes
                    </h2>
                    <Link
                      href="/mi-cuenta/pedidos"
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors duration-200 flex items-center group"
                    >
                      Ver todos
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  <AnimatePresence mode="wait">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                              <div>
                                <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2"></div>
                                <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                              </div>
                            </div>
                            <div className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentOrders.length > 0 ? (
                      <div className="space-y-3">
                        {recentOrders.map((order, index) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex items-center justify-between p-4 border border-gray-100/60 rounded-xl hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50/50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-200">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">#{order.id}</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(order.date).toLocaleDateString('es-CO')} • {order.items} producto{order.items !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 text-sm">{formatPrice(order.total)}</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ring-1 ${getStatusColor(order.status)}`}>
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No tienes pedidos aún
                        </h3>
                        <p className="text-gray-600 mb-6 text-sm">
                          Explora nuestro catálogo y descubre productos increíbles
                        </p>
                        <Link
                          href="/productos"
                          className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                        >
                          <span>Explorar Productos</span>
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Exportar el componente protegido
export default withClientAuth(MiCuentaPage);