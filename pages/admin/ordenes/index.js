import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

// 🆕 MODAL PARA ENVÍO RÁPIDO DE EMAILS
const QuickEmailModal = ({ isOpen, onClose, order, onSend }) => {
  const [emailType, setEmailType] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [sending, setSending] = useState(false);

  const emailTypes = {
    bank_transfer_instructions: 'Instrucciones de Transferencia',
    order_confirmation: 'Confirmación de Pedido',
    status_update: 'Actualización de Estado',
    payment_confirmation: 'Confirmación de Pago',
    shipped_notification: 'Pedido Enviado',
    delivered_notification: 'Pedido Entregado',
    custom: 'Email Personalizado'
  };

  const handleSend = async () => {
    if (!emailType) {
      alert('Selecciona un tipo de email');
      return;
    }

    if (emailType === 'custom' && (!customMessage || !customSubject)) {
      alert('Completa el mensaje y asunto personalizados');
      return;
    }

    setSending(true);
    try {
      const payload = {
        email_type: emailType,
        ...(emailType === 'custom' && {
          custom_message: customMessage,
          custom_subject: customSubject
        }),
        ...(emailType === 'status_update' && customMessage && {
          custom_message: customMessage
        }),
        ...(emailType === 'shipped_notification' && customMessage && {
          custom_message: customMessage
        })
      };

      const response = await fetch(`/api/admin/orders/${order.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Email enviado exitosamente a ${order.customer_email}`);
        onSend(data);
        onClose();
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error enviando email:', error);
      alert('❌ Error de conexión');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Enviar Email - #{order.order_number}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para: {order.customer_email}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Email
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona un tipo...</option>
              {Object.entries(emailTypes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {emailType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Asunto del email..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Escribe tu mensaje..."
                />
              </div>
            </>
          )}

          {(emailType === 'status_update' || emailType === 'shipped_notification') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje adicional (opcional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Información adicional..."
              />
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !emailType}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Enviando...' : 'Enviar Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrdersAdmin = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    search: router.query.search || '',
    status: router.query.status || '',
    payment_status: router.query.payment_status || '',
    date_from: router.query.date_from || '',
    date_to: router.query.date_to || '',
    page: parseInt(router.query.page) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
	 
	// 🆕 ESTADO PARA EL MODAL DE EMAIL
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    order: null
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/orders?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setPagination(data.pagination);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };
	
  const handleQuickEmail = (order) => {
    setEmailModal({
      isOpen: true,
      order: order
    });
  };

  const handleEmailSent = (emailData) => {
    console.log('Email enviado:', emailData);
    // Opcional: Actualizar la lista o mostrar notificación
  };

  const closeEmailModal = () => {
    setEmailModal({
      isOpen: false,
      order: null
    });
  };

  const handleFilterChange = (key, value) => {
    let newFilters;
    
    if (key === 'page') {
      newFilters = { ...filters, [key]: value };
    } else {
      newFilters = { ...filters, [key]: value, page: 1 };
    }
    
    setFilters(newFilters);
    
    // Actualizar URL
    const queryParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== '') queryParams.set(k, v);
    });
    
    router.push(`/admin/ordenes?${queryParams.toString()}`, undefined, { shallow: true });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchOrders();
        alert('Estado actualizado exitosamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error actualizando el estado');
    }
  };

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

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'failed': 'Fallido',
      'refunded': 'Reembolsado'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getOrderSourceBadge = (order) => {
    if (order.from_woocommerce) {
      return <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">WooCommerce</span>;
    }
    if (order.created_via) {
      return <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{order.created_via}</span>;
    }
    return null;
  };

  return (
    <AdminLayout title="Gestión de Órdenes">
      {/* Header con resumen mejorado */}
      <div className="bg-white shadow-soft rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Órdenes ({pagination.total || 0})
              </h2>
              {summary.total_revenue && (
                <p className="text-sm text-gray-600">
                  Ingresos totales: {formatCurrency(summary.total_revenue)}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchOrders()}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                🔄 Actualizar
              </button>
              <Link
                href="/admin/reportes"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                📊 Reportes
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Búsqueda expandida */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Buscar por número, email, nombre, teléfono..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Estado */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            {/* Estado de pago */}
            <select
              value={filters.payment_status}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los pagos</option>
              <option value="pending">Pago pendiente</option>
              <option value="completed">Pago completado</option>
              <option value="failed">Pago fallido</option>
              <option value="refunded">Reembolsado</option>
            </select>

            {/* Fecha desde */}
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />

            {/* Fecha hasta */}
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de órdenes mejorada */}
      <div className="bg-white shadow-soft rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando órdenes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              🛒
            </div>
            <p className="text-gray-500 mb-4">No se encontraron órdenes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.order_number}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{order.total_items} item{order.total_items !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{order.total_quantity} unidades</span>
                            {getOrderSourceBadge(order)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer_email}
                          </div>
                          {order.customer_phone && (
                            <div className="text-sm text-gray-500">
                              📞 {order.customer_phone}
                            </div>
                          )}
                          {order.customer_city && (
                            <div className="text-sm text-gray-500">
                              📍 {order.customer_city}{order.customer_state ? `, ${order.customer_state}` : ''}
                            </div>
                          )}
                          {order.is_guest_order && (
                            <span className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              Invitado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.formatted_total}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.payment_method}
                          </div>
                          {order.has_discount && (
                            <div className="text-xs text-green-600">
                              💰 Descuento aplicado
                            </div>
                          )}
                          {order.has_shipping && (
                            <div className="text-xs text-blue-600">
                              🚚 Envío: {formatCurrency(order.shipping_amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getPaymentStatusBadge(order.payment_status)}
                          {order.payment_reference && (
                            <div className="text-xs text-gray-500">
                              Ref: {order.payment_reference}
                            </div>
                          )}
                          {order.epayco_transaction_id && (
                            <div className="text-xs text-gray-500">
                              ePayco: {order.epayco_transaction_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{formatDate(order.created_at)}</div>
                          {order.date_paid && order.date_paid !== order.created_at && (
                            <div className="text-xs text-green-600">
                              💳 Pagado: {formatDate(order.date_paid)}
                            </div>
                          )}
                          {order.date_completed && (
                            <div className="text-xs text-blue-600">
                              ✅ Completado: {formatDate(order.date_completed)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <Link
                            href={`/admin/ordenes/${order.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalles
                          </Link>
                          
                          {/* 🆕 BOTÓN DE ENVÍO RÁPIDO DE EMAIL */}
                          {order.customer_email !== 'No disponible' && (
                            <button
                              onClick={() => handleQuickEmail(order)}
                              className="text-purple-600 hover:text-purple-900 text-left"
                            >
                              📧 Enviar Email
                            </button>
                          )}
                          
                          {order.is_paid && (
                            <button
                              onClick={() => window.open(`/admin/ordenes/${order.id}/factura`, '_blank')}
                              className="text-green-600 hover:text-green-900 text-left"
                            >
                              Factura
                            </button>
                          )}
                          
                          <button
                            onClick={() => window.open(`mailto:${order.customer_email}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900 text-left"
                          >
                            Contactar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Mostrando {pagination.startRecord || ((pagination.page - 1) * pagination.limit) + 1} a {pagination.endRecord || Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} órdenes
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex space-x-1">
                      {(() => {
                        const currentPage = pagination.page;
                        const totalPages = pagination.totalPages;
                        const maxVisible = 5;
                        
                        let startPage, endPage;
                        
                        if (totalPages <= maxVisible) {
                          startPage = 1;
                          endPage = totalPages;
                        } else {
                          if (currentPage <= 3) {
                            startPage = 1;
                            endPage = maxVisible;
                          } else if (currentPage >= totalPages - 2) {
                            startPage = totalPages - maxVisible + 1;
                            endPage = totalPages;
                          } else {
                            startPage = currentPage - 2;
                            endPage = currentPage + 2;
                          }
                        }
                        
                        const pages = [];
                        
                        for (let i = startPage; i <= endPage; i++) {
                          const isActive = i === currentPage;
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handleFilterChange('page', i)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                                isActive
                                  ? 'bg-primary-600 border-primary-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>

                    <button
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Resumen estadístico mejorado */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-soft rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
              ⏳
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.orders_by_status?.pending || orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-soft rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              ⚙️
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Procesando</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.orders_by_status?.processing || orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-soft rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
              🚚
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Enviadas</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.orders_by_status?.shipped || orders.filter(o => o.status === 'shipped').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-soft rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
              ✅
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Entregadas</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.orders_by_status?.delivered || orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>
	  {/* 🆕 MODAL DE EMAIL RÁPIDO */}
      <QuickEmailModal
        isOpen={emailModal.isOpen}
        onClose={closeEmailModal}
        order={emailModal.order}
        onSend={handleEmailSent}
      />
    </AdminLayout>
  );
};

export default OrdersAdmin;