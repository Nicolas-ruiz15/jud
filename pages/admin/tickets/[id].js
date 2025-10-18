// pages/admin/tickets/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function TicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [ticket, setTicket] = useState(null);
  const [responses, setResponses] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado del formulario de respuesta
  const [responseForm, setResponseForm] = useState({
    message: '',
    is_internal: false,
    template_id: '',
    status: '',
    priority: '',
    assigned_to: '',
    resolution: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos del ticket
  useEffect(() => {
    if (id) {
      loadTicketData();
    }
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tickets/${id}`);
      if (!response.ok) {
        throw new Error('Ticket no encontrado');
      }

      const data = await response.json();
      setTicket(data.data.ticket);
      setResponses(data.data.responses || []);
      setTimeline(data.data.timeline || []);
      setTemplates(data.data.suggested_templates || []);
      
      // Inicializar formulario con valores actuales del ticket
      setResponseForm(prev => ({
        ...prev,
        status: data.data.ticket.status,
        priority: data.data.ticket.priority,
        assigned_to: data.data.ticket.assigned_to || ''
      }));

    } catch (err) {
      console.error('Error loading ticket:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío de respuesta y actualización
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!responseForm.message.trim() && !hasChanges()) {
      return;
    }

    try {
      setSubmitting(true);

      const updateData = {
        response_message: responseForm.message.trim(),
        response_is_internal: responseForm.is_internal,
        admin_user_name: 'Admin', // TODO: obtener del contexto de auth
        admin_user_email: 'admin@judaicabreslovcolombia.com' // TODO: obtener del contexto
      };

      // Solo incluir campos que han cambiado
      if (responseForm.status !== ticket.status) {
        updateData.status = responseForm.status;
      }
      if (responseForm.priority !== ticket.priority) {
        updateData.priority = responseForm.priority;
      }
      if (responseForm.assigned_to !== (ticket.assigned_to || '')) {
        updateData.assigned_to = responseForm.assigned_to || null;
      }
      if (responseForm.resolution.trim()) {
        updateData.resolution = responseForm.resolution;
      }

      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Error actualizando ticket');
      }

      // Limpiar formulario y recargar datos
      setResponseForm(prev => ({
        ...prev,
        message: '',
        template_id: '',
        resolution: ''
      }));

      await loadTicketData();
      
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Error actualizando ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar si hay cambios en el formulario
  const hasChanges = () => {
    return (
      responseForm.status !== ticket?.status ||
      responseForm.priority !== ticket?.priority ||
      responseForm.assigned_to !== (ticket?.assigned_to || '') ||
      responseForm.resolution.trim()
    );
  };

  // Aplicar plantilla de respuesta
  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      let message = template.message_template;
      
      // Reemplazar variables básicas
      message = message.replace(/{name}/g, ticket?.name || '');
      message = message.replace(/{ticket_number}/g, ticket?.ticket_number || '');
      message = message.replace(/{subject}/g, ticket?.subject || '');
      message = message.replace(/{product_name}/g, ticket?.product_name || '');
      
      setResponseForm(prev => ({
        ...prev,
        message: message
      }));
    }
  };

  // Función para obtener el color según estado
  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-800 border-red-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending_customer': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
      'closed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Función para obtener el color según prioridad
  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'bg-red-500 text-white',
      'medium': 'bg-yellow-500 text-yellow-900',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  // Función para formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket no encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'El ticket solicitado no existe'}</p>
          <Link
            href="/admin/tickets"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Volver a Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Ticket {ticket.ticket_number} - Admin Judaica Breslov</title>
      </Head>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/tickets"
                  className="text-gray-400 hover:text-gray-600"
                >
                  ← Volver
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  🎫 {ticket.ticket_number}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                  {ticket.status === 'open' ? 'Abierto' :
                   ticket.status === 'in_progress' ? 'En Progreso' :
                   ticket.status === 'pending_customer' ? 'Esperando Cliente' :
                   ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                  Prioridad {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{ticket.subject}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-500">
                <div>Creado: {formatDate(ticket.created_at)}</div>
                {ticket.updated_at !== ticket.created_at && (
                  <div>Actualizado: {formatDate(ticket.updated_at)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna principal - Conversación */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información del ticket */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Información del Ticket</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Cliente:</span>
                  <div className="mt-1">
                    <div className="font-medium">{ticket.name}</div>
                    <div className="text-sm text-gray-600">{ticket.email}</div>
                    {ticket.phone && (
                      <div className="text-sm text-gray-600">📞 {ticket.phone}</div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Tipo:</span>
                  <div className="mt-1 font-medium">
                    {ticket.type === 'soporte' ? 'Soporte Técnico' :
                     ticket.type === 'pedidos' ? 'Gestión de Pedidos' :
                     ticket.type === 'productos' ? 'Productos' :
                     ticket.type === 'quejas' ? 'Quejas y Reclamos' : 'General'}
                  </div>
                </div>
                {ticket.order_number && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Pedido:</span>
                    <div className="mt-1 font-medium text-blue-600">📦 {ticket.order_number}</div>
                  </div>
                )}
                {ticket.product_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Producto:</span>
                    <div className="mt-1 font-medium">🛍️ {ticket.product_name}</div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-500">Descripción original:</span>
                <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </div>

            {/* Historial de conversación */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">💬 Historial de Conversación</h3>
              </div>
              <div className="p-6">
                {responses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">💭</div>
                    <p>No hay respuestas aún. ¡Sé el primero en responder!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {responses.map((response, index) => (
                      <motion.div
                        key={response.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${response.user_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-3xl w-full ${
                          response.user_type === 'admin' 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : 'bg-gray-50 border-l-4 border-gray-400'
                        } rounded-lg p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                response.user_type === 'admin' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {response.user_type === 'admin' ? '👨‍💼 Equipo' : '👤 Cliente'}
                              </span>
                              <span className="font-medium text-gray-900">
                                {response.display_name}
                              </span>
                              {response.is_internal && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  🔒 Interno
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(response.created_at)}
                            </span>
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {response.message}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de respuesta */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">✍️ Responder al Cliente</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                {/* Plantillas de respuesta */}
                {templates.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plantillas de respuesta rápida:
                    </label>
                    <select
                      value={responseForm.template_id}
                      onChange={(e) => {
                        setResponseForm(prev => ({ ...prev, template_id: e.target.value }));
                        if (e.target.value) applyTemplate(e.target.value);
                      }}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mensaje de respuesta */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje:
                  </label>
                  <textarea
                    value={responseForm.message}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Escribe tu respuesta al cliente..."
                    rows="6"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Opciones de respuesta */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={responseForm.is_internal}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, is_internal: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      📝 Nota interna (no visible para el cliente)
                    </span>
                  </label>
                </div>

                {/* Resolución */}
                {(responseForm.status === 'resolved' || responseForm.status === 'closed') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la resolución:
                    </label>
                    <textarea
                      value={responseForm.resolution}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, resolution: e.target.value }))}
                      placeholder="Describe cómo se resolvió el problema..."
                      rows="3"
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Botón de envío */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || (!responseForm.message.trim() && !hasChanges())}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        📤 {responseForm.message.trim() ? 'Enviar Respuesta' : 'Actualizar Ticket'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Gestión del ticket */}
          <div className="space-y-6">
            
            {/* Estado y asignación */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚙️ Gestión del Ticket</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado:
                  </label>
                  <select
                    value={responseForm.status}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="open">🔴 Abierto</option>
                    <option value="in_progress">🔵 En Progreso</option>
                    <option value="pending_customer">🟡 Esperando Cliente</option>
                    <option value="resolved">🟢 Resuelto</option>
                    <option value="closed">⚫ Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad:
                  </label>
                  <select
                    value={responseForm.priority}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">🟢 Baja</option>
                    <option value="medium">🟡 Media</option>
                    <option value="high">🔴 Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asignado a:
                  </label>
                  <select
                    value={responseForm.assigned_to}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    <option value="1">Admin Principal</option>
                    <option value="2">Soporte Técnico</option>
                    <option value="3">Servicio al Cliente</option>
                  </select>
                </div>
              </div>

              {hasChanges() && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Hay cambios sin guardar. Envía una respuesta o actualiza el ticket para guardar los cambios.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Métricas del ticket */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Métricas</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Respuestas:</span>
                  <span className="font-medium">{responses.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tiempo abierto:</span>
                  <span className="font-medium">
                    {Math.round((new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60))}h
                  </span>
                </div>
                
                {ticket.first_response_time && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Primera respuesta:</span>
                    <span className="font-medium">
                      {Math.round(ticket.first_response_time / 60)}h
                    </span>
                  </div>
                )}
                
                {ticket.resolution_time && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tiempo resolución:</span>
                    <span className="font-medium">
                      {Math.round(ticket.resolution_time / 60)}h
                    </span>
                  </div>
                )}
                
                {ticket.customer_rating && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Calificación:</span>
                    <span className="font-medium">
                      {'⭐'.repeat(ticket.customer_rating)} ({ticket.customer_rating}/5)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline del ticket */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⏱️ Timeline</h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {timeline.map((event, eventIdx) => (
                    <li key={eventIdx}>
                      <div className="relative pb-8">
                        {eventIdx !== timeline.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              event.type === 'created' ? 'bg-blue-500' :
                              event.type === 'admin_response' ? 'bg-green-500' :
                              event.type === 'customer_response' ? 'bg-gray-500' :
                              event.type === 'escalation' ? 'bg-red-500' :
                              event.type === 'resolved' ? 'bg-green-600' :
                              'bg-gray-400'
                            }`}>
                              <span className="text-white text-xs">
                                {event.type === 'created' ? '🎫' :
                                 event.type === 'admin_response' ? '👨‍💼' :
                                 event.type === 'customer_response' ? '👤' :
                                 event.type === 'escalation' ? '⬆️' :
                                 event.type === 'resolved' ? '✅' : '📝'}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {event.description}
                              </p>
                              {event.details && (
                                <div className="mt-1 text-xs text-gray-400">
                                  {JSON.stringify(event.details, null, 2).slice(0, 100)}...
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(event.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Acciones Rápidas</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setResponseForm(prev => ({ ...prev, status: 'in_progress', assigned_to: '1' }))}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  🏃‍♂️ Tomar ticket y comenzar
                </button>
                
                <button
                  onClick={() => setResponseForm(prev => ({ ...prev, status: 'pending_customer' }))}
                  className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  ⏳ Esperando respuesta del cliente
                </button>
                
                <button
                  onClick={() => setResponseForm(prev => ({ ...prev, status: 'resolved' }))}
                  className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  ✅ Marcar como resuelto
                </button>
                
                <a
                  href={`https://wa.me/${ticket.phone?.replace(/[^\d]/g, '')}?text=Hola ${ticket.name}, te contacto desde Judaica Breslov sobre tu ticket ${ticket.ticket_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors text-sm block text-center"
                >
                  📱 Contactar por WhatsApp
                </a>
                
                <a
                  href={`mailto:${ticket.email}?subject=Re: Ticket ${ticket.ticket_number} - ${ticket.subject}`}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm block text-center"
                >
                  📧 Enviar email directo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}