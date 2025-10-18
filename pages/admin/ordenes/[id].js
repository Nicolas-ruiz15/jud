import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';

const OrderEditModal = ({ isOpen, onClose, order, onOrderUpdated }) => {
  const [items, setItems] = useState(order?.items || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [orderTotals, setOrderTotals] = useState({
    subtotal: order?.subtotal || 0,
    tax_amount: order?.tax_amount || 0,
    shipping_amount: order?.shipping_amount || 0,
    discount_amount: order?.discount_amount || 0,
    total_amount: order?.total_amount || 0
  });

  // Buscar productos
  const searchProducts = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/search-products?search=${encodeURIComponent(term)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Cargar items actuales cuando se abre el modal
  useEffect(() => {
    if (isOpen && order?.id) {
      loadCurrentItems();
    }
  }, [isOpen, order?.id]);

  const loadCurrentItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items`);
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto
  const addProduct = async (product, quantity = 1) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: quantity,
          price: product.price
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCurrentItems(); // Recargar items
        setOrderTotals(data.data.orderTotals); // Actualizar totales
        setSearchTerm(''); // Limpiar búsqueda
        setSearchResults([]);
        alert(`✅ Producto "${product.name}" agregado exitosamente`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar cantidad/precio de item
  const updateItem = async (itemId, field, value) => {
    setSaving(true);
    try {
      const payload = { item_id: itemId };
      payload[field] = parseFloat(value);

      const response = await fetch(`/api/admin/orders/${order.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCurrentItems();
        setOrderTotals(data.data.orderTotals);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error actualizando item:', error);
      alert('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar item
  const deleteItem = async (itemId, productName) => {
    if (!confirm(`¿Eliminar "${productName}" del pedido?`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items?item_id=${itemId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCurrentItems();
        setOrderTotals(data.data.orderTotals);
        alert(`✅ Producto "${productName}" eliminado`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error eliminando item:', error);
      alert('❌ Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(amount || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">
            📝 Editar Pedido #{order.order_number}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Panel izquierdo - Items actuales */}
          <div className="w-2/3 p-6 overflow-y-auto border-r border-gray-200">
            <h4 className="font-semibold text-lg mb-4">📦 Productos en el Pedido</h4>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  📦
                </div>
                <p>No hay productos en este pedido</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                        {item.product_sku && (
                          <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteItem(item.id, item.product_name)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          disabled={saving}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          disabled={saving}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <div className="px-2 py-1 bg-gray-100 rounded-md text-sm font-semibold">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho - Buscar y agregar productos */}
          <div className="w-1/3 p-6 overflow-y-auto">
            <h4 className="font-semibold text-lg mb-4">🔍 Agregar Productos</h4>
            
            {/* Búsqueda */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Resultados de búsqueda */}
            <div className="space-y-3">
              {searchLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : searchTerm.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    🔍
                  </div>
                  <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    😕
                  </div>
                  <p className="text-sm">No se encontraron productos</p>
                </div>
              ) : (
                searchResults.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h6 className="font-medium text-sm text-gray-900">{product.name}</h6>
                        {product.sku && (
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        )}
                        {product.source === 'order_history' && (
                          <p className="text-xs text-blue-600">📈 Usado {product.usage_count} vez(es)</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {product.formatted_price}
                        </p>
                        {product.stock_quantity !== 999 && (
                          <p className="text-xs text-gray-500">
                            Stock: {product.stock_quantity}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={product.stock_quantity !== 999 ? product.stock_quantity : 999}
                        defaultValue="1"
                        id={`qty-${product.id}`}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const quantity = parseInt(document.getElementById(`qty-${product.id}`).value) || 1;
                          addProduct(product, quantity);
                        }}
                        disabled={saving || !product.in_stock}
                        className="flex-1 bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? '...' : '+ Agregar'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer con totales */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <p className="font-semibold">{formatCurrency(orderTotals.subtotal)}</p>
                </div>
                {orderTotals.tax_amount > 0 && (
                  <div>
                    <span className="text-gray-600">Impuestos:</span>
                    <p className="font-semibold">{formatCurrency(orderTotals.tax_amount)}</p>
                  </div>
                )}
                {orderTotals.shipping_amount > 0 && (
                  <div>
                    <span className="text-gray-600">Envío:</span>
                    <p className="font-semibold">{formatCurrency(orderTotals.shipping_amount)}</p>
                  </div>
                )}
                {orderTotals.discount_amount > 0 && (
                  <div>
                    <span className="text-gray-600">Descuento:</span>
                    <p className="font-semibold text-green-600">-{formatCurrency(orderTotals.discount_amount)}</p>
                  </div>
                )}
              </div>
              <div className="text-lg">
                <span className="text-gray-600">Total Final:</span>
                <span className="font-bold text-gray-900 ml-2">
                  {formatCurrency(orderTotals.total_amount)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onOrderUpdated(orderTotals);
                  onClose();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                ✅ Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🆕 COMPONENTE PARA GESTIÓN COMPLETA DE EMAILS
const EmailManagement = ({ order, onEmailSent }) => {
  const [selectedEmailType, setSelectedEmailType] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const emailTypes = {
    bank_transfer_instructions: {
      name: 'Instrucciones de Transferencia',
      description: 'Envía las instrucciones de pago por transferencia bancaria',
      icon: '🏦'
    },
    order_confirmation: {
      name: 'Confirmación de Pedido',
      description: 'Confirma que el pedido fue recibido',
      icon: '✅'
    },
    status_update: {
      name: 'Actualización de Estado',
      description: 'Notifica cambios en el estado del pedido',
      icon: '📋'
    },
    payment_confirmation: {
      name: 'Confirmación de Pago',
      description: 'Confirma que el pago fue recibido',
      icon: '💳'
    },
    shipped_notification: {
      name: 'Pedido Enviado',
      description: 'Notifica que el pedido está en camino',
      icon: '🚚'
    },
    delivered_notification: {
      name: 'Pedido Entregado',
      description: 'Confirma la entrega del pedido',
      icon: '✅'
    },
    custom: {
      name: 'Email Personalizado',
      description: 'Mensaje personalizado',
      icon: '✉️'
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEmailType) {
      alert('Selecciona un tipo de email');
      return;
    }

    if (selectedEmailType === 'custom' && (!customMessage || !customSubject)) {
      alert('Completa el mensaje y asunto personalizados');
      return;
    }

    setSending(true);
    try {
      const payload = {
        email_type: selectedEmailType,
        ...(selectedEmailType === 'custom' && {
          custom_message: customMessage,
          custom_subject: customSubject
        }),
        ...(selectedEmailType === 'status_update' && customMessage && {
          custom_message: customMessage
        }),
        ...(selectedEmailType === 'shipped_notification' && customMessage && {
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
        alert(`✅ Email "${emailTypes[selectedEmailType].name}" enviado exitosamente`);
        setSelectedEmailType('');
        setCustomMessage('');
        setCustomSubject('');
        if (onEmailSent) onEmailSent(data);
        loadEmailHistory(); // Recargar historial
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

  const loadEmailHistory = async () => {
    setLoadingHistory(true);
    try {
      // Esta API la crearemos después si la necesitas
      const response = await fetch(`/api/admin/orders/${order.id}/email-history`);
      if (response.ok) {
        const data = await response.json();
        setEmailHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (order?.id) {
      loadEmailHistory();
    }
  }, [order?.id]);

  return (
    <div className="space-y-6">
      {/* Envío de nuevo email */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Enviar Email al Cliente</h4>
        <p className="text-sm text-blue-700 mb-4">Para: {order.customer_email}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Email
            </label>
            <select
              value={selectedEmailType}
              onChange={(e) => setSelectedEmailType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un tipo...</option>
              {Object.entries(emailTypes).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
            {selectedEmailType && emailTypes[selectedEmailType] && (
              <p className="text-sm text-gray-600 mt-1">
                {emailTypes[selectedEmailType].description}
              </p>
            )}
          </div>

          {selectedEmailType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe tu mensaje personalizado..."
                />
              </div>
            </>
          )}

          {(selectedEmailType === 'status_update' || selectedEmailType === 'shipped_notification') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje adicional (opcional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Información adicional para incluir en el email..."
              />
            </div>
          )}

          <button
            onClick={handleSendEmail}
            disabled={sending || !selectedEmailType}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              '📧 Enviar Email'
            )}
          </button>
        </div>
      </div>

      {/* Historial de emails (opcional) */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Historial de Emails</h4>
        {loadingHistory ? (
          <p className="text-sm text-gray-500">Cargando historial...</p>
        ) : emailHistory.length > 0 ? (
          <div className="space-y-2">
            {emailHistory.map((email, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-gray-600">Para: {email.recipient}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(email.sent_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No se han enviado emails para esta orden.</p>
        )}
      </div>
    </div>
  );
};

// Componentes de UI
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const InfoCard = ({ title, icon, children, className = "" }) => (
  <div className={`bg-white shadow-soft rounded-xl overflow-hidden border border-gray-100 ${className}`}>
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && <div className="text-gray-500">{icon}</div>}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  
  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  return (
    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${styles[type]}`}>
      <span className="flex-grow">{message}</span>
      <button onClick={onDismiss} className="text-white hover:text-gray-200 font-bold text-lg">
        ×
      </button>
    </div>
  );
};

const AddressBlock = ({ address, title }) => {
  if (!address) {
    return (
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
        <p className="text-sm text-gray-500">No hay información de dirección disponible.</p>
      </div>
    );
  }

  const hasAddress = address.address || address.city || address.state;
  const hasPersonalInfo = address.first_name || address.last_name || address.email || address.phone;

  if (!hasAddress && !hasPersonalInfo) {
    return (
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
        <p className="text-sm text-gray-500">No hay información disponible.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="text-sm text-gray-600 space-y-1">
        {(address.first_name || address.last_name) && (
          <p className="font-medium text-gray-800">
            {address.first_name} {address.last_name}
          </p>
        )}
        {address.company && (
          <p className="text-gray-700">{address.company}</p>
        )}
        {address.address && <p>{address.address}</p>}
        {address.address_2 && <p>{address.address_2}</p>}
        {(address.city || address.state) && (
          <p>
            {address.city}{address.state ? `, ${address.state}` : ''}
          </p>
        )}
        {address.country && <p>{address.country}</p>}
        {address.email && (
          <p><strong>Email:</strong> <a href={`mailto:${address.email}`} className="text-blue-600 hover:text-blue-800">{address.email}</a></p>
        )}
        {address.phone && (
          <p><strong>Teléfono:</strong> <a href={`tel:${address.phone}`} className="text-blue-600 hover:text-blue-800">{address.phone}</a></p>
        )}
      </div>
    </div>
  );
};

const OrderDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [order, setOrder] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: null, type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: null, type: 'success' }), 5000);
  };

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cargar la orden.');
      
      setOrder(data.data);
      setNotes(data.data.admin_notes || '');
    } catch (err) {
      setError(err.message);
      console.error('Error cargando orden:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdate = async (payload) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al actualizar.');

      showNotification('Orden actualizada exitosamente', 'success');
      await fetchOrder();
    } catch (err) {
      showNotification(err.message, 'error');
      console.error('Error actualizando orden:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Pendiente', icon: '⏳' },
      processing: { variant: 'info', label: 'Procesando', icon: '⚙️' },
      shipped: { variant: 'purple', label: 'Enviado', icon: '🚚' },
      delivered: { variant: 'success', label: 'Entregado', icon: '✅' },
      cancelled: { variant: 'error', label: 'Cancelado', icon: '❌' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Pendiente', icon: '⏳' },
      completed: { variant: 'success', label: 'Completado', icon: '✅' },
      failed: { variant: 'error', label: 'Fallido', icon: '❌' },
      refunded: { variant: 'default', label: 'Reembolsado', icon: '↩️' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Cargando...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Error">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Error al Cargar la Orden</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => router.push('/admin/ordenes')} 
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Orden no encontrada">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600">Orden no encontrada</h2>
          <button 
            onClick={() => router.push('/admin/ordenes')} 
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Volver a Órdenes
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Orden #${order.order_number || order.id}`}>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onDismiss={() => setNotification({ message: null, type: 'success' })} 
      />
      
      {/* Header completo */}
      <div className="bg-white shadow-soft rounded-xl p-6 mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">#{order.order_number || order.id}</h1>
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.payment_status)}
              {order.flags?.from_woocommerce && (
                <Badge variant="info">WooCommerce #{order.woocommerce_id}</Badge>
              )}
              {order.flags?.is_guest_order && (
                <Badge variant="warning">Invitado</Badge>
              )}
              {order.flags?.has_coupons && (
                <Badge variant="purple">Con Cupones</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total:</span>
                <p className="font-semibold text-lg text-gray-900">{formatCurrency(order.total_amount)}</p>
                {order.flags?.has_discount && (
                  <p className="text-green-600 text-xs">💰 Con descuento</p>
                )}
              </div>
              <div>
                <span className="text-gray-500">Cliente:</span>
                <p className="font-medium">{order.customer_name || 'No disponible'}</p>
                <p className="text-gray-600">{order.customer_email || 'Sin email'}</p>
                {order.customer_phone && (
                  <p className="text-gray-600">📞 {order.customer_phone}</p>
                )}
              </div>
              <div>
                <span className="text-gray-500">Creada:</span>
                <p className="font-medium">{formatDate(order.created_at)}</p>
                {order.created_via && (
                  <p className="text-gray-600">vía {order.created_via}</p>
                )}
              </div>
              <div>
                <span className="text-gray-500">Pago:</span>
                <p className="font-medium">{order.payment_method || 'No especificado'}</p>
                {order.payment_reference && (
                  <p className="text-gray-600">Ref: {order.payment_reference}</p>
                )}
                {order.epayco_transaction_id && (
                  <p className="text-gray-600">ePayco: {order.epayco_transaction_id}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Items:</span>
                <p className="font-medium">{order.items?.length || 0} productos</p>
              </div>
              {order.flags?.has_shipping && (
                <div>
                  <span className="text-gray-500">Envío:</span>
                  <p className="font-medium">{formatCurrency(order.shipping_amount)}</p>
                </div>
              )}
              {order.date_paid && (
                <div>
                  <span className="text-gray-500">Fecha de Pago:</span>
                  <p className="font-medium">{formatDate(order.date_paid)}</p>
                </div>
              )}
              {order.date_completed && (
                <div>
                  <span className="text-gray-500">Completado:</span>
                  <p className="font-medium">{formatDate(order.date_completed)}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => router.push('/admin/ordenes')} 
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-4 h-4" />
              <span>Volver</span>
            </button>
            
            <button 
              onClick={() => window.print()} 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
		
		{/* 🆕 GESTIÓN DE EMAILS */}
          <InfoCard 
            title="Gestión de Emails" 
            icon={<Icon path="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
          >
            <EmailManagement 
              order={order} 
              onEmailSent={(data) => showNotification(`Email enviado: ${data.subject}`, 'success')} 
            />
          </InfoCard>
          
          {/* Productos */}
          <InfoCard 
            title={`Productos (${order.items?.length || 0})`} 
            icon={<Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
          >
            {order.items && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      📦
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.product_name || 'Producto'}</h4>
                      {item.product_sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {item.quantity || 1} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-900">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay productos en esta orden.</p>
            )}

            {/* Cupones */}
            {order.coupon_lines && order.coupon_lines.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h5 className="font-medium text-gray-800 mb-3">Cupones Utilizados:</h5>
                {order.coupon_lines.map((coupon, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded-md mb-2">
                    <span className="font-mono bg-green-200 text-green-800 px-2 py-1 rounded">
                      {coupon.code || `Cupón ${index + 1}`}
                    </span>
                    <span className="font-semibold text-green-700">
                      -{formatCurrency(coupon.discount || coupon.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Líneas de envío */}
            {order.shipping_lines && order.shipping_lines.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-800 mb-3">Métodos de Envío:</h5>
                {order.shipping_lines.map((shipping, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-blue-50 rounded-md mb-2">
                    <span className="text-blue-800">
                      {shipping.method_title || shipping.name || 'Envío estándar'}
                    </span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(shipping.total || shipping.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Líneas de impuestos */}
            {order.tax_lines && order.tax_lines.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-800 mb-3">Impuestos Aplicados:</h5>
                {order.tax_lines.map((tax, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-yellow-50 rounded-md mb-2">
                    <span className="text-yellow-800">
                      {tax.label || tax.name || `Impuesto ${tax.rate ? `(${tax.rate}%)` : ''}`}
                    </span>
                    <span className="font-semibold text-yellow-700">
                      {formatCurrency(tax.tax_total || tax.amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totales */}
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal productos:</span>
                <span className="font-medium text-gray-800">{formatCurrency(order.subtotal)}</span>
              </div>
              
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(order.shipping_amount)}</span>
                </div>
              )}
              
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="font-semibold">Descuento aplicado:</span>
                  <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold border-t-2 border-gray-900 pt-3 mt-4">
                <span className="text-gray-900">Total Final:</span>
                <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
              </div>
			  {/* 🆕 SOLO USAR EL BOTÓN AQUÍ */}
				<EditOrderButton 
  					order={order} 
 					 onOrderUpdated={(newTotals) => {
  					  setOrder(prev => ({
     				 ...prev,
     				 ...newTotals,
     				 items: undefined
    				}));
   					 fetchOrder();
  						}} 
				/>
              
              {order.prices_include_tax && (
                <div className="text-xs text-gray-500 text-center">
                  * Los precios incluyen impuestos
                </div>
              )}
            </div>
          </InfoCard>

          {/* Información del cliente */}
          <InfoCard 
            title="Información Completa del Cliente" 
            icon={<Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AddressBlock address={order.shipping_address} title="Dirección de Envío" />
              <AddressBlock address={order.billing_address} title="Dirección de Facturación" />
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Información Técnica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {order.customer_ip_address && (
                  <div>
                    <span className="text-gray-500">IP del Cliente:</span>
                    <p className="font-medium">{order.customer_ip_address}</p>
                  </div>
                )}
                {order.user_id && (
                  <div>
                    <span className="text-gray-500">Usuario Registrado:</span>
                    <p className="font-medium">ID #{order.user_id}</p>
                  </div>
                )}
                {order.session_id && (
                  <div>
                    <span className="text-gray-500">Sesión:</span>
                    <p className="font-mono text-xs">{order.session_id.substring(0, 16)}...</p>
                  </div>
                )}
                {order.cart_hash && (
                  <div>
                    <span className="text-gray-500">Hash del Carrito:</span>
                    <p className="font-mono text-xs">{order.cart_hash.substring(0, 16)}...</p>
                  </div>
                )}
              </div>
              
              {order.customer_user_agent && (
                <div className="mt-4">
                  <span className="text-gray-500">Navegador del Cliente:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                    {order.customer_user_agent}
                  </p>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <InfoCard 
              title="Historial de la Orden" 
              icon={<Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            >
              <div className="space-y-4">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {event.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(event.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Controles de estado */}
          <InfoCard title="Controles de Estado">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de la orden</label>
                <select 
                  value={order.status} 
                  onChange={(e) => handleUpdate({ status: e.target.value })} 
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="processing">⚙️ Procesando</option>
                  <option value="shipped">🚚 Enviado</option>
                  <option value="delivered">✅ Entregado</option>
                  <option value="cancelled">❌ Cancelado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del pago</label>
                <select 
                  value={order.payment_status} 
                  onChange={(e) => handleUpdate({ payment_status: e.target.value })} 
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="completed">✅ Completado</option>
                  <option value="failed">❌ Fallido</option>
                  <option value="refunded">↩️ Reembolsado</option>
                </select>
              </div>
            </div>
          </InfoCard>

          {/* Información de pago */}
          <InfoCard 
            title="Información Completa de Pago" 
            icon={<Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
          >
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Método:</span>
                <span className="font-semibold text-gray-800">{order.payment_method || 'N/A'}</span>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Referencia:</span>
                  <span className="font-semibold text-gray-800">{order.payment_reference}</span>
                </div>
              )}
              {order.epayco_transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID ePayco:</span>
                  <span className="font-semibold text-gray-800">{order.epayco_transaction_id}</span>
                </div>
              )}
              {order.customer_ip_address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Cliente:</span>
                  <span className="font-semibold text-gray-800">{order.customer_ip_address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Moneda:</span>
                <span className="font-semibold text-gray-800">{order.currency || 'COP'}</span>
              </div>
              {order.prices_include_tax && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Precios:</span>
                  <span className="font-semibold text-gray-800">Incluyen impuestos</span>
                </div>
              )}
              {order.date_paid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de pago:</span>
                  <span className="font-semibold text-gray-800">{formatDate(order.date_paid)}</span>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Información del sistema */}
          <InfoCard 
            title="Información del Sistema" 
            icon={<Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
          >
            <div className="space-y-3 text-sm">
              {order.created_via && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado vía:</span>
                  <span className="font-semibold text-gray-800">{order.created_via}</span>
                </div>
              )}
              {order.woocommerce_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">WooCommerce ID:</span>
                  <span className="font-semibold text-gray-800">#{order.woocommerce_id}</span>
                </div>
              )}
              {order.woo_version && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Versión WC:</span>
                  <span className="font-semibold text-gray-800">{order.woo_version}</span>
                </div>
              )}
              {order.user_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario ID:</span>
                  <span className="font-semibold text-gray-800">#{order.user_id}</span>
                </div>
              )}
              {order.cart_hash && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hash carrito:</span>
                  <span className="font-mono text-xs text-gray-800">{order.cart_hash.substring(0, 12)}...</span>
                </div>
              )}
              {order.session_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID sesión:</span>
                  <span className="font-mono text-xs text-gray-800">{order.session_id.substring(0, 12)}...</span>
                </div>
              )}
              {order.customer_user_agent && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Navegador:</span>
                  <p className="font-mono text-xs text-gray-800 mt-1">{order.customer_user_agent}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-semibold text-gray-800">{formatDate(order.updated_at)}</span>
              </div>
            </div>
          </InfoCard>

          {/* Estado de la orden con flags */}
          {order.flags && (
            <InfoCard title="Estado Detallado">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded ${order.flags.is_paid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {order.flags.is_paid ? '✅ Pagado' : '❌ Sin pagar'}
                </div>
                <div className={`p-2 rounded ${order.flags.is_completed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {order.flags.is_completed ? '✅ Completado' : '⏳ En proceso'}
                </div>
                <div className={`p-2 rounded ${order.flags.has_complete_billing ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {order.flags.has_complete_billing ? '✅ Dir. Facturación' : '❌ Sin dirección'}
                </div>
                <div className={`p-2 rounded ${order.flags.has_complete_shipping ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {order.flags.has_complete_shipping ? '✅ Dir. Envío' : '❌ Sin dirección'}
                </div>
                {order.flags.is_guest_order && (
                  <div className="col-span-2 p-2 rounded bg-orange-50 text-orange-700 text-center">
                    👤 Cliente Invitado
                  </div>
                )}
                {order.flags.from_woocommerce && (
                  <div className="col-span-2 p-2 rounded bg-blue-50 text-blue-700 text-center">
                    🛒 Desde WooCommerce
                  </div>
                )}
                {order.flags.has_coupons && (
                  <div className="col-span-2 p-2 rounded bg-purple-50 text-purple-700 text-center">
                    🎫 Con Cupones
                  </div>
                )}
              </div>
            </InfoCard>
          )}

          {/* Metadata adicional si existe */}
          {order.order_meta_data && order.order_meta_data.length > 0 && (
            <InfoCard title="Metadata Adicional">
              <div className="text-xs text-gray-500 space-y-2 max-h-48 overflow-y-auto">
                {order.order_meta_data.slice(0, 10).map((meta, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">{meta.key}:</p>
                    <p className="font-mono break-all">
                      {typeof meta.value === 'object' ? JSON.stringify(meta.value).substring(0, 100) : String(meta.value).substring(0, 100)}
                      {String(meta.value).length > 100 && '...'}
                    </p>
                  </div>
                ))}
                {order.order_meta_data.length > 10 && (
                  <p className="text-center text-gray-400">
                    Y {order.order_meta_data.length - 10} elementos más...
                  </p>
                )}
              </div>
            </InfoCard>
          )}

          {/* Notas administrativas */}
          <InfoCard 
            title="Notas Administrativas" 
            icon={<Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
          >
            <div className="space-y-3">
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" 
                placeholder="Agregar notas internas..."
              />
              <button 
                onClick={() => handleUpdate({ admin_notes: notes })} 
                disabled={updating} 
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Guardando...' : 'Guardar Notas'}
              </button>
            </div>
            
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-800 mb-2">Notas del Cliente:</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{order.notes}</p>
              </div>
            )}
          </InfoCard>
        </div>
      </div>
    </AdminLayout>
  );
};
// 🆕 AGREGAR ESTE COMPONENTE QUE FALTA
const EditOrderButton = ({ order, onOrderUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowEditModal(true)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
          <span>📝 Editar Pedido</span>
        </button>
      </div>

      <OrderEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={order}
        onOrderUpdated={(newTotals) => {
          onOrderUpdated(newTotals);
          alert('✅ Pedido actualizado exitosamente');
        }}
      />
    </>
  );
};
export default OrderDetail;