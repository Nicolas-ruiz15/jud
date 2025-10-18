// pages/metodos-pago.js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function MetodosPago() {
  const [selectedMethod, setSelectedMethod] = useState('tarjetas');
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('page_view', {
        category: 'payment',
        page: 'payment_methods'
      });
    }
  }, []);

  const trackPaymentMethodSelection = (method) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('payment_method_selection', {
        category: 'payment',
        method: method,
        page: 'payment_methods'
      });
    }
  };

  // Métodos de pago disponibles
  const paymentMethods = {
    tarjetas: {
      title: "Tarjetas de Crédito y Débito",
      icon: "💳",
      description: "Pago seguro e inmediato con todas las tarjetas",
      benefits: ["Procesamiento inmediato", "Máxima seguridad SSL", "Todas las franquicias"],
      cards: [
        { name: "Visa", logo: "🔵", color: "blue" },
        { name: "Mastercard", logo: "🔴", color: "red" },
        { name: "American Express", logo: "🟢", color: "green" },
        { name: "Diners Club", logo: "⚪", color: "gray" }
      ],
      fees: "Sin recargo adicional",
      process: [
        "Selecciona tus productos",
        "Ingresa datos de entrega", 
        "Elige pago con tarjeta",
        "Completa información de tarjeta",
        "Confirma tu compra"
      ]
    },
    pse: {
      title: "PSE - Pagos Seguros en Línea",
      icon: "🏦",
      description: "Débito directo desde tu cuenta bancaria",
      benefits: ["Débito inmediato", "Sin intermediarios", "Todos los bancos"],
      banks: [
        "Bancolombia", "Banco de Bogotá", "BBVA Colombia", 
        "Banco Popular", "Davivienda", "Banco Caja Social",
        "Banco AV Villas", "Colpatria", "Banco Agrario"
      ],
      fees: "Sin costos adicionales",
      process: [
        "Selecciona PSE como método de pago",
        "Elige tu banco",
        "Ingresa a tu banca online",
        "Autoriza el débito",
        "Recibe confirmación inmediata"
      ]
    },
    efecty: {
      title: "Efecty y Corresponsales",
      icon: "🏪",
      description: "Pago en efectivo en miles de puntos",
      benefits: ["Más de 10,000 puntos", "Horarios extendidos", "Sin cuenta bancaria"],
      locations: [
        "Efecty", "Baloto", "Gana", "SuRed", 
        "Red Multicolor", "Banco Agrario", "Servibanca"
      ],
      fees: "Tarifa mínima del corresponsal",
      process: [
        "Genera tu código de pago",
        "Acércate al punto Efecty más cercano",
        "Presenta tu código y cédula",
        "Paga en efectivo",
        "Conserva tu comprobante"
      ]
    },
    transferencia: {
      title: "Transferencia Bancaria",
      icon: "🏛️",
      description: "Método preferido con beneficios especiales",
      benefits: ["Envío GRATIS +$200k", "Sin comisiones", "Descuentos exclusivos"],
      discounts: [
        "5% descuento en libros Breslov",
        "3% en productos religiosos",
        "Envío gratis desde $200,000",
        "Atención prioritaria"
      ],
      fees: "Sin comisiones adicionales",
      process: [
        "Solicita datos bancarios por WhatsApp",
        "Realiza transferencia desde tu banco",
        "Envía comprobante por WhatsApp",
        "Confirmamos recepción",
        "Procesamos tu pedido con prioridad"
      ]
    },
    otros: {
      title: "Otros Métodos",
      icon: "📱",
      description: "Billeteras digitales y métodos alternativos",
      benefits: ["Innovación tecnológica", "Proceso rápido", "Seguridad garantizada"],
      methods: [
        { name: "Nequi", icon: "💜", available: true },
        { name: "Daviplata", icon: "🔵", available: true },
        { name: "Movii", icon: "🟡", available: true },
        { name: "PayU", icon: "💚", available: true },
        { name: "Mercado Pago", icon: "🔷", available: false },
        { name: "PayPal", icon: "🌐", available: false }
      ],
      fees: "Según plataforma",
      process: [
        "Selecciona tu billetera digital",
        "Confirma el monto",
        "Autoriza desde tu app",
        "Recibe confirmación",
        "Tu pedido se procesa automáticamente"
      ]
    }
  };

  return (
    <Layout
      title="Métodos de Pago - Judaica Breslov Colombia"
      description="Múltiples formas de pago seguras: tarjetas, PSE, Efecty, transferencia bancaria. Descuentos especiales por transferencia y envío gratis +$200.000."
      canonical={`${process.env.NEXT_PUBLIC_SITE_URL}/metodos-pago`}
    >
      <Head>
        <meta name="keywords" content="métodos pago judaica colombia, pagar productos judios, PSE efecty transferencia, tarjetas breslov colombia" />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Métodos de Pago
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8">
                Elige la forma más cómoda y segura de pagar tus productos judaicos
              </p>
              
              {/* Beneficios destacados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold mb-2">100% Seguro</h3>
                  <p className="text-purple-100">Certificación SSL y encriptación</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Proceso Rápido</h3>
                  <p className="text-purple-100">Confirmación inmediata</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">🎁</div>
                  <h3 className="text-xl font-bold mb-2">Beneficios Exclusivos</h3>
                  <p className="text-purple-100">Descuentos por transferencia</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Selector de métodos */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(paymentMethods).map(([key, method]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedMethod(key);
                  trackPaymentMethodSelection(key);
                }}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedMethod === key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method.icon} {method.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido del método seleccionado */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              key={selectedMethod}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Header del método */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-6xl mr-4">{paymentMethods[selectedMethod].icon}</span>
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">{paymentMethods[selectedMethod].title}</h2>
                    <p className="text-xl text-purple-100">{paymentMethods[selectedMethod].description}</p>
                  </div>
                </div>
                
                {/* Beneficios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentMethods[selectedMethod].benefits.map((benefit, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                      <span className="font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenido específico por método */}
              <div className="p-8">
                {selectedMethod === 'tarjetas' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">Tarjetas Aceptadas</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {paymentMethods[selectedMethod].cards.map((card, index) => (
                          <div key={index} className={`bg-${card.color}-50 border-2 border-${card.color}-200 rounded-xl p-6 text-center`}>
                            <div className="text-4xl mb-2">{card.logo}</div>
                            <h4 className={`font-bold text-${card.color}-800`}>{card.name}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                      <h4 className="font-bold text-green-800 mb-2">🔒 Seguridad Garantizada</h4>
                      <p className="text-green-700">
                        Utilizamos la plataforma ePayco que cumple con los más altos estándares de seguridad 
                        internacionales. Tus datos están protegidos con encriptación SSL de 256 bits.
                      </p>
                    </div>
                  </div>
                )}

                {selectedMethod === 'pse' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">Bancos Disponibles</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {paymentMethods[selectedMethod].banks.map((bank, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <h4 className="font-medium text-blue-800">{bank}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h4 className="font-bold text-blue-800 mb-2">ℹ️ Importante sobre PSE</h4>
                      <ul className="text-blue-700 space-y-1">
                        <li>• Requiere tener banca online activa</li>
                        <li>• El débito es inmediato e irreversible</li>
                        <li>• Disponible 24/7 excepto mantenimientos del banco</li>
                        <li>• Límites según tu banco (consulta con tu entidad)</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedMethod === 'efecty' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">Puntos de Pago Disponibles</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {paymentMethods[selectedMethod].locations.map((location, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                            <div className="text-2xl mb-2">🏪</div>
                            <h4 className="font-medium text-orange-800">{location}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                      <h4 className="font-bold text-yellow-800 mb-2">⏰ Horarios y Límites</h4>
                      <ul className="text-yellow-700 space-y-1">
                        <li>• Disponible según horario del punto de pago</li>
                        <li>• Límite máximo: $3,000,000 por transacción</li>
                        <li>• Debes pagar dentro de 24 horas</li>
                        <li>• Conserva tu comprobante hasta recibir el producto</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedMethod === 'transferencia' && (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
                      <h3 className="text-2xl font-bold mb-4 text-green-800">🎉 ¡Método Preferido!</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold text-green-700 mb-3">Descuentos Exclusivos:</h4>
                          <ul className="space-y-2 text-green-600">
                            {paymentMethods[selectedMethod].discounts.map((discount, index) => (
                              <li key={index} className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {discount}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-center">
                          <button
                            onClick={() => setShowBankInfo(true)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            Obtener Datos Bancarios
                          </button>
                          <p className="text-sm text-green-600 mt-2">Por WhatsApp seguro</p>
                        </div>
                      </div>
                    </div>

                    {showBankInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl"
                      >
                        <h4 className="font-bold text-blue-800 mb-3">📱 Cómo Obtener los Datos Bancarios</h4>
                        <p className="text-blue-700 mb-4">
                          Por seguridad, enviamos los datos bancarios únicamente por WhatsApp verificado. 
                          Esto nos permite confirmar tu identidad y proteger tanto tu información como la nuestra.
                        </p>
                        <a
                          href="https://wa.me/573009291156?text=Hola,%20necesito%20los%20datos%20bancarios%20para%20hacer%20una%20transferencia"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          Solicitar Datos por WhatsApp
                        </a>
                      </motion.div>
                    )}
                  </div>
                )}

                {selectedMethod === 'otros' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">Billeteras Digitales y Otros</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {paymentMethods[selectedMethod].methods.map((method, index) => (
                          <div 
                            key={index} 
                            className={`border-2 rounded-xl p-6 text-center transition-all duration-300 ${
                              method.available 
                                ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="text-3xl mb-2">{method.icon}</div>
                            <h4 className={`font-bold ${method.available ? 'text-green-800' : 'text-gray-500'}`}>
                              {method.name}
                            </h4>
                            <p className={`text-sm mt-1 ${method.available ? 'text-green-600' : 'text-gray-400'}`}>
                              {method.available ? 'Disponible' : 'Próximamente'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-xl">
                      <h4 className="font-bold text-purple-800 mb-2">🔮 Nuevos Métodos Próximamente</h4>
                      <p className="text-purple-700">
                        Estamos trabajando para integrar más opciones de pago como Mercado Pago y PayPal. 
                        ¡Mantente atento a nuestras actualizaciones!
                      </p>
                    </div>
                  </div>
                )}

                {/* Proceso paso a paso */}
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">📋 Proceso Paso a Paso</h3>
                  <div className="space-y-4">
                    {paymentMethods[selectedMethod].process.map((step, index) => (
                      <div key={index} className="flex items-center bg-gray-50 rounded-lg p-4">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información de costos */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h4 className="font-bold text-yellow-800 mb-2">💰 Información de Costos</h4>
                  <p className="text-yellow-700">
                    <strong>Comisiones por este método:</strong> {paymentMethods[selectedMethod].fees}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seguridad y certificaciones */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Seguridad y Certificaciones
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center"
              >
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-4 text-blue-800">SSL de 256 bits</h3>
                <p className="text-blue-700 leading-relaxed">
                  Toda la información está encriptada con el mismo nivel de seguridad 
                  que usan los bancos internacionales.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center"
              >
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="text-2xl font-bold mb-4 text-green-800">PCI DSS Compliant</h3>
                <p className="text-green-700 leading-relaxed">
                  Cumplimos con los estándares internacionales para el manejo 
                  seguro de información de tarjetas de crédito.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center"
              >
                <div className="text-5xl mb-4">🏦</div>
                <h3 className="text-2xl font-bold mb-4 text-purple-800">Supervisión SFC</h3>
                <p className="text-purple-700 leading-relaxed">
                  Nuestros aliados de pagos están regulados por la 
                  Superintendencia Financiera de Colombia.
                </p>
              </motion.div>
            </div>

            <div className="mt-12 bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
                🏆 Nuestros Aliados de Pago
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { name: "ePayco", description: "Procesador principal" },
                  { name: "PSE", description: "Sistema bancario nacional" },
                  { name: "Efecty", description: "Red de corresponsales" },
                  { name: "Bancolombia", description: "Transferencias seguras" }
                ].map((partner, index) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="text-3xl mb-2">🤝</div>
                    <h4 className="font-bold text-gray-800">{partner.name}</h4>
                    <p className="text-sm text-gray-600">{partner.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ de pagos */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Preguntas Frecuentes sobre Pagos
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "¿Es seguro pagar con tarjeta en su sitio web?",
                  answer: "Absolutamente. Utilizamos ePayco, una plataforma certificada que cumple con todos los estándares internacionales de seguridad. Nunca almacenamos datos de tarjetas en nuestros servidores."
                },
                {
                  question: "¿Por qué la transferencia bancaria tiene descuentos especiales?",
                  answer: "Las transferencias nos permiten evitar comisiones de intermediarios, por lo que compartimos ese ahorro contigo mediante descuentos y envío gratis. Además, es nuestro método de pago más seguro."
                },
                {
                  question: "¿Cuánto tiempo tarda en procesarse mi pago?",
                  answer: "Tarjetas y PSE se procesan inmediatamente. Efecty puede tardar 1-2 horas. Las transferencias se confirman manualmente en horario laboral (máximo 24 horas)."
                },
                {
                  question: "¿Puedo cambiar el método de pago después de hacer el pedido?",
                  answer: "Sí, pero solo si el pago aún no ha sido procesado. Contáctanos inmediatamente al WhatsApp +57 300 929 1156 para hacer el cambio."
                },
                {
                  question: "¿Emiten factura electrónica para todos los métodos de pago?",
                  answer: "Sí, emitimos factura electrónica para todas las compras sin importar el método de pago. La recibes por email dentro de las 24 horas siguientes al pago."
                },
                {
                  question: "¿Hay límites mínimos o máximos para comprar?",
                  answer: "No hay mínimo de compra. Los máximos dependen del método: tarjetas según tu cupo, PSE según tu banco, Efecty hasta $3,000,000, transferencias sin límite."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md"
                >
                  <h4 className="font-bold text-lg text-gray-900 mb-3">{faq.question}</h4>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para Realizar tu Compra?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Elige tus productos judaicos favoritos y paga de la forma más cómoda para ti
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/productos"
              className="inline-flex items-center bg-white hover:bg-gray-100 text-purple-600 font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 8H6L5 9z" />
              </svg>
              Ver Productos
            </Link>
            <a
              href="https://wa.me/573009291156?text=Hola,%20tengo%20preguntas%20sobre%20los%20métodos%20de%20pago%20disponibles"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Enlaces relacionados */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Información Relacionada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Información de Envíos", href: "/envios", icon: "📦", description: "Tiempos y costos de entrega" },
                { title: "Política de Devoluciones", href: "/politica-devoluciones", icon: "↩️", description: "Proceso de devoluciones" },
                { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes", icon: "❓", description: "Dudas comunes resueltas" },
                { title: "Centro de Ayuda", href: "/centro-ayuda", icon: "🎧", description: "Soporte especializado" }
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="bg-gray-50 hover:bg-gray-100 p-6 rounded-xl text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
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