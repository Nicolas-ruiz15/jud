// pages/envios.js
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function InformacionEnvios() {
  const [selectedRegion, setSelectedRegion] = useState('principales');
  const [shippingCalculator, setShippingCalculator] = useState({
    city: '',
    weight: 1,
    value: 100000
  });

  // Analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('page_view', {
        category: 'shipping',
        page: 'shipping_info'
      });
    }
  }, []);

  const trackShippingCalculation = (city, weight, value) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('shipping_calculator_use', {
        category: 'shipping',
        city: city,
        weight: weight,
        order_value: value
      });
    }
  };

  // Información de ciudades y tiempos de entrega
  const shippingInfo = {
    principales: {
      title: "Ciudades Principales",
      description: "Entrega rápida 2-4 días hábiles",
      icon: "🏙️",
      cities: [
        { name: "Bogotá D.C.", time: "2-3 días", price: "Gratis +$250k" },
        { name: "Medellín", time: "2-4 días", price: "Gratis +$250k" },
        { name: "Cali", time: "3-4 días", price: "Gratis +$250k" },
        { name: "Barranquilla", time: "3-4 días", price: "Gratis +$250k" },
        { name: "Cartagena", time: "3-4 días", price: "Gratis +$250k" },
        { name: "Bucaramanga", time: "2-4 días", price: "Gratis +$250k" },
        { name: "Pereira", time: "3-4 días", price: "Gratis +$250k" },
        { name: "Santa Marta", time: "3-4 días", price: "Gratis +$250k" }
      ]
    },
    intermedias: {
      title: "Ciudades Intermedias",
      description: "Entrega estándar 3-6 días hábiles",
      icon: "🏘️",
      cities: [
        { name: "Manizales", time: "3-5 días", price: "Gratis +$250k" },
        { name: "Armenia", time: "3-5 días", price: "Gratis +$250k" },
        { name: "Ibagué", time: "3-5 días", price: "Gratis +$250k" },
        { name: "Pasto", time: "4-6 días", price: "Gratis +$250k" },
        { name: "Villavicencio", time: "3-5 días", price: "Gratis +$250k" },
        { name: "Neiva", time: "4-5 días", price: "Gratis +$250k" },
        { name: "Popayán", time: "4-6 días", price: "Gratis +$250k" },
        { name: "Tunja", time: "2-4 días", price: "Gratis +$250k" }
      ]
    },
    remotas: {
      title: "Zonas Remotas",
      description: "Entrega extendida 5-10 días hábiles",
      icon: "🏔️",
      cities: [
        { name: "Leticia", time: "7-10 días", price: "Costo adicional" },
        { name: "San Andrés", time: "5-8 días", price: "Costo adicional" },
        { name: "Mitú", time: "8-12 días", price: "Costo adicional" },
        { name: "Puerto Inírida", time: "8-12 días", price: "Costo adicional" },
        { name: "Municipios rurales", time: "5-10 días", price: "Consultar" }
      ]
    }
  };

  // Transportadoras aliadas
  const carriers = [
    {
      name: "Servientrega",
      logo: "🚚",
      coverage: "Nacional",
      tracking: "servientrega.com",
      specialty: "Ciudades principales"
    },
    {
      name: "Coordinadora",
      logo: "📦",
      coverage: "Nacional",
      tracking: "coordinadora.com",
      specialty: "Zonas intermedias"
    },
    {
      name: "TCC",
      logo: "🚛",
      coverage: "Nacional",
      tracking: "tcc.com.co",
      specialty: "Zonas rurales"
    },
    {
      name: "Envía",
      logo: "📫",
      coverage: "Urbano",
      tracking: "envia.co",
      specialty: "Entrega rápida urbana"
    }
  ];

  return (
    <Layout
      title="Información de Envíos - Judaica Breslov Colombia"
      description="Envíos a toda Colombia. Entrega 2-4 días hábiles a ciudades principales. Envío gratis en compras +$250.000. Productos judaicos auténticos desde Israel."
      canonical={`${process.env.NEXT_PUBLIC_SITE_URL}/envios`}
    >
      <Head>
        <meta name="keywords" content="envios colombia judaica, envio gratis productos judios, tiempos entrega mezuza talit tefilin, shipping colombia breslov" />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Información de Envíos
              </h1>
              <p className="text-xl md:text-2xl text-green-100 mb-8">
                Llevamos productos judaicos auténticos a toda Colombia con seguridad y rapidez
              </p>
              
              {/* Beneficios destacados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">🚚</div>
                  <h3 className="text-xl font-bold mb-2">Envío Gratis</h3>
                  <p className="text-green-100">En compras +$250.000</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Entrega Rápida</h3>
                  <p className="text-green-100">2-4 días ciudades principales</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-bold mb-2">Empaque Especial</h3>
                  <p className="text-green-100">Protección para productos religiosos</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Calculadora de envíos */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-12"
            >
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
                🧮 Calculadora de Envío
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Consulta el tiempo de entrega y costo aproximado para tu ciudad
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad de destino
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Medellín, Antioquia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shippingCalculator.city}
                    onChange={(e) => setShippingCalculator({...shippingCalculator, city: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso aproximado (kg)
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shippingCalculator.weight}
                    onChange={(e) => setShippingCalculator({...shippingCalculator, weight: parseInt(e.target.value)})}
                  >
                    <option value={1}>Hasta 1 kg (libros, kipot)</option>
                    <option value={2}>1-2 kg (talitot, mezuzot)</option>
                    <option value={3}>2-3 kg (tefilín, candelabros)</option>
                    <option value={5}>Más de 3 kg (pedidos grandes)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor del pedido (COP)
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shippingCalculator.value}
                    onChange={(e) => setShippingCalculator({...shippingCalculator, value: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={() => trackShippingCalculation(shippingCalculator.city, shippingCalculator.weight, shippingCalculator.value)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Calcular Envío
                </button>
              </div>
              
              {shippingCalculator.city && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl"
                >
                  <h4 className="font-bold text-blue-800 mb-2">Estimación para {shippingCalculator.city}:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                    <div>
                      <strong>Tiempo estimado:</strong> 3-6 días hábiles
                    </div>
                    <div>
                      <strong>Costo:</strong> {shippingCalculator.value >= 250000 ? 'GRATIS 🎉' : '$18.000 - $25.000'}
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-4">
                    *Esta es una estimación. El tiempo exacto puede variar según la transportadora y condiciones logísticas.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Información por regiones */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Cobertura Nacional
            </h2>
            
            {/* Selector de región */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {Object.entries(shippingInfo).map(([key, region]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegion(key)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedRegion === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.icon} {region.title}
                </button>
              ))}
            </div>

            {/* Información de la región seleccionada */}
            <motion.div
              key={selectedRegion}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {shippingInfo[selectedRegion].icon} {shippingInfo[selectedRegion].title}
                </h3>
                <p className="text-xl text-gray-600">
                  {shippingInfo[selectedRegion].description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shippingInfo[selectedRegion].cities.map((city, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{city.name}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{city.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className={city.price.includes('Gratis') ? 'text-green-600 font-semibold' : ''}>{city.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transportadoras aliadas */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Nuestras Transportadoras Aliadas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {carriers.map((carrier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 text-center"
                >
                  <div className="text-4xl mb-4">{carrier.logo}</div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{carrier.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Cobertura:</strong> {carrier.coverage}</div>
                    <div><strong>Especialidad:</strong> {carrier.specialty}</div>
                    <div><strong>Rastreo:</strong> {carrier.tracking}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proceso de envío */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              ¿Cómo Funciona Nuestro Proceso de Envío?
            </h2>
            
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Procesamiento del Pedido",
                  description: "Verificamos disponibilidad y preparamos tu pedido con cuidado especial",
                  time: "1-2 días hábiles",
                  icon: "📋",
                  color: "blue",
                  details: [
                    "Verificación de autenticidad de productos religiosos",
                    "Empaque especializado para artículos delicados",
                    "Inclusión de certificados y documentación",
                    "Generación de factura electrónica"
                  ]
                },
                {
                  step: 2,
                  title: "Preparación y Embalaje",
                  description: "Empaque profesional que protege la integridad de productos sagrados",
                  time: "Mismo día",
                  icon: "📦",
                  color: "green",
                  details: [
                    "Materiales de protección anti-humedad",
                    "Cajas resistentes para productos frágiles",
                    "Separación adecuada de artículos religiosos",
                    "Etiquetado claro y discreto"
                  ]
                },
                {
                  step: 3,
                  title: "Envío y Rastreo",
                  description: "Entrega a transportadora y seguimiento en tiempo real",
                  time: "Inmediato",
                  icon: "🚚",
                  color: "purple",
                  details: [
                    "Selección automática de la mejor transportadora",
                    "Generación de número de guía",
                    "Notificación por WhatsApp y email",
                    "Link de rastreo en tiempo real"
                  ]
                },
                {
                  step: 4,
                  title: "Entrega Final",
                  description: "Recepción segura en tu dirección registrada",
                  time: "2-10 días",
                  icon: "🏠",
                  color: "orange",
                  details: [
                    "3 intentos de entrega en horario laboral",
                    "Confirmación telefónica previa",
                    "Entrega con documento de identidad",
                    "Notificación de entrega exitosa"
                  ]
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className={`flex flex-col md:flex-row items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} gap-8`}
                >
                  <div className="flex-1 bg-gray-50 rounded-2xl p-8">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 bg-${step.color}-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4`}>
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                        <p className={`text-${step.color}-600 font-medium`}>{step.time}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 text-lg">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-gray-600">
                          <svg className={`w-4 h-4 mr-3 text-${step.color}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-8xl">{step.icon}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Políticas importantes */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">
              Políticas de Envío Importantes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Envío Gratis
                </h3>
                <ul className="space-y-2 text-blue-100">
                  <li>• Compras iguales o mayores a $250.000 COP</li>
                  <li>• Válido solo para pagos por transferencia bancaria</li>
                  <li>• Aplica para toda Colombia continental</li>
                  <li>• No incluye San Andrés e islas</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tiempos de Entrega
                </h3>
                <ul className="space-y-2 text-blue-100">
                  <li>• No incluyen fines de semana ni festivos</li>
                  <li>• Pueden variar por condiciones climáticas</li>
                  <li>• Tiempo de procesamiento: 1-2 días adicionales</li>
                  <li>• Confirmación por WhatsApp al enviar</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Productos Especiales
                </h3>
                <ul className="space-y-2 text-blue-100">
                  <li>• Tefilín requieren empaque especializado</li>
                  <li>• Pergaminos de mezuzá van protegidos</li>
                  <li>• Libros con protección anti-humedad</li>
                  <li>• Vinos y aceites con embalaje especial</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-4a1 1 0 011-1h4a1 1 0 011 1v4z" />
                  </svg>
                  Responsabilidades
                </h3>
                <ul className="space-y-2 text-blue-100">
                  <li>• Dirección correcta es responsabilidad del cliente</li>
                  <li>• Disponibilidad en horario de entrega</li>
                  <li>• Documento de identidad al recibir</li>
                  <li>• Revisión inmediata del paquete</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="https://wa.me/573009291156?text=Hola,%20necesito%20información%20sobre%20envíos%20a%20mi%20ciudad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Consultar Envío Personalizado
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ de envíos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Preguntas Frecuentes sobre Envíos
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "¿Puedo cambiar la dirección de envío después de hacer el pedido?",
                  answer: "Sí, pero solo si el pedido aún no ha sido entregado a la transportadora. Contáctanos inmediatamente al WhatsApp +57 300 929 1156 con tu número de pedido."
                },
                {
                  question: "¿Qué pasa si no estoy en casa cuando llega el pedido?",
                  answer: "La transportadora intentará la entrega 3 veces en diferentes horarios. Si no te encuentran, el paquete queda disponible en la oficina más cercana donde puedes recogerlo con tu cédula."
                },
                {
                  question: "¿Pueden entregar en horarios específicos?",
                  answer: "Las transportadoras manejan horarios estándar (8:00 AM - 6:00 PM). Para horarios especiales, podemos coordinar con un costo adicional según la ciudad."
                },
                {
                  question: "¿Cómo rastreo mi pedido?",
                  answer: "Te enviamos el número de guía por WhatsApp y email. Puedes rastrear en tiempo real en la página web de la transportadora o contactarnos para actualizaciones."
                },
                {
                  question: "¿Qué incluye el embalaje especial para productos religiosos?",
                  answer: "Usamos materiales anti-humedad, cajas rígidas para productos frágiles, y separación adecuada para artículos sagrados. Los pergaminos van en tubos protectores y los libros con plástico sellado."
                },
                {
                  question: "¿Hacen envíos internacionales?",
                  answer: "Actualmente solo enviamos dentro de Colombia. Para envíos internacionales, contáctanos para evaluar opciones especiales con costos adicionales."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-6"
                >
                  <h4 className="font-bold text-lg text-gray-900 mb-3">{faq.question}</h4>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enlaces relacionados */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Información Relacionada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Métodos de Pago", href: "/metodos-pago", icon: "💳", description: "Formas de pagar tu pedido" },
                { title: "Política de Devoluciones", href: "/politica-devoluciones", icon: "↩️", description: "Proceso de devoluciones" },
                { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes", icon: "❓", description: "Dudas comunes resueltas" },
                { title: "Centro de Ayuda", href: "/centro-ayuda", icon: "🎧", description: "Soporte especializado" }
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="bg-white hover:bg-gray-100 p-6 rounded-xl text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
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