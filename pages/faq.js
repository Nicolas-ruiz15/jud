// pages/preguntas-frecuentes.js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';

export default function PreguntasFrecuentes() {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');

  // FAQ organizadas por categorías basadas en tu sitio web
  const faqCategories = {
    productos: {
      title: "Productos y Autenticidad",
      icon: "🛡️",
      faqs: [
        {
          question: "¿Sus productos judaicos son auténticos y certificados?",
          answer: "Sí, todos nuestros productos vienen directamente desde Israel con certificados de autenticidad. Nuestras mezuzot incluyen pergaminos kosher escritos a mano por escribas certificados, los talitot son tejidos según las especificaciones halájicas, y los tefilín cumplen con todos los requisitos religiosos tradicionales."
        },
        {
          question: "¿Qué diferencia a los libros de Breslov que venden?",
          answer: "Ofrecemos la colección más completa en español de las enseñanzas del Rabí Najman de Breslov y del Rabí Shalom Arush. Nuestros libros son traducciones autorizadas y incluyen comentarios explicativos. Tenemos desde obras básicas como 'Likutey Moharan' hasta guías prácticas de vida diaria según la filosofía Breslov."
        },
        {
          question: "¿Cómo sé qué talla de tallit o tefilín necesito?",
          answer: "Para talitot, ofrecemos tallas estándar (120x150cm para jóvenes, 150x200cm para adultos). Para tefilín, necesitamos la medida de la circunferencia de la cabeza y del brazo. Nuestro equipo te asesora personalmente vía WhatsApp (+57 300 929 1156) para garantizar el ajuste perfecto."
        },
        {
          question: "¿Las mezuzot vienen con pergamino kosher incluido?",
          answer: "Sí, todas nuestras mezuzot incluyen pergamino kosher escrito a mano por sofer (escriba) certificado. Cada pergamino viene con certificado de kashrut y está escrito según las leyes halájicas tradicionales. También ofrecemos servicio de verificación rabínica local si lo requieres."
        },
        {
          question: "¿Tienen productos específicos para diferentes tradiciones (Ashkenazi/Sefardí)?",
          answer: "Absolutamente. Manejamos productos tanto para tradición ashkenazi como sefardí. Por ejemplo, tenemos talitot con diferentes estilos de tzitzit, kipot de diferentes materiales y estilos, y libros de rezo según las diferentes tradiciones. Especifica tu tradición al hacer el pedido."
        }
      ]
    },
    envios: {
      title: "Envíos y Entregas",
      icon: "🚚",
      faqs: [
        {
          question: "¿A qué ciudades de Colombia hacen envíos?",
          answer: "Enviamos a toda Colombia. A ciudades principales (Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga) el tiempo de entrega es de 2-4 días hábiles. A otras ciudades y municipios puede tomar 3-7 días hábiles dependiendo de la ubicación."
        },
        {
          question: "¿Cuándo es gratis el envío?",
          answer: "El envío es GRATIS en toda Colombia para compras iguales o superiores a $200.000 COP, válido solo para pagos por transferencia bancaria. Para otros métodos de pago o compras menores, aplicamos tarifa de envío según la ciudad de destino."
        },
        {
          question: "¿Cómo puedo rastrear mi pedido?",
          answer: "Una vez procesado tu pedido, te enviamos el número de guía por WhatsApp y email. Puedes rastrear tu envío en la página web de la transportadora (Servientrega, Coordinadora o TCC según la zona). También puedes contactarnos para consultar el estado de tu pedido."
        },
        {
          question: "¿Qué pasa si no estoy en casa cuando llega el pedido?",
          answer: "La transportadora intentará la entrega 3 veces. Si no te encuentran, el paquete queda en la oficina más cercana donde puedes recogerlo presentando tu cédula. Te notificamos inmediatamente por WhatsApp cuando esto suceda."
        },
        {
          question: "¿Embalan bien los productos delicados?",
          answer: "Sí, tenemos embalaje especializado para productos religiosos. Las mezuzot van en estuches protectores, los libros en plástico resistente al agua, y los talitot/tefilín en cajas rígidas. Entendemos el valor espiritual y material de cada artículo."
        }
      ]
    },
    pagos: {
      title: "Métodos de Pago",
      icon: "💳",
      faqs: [
        {
          question: "¿Qué métodos de pago aceptan?",
          answer: "Aceptamos: Tarjetas de crédito y débito (Visa, Mastercard), PSE (Pagos Seguros en Línea), Efecty, transferencia bancaria directa, y otros métodos electrónicos. La transferencia bancaria tiene descuentos especiales y envío gratis."
        },
        {
          question: "¿Es seguro pagar con tarjeta en su sitio web?",
          answer: "Completamente seguro. Utilizamos la plataforma ePayco que cuenta con certificación SSL y cumple con todos los estándares de seguridad internacionales. Nunca almacenamos datos de tarjetas en nuestros servidores."
        },
        {
          question: "¿Cuáles son los datos para transferencia bancaria?",
          answer: "Para transferencias bancarias, contáctanos al WhatsApp +57 300 929 1156 y te enviamos los datos bancarios actualizados. Este método tiene beneficios especiales: envío gratis desde $200.000 y descuentos exclusivos."
        },
        {
          question: "¿Puedo pagar contra entrega?",
          answer: "Por el momento no manejamos pago contra entrega debido a la naturaleza especializada de nuestros productos religiosos. Todos los pagos deben procesarse antes del envío para garantizar la disponibilidad y autenticidad de los productos."
        },
        {
          question: "¿Emiten factura electrónica?",
          answer: "Sí, emitimos factura electrónica para todas las compras. La factura llega a tu email registrado dentro de las siguientes 24 horas después de procesar el pago. Si necesitas factura a nombre de empresa, indícanos los datos al realizar la compra."
        }
      ]
    },
    breslov: {
      title: "Breslov y Enseñanzas",
      icon: "✨",
      faqs: [
        {
          question: "¿Qué es Breslov y por qué se especializan en esta corriente?",
          answer: "Breslov es una corriente jasídica fundada por el Rabí Najman de Breslov (1772-1810). Nos especializamos en Breslov porque sus enseñanzas enfatizan la alegría en el servicio a D-os, la conexión personal con lo divino, y la importancia de los cuentos y música en la espiritualidad. Es una filosofía muy accesible para judíos de todos los niveles."
        },
        {
          question: "¿Necesito ser jasídico para usar productos o leer libros Breslov?",
          answer: "Para nada. Las enseñanzas de Breslov son universales dentro del judaísmo y pueden ser estudiadas por cualquier judío, sin importar su nivel de observancia o trasfondo. Los libros están escritos de manera accesible y muchos incluyen explicaciones para principiantes."
        },
        {
          question: "¿Cuál libro recomiendan para comenzar con Breslov?",
          answer: "Para principiantes recomendamos 'El Jardín de la Fe' del Rabí Shalom Arush, que es una introducción práctica a la emuná (fe). También 'Sabiduría de Mujeres' para mujeres, y 'Los Cuentos del Rabí Najman' que son historias con profundas enseñanzas espirituales."
        },
        {
          question: "¿Hacen asesoría espiritual o solo venden productos?",
          answer: "Principalmente vendemos productos, pero nuestro equipo tiene conocimiento profundo en las enseñanzas judaicas y Breslov. Podemos orientarte sobre qué libros son apropiados para tu nivel o situación particular. Para asesoría espiritual profunda, te conectamos con rabinos locales."
        }
      ]
    },
    cuenta: {
      title: "Mi Cuenta y Pedidos",
      icon: "👤",
      faqs: [
        {
          question: "¿Necesito crear una cuenta para comprar?",
          answer: "No es obligatorio, pero recomendamos crear una cuenta para tener historial de compras, seguimiento de pedidos, y acceso a descuentos exclusivos. El proceso de registro es rápido y solo requiere email y contraseña."
        },
        {
          question: "¿Cómo puedo ver el estado de mi pedido?",
          answer: "Si tienes cuenta, inicia sesión y ve a 'Mis Pedidos'. Si compraste como invitado, te enviamos actualizaciones por email y WhatsApp. También puedes contactarnos directamente con tu número de orden."
        },
        {
          question: "¿Puedo modificar o cancelar un pedido ya realizado?",
          answer: "Sí, pero solo si el pedido aún no ha sido enviado. Contáctanos inmediatamente al WhatsApp +57 300 929 1156. Una vez el producto esté en camino con la transportadora, ya no podremos modificarlo."
        },
        {
          question: "¿Guardan mis datos de pago?",
          answer: "No, por seguridad nunca almacenamos datos de tarjetas de crédito o información financiera. Cada compra requiere ingresar nuevamente los datos de pago. Solo guardamos información básica como dirección de envío para tu comodidad."
        }
      ]
    },
    general: {
      title: "Información General",
      icon: "ℹ️",
      faqs: [
        {
          question: "¿Dónde están ubicados físicamente?",
          answer: "Estamos ubicados en Bogotá, Colombia, pero atendemos todo el país. No tenemos tienda física abierta al público, trabajamos exclusivamente online para ofrecer mejores precios y mayor variedad de productos directamente desde Israel."
        },
        {
          question: "¿Cuál es su horario de atención?",
          answer: "Nuestro horario de atención por WhatsApp y email es de lunes a viernes de 8:00 AM a 6:00 PM (hora de Colombia). Los fines de semana respondemos consultas urgentes. La tienda online está disponible 24/7 para realizar compras."
        },
        {
          question: "¿Atienden consultas en hebreo o solo en español?",
          answer: "Atendemos principalmente en español, pero tenemos capacidad para consultas básicas en hebreo. Si necesitas asesoría muy específica en hebreo, podemos conectarte con nuestros proveedores en Israel."
        },
        {
          question: "¿Organizan eventos o clases sobre judaísmo?",
          answer: "Ocasionalmente organizamos charlas y eventos relacionados con las enseñanzas Breslov y judaísmo en general. Anunciamos estos eventos a través de nuestro newsletter y redes sociales. Suscríbete para estar al tanto."
        },
        {
          question: "¿Pueden conseguir productos específicos que no aparecen en la web?",
          answer: "Sí, tenemos conexión directa con proveedores en Israel y podemos conseguir productos específicos bajo pedido. Contáctanos con los detalles de lo que buscas y te cotizamos tiempo de entrega y precio especial."
        }
      ]
    }
  };

  // Función para filtrar FAQs
  const getFilteredFaqs = () => {
    let faqs = [];
    
    if (selectedCategory === 'todas') {
      Object.values(faqCategories).forEach(category => {
        faqs.push(...category.faqs.map(faq => ({...faq, category: category.title})));
      });
    } else {
      faqs = faqCategories[selectedCategory]?.faqs.map(faq => ({
        ...faq, 
        category: faqCategories[selectedCategory].title
      })) || [];
    }

    if (searchTerm) {
      faqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return faqs;
  };

  const filteredFaqs = getFilteredFaqs();

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('page_view', {
        category: 'support',
        page: 'faq'
      });
    }
  }, []);

  const trackFaqInteraction = (question, action) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('faq_interaction', {
        category: 'support',
        action: action,
        label: question,
        page: 'faq'
      });
    }
  };

  return (
    <Layout
      title="Preguntas Frecuentes - Judaica Breslov Colombia"
      description="Encuentra respuestas a todas tus preguntas sobre productos judaicos, envíos, métodos de pago, enseñanzas Breslov y más. Soporte completo para tu experiencia de compra."
      canonical={`${process.env.NEXT_PUBLIC_SITE_URL}/preguntas-frecuentes`}
    >
      <Head>
        <meta name="keywords" content="preguntas frecuentes, FAQ judaica, soporte breslov colombia, ayuda productos judaicos, mezuza dudas, talit preguntas, tefilin ayuda" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": filteredFaqs.slice(0, 10).map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Preguntas Frecuentes
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8">
                Todo lo que necesitas saber sobre productos judaicos, envíos, 
                enseñanzas Breslov y nuestra tienda online
              </p>
              
              {/* Búsqueda rápida */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar en preguntas frecuentes..."
                    className="w-full px-12 py-4 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white/20 focus:outline-none border-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Navegación rápida */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory('todas')}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === 'todas'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Todas las Categorías
            </button>
            {Object.entries(faqCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Resultados de búsqueda */}
            {searchTerm && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <span className="font-semibold">{filteredFaqs.length}</span> resultado(s) encontrado(s) para: 
                  <span className="font-bold"> "{searchTerm}"</span>
                </p>
              </div>
            )}

            {/* Lista de FAQs */}
            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        const newOpen = openFaq === index ? null : index;
                        setOpenFaq(newOpen);
                        trackFaqInteraction(faq.question, newOpen ? 'open' : 'close');
                      }}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        {selectedCategory === 'todas' && (
                          <span className="text-sm text-blue-600 font-medium">
                            {faq.category}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg 
                          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
                            openFaq === index ? 'transform rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-6 bg-gray-50">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    No encontramos resultados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Intenta con otros términos de búsqueda o selecciona una categoría diferente.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('todas');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Ver todas las preguntas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Nuestro equipo está aquí para ayudarte con cualquier consulta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/573009291156?text=Hola,%20tengo%20una%20pregunta%20sobre%20sus%20productos%20judaicos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => trackFaqInteraction('WhatsApp CTA', 'click')}
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              WhatsApp: +57 300 929 1156
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => trackFaqInteraction('Contact CTA', 'click')}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar Email
            </Link>
          </div>
        </div>
      </section>

      {/* Enlaces relacionados */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              También te puede interesar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Política de Devoluciones", href: "/politica-devoluciones", icon: "↩️" },
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