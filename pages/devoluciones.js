// pages/politica-devoluciones.js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function PoliticaDevoluciones() {
  const [activeSection, setActiveSection] = useState('general');

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('page_view', {
        category: 'policy',
        page: 'returns_policy'
      });
    }
  }, []);

  const trackSectionView = (section) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('policy_section_view', {
        category: 'policy',
        section: section,
        page: 'returns_policy'
      });
    }
  };

  const sections = [
    { id: 'general', title: 'Condiciones Generales', icon: '📋' },
    { id: 'plazos', title: 'Plazos y Procedimientos', icon: '⏰' },
    { id: 'productos', title: 'Productos Religiosos', icon: '🕯️' },
    { id: 'proceso', title: 'Proceso de Devolución', icon: '🔄' },
    { id: 'excepciones', title: 'Excepciones', icon: '⚠️' },
    { id: 'contacto', title: 'Contactar Soporte', icon: '📞' }
  ];

  return (
    <Layout
      title="Política de Devoluciones - Judaica Breslov Colombia"
      description="Conoce nuestra política de devoluciones para productos judaicos. Plazos de 2 días para reportar problemas y procedimientos claros para productos religiosos certificados."
      canonical={`${process.env.NEXT_PUBLIC_SITE_URL}/politica-devoluciones`}
    >
      <Head>
        <meta name="keywords" content="política devoluciones judaica, devolución productos religiosos colombia, garantía mezuza talit tefilin, devoluciones breslov" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Política de Devoluciones - Judaica Breslov Colombia",
              "description": "Política completa de devoluciones para productos judaicos y religiosos",
              "publisher": {
                "@type": "Organization",
                "name": "Judaica Breslov Colombia"
              }
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Política de Devoluciones
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 mb-8">
                Procedimientos claros y justos para la devolución de productos judaicos
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold mb-4">Plazos Importantes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                  <div className="bg-white/20 rounded-lg p-4">
                    <strong>2 días</strong><br />
                    <span className="text-orange-100">para reportar problemas</span>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <strong>7 días</strong><br />
                    <span className="text-orange-100">para devolver el producto</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Navegación de secciones */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  trackSectionView(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.icon} {section.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">

            {/* Condiciones Generales */}
            <motion.div
              id="general"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="text-4xl mr-4">📋</span>
                Condiciones Generales
              </h2>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  En <strong>Judaica Breslov Colombia</strong>, entendemos la importancia espiritual y personal 
                  de nuestros productos religiosos. Por ello, hemos desarrollado una política de devoluciones 
                  que balancea la protección del cliente con la naturaleza sagrada de los artículos judaicos.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                  <h4 className="font-bold text-blue-900 mb-2">Marco Legal</h4>
                  <p className="text-blue-800">
                    Esta política se rige por la legislación colombiana, específicamente el Estatuto del 
                    Consumidor (Ley 1480 de 2011) y el Código de Comercio, adaptada para productos religiosos 
                    y de naturaleza especializada.
                  </p>
                </div>

                <h4 className="text-xl font-semibold mb-4 text-gray-900">Principios Fundamentales</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Transparencia:</strong> Información clara sobre el estado y origen de cada producto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Respeto religioso:</strong> Manejo adecuado de artículos sagrados según la halajá</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Protección mutua:</strong> Derechos del consumidor balanceados con protección empresarial</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span><strong>Calidad garantizada:</strong> Todos los productos cuentan con certificación de autenticidad</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Plazos y Procedimientos */}
            <motion.div
              id="plazos"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="text-4xl mr-4">⏰</span>
                Plazos y Procedimientos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h4 className="text-2xl font-bold text-red-700 mb-4">Máximo 2 Días</h4>
                  <h5 className="font-semibold text-red-800 mb-3">Para Reportar Problemas</h5>
                  <ul className="text-red-700 space-y-2">
                    <li>• Defectos de fabricación</li>
                    <li>• Productos dañados en envío</li>
                    <li>• Artículo incorrecto recibido</li>
                    <li>• Problemas de autenticidad</li>
                  </ul>
                  <p className="text-sm text-red-600 mt-4 font-medium">
                    Plazo contado desde la entrega confirmada del producto
                  </p>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="text-2xl font-bold text-orange-700 mb-4">Máximo 7 Días</h4>
                  <h5 className="font-semibold text-orange-800 mb-3">Para Devolver Físicamente</h5>
                  <ul className="text-orange-700 space-y-2">
                    <li>• Empacar producto original</li>
                    <li>• Incluir certificados</li>
                    <li>• Envío por transportadora</li>
                    <li>• Número de autorización</li>
                  </ul>
                  <p className="text-sm text-orange-600 mt-4 font-medium">
                    Después de obtener autorización de devolución
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <h4 className="font-bold text-yellow-800 mb-2">⚠️ Importante sobre los Plazos</h4>
                <p className="text-yellow-700">
                  Los plazos de 2 días para reportar y 7 días para devolver son <strong>MÁXIMOS e improrrogables</strong>. 
                  Después de estos términos, no podremos procesar devoluciones por políticas de higiene, 
                  seguridad religiosa y protección de la autenticidad de nuestros productos kosher.
                </p>
              </div>
            </motion.div>

            {/* Productos Religiosos */}
            <motion.div
              id="productos"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="text-4xl mr-4">🕯️</span>
                Consideraciones para Productos Religiosos
              </h2>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-blue-800 mb-4">✅ Productos Retornables</h4>
                    <ul className="space-y-2 text-blue-700">
                      <li><strong>Mezuzot:</strong> Si no han sido instaladas</li>
                      <li><strong>Talitot:</strong> En empaque original</li>
                      <li><strong>Libros:</strong> Sin marcas ni dobleces</li>
                      <li><strong>Kipot:</strong> Sin uso aparente</li>
                      <li><strong>Joyería:</strong> Con certificado incluido</li>
                      <li><strong>Candelabros:</strong> Sin residuos de cera</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-red-800 mb-4">❌ Productos NO Retornables</h4>
                    <ul className="space-y-2 text-red-700">
                      <li><strong>Tefilín:</strong> Por contacto con piel</li>
                      <li><strong>Mezuzot instaladas:</strong> Ya consagradas</li>
                      <li><strong>Comida kosher:</strong> Por seguridad alimentaria</li>
                      <li><strong>Libros de oración usados:</strong> Por higiene</li>
                      <li><strong>Productos personalizados:</strong> Nombre, dedicatoria</li>
                      <li><strong>Aceites y perfumes:</strong> Una vez abiertos</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-6">
                  <h4 className="font-bold text-purple-800 mb-3">🔮 Consideraciones Halájicas</h4>
                  <p className="text-purple-700 mb-4">
                    Algunos productos religiosos, una vez utilizados o expuestos a ciertas condiciones, 
                    adquieren un estatus sagrado que impide su reventa según la ley judaica. 
                    Respetamos estas tradiciones en nuestra política.
                  </p>
                  <p className="text-purple-700">
                    <strong>Consulta rabínica disponible:</strong> Si tienes dudas sobre el uso correcto 
                    de algún producto religioso, podemos conectarte con autoridades rabínicas locales.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Proceso de Devolución */}
            <motion.div
              id="proceso"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="text-4xl mr-4">🔄</span>
                Proceso Paso a Paso
              </h2>

              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: "Contacto Inmediato",
                    description: "Dentro de las primeras 48 horas después de recibir el producto",
                    details: [
                      "WhatsApp: +57 300 929 1156",
                      "Email: contacto@judaicabreslovcolombia.com",
                      "Proporcionar número de pedido",
                      "Describir detalladamente el problema",
                      "Enviar fotos si es necesario"
                    ],
                    color: "red"
                  },
                  {
                    step: 2,
                    title: "Evaluación y Autorización",
                    description: "Nuestro equipo evalúa la solicitud en máximo 24 horas",
                    details: [
                      "Revisión de la solicitud por equipo especializado",
                      "Verificación de elegibilidad del producto",
                      "Generación de número de autorización RMA",
                      "Instrucciones específicas de empaque",
                      "Etiqueta de envío prepagada (casos aplicables)"
                    ],
                    color: "orange"
                  },
                  {
                    step: 3,
                    title: "Preparación y Envío",
                    description: "El cliente prepara y envía el producto en máximo 7 días",
                    details: [
                      "Empacar en caja original o equivalente",
                      "Incluir TODOS los accesorios y certificados",
                      "Adjuntar número de autorización RMA",
                      "Usar transportadora autorizada",
                      "Conservar guía de envío como comprobante"
                    ],
                    color: "yellow"
                  },
                  {
                    step: 4,
                    title: "Recepción e Inspección",
                    description: "Evaluamos el producto devuelto en nuestras instalaciones",
                    details: [
                      "Inspección física del producto",
                      "Verificación de completitud",
                      "Evaluación de condiciones de uso",
                      "Confirmación de autenticidad",
                      "Dictamen final de aceptación"
                    ],
                    color: "blue"
                  },
                  {
                    step: 5,
                    title: "Resolución Final",
                    description: "Procesamos la devolución aprobada en 3-5 días hábiles",
                    details: [
                      "Reembolso al método de pago original",
                      "Cambio por producto equivalente",
                      "Nota de crédito para futuras compras",
                      "Notificación por email y WhatsApp",
                      "Tiempo de procesamiento bancario: 5-10 días"
                    ],
                    color: "green"
                  }
                ].map((step, index) => (
                  <div key={index} className={`border-l-4 border-${step.color}-500 bg-${step.color}-50 p-6 rounded-r-xl`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 bg-${step.color}-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4`}>
                        {step.step}
                      </div>
                      <div>
                        <h4 className={`text-xl font-bold text-${step.color}-800`}>{step.title}</h4>
                        <p className={`text-${step.color}-700`}>{step.description}</p>
                      </div>
                    </div>
                    <ul className={`text-${step.color}-700 space-y-1 ml-14`}>
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center">
                          <span className={`text-${step.color}-500 mr-2`}>•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Excepciones */}
            <motion.div
              id="excepciones"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="text-4xl mr-4">⚠️</span>
                Excepciones y Casos Especiales
              </h2>

              <div className="space-y-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-red-800 mb-4">🚫 No Aplicamos Devoluciones Por:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-red-700">
                    <li>• Cambio de opinión sin causa justificada</li>
                    <li>• Mal uso del producto religioso</li>
                    <li>• Daños por negligencia del cliente</li>
                    <li>• Pérdida de componentes originales</li>
                    <li>• Productos vencidos por tiempo</li>
                    <li>• Artículos en promoción final</li>
                    <li>• Gastos de envío (salvo error nuestro)</li>
                    <li>• Diferencias menores de color/textura</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-green-800 mb-4">✅ Casos Especiales de Garantía Extendida:</h4>
                  <ul className="space-y-3 text-green-700">
                    <li><strong>Defectos de fábrica en Tefilín:</strong> Hasta 6 meses de garantía</li>
                    <li><strong>Pergaminos de Mezuzá defectuosos:</strong> Reemplazo inmediato sin costo</li>
                    <li><strong>Talitot con fallas en tzitzit:</strong> Reparación o cambio gratuito</li>
                    <li><strong>Libros con páginas faltantes:</strong> Reposición completa del ejemplar</li>
                    <li><strong>Productos dañados en envío:</strong> Reemplazo inmediato sin costo</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6">
                  <h4 className="font-bold text-blue-800 mb-3">💼 Protección Empresarial</h4>
                  <p className="text-blue-700 mb-4">
                    Para proteger la integridad de nuestros productos kosher y la sostenibilidad de nuestro negocio:
                  </p>
                  <ul className="text-blue-700 space-y-2">
                    <li>• Nos reservamos el derecho de rechazar devoluciones fraudulentas</li>
                    <li>• Los costos de envío de devolución corren por cuenta del cliente (excepto errores nuestros)</li>
                    <li>• Productos retornados en mal estado no serán reembolsados</li>
                    <li>• Límite de 2 devoluciones por cliente por año calendario</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Contactar Soporte */}
            <motion.div
              id="contacto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <span className="text-4xl mr-4">📞</span>
                ¿Necesitas Iniciar una Devolución?
              </h2>
              
              <p className="text-xl mb-8 text-blue-100">
                Nuestro equipo especializado está aquí para ayudarte con cualquier problema
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a
                  href="https://wa.me/573009291156?text=Hola,%20necesito%20iniciar%20un%20proceso%20de%20devolución%20para%20mi%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-400 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center mb-4">
                    <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <div>
                      <h4 className="font-bold text-lg">WhatsApp Directo</h4>
                      <p className="text-green-100">Respuesta inmediata</p>
                    </div>
                  </div>
                  <p className="font-bold text-xl">+57 300 929 1156</p>
                  <p className="text-green-100 mt-2">Lun-Vie: 8:00 AM - 6:00 PM</p>
                </a>

                <Link
                  href="/centro-ayuda"
                  className="bg-white/20 hover:bg-white/30 p-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center mb-4">
                    <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-lg">Centro de Ayuda</h4>
                      <p className="text-blue-100">Sistema de tickets</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">Crear Ticket de Soporte</p>
                  <p className="text-blue-100 mt-2">Seguimiento detallado de tu caso</p>
                </Link>
              </div>

              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h4 className="font-bold text-lg mb-3">📋 Información que necesitamos:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-100">
                  <li>• Número de pedido</li>
                  <li>• Fecha de recepción</li>
                  <li>• Descripción detallada del problema</li>
                  <li>• Fotos del producto (si aplica)</li>
                  <li>• Estado del empaque original</li>
                  <li>• Método de pago utilizado</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-8 text-gray-900">
              Páginas Relacionadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes", icon: "❓" },
                { title: "Información de Envíos", href: "/envios", icon: "📦" },
                { title: "Métodos de Pago", href: "/metodos-pago", icon: "💳" },
                { title: "Centro de Ayuda", href: "/centro-ayuda", icon: "🎧" }
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="bg-gray-50 hover:bg-gray-100 p-6 rounded-xl text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl mb-3">{link.icon}</div>
                  <h4 className="font-semibold text-gray-900">{link.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}