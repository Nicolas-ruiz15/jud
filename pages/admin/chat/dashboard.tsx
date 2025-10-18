// pages/admin/chat/dashboard.tsx - PANEL DE ADMINISTRACIÓN DEL CHAT
import { useState, useEffect } from 'react';
import { NextPage } from 'next';

interface ChatStats {
  activeConversations: number;
  conversationsToday: number;
  totalMessages: number;
  avgResponseTime: number;
  botConfidence: number;
  humanEscalations: number;
}

interface ConversationSummary {
  id: number;
  sessionId: string;
  visitorName?: string;
  country?: string;
  deviceType: string;
  status: 'active' | 'closed' | 'pending';
  messageCount: number;
  lastMessage: string;
  lastMessageTime: string;
  assignedTo?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const AdminChatDashboard: NextPage = () => {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'conversations' | 'knowledge' | 'settings'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, conversationsResponse] = await Promise.all([
        fetch('/api/admin/chat/stats'),
        fetch('/api/admin/chat/conversations')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCloseConversation = async (conversationId: number) => {
    try {
      const response = await fetch('/api/admin/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, closeReason: 'closed_by_admin' })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const handleAssignConversation = async (conversationId: number, assignTo: string) => {
    try {
      const response = await fetch('/api/admin/chat/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, assignTo })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Chat - Judaica Breslov</h1>
              <p className="text-gray-600 mt-1">Gestión y monitoreo del sistema de chat</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Resumen', icon: '📊' },
                { key: 'conversations', label: 'Conversaciones', icon: '💬' },
                { key: 'knowledge', label: 'Base de Conocimiento', icon: '🧠' },
                { key: 'settings', label: 'Configuración', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    selectedTab === tab.key
                      ? 'border-slate-500 text-slate-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confianza IA</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(stats.botConfidence * 100)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgResponseTime / 60)}min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {conversations.slice(0, 5).map(conversation => (
                    <div key={conversation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {conversation.visitorName?.charAt(0) || '👤'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.visitorName || 'Visitante Anónimo'}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {selectedTab === 'conversations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Gestión de Conversaciones</h3>
                <div className="flex items-center space-x-2">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="all">Todas</option>
                    <option value="active">Activas</option>
                    <option value="pending">Pendientes</option>
                    <option value="closed">Cerradas</option>
                  </select>
                  <button className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors">
                    Filtrar
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensajes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Mensaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conversations.map(conversation => (
                    <tr key={conversation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-600">
                                {conversation.visitorName?.charAt(0) || '👤'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {conversation.visitorName || 'Visitante Anónimo'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {conversation.country} • {conversation.deviceType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conversation.messageCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {conversation.lastMessage}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => window.open(`/admin/chat/conversation/${conversation.id}`, '_blank')}
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Ver
                        </button>
                        {conversation.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAssignConversation(conversation.id, 'admin')}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Asignar
                            </button>
                            <button
                              onClick={() => handleCloseConversation(conversation.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Cerrar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {selectedTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Base de Conocimiento del Bot</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas de Intents</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Intents activos:</span>
                      <span className="font-medium">45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confianza promedio:</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escalaciones a humano:</span>
                      <span className="font-medium">12%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Acciones Rápidas</h4>
                  <div className="space-y-2">
                    <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-md text-sm transition-colors">
                      Entrenar Bot con Conversaciones Recientes
                    </button>
                    <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-md text-sm transition-colors">
                      Exportar Base de Conocimiento
                    </button>
                    <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-md text-sm transition-colors">
                      Agregar Nuevo Intent
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Intents Más Utilizados</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { intent: 'greeting', usage: 85, confidence: 92 },
                    { intent: 'product_inquiry', usage: 78, confidence: 89 },
                    { intent: 'pricing_info', usage: 65, confidence: 87 },
                    { intent: 'shipping_info', usage: 45, confidence: 91 },
                    { intent: 'contact_request', usage: 32, confidence: 85 }
                  ].map(item => (
                    <div key={item.intent} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.intent}</p>
                        <p className="text-sm text-gray-600">Usado {item.usage} veces esta semana</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.confidence}% confianza</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-slate-600 h-2 rounded-full" 
                            style={{ width: `${item.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Chat</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del Chat
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option>Habilitado</option>
                      <option>Deshabilitado</option>
                      <option>Solo horario de oficina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje de Bienvenida
                    </label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                      placeholder="¡Shalom! Bienvenido a Judaica Breslov..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Umbral de Confianza del Bot
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="75"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">75% - Respuestas con confianza mayor al 75%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horarios de Atención
                    </label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Lunes - Viernes:</span>
                        <span>9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sábados:</span>
                        <span>9:00 AM - 3:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Domingos:</span>
                        <span className="text-red-600">Cerrado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md transition-colors">
                      Guardar Cambios
                    </button>
                    <button className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors">
                      Cancelar
                    </button>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors">
                    Reiniciar Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatDashboard;