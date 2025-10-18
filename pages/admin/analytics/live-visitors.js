// Versión SIMPLE Y FUNCIONAL sin useCallback ni dependencias circulares
import { useState, useEffect, useRef } from 'react';
import { 
  Phone, Video, MessageCircle, MapPin, Clock, Globe, Smartphone, Monitor, 
  Tablet, Eye, MousePointer, ArrowRight, ExternalLink, User, UserCheck, 
  Search, TrendingUp, Activity, Wifi, ShoppingCart, Mail, Calendar,
  AlertTriangle, CheckCircle, XCircle, Minimize2, Maximize2, Mic, MicOff,
  VideoOff, PhoneOff, Send, Paperclip, Smile, Filter, Download, Settings,
  MoreVertical, Zap, Star, Heart, Coffee, AlertCircle, RefreshCw
} from 'lucide-react';

const LiveVisitorsPage = () => {
  // Estados principales
  const [visitors, setVisitors] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [chatConversations, setChatConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visitors');
  
  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Estados para llamadas
  const [activeCall, setActiveCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Estados para estadísticas
  const [stats, setStats] = useState({
    activeVisitors: 0,
    registeredVisitors: 0,
    anonymousVisitors: 0,
    totalPageViews: 0,
    averageTimeOnSite: '0:00',
    newVisitorsToday: 0,
    activeChats: 0,
    unreadMessages: 0,
    visitorsWithCart: 0,
    averageCartValue: 0,
    conversionRate: 0
  });
  
  // Estados para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isGettingAISuggestion, setIsGettingAISuggestion] = useState(false);
  
  // Referencias
  const intervalRef = useRef();
  const messagesEndRef = useRef();
  const chatInputRef = useRef();
  const notificationTimeouts = useRef(new Map());

  // Función SIMPLE para obtener datos
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      setConnectionStatus('connecting');
      
      const [visitorsResponse, chatResponse] = await Promise.all([
        fetch('/api/admin/analytics/live-visitors', { 
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/admin/chat/conversations', { 
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      if (!visitorsResponse.ok || !chatResponse.ok) {
        throw new Error('API response error');
      }

      const [visitorsResult, chatResult] = await Promise.all([
        visitorsResponse.json(),
        chatResponse.json()
      ]);

      // Procesar visitantes
      if (visitorsResult.success) {
        const visitorsData = visitorsResult.data || {};
        const newVisitors = visitorsData.visitors || [];
        
        setVisitors(newVisitors);
        setStats(prev => ({
          ...prev,
          ...visitorsData.stats,
          averageTimeOnSite: formatDuration(visitorsData.stats?.averageTimeOnSite || 0)
        }));
      }

      // Procesar conversaciones
      if (chatResult.success) {
        const chatData = chatResult.data || {};
        const conversations = chatData.conversations || [];
        
        setChatConversations(conversations);
        setStats(prev => ({
          ...prev,
          activeChats: chatData.statistics?.activeConversations || 0,
          unreadMessages: chatData.statistics?.totalUnreadMessages || 0
        }));
      }

      setConnectionStatus('connected');
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching data:', error);
      setConnectionStatus('error');
      addNotification('Error de conexión', 'error', 'error', 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función SIMPLE para cargar mensajes - ESTA ES LA CLAVE
  const fetchChatMessages = async (conversationId, silent = false) => {
    if (!conversationId) {
      console.log('❌ No conversationId provided');
      return;
    }

    if (!silent) {
      console.log('📨 Cargando mensajes para conversación:', conversationId);
    }

    try {
      // SOLUCIÓN: Obtener sessionId de la conversación actual
      const conversation = chatConversations.find(c => c.id === conversationId) || selectedConversation;
      const sessionId = conversation?.sessionId;

      const params = new URLSearchParams({
        conversationId: conversationId.toString(),
        includeContext: 'true'
      });

      if (sessionId) {
        params.append('sessionId', sessionId);
      }

      console.log('🔗 URL de solicitud:', `/api/chat/messages?${params.toString()}`);

      const response = await fetch(
        `/api/chat/messages?${params.toString()}`,
        { 
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📦 Respuesta completa de la API:', result);
      
      if (result.success) {
        const messages = result.data?.messages || [];
        console.log('✅ Mensajes procesados:', messages.length);
        
        setChatMessages(messages);
        
        if (!silent && messages.length > 0) {
          console.log('📨 Mensajes cargados exitosamente:', messages.length);
          
          // Scroll al final después de cargar
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      } else {
        throw new Error(result.message || 'Error desconocido en la respuesta');
      }
    } catch (error) {
      console.error('❌ Error detallado cargando mensajes:', {
        error: error.message,
        conversationId,
        sessionId: selectedConversation?.sessionId
      });
      
      if (!silent) {
        addNotification(`Error cargando mensajes: ${error.message}`, 'error', 'error');
      }
      
      setChatMessages([]);
    }
  };

  // Función SIMPLE para enviar mensajes
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    if (!selectedConversation && !selectedVisitor) {
      addNotification('No hay conversación activa', 'error', 'error');
      return;
    }

    const messageText = newMessage.trim();
    setIsSending(true);
    setNewMessage('');

    try {
      const payload = {
        message: messageText,
        assignToMe: true
      };

      if (selectedConversation) {
        payload.conversationId = selectedConversation.id;
        payload.sessionId = selectedConversation.sessionId;
      } else if (selectedVisitor) {
        payload.sessionId = selectedVisitor.session_id;
        payload.visitorContext = selectedVisitor;
      }

      const response = await fetch('/api/admin/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        addNotification('✅ Mensaje enviado', 'success', 'success', 2000);
        
        // Actualizar mensajes inmediatamente
        if (selectedConversation) {
          setTimeout(() => {
            fetchChatMessages(selectedConversation.id, true);
          }, 500);
        }
      } else {
        throw new Error(result.message || 'Error enviando mensaje');
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      setNewMessage(messageText);
      addNotification('❌ Error enviando mensaje', 'error', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Función SIMPLE para agregar notificaciones
  const addNotification = (message, type = 'info', severity = 'info', duration = 5000) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      severity,
      timestamp: new Date(),
      duration
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]);

    const timeout = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, duration);
  };

  // Función para iniciar chat con visitante
  const startChatWithVisitor = async (visitor) => {
    try {
      const existingChat = chatConversations.find(
        conv => conv.sessionId === visitor.session_id
      );

      if (existingChat) {
        setSelectedConversation(existingChat);
        setSelectedVisitor(visitor);
        setChatMode(true);
        setActiveTab('chat');
        fetchChatMessages(existingChat.id);
      } else {
        setSelectedVisitor(visitor);
        setSelectedConversation(null);
        setChatMode(true);
        setActiveTab('chat');
        setChatMessages([]);
      }
      
      addNotification(`💬 Chat iniciado con ${visitor.user.name}`, 'chat_opened', 'info');
    } catch (error) {
      console.error('Error starting chat:', error);
      addNotification('❌ Error iniciando chat', 'error', 'error');
    }
  };

  // Funciones auxiliares
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CO': '🇨🇴', 'US': '🇺🇸', 'MX': '🇲🇽', 'ES': '🇪🇸',
      'AR': '🇦🇷', 'PE': '🇵🇪', 'CL': '🇨🇱', 'EC': '🇪🇨',
      'BR': '🇧🇷', 'VE': '🇻🇪', 'UY': '🇺🇾', 'PY': '🇵🇾'
    };
    return flags[countryCode] || '🌍';
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getIntentColor = (intent) => {
    const colors = {
      'purchase': 'bg-green-50 text-green-700 border-green-200',
      'browsing': 'bg-blue-50 text-blue-700 border-blue-200',
      'support': 'bg-orange-50 text-orange-700 border-orange-200',
      'bouncing': 'bg-red-50 text-red-700 border-red-200',
      'research': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[intent] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getEngagementColor = (engagement) => {
    const colors = {
      'high': 'text-green-600 bg-green-50 border-green-200',
      'medium': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'low': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[engagement] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'online': 'bg-green-500',
      'away': 'bg-yellow-500',
      'offline': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Filtros
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = !searchQuery || 
      visitor.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.location.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || visitor.session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredConversations = chatConversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.visitor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  // EFECTOS SIMPLES SIN DEPENDENCIAS CIRCULARES
  useEffect(() => {
    fetchAllData();
    // Actualizar datos cada 8 segundos
    intervalRef.current = setInterval(() => fetchAllData(true), 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // SIN DEPENDENCIAS

  // EFECTO PARA ACTUALIZAR MENSAJES EN TIEMPO REAL
  useEffect(() => {
    let messageInterval;
    
    if (selectedConversation?.id) {
      // Actualizar mensajes cada 3 segundos cuando hay conversación seleccionada
      messageInterval = setInterval(() => {
        fetchChatMessages(selectedConversation.id, true);
      }, 3000);
    }

    return () => {
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, [selectedConversation?.id]); // SOLO dependencia del ID

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando Panel en Vivo</h3>
          <p className="text-gray-600">Conectando con visitantes activos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Activity className="w-7 h-7 text-blue-600" />
                <span>Panel en Vivo</span>
              </h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'En línea' :
                   connectionStatus === 'connecting' ? 'Conectando...' :
                   'Sin conexión'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchAllData()}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Visitantes</p>
                  <p className="text-2xl font-bold">{stats.activeVisitors}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Chats</p>
                  <p className="text-2xl font-bold">{stats.activeChats}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Páginas</p>
                  <p className="text-2xl font-bold">{stats.totalPageViews}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Carritos</p>
                  <p className="text-2xl font-bold">{stats.visitorsWithCart}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-orange-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Nuevos</p>
                  <p className="text-2xl font-bold">{stats.newVisitorsToday}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Sin leer</p>
                  <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                </div>
                <Mail className="w-8 h-8 text-pink-200" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('visitors')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === 'visitors'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Visitantes ({filteredVisitors.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative transition-colors ${
                    activeTab === 'chat'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chats ({filteredConversations.length})</span>
                  {stats.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {stats.unreadMessages > 9 ? '9+' : stats.unreadMessages}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="fixed top-24 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${
              notification.severity === 'error' ? 'bg-red-500' :
              notification.severity === 'warning' ? 'bg-orange-500' :
              notification.severity === 'success' ? 'bg-green-500' :
              'bg-blue-500'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {activeTab === 'visitors' && (
            <>
              {/* Lista de Visitantes */}
              <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Visitantes Activos ({filteredVisitors.length})
                  </h3>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredVisitors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No hay visitantes activos</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredVisitors.map((visitor) => (
                        <div
                          key={visitor.session_id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                            selectedVisitor?.session_id === visitor.session_id 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : ''
                          }`}
                          onClick={() => setSelectedVisitor(visitor)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {visitor.user.avatar}
                                </div>
                                <div className={`absolute -top-1 -left-1 w-4 h-4 ${getStatusColor(visitor.session.status)} rounded-full border-2 border-white`}></div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {visitor.user.name}
                                  </p>
                                  <span className="text-lg">{getCountryFlag(visitor.location.countryCode)}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  {getDeviceIcon(visitor.device.type)}
                                  <span>{visitor.location.city}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(visitor.session.lastActivity)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-1 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startChatWithVisitor(visitor);
                              }}
                              className="flex-1 bg-blue-600 text-white text-xs py-2 px-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de Detalles del Visitante */}
              <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedVisitor ? 'Detalles del Visitante' : 'Selecciona un Visitante'}
                  </h3>
                </div>
                
                <div className="p-6">
                  {selectedVisitor ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {selectedVisitor.user.avatar}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {selectedVisitor.user.name}
                          </h3>
                          <p className="text-gray-600">{selectedVisitor.location.city}, {selectedVisitor.location.country}</p>
                          <button
                            onClick={() => startChatWithVisitor(selectedVisitor)}
                            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Iniciar Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Selecciona un visitante</p>
                        <p className="text-sm">Haz clic en cualquier visitante para ver su información</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'chat' && (
            <>
              {/* Lista de Chats */}
              <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conversaciones ({filteredConversations.length})
                  </h3>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No hay conversaciones activas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                            selectedConversation?.id === conversation.id 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : ''
                          }`}
                          onClick={() => {
                            console.log('🎯 Conversación seleccionada:', {
                              id: conversation.id,
                              sessionId: conversation.sessionId,
                              visitor: conversation.visitor?.name
                            });
                            
                            setSelectedConversation(conversation);
                            setChatMode(true);
                            setActiveTab('chat');
                            setChatMessages([]);
                            
                            // Cargar mensajes inmediatamente
                            fetchChatMessages(conversation.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {conversation.visitor?.name ? conversation.visitor.name.charAt(0).toUpperCase() : 'V'}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {conversation.visitor?.name || 'Visitante Anónimo'}
                                  </p>
                                  <span className="text-lg">{getCountryFlag(conversation.location?.countryCode)}</span>
                                </div>
                                
                                <p className="text-xs text-gray-500 truncate">
                                  📍 {conversation.location?.city || 'Ubicación desconocida'}
                                </p>
                                
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-600 truncate mt-1">
                                    💬 {conversation.lastMessage.content}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                  <span>📄 {conversation.metrics?.messageCount || 0} mensajes</span>
                                  <span>⏱️ {formatTimeAgo(conversation.timestamps?.lastMessage)}</span>
                                </div>
                              </div>
                            </div>

                            {conversation.metrics?.unreadMessages > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                {conversation.metrics.unreadMessages > 9 ? '9+' : conversation.metrics.unreadMessages}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de Chat */}
              <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation ? 'Chat Activo' : 
                       chatMode && selectedVisitor ? `Chat con ${selectedVisitor.user.name}` : 
                       'Selecciona una Conversación'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {selectedConversation && (
                        <button
                          onClick={() => {
                            setSelectedConversation(null);
                            setChatMessages([]);
                            setChatMode(false);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors text-sm px-3 py-1 rounded-lg hover:bg-gray-100"
                        >
                          ✕ Cerrar
                        </button>
                      )}
                    </div>
                  </div>
                  {(selectedConversation || (chatMode && selectedVisitor)) && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedConversation ? 
                          `${selectedConversation.visitor?.name || 'Visitante Anónimo'} - ${selectedConversation.location?.city}` :
                          `${selectedVisitor.user.name} - ${selectedVisitor.location.city}`
                        }
                      </p>
                    </div>
                  )}
                </div>
                
                {(selectedConversation || (chatMode && selectedVisitor)) ? (
                  <>
                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white" style={{minHeight: '400px', maxHeight: '500px'}}>
                      {chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Conversación vacía</p>
                            <p className="text-sm">Envía el primer mensaje para comenzar</p>
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender.type === 'agent' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              message.sender.type === 'agent'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                : message.sender.type === 'system'
                                ? 'bg-yellow-100 text-yellow-800 text-center text-xs'
                                : message.sender.type === 'bot'
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300'
                                : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                            }`}>
                              {message.sender.type !== 'agent' && message.sender.type !== 'system' && (
                                <div className="flex items-center space-x-1 mb-2">
                                  <span className="text-sm">{message.sender.avatar}</span>
                                  <span className="text-xs font-semibold">{message.sender.name}</span>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message.content}</p>
                              <p className={`text-xs mt-2 ${
                                message.sender.type === 'agent' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTimeAgo(message.timestamps.created)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input para responder */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }} className="space-y-3">
                        <div className="flex space-x-3">
                          <div className="flex-1">
                            <input
                              ref={chatInputRef}
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Escribe tu respuesta..."
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={isSending}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg"
                          >
                            {isSending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline">Enviar</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Respuestas rápidas */}
                        <div className="flex flex-wrap gap-2">
                          <button 
                            type="button"
                            onClick={() => setNewMessage('¡Hola! ¿En qué te puedo ayudar hoy?')}
                            className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            👋 Saludo
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewMessage('¿Te gustaría que te ayude con algo específico de nuestros productos?')}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            🛍️ Productos
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewMessage('Tengo un descuento especial que podría interesarte. ¿Te gustaría conocerlo?')}
                            className="text-xs bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full hover:bg-yellow-200 transition-colors"
                          >
                            🎁 Descuento
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Selecciona una conversación</p>
                      <p className="text-sm">Elige una conversación de la lista o inicia un chat con un visitante</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estilos CSS */}
      <style jsx>{`
        /* Scroll personalizado */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default LiveVisitorsPage;