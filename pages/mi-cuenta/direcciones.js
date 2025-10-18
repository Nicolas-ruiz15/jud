// pages/mi-cuenta/direcciones.js - Gestión de direcciones con diseño moderno
import { useState, useEffect } from 'react';
<script src="/js/visitor-tracking.js"></script>
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import withClientAuth from '../../components/withClientAuth';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

function MisDireccionesPage({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setAddresses(data.data);
      } else {
        toast.error('Error cargando direcciones');
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      toast.error('Error de conexión');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) return;

    setDeletingId(addressId);
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dirección eliminada');
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      } else {
        toast.error(data.message || 'Error al eliminar dirección');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/set-default`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dirección predeterminada actualizada');
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        })));
      } else {
        toast.error(data.message || 'Error al actualizar dirección predeterminada');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      work: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      other: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
    };
    return icons[type] || icons.other;
  };

  const getTypeLabel = (type) => {
    const labels = {
      home: 'Casa',
      work: 'Trabajo',
      other: 'Otro'
    };
    return labels[type] || 'Otro';
  };

  const getTypeColor = (type) => {
    const colors = {
      home: 'from-blue-500 to-cyan-600',
      work: 'from-purple-500 to-indigo-600',
      other: 'from-gray-500 to-slate-600'
    };
    return colors[type] || 'from-gray-500 to-slate-600';
  };

  return (
    <Layout
      title="Mis Direcciones | Mi Cuenta | Judaica Breslov Colombia"
      description="Gestiona tus direcciones de envío"
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
              <span className="text-gray-900 font-semibold">Direcciones</span>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  Mis Direcciones
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tus direcciones de envío
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/mi-cuenta/direcciones/agregar"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                  Agregar dirección
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
            
            {/* Sidebar mejorado */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden sticky top-6">
                {/* Avatar section */}
                <div className="p-6 text-center bg-gradient-to-br from-purple-50 to-indigo-100/50">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-purple-100">
                    <span className="text-white font-bold text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{user?.name || 'Usuario'}</h3>
                  <p className="text-sm text-gray-600 mb-4">{addresses.length} direcciones guardadas</p>
                </div>
                
                {/* Information section */}
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Envío Gratis</h4>
                        <p className="text-gray-600 text-sm">En compras superiores a $200.000</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Tiempo de Entrega</h4>
                        <p className="text-gray-600 text-sm">2-5 días hábiles</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Direcciones Múltiples</h4>
                        <p className="text-gray-600 text-sm">Guarda todas las que necesites</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de direcciones */}
            <div className="lg:col-span-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-8">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                            <div>
                              <div className="h-5 w-20 bg-gray-200 rounded-lg mb-2"></div>
                              <div className="h-4 w-16 bg-gray-200 rounded-lg"></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-gray-200 rounded-lg"></div>
                          <div className="h-4 w-3/4 bg-gray-200 rounded-lg"></div>
                          <div className="h-4 w-1/2 bg-gray-200 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address, index) => (
                    <motion.div
                      key={address.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden ${
                        address.isDefault 
                          ? 'border-purple-500 ring-2 ring-purple-200' 
                          : 'border-gray-100 hover:border-gray-300 hover:shadow-2xl'
                      }`}
                    >
                      {address.isDefault && (
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-4 py-2 text-center">
                          Dirección Predeterminada
                        </div>
                      )}
                      
                      <div className="p-8">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTypeColor(address.type)} flex items-center justify-center shadow-lg`}>
                              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon(address.type)} />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{address.name}</h3>
                              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                                {getTypeLabel(address.type)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/mi-cuenta/direcciones/editar?id=${address.id}`}
                              className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(address.id)}
                              disabled={deletingId === address.id}
                              className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              {deletingId === address.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Información de la dirección */}
                        <div className="space-y-3 text-sm mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Destinatario:</span>
                            <span className="font-semibold text-gray-900">{address.recipient}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Teléfono:</span>
                            <span className="font-semibold text-gray-900">{address.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dirección:</span>
                            <span className="font-semibold text-gray-900 text-right max-w-xs">{address.address}</span>
                          </div>
                          {address.neighborhood && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Barrio:</span>
                              <span className="font-semibold text-gray-900">{address.neighborhood}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ciudad:</span>
                            <span className="font-semibold text-gray-900">{address.city}, {address.department}</span>
                          </div>
                          {address.zipCode && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Código Postal:</span>
                              <span className="font-semibold text-gray-900">{address.zipCode}</span>
                            </div>
                          )}
                          {address.additionalInfo && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                              <p className="text-sm text-blue-800">
                                <strong>Info adicional:</strong> {address.additionalInfo}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        {!address.isDefault && (
                          <div className="pt-6 border-t border-gray-200/60">
                            <button
                              onClick={() => handleSetDefault(address.id)}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                              Establecer como predeterminada
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 p-12 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No tienes direcciones guardadas
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Agrega una dirección para hacer tus compras más rápidas
                  </p>
                  <Link
                    href="/mi-cuenta/direcciones/agregar"
                    className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Agregar Primera Dirección
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de información adicional */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-100 border-t border-purple-200/50">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cobertura Nacional</h3>
                <p className="text-gray-600">Entregamos en todas las ciudades principales de Colombia</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Entrega Segura</h3>
                <p className="text-gray-600">Todos los paquetes incluyen seguro y seguimiento</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Horarios Flexibles</h3>
                <p className="text-gray-600">Coordinamos la entrega según tu disponibilidad</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withClientAuth(MisDireccionesPage);