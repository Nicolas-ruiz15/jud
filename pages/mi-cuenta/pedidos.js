// pages/mi-cuenta/pedidos.js - Lista de pedidos del cliente con diseño moderno
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

function MisPedidosPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [cancelingOrder, setCancelingOrder] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, [filter, sortBy]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter: filter,
        sort: sortBy,
        limit: '50'
      });

      const response = await fetch(`/api/user/orders?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        toast.error('Error cargando pedidos');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      toast.error('Error de conexión');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) return;

    setCancelingOrder(orderId);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pedido cancelado correctamente');
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled', canCancel: false }
            : order
        ));
      } else {
        toast.error(data.message || 'Error al cancelar pedido');
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      toast.error('Error de conexión');
    } finally {
      setCancelingOrder(null);
    }
  };

  const handleTrackOrder = (trackingNumber) => {
    toast.info(`Número de seguimiento: ${trackingNumber}`);
  };

  const handleReorder = async (orderId) => {
    try {
      const response = await fetch(`/api/user/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Productos agregados al carrito');
        router.push('/carrito');
      } else {
        toast.error(data.message || 'Error al reordenar');
      }
    } catch (error) {
      console.error('Error reordenando:', error);
      toast.error('Error de conexión');
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
      pending: 'from-yellow-500 to-orange-500',
      processing: 'from-blue-500 to-cyan-600',
      shipped: 'from-purple-500 to-indigo-600',
      out_for_delivery: 'from-indigo-500 to-purple-600',
      delivered: 'from-green-500 to-emerald-600',
      completed: 'from-green-500 to-emerald-600',
      cancelled: 'from-red-500 to-pink-600',
      refunded: 'from-gray-500 to-slate-600',
      failed: 'from-red-500 to-pink-600'
    };
    return colors[status] || 'from-gray-500 to-slate-600';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      out_for_delivery: 'En Camino',
      delivered: 'Entregado',
      completed: 'Completado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
      failed: 'Fallido'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      processing: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      shipped: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      out_for_delivery: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      delivered: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      cancelled: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      refunded: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
      failed: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    };
    return icons[status] || icons.pending;
  };

  // Calcular conteos para filtros
  const filterCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
    cancelled: orders.filter(o => ['cancelled', 'refunded', 'failed'].includes(o.status)).length
  };

  const filterOptions = [
    { value: 'all', label: 'Todos los pedidos', count: filterCounts.all, color: 'from-blue-500 to-cyan-600' },
    { value: 'processing', label: 'En proceso', count: filterCounts.processing, color: 'from-blue-500 to-cyan-600' },
    { value: 'shipped', label: 'Enviados', count: filterCounts.shipped, color: 'from-purple-500 to-indigo-600' },
    { value: 'delivered', label: 'Entregados', count: filterCounts.delivered, color: 'from-green-500 to-emerald-600' },
    { value: 'cancelled', label: 'Cancelados', count: filterCounts.cancelled, color: 'from-red-500 to-pink-600' }
  ];

  return (
    <Layout
      title="Mis Pedidos | Mi Cuenta | Judaica Breslov Colombia"
      description="Historial completo de pedidos y seguimiento de envíos"
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
              <span className="text-gray-900 font-semibold">Mis Pedidos</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                    </svg>
                  </div>
                  Mis Pedidos
                </h1>
                <p className="text-gray-600 mt-1">
                  Historial completo y seguimiento de envíos
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/productos"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Seguir Comprando
                </Link>
                <Link
                  href="/mi-cuenta"
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver al Panel
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Sidebar con filtros mejorado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                {/* Avatar section */}
                <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100/50">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-blue-100">
                    <span className="text-white font-bold text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{user?.name || 'Usuario'}</h3>
                  <p className="text-sm text-gray-600 mb-4">{orders.length} pedidos realizados</p>
                </div>
                
                {/* Filtros navigation */}
                <nav className="p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 px-4">Filtrar Pedidos</h3>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`w-full group flex items-center justify-between space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left mb-2 ${
                        filter === option.value
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          filter === option.value 
                            ? `bg-gradient-to-br ${option.color} shadow-lg` 
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <svg className={`w-5 h-5 ${filter === option.value ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                      <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full min-w-[24px] text-center">
                        {option.count}
                      </span>
                    </button>
                  ))}
                </nav>

                {/* Ordenamiento */}
                <div className="p-4 border-t border-gray-200/60">
                  <h4 className="font-medium mb-3 text-sm text-gray-700">Ordenar por</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="date_desc">Fecha más reciente</option>
                    <option value="date_asc">Fecha más antigua</option>
                    <option value="total_desc">Mayor valor</option>
                    <option value="total_asc">Menor valor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de pedidos */}
            <div className="lg:col-span-4">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
                      <div className="px-8 py-6 border-b border-gray-200/60 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <div className="animate-pulse">
                            <div className="h-6 w-32 bg-gray-200 rounded-xl mb-2"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded-lg"></div>
                          </div>
                          <div className="animate-pulse">
                            <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="px-8 py-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 w-3/4 bg-gray-200 rounded-lg"></div>
                          <div className="h-4 w-1/2 bg-gray-200 rounded-lg"></div>
                          <div className="h-4 w-2/3 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
                    >
                      {/* Header del pedido */}
                      <div className="px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-gray-100/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStatusColor(order.status)} flex items-center justify-center shadow-lg`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getStatusIcon(order.status)} />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                Pedido #{order.id}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-br ${getStatusColor(order.status)} text-white shadow-lg mb-2`}>
                              <span className="text-sm font-semibold">{getStatusText(order.status)}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatPrice(order.total)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.items_count} producto{order.items_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detalles del pedido */}
                      <div className="px-8 py-6">
                        {/* Productos (muestra los primeros 3) */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              Productos:
                            </h4>
                            <div className="space-y-3">
                              {order.items.slice(0, 3).map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">
                                      {formatPrice(item.price * item.quantity)}
                                    </p>
                                    {item.quantity > 1 && (
                                      <p className="text-sm text-gray-600">
                                        {formatPrice(item.price)} c/u
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="text-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                                  <p className="text-sm text-blue-700 font-medium">
                                    ... y {order.items.length - 3} producto{order.items.length - 3 !== 1 ? 's' : ''} más
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Información de envío y pago */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {order.shipping_address && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200/50">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                </div>
                                Envío:
                              </h4>
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Dirección:</strong> {order.shipping_address}
                              </p>
                              {order.shipping_method && (
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Método:</strong> {order.shipping_method}
                                </p>
                              )}
                              {order.tracking_number && (
                                <p className="text-sm text-gray-700">
                                  <strong>Tracking:</strong> 
                                  <button 
                                    onClick={() => handleTrackOrder(order.tracking_number)}
                                    className="text-purple-600 hover:text-purple-700 ml-1 underline font-medium"
                                  >
                                    {order.tracking_number}
                                  </button>
                                </p>
                              )}
                            </div>
                          )}

                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                              Pago:
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Método:</strong> {order.payment_method || 'No especificado'}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Estado:</strong> 
                              <span className={`ml-1 font-medium ${
                                order.payment_status === 'paid' ? 'text-green-600' :
                                order.payment_status === 'refunded' ? 'text-blue-600' :
                                'text-yellow-600'
                              }`}>
                                {order.payment_status === 'paid' ? 'Pagado' :
                                 order.payment_status === 'refunded' ? 'Reembolsado' :
                                 order.payment_status === 'pending' ? 'Pendiente' :
                                 'No especificado'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200/60">
                          <div className="flex items-center space-x-4">
                            {order.canTrack && order.tracking_number && (
                              <button 
                                onClick={() => handleTrackOrder(order.tracking_number)}
                                className="flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Rastrear Envío
                              </button>
                            )}
                            
                            {order.isCompleted && (
                              <button 
                                onClick={() => handleReorder(order.id)}
                                className="flex items-center text-green-600 hover:text-green-700 font-semibold text-sm bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Comprar de Nuevo
                              </button>
                            )}
                            
                            {order.canCancel && (
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancelingOrder === order.id}
                                className="flex items-center text-red-600 hover:text-red-700 font-semibold text-sm bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {cancelingOrder === order.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    Cancelando...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Cancelar Pedido
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center space-x-4">
                            <button className="flex items-center text-gray-600 hover:text-gray-700 font-semibold text-sm bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Descargar Factura
                            </button>
                            <Link
                              href={`/mi-cuenta/pedidos/${order.id}`}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver Detalles
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-12 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {filter === 'all' ? 'No tienes pedidos aún' : `No hay pedidos ${filterOptions.find(f => f.value === filter)?.label.toLowerCase()}`}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    {filter === 'all' 
                      ? 'Explora nuestro catálogo y realiza tu primera compra'
                      : 'Cambia el filtro para ver otros pedidos o explora nuestros productos'
                    }
                  </p>
                  <div className="flex justify-center space-x-6">
                    {filter !== 'all' && (
                      <button
                        onClick={() => setFilter('all')}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        Ver Todos los Pedidos
                      </button>
                    )}
                    <Link
                      href="/productos"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Explorar Productos
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withClientAuth(MisPedidosPage);