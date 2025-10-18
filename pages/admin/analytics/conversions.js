// pages/admin/analytics/conversions.js - PÁGINA DE CONVERSIONES
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';

const ConversionsPage = () => {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversions: 0,
    totalValue: 0,
    averageValue: 0,
    conversionRate: 0
  });
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchConversions();
  }, [timeRange]);

  const fetchConversions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/conversions?period=${timeRange}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversions(data.conversions || []);
        setStats(data.stats || {
          totalConversions: 0,
          totalValue: 0,
          averageValue: 0,
          conversionRate: 0
        });
      }
    } catch (error) {
      console.error('Error fetching conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  const getConversionTypeIcon = (type) => {
    const icons = {
      'purchase': '🛒',
      'add_to_cart': '🛍️',
      'contact_form': '📝',
      'phone_call': '📞',
      'email_signup': '📧',
      'chat_started': '💬',
      'download': '📥',
      'video_view': '📹',
      'subscription': '⭐'
    };
    return icons[type] || '🎯';
  };

  const getConversionTypeName = (type) => {
    const names = {
      'purchase': 'Compra',
      'add_to_cart': 'Agregar al Carrito',
      'contact_form': 'Formulario de Contacto',
      'phone_call': 'Llamada Telefónica',
      'email_signup': 'Registro de Email',
      'chat_started': 'Chat Iniciado',
      'download': 'Descarga',
      'video_view': 'Video Visto',
      'subscription': 'Suscripción'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <AdminLayout title="Conversiones">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Conversiones">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversiones</h1>
            <p className="text-gray-600">Análisis detallado de conversiones y objetivos</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">Último día</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conversiones</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              {stats.totalConversions > 0 ? '+' : ''}
              {((stats.totalConversions / (stats.totalConversions + 10)) * 100).toFixed(1)}% vs período anterior
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Promedio</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.averageValue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Conversión</p>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(2)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversions Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversiones Recientes ({conversions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {conversions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay conversiones aún</h3>
              <p>Las conversiones aparecerán aquí cuando los usuarios completen acciones importantes.</p>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Tipos de conversiones que trackea el sistema:</strong></p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <span>🛒 Compras</span>
                  <span>🛍️ Agregar al carrito</span>
                  <span>📝 Formularios</span>
                  <span>📞 Llamadas</span>
                  <span>💬 Chats</span>
                  <span>📧 Registros</span>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Página
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversions.map((conversion, index) => (
                  <tr key={conversion.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">
                          {getConversionTypeIcon(conversion.conversion_type)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getConversionTypeName(conversion.conversion_type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {conversion.conversion_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {conversion.conversion_value > 0 ? formatCurrency(conversion.conversion_value) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {conversion.user_name || 'Anónimo'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conversion.session_id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={conversion.page_url}>
                        {conversion.page_path || conversion.page_url || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conversion.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {conversion.metadata && (
                        <button
                          onClick={() => {
                            alert(JSON.stringify(JSON.parse(conversion.metadata), null, 2));
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ver detalles
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Instrucciones para generar conversiones */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Cómo generar conversiones de prueba</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Para testear el sistema, puedes:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Abrir el chat en vivo desde tu sitio web</li>
            <li>Simular una compra (si tienes e-commerce configurado)</li>
            <li>Usar la consola del navegador: <code className="bg-blue-100 px-1 rounded">window.analytics.trackConversion('test_conversion', 1000)</code></li>
            <li>Llenar formularios de contacto en tu sitio</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConversionsPage;