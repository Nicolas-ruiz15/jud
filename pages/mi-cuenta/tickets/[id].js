// pages/mi-cuenta/tickets/[id].js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import withClientAuth from '../../../components/withClientAuth';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

function TicketDetailPage({ user }) {
  const [ticket, setTicket] = useState(null);
  const [responses, setResponses] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canRespond, setCanRespond] = useState(false);
  const [canRate, setCanRate] = useState(false);
  
  const [newResponse, setNewResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      loadTicketDetail();
    }
  }, [id]);

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/user/tickets/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTicket(data.data.ticket);
          setResponses(data.data.responses);
          setTimeline(data.data.timeline);
          setCanRespond(data.data.can_respond);
          setCanRate(data.data.can_rate);
        }
      } else if (response.status === 404) {
        toast.error('Ticket no encontrado');
        router.push('/mi-cuenta/tickets');
      } else {
        toast.error('Error cargando ticket');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!newResponse.trim()) {
      toast.error('El mensaje es obligatorio');
      return;
    }

    try {
      setSubmittingResponse(true);
      
      const response = await fetch(`/api/user/tickets/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newResponse.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Respuesta enviada exitosamente');
          setNewResponse('');
          loadTicketDetail(); // Recargar para ver la nueva respuesta
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error enviando respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmittingRating(true);
      
      const response = await fetch(`/api/user/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customer_rating: rating,
          customer_feedback: feedback.trim() || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Calificación guardada exitosamente');
          loadTicketDetail(); // Recargar para ver la calificación
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error guardando calificación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSubmittingRating(false);
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
      high: '🔴 Alta',
      medium: '🟡 Media',
      low: '🟢 Baja'
    };
    return texts[priority] || priority;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineIcon = (type) => {
    const icons = {
      created: '🎫',
      admin_response: '👨‍💼',
      customer_response: '🙋‍♂️',
      escalation: '⬆️',
      resolved: '✅',
      closed: '🔒'
    };
    return icons[type] || '📝';
  };

  const getTimelineColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      gray: 'bg-gray-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Layout title="Cargando ticket...">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando ticket...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout title="Ticket no encontrado">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket no encontrado</h1>
            <Link href="/mi-cuenta/tickets" className="text-blue-600 hover:text-blue-700">
              Volver a Mis Tickets
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Ticket #${ticket.ticket_number} | Judaica Breslov Colombia`}
      description="Detalle y conversación del ticket de soporte"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-blue-600">Inicio</Link>
              <span>/</span>
              <Link href="/mi-cuenta" className="hover:text-blue-600">Mi Cuenta</Link>
              <span>/</span>
              <Link href="/mi-cuenta/tickets" className="hover:text-blue-600">Mis Tickets</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">#{ticket.ticket_number}</span>
            </nav>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Ticket #{ticket.ticket_number}
                  </h1>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityText(ticket.priority)}
                  </span>
                </div>
                <h2 className="text-xl text-gray-900 mb-2">{ticket.subject}</h2>
                <p className="text-gray-600">
                  Creado el {formatDate(ticket.created_at)}
                </p>
              </div>
              
              <Link
                href="/mi-cuenta/tickets"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← Volver
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contenido principal */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Descripción inicial */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción del Problema</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
                
                {(ticket.order_number || ticket.product_name) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Información Adicional:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {ticket.order_number && (
                        <div>
                          <span className="text-gray-600">Número de Pedido:</span>
                          <span className="ml-2 font-medium">{ticket.order_number}</span>
                        </div>
                      )}
                      {ticket.product_name && (
                        <div>
                          <span className="text-gray-600">Producto:</span>
                          <span className="ml-2 font-medium">{ticket.product_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversación */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Conversación</h3>
                </div>

                <div className="p-6">
                  {responses.length > 0 ? (
                    <div className="space-y-6">
                      {responses.map((response, index) => (
                        <motion.div
                          key={response.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex ${response.user_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-3xl ${
                            response.user_type === 'customer' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          } rounded-2xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {response.user_type === 'customer' ? 'Tú' : response.display_name || 'Soporte'}
                              </span>
                              <span className={`text-xs ${
                                response.user_type === 'customer' ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatDate(response.created_at)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{response.message}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aún no hay respuestas en este ticket.</p>
                      {canRespond && (
                        <p className="mt-2">¡Sé el primero en responder!</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Formulario de respuesta */}
              {canRespond && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Respuesta</h3>
                  
                  <form onSubmit={handleSubmitResponse} className="space-y-4">
                    <div>
                      <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                        Tu respuesta
                      </label>
                      <textarea
                        id="response"
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submittingResponse}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      {submittingResponse ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                  </form>
                </div>
              )}

              {/* Formulario de calificación */}
              {canRate && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Califica Nuestro Servicio</h3>
                  
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calificación (1-5 estrellas)
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl ${
                              star <= rating ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                        Comentarios adicionales (opcional)
                      </label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Cuéntanos sobre tu experiencia..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submittingRating || rating === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      {submittingRating ? 'Guardando...' : 'Enviar Calificación'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar con timeline */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial del Ticket</h3>
                
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getTimelineColor(event.color)}`}>
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </p>
                        {event.details && event.details.message && (
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {event.details.message.length > 50 
                              ? event.details.message.substring(0, 50) + '...'
                              : event.details.message
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Información del ticket */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Ticket</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium capitalize">{ticket.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prioridad:</span>
                      <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityText(ticket.priority)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </div>
                    {ticket.assigned_to_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Asignado a:</span>
                        <span className="font-medium">{ticket.assigned_to_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withClientAuth(TicketDetailPage);