import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';

export default function AdminSyncPage() {
  const [syncStatus, setSyncStatus] = useState({
    inProgress: false,
    stats: null,
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Polling para obtener el estado de sincronización
  useEffect(() => {
    const pollSyncStatus = async () => {
      try {
        const response = await fetch('/api/admin/sync/woocommerce');
        if (response.ok) {
          const data = await response.json();
          setSyncStatus(data.data);
        }
      } catch (error) {
        console.error('Error obteniendo estado:', error);
      }
    };

    // Poll cada 2 segundos si hay sincronización en progreso
    const interval = setInterval(pollSyncStatus, 2000);
    
    // Poll inicial
    pollSyncStatus();

    return () => clearInterval(interval);
  }, []);

  const startSync = async (type) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/sync/woocommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sincronización ${type} iniciada`);
        setSyncStatus(prev => ({ ...prev, inProgress: true, error: null, stats: null }));
      } else {
        toast.error(data.message || 'Error iniciando sincronización');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const formatStats = (stats) => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Categorías */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📂 Categorías</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Creadas:</span>
              <span className="font-bold text-green-600">{stats.categories.created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Actualizadas:</span>
              <span className="font-bold text-blue-600">{stats.categories.updated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Errores:</span>
              <span className="font-bold text-red-600">{stats.categories.errors}</span>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-4">📦 Productos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-700">Creados:</span>
              <span className="font-bold text-green-600">{stats.products.created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Actualizados:</span>
              <span className="font-bold text-blue-600">{stats.products.updated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Errores:</span>
              <span className="font-bold text-red-600">{stats.products.errors}</span>
            </div>
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">🖼️ Imágenes</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-purple-700">Descargadas:</span>
              <span className="font-bold text-green-600">{stats.images.downloaded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Errores:</span>
              <span className="font-bold text-red-600">{stats.images.errors}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Sincronización WooCommerce - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Sincronización WooCommerce
            </h1>
            <p className="mt-2 text-gray-600">
              Importa productos y categorías desde tu tienda WooCommerce
            </p>
          </div>

          {/* Estado Actual */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
            
            {syncStatus.inProgress && (
              <div className="flex items-center mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-600 font-medium">Sincronización en progreso...</span>
              </div>
            )}

            {syncStatus.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error en Sincronización</h3>
                    <p className="text-sm text-red-700 mt-1">{syncStatus.error}</p>
                  </div>
                </div>
              </div>
            )}

            {!syncStatus.inProgress && !syncStatus.error && syncStatus.stats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Sincronización Completada</h3>
                    <p className="text-sm text-green-700 mt-1">La sincronización se completó exitosamente</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Acciones de Sincronización</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sincronización Completa */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">🔄 Sincronización Completa</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sincroniza todas las categorías y productos desde WooCommerce. 
                  Incluye descarga y optimización de imágenes.
                </p>
                <button
                  onClick={() => startSync('full')}
                  disabled={isLoading || syncStatus.inProgress}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? 'Iniciando...' : 'Iniciar Sincronización Completa'}
                </button>
              </div>

              {/* Solo Categorías */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">📂 Solo Categorías</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sincroniza únicamente las categorías desde WooCommerce.
                  Más rápido si solo necesitas actualizar categorías.
                </p>
                <button
                  onClick={() => startSync('categories')}
                  disabled={isLoading || syncStatus.inProgress}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? 'Iniciando...' : 'Sincronizar Categorías'}
                </button>
              </div>

              {/* Solo Productos */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-3">📦 Solo Productos</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sincroniza únicamente los productos desde WooCommerce.
                  Incluye descarga de imágenes.
                </p>
                <button
                  onClick={() => startSync('products')}
                  disabled={isLoading || syncStatus.inProgress}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? 'Iniciando...' : 'Sincronizar Productos'}
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {syncStatus.stats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Estadísticas de la Última Sincronización</h2>
              {formatStats(syncStatus.stats)}
            </div>
          )}

          {/* Información Importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-medium text-yellow-900 mb-3">⚠️ Información Importante</h3>
            <ul className="text-yellow-800 space-y-2 text-sm">
              <li>• La sincronización puede tomar varios minutos dependiendo del número de productos</li>
              <li>• Las imágenes se descargan y optimizan automáticamente (WebP, múltiples tamaños)</li>
              <li>• Los productos existentes se actualizarán con los datos de WooCommerce</li>
              <li>• Asegúrate de tener configuradas correctamente las credenciales de WooCommerce en el .env</li>
              <li>• Durante la sincronización, evita realizar otras operaciones pesadas en el servidor</li>
            </ul>
          </div>

          {/* Configuración WooCommerce */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">🔧 Configuración WooCommerce</h3>
            <p className="text-blue-800 text-sm mb-3">
              Para que la sincronización funcione, necesitas configurar las siguientes variables en tu archivo .env:
            </p>
            <div className="bg-blue-100 rounded p-4 font-mono text-sm text-blue-900">
              <div>WOOCOMMERCE_URL=https://tu-tienda.com</div>
              <div>WOOCOMMERCE_CONSUMER_KEY=ck_tu_consumer_key</div>
              <div>WOOCOMMERCE_CONSUMER_SECRET=cs_tu_consumer_secret</div>
            </div>
            <p className="text-blue-700 text-sm mt-3">
              Puedes generar las claves API en: WooCommerce → Configuración → Avanzado → REST API
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// Middleware para verificar autenticación de administrador
export async function getServerSideProps(context) {
  // Aquí puedes agregar verificación de autenticación
  // Por ahora, permitimos acceso directo
  return {
    props: {}
  };
}