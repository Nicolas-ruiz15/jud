// pages/centro-ayuda.js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function CentroAyuda() {
  const [activeTab, setActiveTab] = useState('soporte');
  const [ticketForm, setTicketForm] = useState({
    type: 'general',
    priority: 'medium',
    name: '',
    email: '',
    phone: '',
    subject: '',
    description: '',
    orderNumber: '',
    productName: ''
  });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('page_view', {
        category: 'support',
        page: 'help_center'
      });
    }
  }, []);

  const trackHelpAction = (action, details = {}) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('help_center_action', {
        category: 'support',
        action: action,
        ...details
      });
    }
  };

  // Categorías de soporte
  const supportCategories = {
    soporte: {
      title: "Soporte Técnico",
      icon: "🛠️",
      description: "Problemas con el sitio web, pagos o pedidos",
      color: "blue",
      topics: [
        {
          title: "Problemas de Pago",
          description: "Tarjeta rechazada, PSE no funciona, error en Efecty",
          urgency: "high",
          solutions: [
            "Verificar datos de tarjeta y cupo disponible",
            "Comprobar que la banca online esté activa para PSE",
            "Validar que el punto Efecty esté operativo",
            "Contactar directamente para solución inmediata"
          ]
        },
        {
          title: "Error en el Sitio Web",
          description: "Página no carga, carrito no funciona, error al registrarse",
          urgency: "medium",
          solutions: [
            "Limpiar cache y cookies del navegador",
            "Probar desde modo incógnito o navegador diferente",
            "Verificar conexión a internet estable",
            "Reportar el error con capturas de pantalla"
          ]
        },
        {
          title: "Problema con Mi Cuenta",
          description: "No puedo iniciar sesión, olvidé mi contraseña",
          urgency: "medium",
          solutions: [
            "Usar la opción 'Olvidé mi contraseña'",
            "Verificar que el email esté escrito correctamente",
            "Revisar carpeta de spam para emails de recuperación",
            "Contactar soporte para reset manual de cuenta"
          ]
        }
      ]
    },
    pedidos: {
      title: "Gestión de Pedidos",
      icon: "📦",
      description: "Estado del pedido, modificaciones, seguimiento",
      color: "green",
      topics: [
        {
          title: "Rastrear mi Pedido",
          description: "¿Dónde está mi pedido? ¿Cuándo llega?",
          urgency: "medium",
          solutions: [
            "Usar el número de guía enviado por WhatsApp/email",
            "Consultar en la página de la transportadora",
            "Revisar el estado en 'Mi Cuenta' si te registraste",
            "Contactarnos para actualización manual del estado"
          ]
        },
        {
          title: "Modificar o Cancelar Pedido",
          description: "Cambiar dirección, productos o cancelar completamente",
          urgency: "high",
          solutions: [
            "Contactar INMEDIATAMENTE si el pedido no ha salido",
            "WhatsApp es el medio más rápido: +57 300 929 1156",
            "Proporcionar número de pedido exacto",
            "Entender que cambios pueden tener costos adicionales"
          ]
        },
        {
          title: "Producto No Llegó",
          description: "Pasó el tiempo estimado y no recibí mi pedido",
          urgency: "high",
          solutions: [
            "Verificar intentos de entrega con la transportadora",
            "Confirmar dirección exacta y disponibilidad",
            "Revisar si quedó en oficina para recoger",
            "Iniciar reclamación formal con número de guía"
          ]
        }
      ]
    },
    productos: {
      title: "Productos y Calidad",
      icon: "🕯️",
      description: "Dudas sobre productos religiosos, autenticidad, uso",
      color: "purple",
      topics: [
        {
          title: "Autenticidad de Productos",
          description: "¿Cómo verifico que mi mezuzá/tefilín es kosher?",
          urgency: "medium",
          solutions: [
            "Todos nuestros productos incluyen certificado de autenticidad",
            "Pergaminos escritos por sofer certificado desde Israel",
            "Contactar a rabino local para verificación adicional",
            "Enviamos documentación completa con cada producto religioso"
          ]
        },
        {
          title: "Instrucciones de Uso",
          description: "¿Cómo instalar mezuzá? ¿Cómo usar tefilín correctamente?",
          urgency: "low",
          solutions: [
            "Incluimos instructivos en español con cada producto",
            "Videos tutoriales disponibles en nuestro WhatsApp",
            "Asesoría personalizada por chat en vivo",
            "Conexión con autoridades rabínicas locales si es necesario"
          ]
        },
        {
          title: "Producto Defectuoso",
          description: "El producto llegó dañado o no funciona correctamente",
          urgency: "high",
          solutions: [
            "Reportar INMEDIATAMENTE (máximo 48 horas)",
            "Enviar fotos detalladas del problema",
            "Conservar empaque original y certificados",
            "Proceso de devolución gratuito por defectos de fábrica"
          ]
        }
      ]
    },
    quejas: {
      title: "Quejas y Reclamos",
      icon: "⚠️",
      description: "Insatisfacción con el servicio, problemas graves",
      color: "red",
      topics: [
        {
          title: "Servicio al Cliente Deficiente",
          description: "Mala atención, demoras en respuesta, trato inadecuado",
          urgency: "high",
          solutions: [
            "Documentar fecha, hora y persona que atendió",
            "Escalar inmediatamente a supervisión",
            "Crear ticket formal para seguimiento",
            "Garantizamos respuesta en máximo 24 horas hábiles"
          ]
        },
        {
          title: "Entrega Tardía o Fallida",
          description: "El pedido llegó muy tarde o no llegó según lo prometido",
          urgency: "high",
          solutions: [
            "Verificar factores externos (clima, fuerza mayor)",
            "Reclamación formal a transportadora",
            "Compensación o descuento según el caso",
            "Mejora de procesos para evitar repetición"
          ]
        },
        {
          title: "Problema con Facturación",
          description: "Cobro incorrecto, factura errónea, problemas de reembolso",
          urgency: "high",
          solutions: [
            "Revisión inmediata de registros contables",
            "Corrección o reversión según corresponda",
            "Emisión de nota crédito si es necesario",
            "Reporte a área financiera para auditoria"
          ]
        }
      ]
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Enviar al nuevo sistema de tickets
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: ticketForm.type,
          priority: ticketForm.priority,
          name: ticketForm.name,
          email: ticketForm.email,
          phone: ticketForm.phone,
          subject: ticketForm.subject,
          description: ticketForm.description,
          order_number: ticketForm.orderNumber || null,
          product_name: ticketForm.productName || null,
          source: 'web'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        trackHelpAction('ticket_submitted', { 
          type: ticketForm.type, 
          priority: ticketForm.priority,
          ticket_number: result.data?.ticket_number 
        });
        
        // Mostrar mensaje de éxito con número de ticket
        const ticketNumber = result.data?.ticket_number || 'generando...';
        alert(`✅ Ticket creado exitosamente!\n\n🎫 Número: ${ticketNumber}\n\n📧 Recibirás confirmación por email\n⏰ Tiempo estimado de respuesta según tu prioridad\n\nPuedes hacer seguimiento por WhatsApp: +57 300 929 1156`);
        
        // Limpiar formulario
        setTicketForm({
          type: 'general',
          priority: 'medium',
          name: '',
          email: '',
          phone: '',
          subject: '',
          description: '',
          orderNumber: '',
          productName: ''
        });
        setShowTicketForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear ticket');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al crear ticket. Por favor contacta por WhatsApp: +57 300 929 1156');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'soporte', label: 'Soporte Técnico', icon: '🛠️' },
    { id: 'pedidos', label: 'Gestión de Pedidos', icon: '📦' },
    { id: 'productos', label: 'Productos', icon: '🕯️' },
    { id: 'quejas', label: 'Quejas y Reclamos', icon: '⚠️' }
  ];

  return (
    <Layout
      title="Centro de Ayuda - Judaica Breslov Colombia"
      description="Centro de ayuda completo para resolver todas tus dudas sobre productos judaicos, pedidos, pagos y más. Soporte especializado y sistema de tickets profesional."
      canonical={`${process.env.NEXT_PUBLIC_SITE_URL}/centro-ayuda`}
    >
      <Head>
        <meta name="keywords" content="centro ayuda judaica colombia, soporte productos religiosos, tickets reclamos breslov, ayuda mezuza talit tefilin" />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Centro de Ayuda
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 mb-8">
                Soporte especializado para productos judaicos y servicios de calidad
              </p>
              
              {/* Métricas de servicio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Respuesta Rápida</h3>
                  <p className="text-indigo-100">Máximo 24 horas hábiles</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-2">Solución Efectiva</h3>
                  <p className="text-indigo-100">96% de casos resueltos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">🕯️</div>
                  <h3 className="text-xl font-bold mb-2">Conocimiento Especializado</h3>
                  <p className="text-indigo-100">Expertos en productos religiosos</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Acceso Rápido
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <a
                href="https://wa.me/573009291156?text=Hola,%20necesito%20ayuda%20urgente%20con%20mi%20pedido"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
                onClick={() => trackHelpAction('whatsapp_urgent')}
              >
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-bold text-green-800 mb-2">WhatsApp Urgente</h3>
                <p className="text-sm text-green-600">Problemas que requieren atención inmediata</p>
              </a>

              <button
                onClick={() => {
                  setShowTicketForm(true);
                  trackHelpAction('create_ticket_click');
                }}
                className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-4xl mb-3">🎫</div>
                <h3 className="font-bold text-blue-800 mb-2">Crear Ticket</h3>
                <p className="text-sm text-blue-600">Para seguimiento detallado de tu caso</p>
              </button>

              <Link
                href="/preguntas-frecuentes"
                className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
                onClick={() => trackHelpAction('faq_click')}
              >
                <div className="text-4xl mb-3">❓</div>
                <h3 className="font-bold text-purple-800 mb-2">Preguntas Frecuentes</h3>
                <p className="text-sm text-purple-600">Respuestas a dudas comunes</p>
              </Link>

              <Link
                href="/contacto"
                className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
                onClick={() => trackHelpAction('contact_click')}
              >
                <div className="text-4xl mb-3">📧</div>
                <h3 className="font-bold text-orange-800 mb-2">Contacto General</h3>
                <p className="text-sm text-orange-600">Consultas comerciales y generales</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación de categorías */}
      <section className="py-8 bg-gray-50 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  trackHelpAction('category_select', { category: tab.id });
                }}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido de la categoría seleccionada */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-gray-900 flex items-center justify-center">
                  <span className="text-5xl mr-4">{supportCategories[activeTab].icon}</span>
                  {supportCategories[activeTab].title}
                </h2>
                <p className="text-xl text-gray-600">
                  {supportCategories[activeTab].description}
                </p>
              </div>

              <div className="space-y-8">
                {supportCategories[activeTab].topics.map((topic, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                        <p className="text-gray-600 text-lg">{topic.description}</p>
                      </div>
                      <div className={`ml-6 px-4 py-2 rounded-full text-sm font-bold ${
                        topic.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        topic.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {topic.urgency === 'high' ? '🔴 Alta' : 
                         topic.urgency === 'medium' ? '🟡 Media' : '🟢 Baja'}
                      </div>
                    </div>

                    <h4 className="font-bold text-lg text-gray-900 mb-4">💡 Soluciones Recomendadas:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topic.solutions.map((solution, sIndex) => (
                        <div key={sIndex} className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                          <div className="flex items-start">
                            <span className="text-indigo-500 mr-3 mt-0.5 font-bold">{sIndex + 1}.</span>
                            <span className="text-gray-700">{solution}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4">
                      <a
                        href={`https://wa.me/573009291156?text=Hola,%20tengo%20un%20problema:%20${topic.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        onClick={() => trackHelpAction('whatsapp_topic', { topic: topic.title })}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          setTicketForm({...ticketForm, subject: topic.title, type: activeTab});
                          setShowTicketForm(true);
                          trackHelpAction('ticket_topic', { topic: topic.title });
                        }}
                        className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Crear Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modal del formulario de ticket */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">🎫 Crear Ticket de Soporte</h3>
              <button
                onClick={() => setShowTicketForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Consulta *
                  </label>
                  <select
                    value={ticketForm.type}
                    onChange={(e) => setTicketForm({...ticketForm, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="low">🟢 Baja - Consulta general</option>
                    <option value="medium">🟡 Media - Problema moderado</option>
                    <option value="high">🔴 Alta - Problema urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({...ticketForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={ticketForm.phone}
                    onChange={(e) => setTicketForm({...ticketForm, phone: e.target.value})}
                    placeholder="+57 300 123 4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Pedido (si aplica)
                  </label>
                  <input
                    type="text"
                    value={ticketForm.orderNumber}
                    onChange={(e) => setTicketForm({...ticketForm, orderNumber: e.target.value})}
                    placeholder="Ej: JBC-2024-001234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  placeholder="Resumen breve del problema"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  placeholder="Describe el problema con el mayor detalle posible. Incluye pasos realizados, mensajes de error, etc."
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-blue-800 mb-2">📋 Compromiso de Servicio</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• <strong>Prioridad Alta:</strong> Respuesta en 4-8 horas hábiles</li>
                  <li>• <strong>Prioridad Media:</strong> Respuesta en 12-24 horas hábiles</li>
                  <li>• <strong>Prioridad Baja:</strong> Respuesta en 24-48 horas hábiles</li>
                  <li>• Seguimiento completo hasta la resolución del caso</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {submitting ? 'Enviando...' : '🎫 Crear Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-4 px-8 rounded-lg transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Base de conocimiento */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              📚 Base de Conocimiento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Guía de Productos Religiosos",
                  description: "Todo sobre mezuzot, tefilín, talitot y su uso correcto",
                  icon: "🕯️",
                  articles: ["¿Cómo instalar una mezuzá?", "Diferencias entre talitot", "Cuidado de tefilín"],
                  color: "purple"
                },
                {
                  title: "Proceso de Compra",
                  description: "Desde la selección hasta la entrega de tu pedido",
                  icon: "🛒",
                  articles: ["Crear cuenta y perfil", "Métodos de pago disponibles", "Seguimiento de pedidos"],
                  color: "blue"
                },
                {
                  title: "Solución de Problemas",
                  description: "Respuestas rápidas a problemas comunes",
                  icon: "🔧",
                  articles: ["Página no carga", "Error al pagar", "Producto no llegó"],
                  color: "green"
                },
                {
                  title: "Política y Términos",
                  description: "Nuestros compromisos y responsabilidades",
                  icon: "📋",
                  articles: ["Política de devoluciones", "Términos de servicio", "Privacidad de datos"],
                  color: "orange"
                },
                {
                  title: "Enseñanzas Breslov",
                  description: "Recursos sobre la filosofía y enseñanzas Breslov",
                  icon: "✨",
                  articles: ["Introducción a Breslov", "Libros recomendados", "Comunidad en Colombia"],
                  color: "pink"
                },
                {
                  title: "Contacto y Soporte",
                  description: "Todas las formas de contactarnos y recibir ayuda",
                  icon: "📞",
                  articles: ["Horarios de atención", "WhatsApp vs Email", "Escalación de casos"],
                  color: "indigo"
                }
              ].map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-${category.color}-50 border-2 border-${category.color}-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
                >
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <h3 className={`text-xl font-bold text-${category.color}-800 mb-2`}>{category.title}</h3>
                    <p className={`text-${category.color}-600 text-sm`}>{category.description}</p>
                  </div>
                  <div className="space-y-2">
                    {category.articles.map((article, aIndex) => (
                      <button
                        key={aIndex}
                        className={`w-full text-left px-3 py-2 bg-white border border-${category.color}-200 rounded-lg hover:bg-${category.color}-50 transition-colors text-sm`}
                        onClick={() => trackHelpAction('article_click', { article, category: category.title })}
                      >
                        {article}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA de contacto */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Aún Necesitas Ayuda?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Nuestro equipo especializado está listo para ayudarte
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a
              href="https://wa.me/573009291156?text=Hola,%20necesito%20ayuda%20con%20mi%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => trackHelpAction('final_whatsapp')}
            >
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
              <p className="text-green-100">+57 300 929 1156</p>
              <p className="text-sm text-green-200 mt-2">Respuesta inmediata</p>
            </a>

            <button
              onClick={() => {
                setShowTicketForm(true);
                trackHelpAction('final_ticket');
              }}
              className="bg-white/20 hover:bg-white/30 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-3xl mb-3">🎫</div>
              <h3 className="font-bold text-lg mb-2">Sistema de Tickets</h3>
              <p className="text-indigo-100">Seguimiento detallado</p>
              <p className="text-sm text-indigo-200 mt-2">Máximo 24h respuesta</p>
            </button>

            <Link
              href="/contacto"
              className="bg-white/20 hover:bg-white/30 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => trackHelpAction('final_contact')}
            >
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <p className="text-indigo-100">contacto@judaicabreslovcolombia.com</p>
              <p className="text-sm text-indigo-200 mt-2">Consultas generales</p>
            </Link>
          </div>

          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-bold text-lg mb-3">📋 Información que nos ayuda a ayudarte mejor:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-indigo-100 text-sm">
              <div>• Número de pedido (si aplica)</div>
              <div>• Producto específico involucrado</div>
              <div>• Descripción detallada del problema</div>
              <div>• Capturas de pantalla de errores</div>
              <div>• Pasos ya realizados para solucionarlo</div>
              <div>• Método de contacto preferido</div>
            </div>
          </div>
        </div>
      </section>

      {/* Horarios y políticas de servicio */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Información de Servicio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🕒</div>
                <h4 className="font-semibold text-gray-900 mb-2">Horarios de Atención</h4>
                <p className="text-sm text-gray-600">Lun-Vie: 8:00 AM - 6:00 PM<br />Sáb: 9:00 AM - 2:00 PM</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Tiempo de Respuesta</h4>
                <p className="text-sm text-gray-600">WhatsApp: Inmediato<br />Tickets: Máximo 24h</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🌐</div>
                <h4 className="font-semibold text-gray-900 mb-2">Idiomas</h4>
                <p className="text-sm text-gray-600">Español (nativo)<br />Hebreo (básico)</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-2">Confidencialidad</h4>
                <p className="text-sm text-gray-600">100% privado y seguro<br />Datos protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enlaces relacionados */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Recursos Relacionados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes", icon: "❓", description: "Respuestas rápidas" },
                { title: "Política de Devoluciones", href: "/politica-devoluciones", icon: "↩️", description: "Proceso de devoluciones" },
                { title: "Información de Envíos", href: "/envios", icon: "📦", description: "Tiempos y costos" },
                { title: "Métodos de Pago", href: "/metodos-pago", icon: "💳", description: "Formas de pago seguras" }
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="bg-white hover:bg-gray-100 p-6 rounded-xl text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => trackHelpAction('related_link', { page: link.title })}
                >
                  <div className="text-3xl mb-3">{link.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{link.title}</h4>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}